<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

// Získanie JSON dát z request body
$input = json_decode(file_get_contents('php://input'), true);

// Validácia vstupných dát
if (!isset($input['order_id']) || empty($input['order_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chýba ID objednávky']);
    exit;
}

$orderId = $input['order_id'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Overenie existencie objednávky
    $checkSql = "SELECT id, status, final_files, agreed_price FROM orders WHERE id = :order_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $checkStmt->execute();
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka nebola nájdená');
    }
    
    // Kontrola, či má objednávka nahrané súbory
    if (!$order['final_files']) {
        throw new Exception('Objednávka nemá nahrané žiadne finálne súbory');
    }
    
    // Kontrola, či nie je už označená ako dokončená
    if ($order['status'] === 'completed') {
        throw new Exception('Objednávka už je označená ako dokončená');
    }
    
    // Kontrola, či bola cena dohodnutá
    if (!$order['agreed_price']) {
        throw new Exception('Objednávka nemá dohodnutú cenu');
    }
    
    // Aktualizácia objednávky na dokončenú
    $updateSql = "UPDATE orders 
                  SET status = 'completed',
                      updated_at = NOW() 
                  WHERE id = :order_id";
    
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Chyba pri označení objednávky ako dokončená');
    }
    
    // Log aktivity
    $logSql = "INSERT INTO order_logs (order_id, action, description, datum_vytvorenia) 
               VALUES (:order_id, :action, :description, NOW())";
    
    try {
        $logStmt = $pdo->prepare($logSql);
        $logStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
        $logStmt->bindValue(':action', 'order_completed', PDO::PARAM_STR);
        $description = 'Objednávka bola označená ako dokončená. Finálne súbory sú dostupné na stiahnutie.';
        $logStmt->bindParam(':description', $description, PDO::PARAM_STR);
        $logStmt->execute();
    } catch (Exception $e) {
        // Log chyby, ale neprerušuj hlavný proces
        error_log("Error logging order activity: " . $e->getMessage());
    }
    
    // Commit transakcie
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Objednávka bola úspešne označená ako dokončená!',
        'new_status' => 'completed',
        'completion_date' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    // Rollback transakcie
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri označení objednávky ako dokončená v databáze'
    ]);
} catch (Exception $e) {
    // Rollback transakcie
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>