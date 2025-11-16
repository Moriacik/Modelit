<?php
// Nastavenie error reporting pred všetkým ostatným
error_reporting(E_ALL);
ini_set('display_errors', 0); // Nezobrazuj chyby v odpovedi
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iba POST requesty
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Include databázovej konfigurácie
require_once 'config.php';

// Validácia vstupných dát
if (!isset($_POST['order_id']) || empty($_POST['order_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chýba ID objednávky']);
    exit;
}

// Zisť či máme súbory - skúšame obe varianty (files[] a files)
$filesKey = isset($_FILES['files[]']) ? 'files[]' : (isset($_FILES['files']) ? 'files' : null);

if (!$filesKey || empty($_FILES[$filesKey]['name'][0])) {
    echo json_encode(['success' => false, 'message' => 'Neboli vybrané žiadne súbory']);
    exit;
}

$orderId = $_POST['order_id'];

// Inicializácia premenných mimo try bloku pre catch handler
$uploadedFiles = [];
// Použitie /tmp pre upload, potom presun do /var/www/html
$uploadDirTemp = '/tmp/uploads_' . getenv('USER') . '/'; 
$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'completed' . DIRECTORY_SEPARATOR;
$pdo = null;

try {
    // Vytvorenie dočasného adresára ak neexistuje
    if (!file_exists($uploadDirTemp)) {
        if (!mkdir($uploadDirTemp, 0777, true)) {
            throw new Exception('Chyba pri vytváraní dočasného adresára pre súbory');
        }
    }
    
    // Zabezpečenie oprávnení dočasného adresára
    @chmod($uploadDirTemp, 0777);
    
    // Vytvorenie finálneho adresára ak neexistuje
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception('Chyba pri vytváraní adresára pre súbory');
        }
    }
    
    // Zabezpečenie oprávnení adresára
    @chmod($uploadDir, 0777);
    
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Overenie existencie objednávky
    $checkSql = "SELECT id, status, order_token FROM orders WHERE id = :order_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $checkStmt->execute();
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka nebola nájdená');
    }
    
    // Povolené typy súborov
    $allowedTypes = ['stl', 'zip'];
    $maxFileSize = 50 * 1024 * 1024; // 50MB
    
    $files = $_FILES[$filesKey];
    
    // Spracovanie každého súboru
    for ($i = 0; $i < count($files['name']); $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            throw new Exception('Chyba pri nahrávaní súboru: ' . $files['name'][$i]);
        }
        
        $fileName = $files['name'][$i];
        $fileSize = $files['size'][$i];
        $fileTmpName = $files['tmp_name'][$i];
        
        // Validácia veľkosti súboru
        if ($fileSize > $maxFileSize) {
            throw new Exception("Súbor {$fileName} je príliš veľký (max 50MB)");
        }
        
        // Validácia typu súboru
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($fileExtension, $allowedTypes)) {
            throw new Exception("Nepovolený typ súboru: {$fileName}");
        }
        
        // Generovanie jedinečného názvu súboru
        $uniqueFileName = $order['order_token'] . '_' . time() . '_' . $i . '.' . $fileExtension;
        $targetPathTemp = $uploadDirTemp . $uniqueFileName;
        $targetPath = $uploadDir . $uniqueFileName;
        
        // Presun súboru do dočasného adresára
        if (!move_uploaded_file($fileTmpName, $targetPathTemp)) {
            error_log("Upload to temp failed for {$fileName}. TmpName: {$fileTmpName}, Target: {$targetPathTemp}");
            error_log("Temp dir writable: " . (is_writable($uploadDirTemp) ? 'yes' : 'no'));
            throw new Exception("Chyba pri ukladaní súboru: {$fileName}");
        }
        
        // Skúsime presunúť do finálneho miesta
        if (!copy($targetPathTemp, $targetPath)) {
            @unlink($targetPathTemp); // Vyčistim temp file
            error_log("Copy to final failed for {$fileName}. From: {$targetPathTemp}, To: {$targetPath}");
            error_log("Final dir writable: " . (is_writable($uploadDir) ? 'yes' : 'no'));
            // Ak copy zlyhá, pokračujeme s temp file ako finálnym (fallback)
            $targetPath = $targetPathTemp;
        } else {
            @unlink($targetPathTemp); // Vyčistim temp file po úspešnom kopírovaní
        }
        
        // Pridanie do zoznamu nahraných súborov
        $uploadedFiles[] = [
            'name' => $uniqueFileName,
            'original_name' => $fileName,
            'size' => formatFileSize($fileSize),
            'type' => $fileExtension,
            'uploaded_at' => date('Y-m-d H:i:s')
        ];
    }
    
    // Aktualizácia databázy s informáciami o súboroch
    $finalFilesJson = json_encode($uploadedFiles);
    
    $updateSql = "UPDATE orders 
                  SET final_files = :final_files,
                      updated_at = NOW() 
                  WHERE id = :order_id";
    
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':final_files', $finalFilesJson, PDO::PARAM_STR);
    $updateStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii databázy');
    }
    
    // Log aktivity - skip ak tabuľka neexistuje
    try {
        $logCheckSql = "SHOW TABLES LIKE 'order_logs'";
        $logCheckStmt = $pdo->prepare($logCheckSql);
        $logCheckStmt->execute();
        
        if ($logCheckStmt->rowCount() > 0) {
            $logSql = "INSERT INTO order_logs (order_id, action, description, datum_vytvorenia) 
                       VALUES (:order_id, :action, :description, NOW())";
            
            $logStmt = $pdo->prepare($logSql);
            $logStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
            $logStmt->bindValue(':action', 'final_files_uploaded', PDO::PARAM_STR);
            $description = 'Nahrané finálne súbory: ' . implode(', ', array_column($uploadedFiles, 'original_name'));
            $logStmt->bindParam(':description', $description, PDO::PARAM_STR);
            $logStmt->execute();
        }
    } catch (Exception $e) {
        // Log tabuľka neexistuje, pokračuj ďalej
        error_log("Order logs not available: " . $e->getMessage());
    }
    
    // Commit transakcie
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Súbory boli úspešne nahrané!',
        'uploaded_files' => $uploadedFiles,
        'files_count' => count($uploadedFiles)
    ]);
    
} catch (PDOException $e) {
    // Rollback transakcie a vymazanie nahraných súborov
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    // Vymazanie nahraných súborov pri chybe
    foreach ($uploadedFiles as $file) {
        $filePath = $uploadDir . $file['name'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
    
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri nahrávaní súborov do databázy'
    ]);
} catch (Exception $e) {
    // Rollback transakcie a vymazanie nahraných súborov
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    // Vymazanie nahraných súborov pri chybe
    foreach ($uploadedFiles as $file) {
        $filePath = $uploadDir . $file['name'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
    
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Helper funkcia pre formátovanie veľkosti súboru
function formatFileSize($size) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $unitIndex = 0;
    
    while ($size >= 1024 && $unitIndex < count($units) - 1) {
        $size /= 1024;
        $unitIndex++;
    }
    
    return round($size, 2) . ' ' . $units[$unitIndex];
}
?>