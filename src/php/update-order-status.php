<?php
header('Content-Type: application/json');
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

// Získanie dát z request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['order_id']) || !isset($input['status'])) {
    echo json_encode(['success' => false, 'message' => 'Chýbajú povinné údaje']);
    exit;
}

$order_id = intval($input['order_id']);
$new_status = trim($input['status']);

// Validácia statusu
$allowed_statuses = ['nova', 'v_procese', 'dokoncena', 'zrusena'];
if (!in_array($new_status, $allowed_statuses)) {
    echo json_encode(['success' => false, 'message' => 'Neplatný status']);
    exit;
}

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Overenie, či objednávka existuje
    $check_stmt = $pdo->prepare("SELECT id, order_token FROM orders WHERE id = ?");
    $check_stmt->execute([$order_id]);
    $order = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Objednávka nebola nájdená']);
        exit;
    }
    
    // Aktualizácia statusu
    $update_stmt = $pdo->prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $result = $update_stmt->execute([$new_status, $order_id]);
    
    if ($result && $update_stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Status objednávky bol úspešne aktualizovaný',
            'order_id' => $order_id,
            'order_token' => $order['order_token'],
            'new_status' => $new_status
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Status sa nepodarilo aktualizovať'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri aktualizácii statusu'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Neočakávaná chyba'
    ]);
}
?>