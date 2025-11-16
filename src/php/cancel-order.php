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
$reason = $input['reason'] ?? 'Zrušené administrátorom';

try {
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
    
    // Kontrola, či môže byť objednávka zrušená
    if (in_array($order['status'], ['completed', 'cancelled'])) {
        throw new Exception('Objednávka už bola dokončená alebo zrušená');
    }
    
    // Aktualizácia objednávky na zrušenú
    $updateSql = "UPDATE orders 
                  SET status = 'cancelled',
                      price_status = 'rejected',
                      updated_at = NOW() 
                  WHERE id = :order_id";
    
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Chyba pri zrušení objednávky');
    }
    
    // Označenie všetkých vyjednávaní ako odmietnuté
    $rejectNegotiationsSql = "UPDATE price_negotiations 
                              SET status = 'rejected', responded_at = NOW() 
                              WHERE order_id = :order_id AND status = 'pending'";
    
    $rejectNegotiationsStmt = $pdo->prepare($rejectNegotiationsSql);
    $rejectNegotiationsStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $rejectNegotiationsStmt->execute();
    
    // Log aktivity
    $logSql = "INSERT INTO order_logs (order_id, action, description, datum_vytvorenia) 
               VALUES (:order_id, :action, :description, NOW())";
    
    try {
        $logStmt = $pdo->prepare($logSql);
        $logStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
        $logStmt->bindValue(':action', 'order_cancelled', PDO::PARAM_STR);
        $logStmt->bindParam(':description', $reason, PDO::PARAM_STR);
        $logStmt->execute();
    } catch (Exception $e) {
        // Log chyby, ale neprerušuj hlavný proces
        error_log("Error logging order activity: " . $e->getMessage());
    }
    
    // Commit transakcie
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Objednávka bola úspešne zrušená.',
        'new_status' => 'cancelled',
        'order_token' => $order['order_token']
    ]);
    
} catch (PDOException $e) {
    // Rollback transakcie
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri zrušení objednávky v databáze'
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