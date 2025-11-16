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

// Čítanie JSON dát
$data = json_decode(file_get_contents('php://input'), true);

// Validácia vstupov
if (!isset($data['order_id']) || !isset($data['order_token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Chýbajú povinné parametre']);
    exit;
}

$orderId = $data['order_id'];
$orderToken = $data['order_token'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Overenie tokenu objednávky
    $verifySql = "SELECT id FROM orders WHERE id = :id AND order_token = :token";
    $verifyStmt = $pdo->prepare($verifySql);
    $verifyStmt->bindParam(':id', $orderId, PDO::PARAM_INT);
    $verifyStmt->bindParam(':token', $orderToken, PDO::PARAM_STR);
    $verifyStmt->execute();
    
    if (!$verifyStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Neplatný token objednávky']);
        exit;
    }
    
    // Aktualizácia databázy - zaznamenanie priebežnej platby
    $updateSql = "UPDATE orders 
                  SET midway_paid_at = NOW(),
                      updated_at = NOW()
                  WHERE id = :id";
    
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':id', $orderId, PDO::PARAM_INT);
    
    if ($updateStmt->execute()) {
        // Úspešne zaplatené - vrátenie aktualizovaných dát
        $fetchSql = "SELECT 
                        deposit_paid_at,
                        midway_paid_at,
                        final_paid_at
                     FROM orders 
                     WHERE id = :id";
        
        $fetchStmt = $pdo->prepare($fetchSql);
        $fetchStmt->bindParam(':id', $orderId, PDO::PARAM_INT);
        $fetchStmt->execute();
        $paymentData = $fetchStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Priebežná platba bola úspešne zaplatená',
            'payment_data' => $paymentData
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Chyba pri aktualizácii databázy']);
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri spracovaní platby'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Neočakávaná chyba'
    ]);
}
?>
