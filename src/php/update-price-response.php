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
if (!isset($input['order_token']) || empty($input['order_token'])) {
    echo json_encode(['success' => false, 'message' => 'Chýba token objednávky']);
    exit;
}

if (!isset($input['action']) || !in_array($input['action'], ['accept', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Neplatná akcia']);
    exit;
}

$orderToken = $input['order_token'];
$action = $input['action'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Overenie existencie objednávky
    $checkSql = "SELECT id, status, admin_price FROM orders WHERE order_token = :token";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindParam(':token', $orderToken, PDO::PARAM_STR);
    $checkStmt->execute();
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka nebola nájdená');
    }
    
    // Kontrola, či už nie je cenová ponuka spracovaná
    if ($order['status'] === 'accepted' || $order['status'] === 'rejected') {
        throw new Exception('Cenová ponuka už bola spracovaná');
    }
    
    // Kontrola, či existuje admin cena
    if (!$order['admin_price'] || $order['admin_price'] <= 0) {
        throw new Exception('Cenová ponuka od správcu ešte nebola vytvorená');
    }
    
    // Aktualizácia objednávky podľa akcie
    if ($action === 'accept') {
        $newStatus = 'accepted';
        $priceStatus = 'accepted';
        $message = 'Cenová ponuka bola úspešne prijatá!';
    } else {
        $newStatus = 'rejected';
        $priceStatus = 'rejected';
        $message = 'Cenová ponuka bola odmietnutá. Môžete kontaktovať správcu pre ďalšie rokovanie.';
    }
    
    // Update SQL
    $updateSql = "UPDATE orders 
                  SET status = :status, 
                      price_status = :price_status, 
                      updated_at = NOW() 
                  WHERE order_token = :token";
    
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':status', $newStatus, PDO::PARAM_STR);
    $updateStmt->bindParam(':price_status', $priceStatus, PDO::PARAM_STR);
    $updateStmt->bindParam(':token', $orderToken, PDO::PARAM_STR);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii objednávky');
    }
    
    // Ak bola ponuka prijatá, aktualizujeme stav na "in_progress"
    if ($action === 'accept') {
        $progressSql = "UPDATE orders 
                        SET status = 'in_progress',
                            updated_at = NOW()
                        WHERE order_token = :token";
        
        $progressStmt = $pdo->prepare($progressSql);
        $progressStmt->bindParam(':token', $orderToken, PDO::PARAM_STR);
        $progressStmt->execute();
    }
    
    // Log aktivity (voliteľné)
    $logSql = "INSERT INTO order_logs (order_id, action, description, datum_vytvorenia) 
               VALUES (:order_id, :action, :description, NOW())";
    
    try {
        $logStmt = $pdo->prepare($logSql);
        $logStmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
        $logStmt->bindParam(':action', $action, PDO::PARAM_STR);
        $logStmt->bindParam(':description', $message, PDO::PARAM_STR);
        $logStmt->execute();
    } catch (Exception $e) {
        // Log chyby, ale neprerušuj hlavný proces
        error_log("Error logging order activity: " . $e->getMessage());
    }
    
    // Commit transakcie
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'new_status' => $newStatus,
        'price_status' => $priceStatus
    ]);
    
} catch (PDOException $e) {
    // Rollback transakcie
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri spracovaní požiadavky v databáze'
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