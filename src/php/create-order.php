<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Validácia povinných polí
    $required_fields = ['meno', 'email', 'popis_prace'];
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            echo json_encode(['success' => false, 'message' => "Pole '$field' je povinné"]);
            exit;
        }
    }
    
    // Sanitizácia vstupných dát
    $meno = trim($_POST['meno']);
    $email = trim($_POST['email']);
    $popis_prace = trim($_POST['popis_prace']);
    $odhadovana_cena = !empty($_POST['odhadovana_cena']) ? floatval($_POST['odhadovana_cena']) : null;
    $deadline = !empty($_POST['deadline']) ? $_POST['deadline'] : null;
    
    // Validácia emailu
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Neplatný email formát']);
        exit;
    }
    
    // Generovanie jedinečného order tokenu (slúži aj ako číslo objednávky)
    // Formát: ORD-YYYY-XXXX-HASH (user-friendly + bezpečný)
    $year = date('Y');
    $random_part = strtoupper(substr(hash('sha256', $email . time() . rand(1000, 9999)), 0, 8));
    $order_token = "ORD-{$year}-{$random_part}";
    
    // Overenie jedinečnosti tokenu
    $check_stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE order_token = ?");
    $check_stmt->execute([$order_token]);
    
    // Ak token už existuje, generuj nový (veľmi nepravdepodobné)
    while ($check_stmt->fetchColumn() > 0) {
        $random_part = strtoupper(substr(hash('sha256', $email . microtime() . rand(1000, 9999)), 0, 8));
        $order_token = "ORD-{$year}-{$random_part}";
        $check_stmt->execute([$order_token]);
    }
    
    // Spracovanie súborov
    $referencne_subory = [];
    $upload_dir = '/var/www/html/uploads/orders/';
    
    // Vytvorenie upload adresára ak neexistuje
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    if (!empty($_FILES['referencne_subory'])) {
        $files = $_FILES['referencne_subory'];
        
        // Ak je to array súborov
        if (is_array($files['name'])) {
            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $file_result = processUploadedFile($files, $i, $upload_dir, $order_token);
                    if ($file_result) {
                        $referencne_subory[] = $file_result;
                    }
                }
            }
        } else {
            // Jeden súbor
            if ($files['error'] === UPLOAD_ERR_OK) {
                $file_result = processUploadedFile($files, null, $upload_dir, $order_token);
                if ($file_result) {
                    $referencne_subory[] = $file_result;
                }
            }
        }
    }
    
    // Uloženie do databázy
    $sql = "INSERT INTO orders (customer_name, customer_email, description, estimated_price, deadline, order_token) 
            VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $meno,
        $email,
        $popis_prace,
        $odhadovana_cena,
        $deadline,
        $order_token
    ]);
    
    $order_id = $pdo->lastInsertId();
    
    // Ak zákazník zadal cenu, vytvor prvý záznam v price_negotiations ako ponuka od zákazníka
    if ($odhadovana_cena !== null && $odhadovana_cena > 0) {
        $neg_sql = "INSERT INTO price_negotiations (order_id, price, offered_by, status, created_at) 
                    VALUES (?, ?, 'customer', 'pending', NOW())";
        $neg_stmt = $pdo->prepare($neg_sql);
        $neg_stmt->execute([$order_id, $odhadovana_cena]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Objednávka bola úspešne vytvorená',
        'order_number' => $order_token,
        'token' => $order_token,
        'order_id' => $order_id
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba databázy: ' . $e->getMessage(),
        'debug' => true
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Neočakávaná chyba: ' . $e->getMessage(),
        'debug' => true
    ]);
}

// Funkcia pre spracovanie nahrávaných súborov
function processUploadedFile($files, $index, $upload_dir, $token) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                     'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     'text/plain'];
    $max_size = 5 * 1024 * 1024; // 5MB
    
    $name = $index !== null ? $files['name'][$index] : $files['name'];
    $tmp_name = $index !== null ? $files['tmp_name'][$index] : $files['tmp_name'];
    $size = $index !== null ? $files['size'][$index] : $files['size'];
    $type = $index !== null ? $files['type'][$index] : $files['type'];
    
    // Validácia typu súboru
    if (!in_array($type, $allowed_types)) {
        return false;
    }
    
    // Validácia veľkosti
    if ($size > $max_size) {
        return false;
    }
    
    // Generovanie bezpečného názvu súboru
    $file_extension = pathinfo($name, PATHINFO_EXTENSION);
    $safe_filename = $token . '_' . time() . '_' . rand(1000, 9999) . '.' . $file_extension;
    $target_path = $upload_dir . $safe_filename;
    
    // Presun súboru
    if (move_uploaded_file($tmp_name, $target_path)) {
        return [
            'original_name' => $name,
            'filename' => $safe_filename,
            'size' => $size,
            'type' => $type
        ];
    }
    
    return false;
}
?>