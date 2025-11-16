<?php
/**
 * Mark Final Ready (admin endpoint)
 * POST /api/mark-final-ready.php
 * 
 * Body:
 * {
 *   "order_id": 1,
 *   "admin_token": "admin_token_here"
 * }
 */

header('Content-Type: application/json');
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$orderId = $input['order_id'] ?? null;
$adminToken = $input['admin_token'] ?? null;

if (!$orderId || !$adminToken) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing order_id or admin_token']);
    exit;
}

// TODO: Verify admin token (add session check)
// For now, we'll just check if order exists

try {
    $pdo->beginTransaction();
    
    $checkSql = "SELECT id FROM orders WHERE id = :id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([':id' => $orderId]);
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        $pdo->rollBack();
        exit;
    }
    
    // Mark final files as ready
    $updateSql = "UPDATE orders SET final_ready = TRUE, updated_at = NOW() WHERE id = :id";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([':id' => $orderId]);
    
    $pdo->commit();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Final files marked as ready',
        'final_ready' => true
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to mark final ready: ' . $e->getMessage()]);
}
?>
