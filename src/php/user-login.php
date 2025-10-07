<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

if (!$input || !isset($input['orderCode'])) {
    echo json_encode(['success' => false, 'message' => 'Chýba kód objednávky']);
    exit;
}

$order_token = trim($input['orderCode']);

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Hľadanie objednávky podľa tokenu
    $stmt = $pdo->prepare("SELECT id, order_token, meno, email, status FROM orders WHERE order_token = ?");
    $stmt->execute([$order_token]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($order) {
        // Objednávka existuje - vygenerovať token pre session
        session_start();
        $user_token = bin2hex(random_bytes(32));
        $_SESSION['user_token'] = $user_token;
        $_SESSION['user_order_id'] = $order['id'];
        $_SESSION['user_order_token'] = $order['order_token'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Prihlásenie úspešné!',
            'token' => $user_token,
            'orderToken' => $order['order_token'],
            'customerName' => $order['meno']
        ]);
        
    } else {
        // Objednávka nenájdená
        echo json_encode([
            'success' => false,
            'message' => 'Objednávka s týmto kódom nebola nájdená'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri vyhľadávaní objednávky'
    ]);
}
?>