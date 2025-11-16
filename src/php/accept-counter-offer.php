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

$orderToken = $input['order_token'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Získanie objednávky
    $orderSql = "SELECT id, price_status FROM orders WHERE order_token = :token";
    $orderStmt = $pdo->prepare($orderSql);
    $orderStmt->bindParam(':token', $orderToken, PDO::PARAM_STR);
    $orderStmt->execute();
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka nebola nájdená');
    }
    
    // Získanie posledného pending návrhu (od admina)
    $negotiationSql = "SELECT id, price FROM price_negotiations 
                       WHERE order_id = :order_id AND status = 'pending' AND offered_by = 'admin'
                       ORDER BY created_at DESC 
                       LIMIT 1";
    
    $negotiationStmt = $pdo->prepare($negotiationSql);
    $negotiationStmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
    $negotiationStmt->execute();
    $negotiation = $negotiationStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$negotiation) {
        throw new Exception('Žiadna čakajúca ponuka od správcu');
    }
    
    // Výpočet cien pre jednotlivé milestones (30% - 30% - 40%)
    $depositRequired = round($negotiation['price'] * 0.3, 2);
    $midwayRequired = round($negotiation['price'] * 0.3, 2);
    $finalRequired = round($negotiation['price'] * 0.4, 2);
    
    // Aktualizácia vyjednávania na accepted
    $updateNegotiationSql = "UPDATE price_negotiations 
                             SET status = 'accepted', responded_at = NOW() 
                             WHERE id = :negotiation_id";
    
    $updateNegotiationStmt = $pdo->prepare($updateNegotiationSql);
    $updateNegotiationStmt->bindParam(':negotiation_id', $negotiation['id'], PDO::PARAM_INT);
    
    if (!$updateNegotiationStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii vyjednávania');
    }
    
    // Aktualizácia objednávky
    $updateOrderSql = "UPDATE orders 
                       SET price_status = 'agreed',
                           agreed_price = :agreed_price,
                           deposit_required = :deposit_required,
                           midway_required = :midway_required,
                           final_required = :final_required,
                           status = 'in_progress',
                           updated_at = NOW() 
                       WHERE id = :order_id";
    
    $updateOrderStmt = $pdo->prepare($updateOrderSql);
    $updateOrderStmt->bindParam(':agreed_price', $negotiation['price'], PDO::PARAM_STR);
    $updateOrderStmt->bindParam(':deposit_required', $depositRequired, PDO::PARAM_STR);
    $updateOrderStmt->bindParam(':midway_required', $midwayRequired, PDO::PARAM_STR);
    $updateOrderStmt->bindParam(':final_required', $finalRequired, PDO::PARAM_STR);
    $updateOrderStmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
    
    if (!$updateOrderStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii objednávky');
    }
    
    // Commit transakcie
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Cenová ponuka bola úspešne prijatá!',
        'agreed_price' => number_format($negotiation['price'], 2, '.', ''),
        'price_status' => 'agreed'
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
