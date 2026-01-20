<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

session_start();

// Overiť, či je admin prihlásený
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Neautorizovaný prístup']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderId = $data['order_id'] ?? null;

    if (!$orderId) {
        echo json_encode(['success' => false, 'message' => 'ID objednávky nebolo poskytnuté']);
        exit;
    }

    // Overiť, či je objednávka dokončená
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Objednávka nebola nájdená']);
        exit;
    }

    if ($order['status'] !== 'completed') {
        echo json_encode(['success' => false, 'message' => 'Iba dokončené objednávky môžu byť vymazané']);
        exit;
    }

    // Vymazať všetky súvisiace záznamy
    $pdo->beginTransaction();

    try {
        // Vymazať vyjednávania
        $stmt = $pdo->prepare("DELETE FROM price_negotiations WHERE order_id = ?");
        $stmt->execute([$orderId]);

        // Vymazať platby
        $stmt = $pdo->prepare("DELETE FROM payments WHERE order_id = ?");
        $stmt->execute([$orderId]);

        // Vymazať objednávku
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Objednávka bola úspešne vymazaná'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error deleting order: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri mazaní objednávky: ' . $e->getMessage()
    ]);
}
?>
