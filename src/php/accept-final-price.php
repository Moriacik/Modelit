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

if (!isset($input['action']) || !in_array($input['action'], ['accept_by_admin', 'accept_by_client'])) {
    echo json_encode(['success' => false, 'message' => 'Neplatná akcia']);
    exit;
}

$orderId = $input['order_id'];
$action = $input['action'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Získanie aktuálnej objednávky a posledného vyjednávania
    $orderSql = "SELECT o.*, pn.price as last_negotiation_price, pn.offered_by as last_offered_by
                 FROM orders o 
                 LEFT JOIN price_negotiations pn ON o.id = pn.order_id 
                 WHERE o.id = :order_id AND pn.status = 'pending'
                 ORDER BY pn.created_at DESC 
                 LIMIT 1";
    
    $orderStmt = $pdo->prepare($orderSql);
    $orderStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $orderStmt->execute();
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka alebo aktívne vyjednávanie nebolo nájdené');
    }
    
    // Určenie finálnej ceny
    $finalPrice = $order['last_negotiation_price'] ?? $order['estimated_price'];
    
    // Aktualizácia vyjednávania na accepted
    $updateNegotiationSql = "UPDATE price_negotiations 
                             SET status = 'accepted', responded_at = NOW() 
                             WHERE order_id = :order_id AND status = 'pending'";
    
    $updateNegotiationStmt = $pdo->prepare($updateNegotiationSql);
    $updateNegotiationStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $updateNegotiationStmt->execute();
    
    // Aktualizácia objednávky
    $updateOrderSql = "UPDATE orders 
                       SET price_status = 'agreed',
                           agreed_price = :agreed_price,
                           status = 'in_progress',
                           updated_at = NOW() 
                       WHERE id = :order_id";
    
    $updateOrderStmt = $pdo->prepare($updateOrderSql);
    $updateOrderStmt->bindParam(':agreed_price', $finalPrice, PDO::PARAM_STR);
    $updateOrderStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    
    if (!$updateOrderStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii objednávky');
    }
    
    // Zatiaľ preskočíme logovanie (môžeme pridať neskôr)
    
    // Commit transakcie
    $pdo->commit();
    
    $message = ($action === 'accept_by_admin') ? 
        'Cenová ponuka bola prijatá! Objednávka môže pokračovať do výroby.' : 
        'Cenová ponuka bola prijatá klientom! Objednávka môže pokračovať do výroby.';
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'agreed_price' => number_format($finalPrice, 2, '.', ''),
        'new_status' => 'in_progress',
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