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

if (!isset($input['counter_price']) || !is_numeric($input['counter_price']) || $input['counter_price'] <= 0) {
    echo json_encode(['success' => false, 'message' => 'Neplatná cena protinávrhov']);
    exit;
}

if (!isset($input['offered_by']) || !in_array($input['offered_by'], ['admin', 'customer'])) {
    echo json_encode(['success' => false, 'message' => 'Neplatný typ ponúkajúceho']);
    exit;
}

$orderId = $input['order_id'];
$counterPrice = $input['counter_price'];
$note = $input['note'] ?? '';
$offeredBy = $input['offered_by'];  // Priamo bez konverzie

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Začatie transakcie
    $pdo->beginTransaction();
    
    // Overenie existencie objednávky
    $checkSql = "SELECT id, status, price_status FROM orders WHERE id = :order_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $checkStmt->execute();
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Objednávka nebola nájdená');
    }
    
    // Kontrola, či nie je cena už dohodnutá
    if ($order['price_status'] === 'agreed') {
        throw new Exception('Cena už bola dohodnutá oboma stranami');
    }
    
    // Označenie predchádzajúcich ponúk ako odmietnuté
    $rejectOldSql = "UPDATE price_negotiations 
                     SET status = 'rejected', responded_at = NOW() 
                     WHERE order_id = :order_id AND status = 'pending'";
    
    $rejectOldStmt = $pdo->prepare($rejectOldSql);
    $rejectOldStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $rejectOldStmt->execute();
    
    // Vloženie nového protinávrhov
    $insertSql = "INSERT INTO price_negotiations 
                  (order_id, price, offered_by, note, status, created_at) 
                  VALUES (:order_id, :price, :offered_by, :note, 'pending', NOW())";
    
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $insertStmt->bindParam(':price', $counterPrice, PDO::PARAM_STR);
    $insertStmt->bindParam(':offered_by', $offeredBy, PDO::PARAM_STR);
    $insertStmt->bindParam(':note', $note, PDO::PARAM_STR);
    
    if (!$insertStmt->execute()) {
        throw new Exception('Chyba pri vkladaní protinávrhov');
    }
    
    // Aktualizácia objednávky
    $updateSql = "UPDATE orders 
                  SET status = 'in_progress',
                      admin_price = :admin_price,
                      price_status = 'negotiating',
                      updated_at = NOW() 
                  WHERE id = :order_id";
    
    $updateStmt = $pdo->prepare($updateSql);
    $adminPrice = ($offeredBy === 'admin') ? $counterPrice : ($order['admin_price'] ?? null);
    $updateStmt->bindParam(':admin_price', $adminPrice, PDO::PARAM_STR);
    $updateStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Chyba pri aktualizácii objednávky');
    }
    
    // Zatiaľ preskočíme logovanie (môžeme pridať neskôr)
    
    // Commit transakcie
    $pdo->commit();
    
    $message = ($offeredBy === 'admin') ? 
        'Protinávrh bol úspešne odoslaný klientovi!' : 
        'Protinávrh od klienta bol zaznamenaný!';
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'new_price' => number_format($counterPrice, 2, '.', ''),
        'negotiation_id' => $pdo->lastInsertId()
    ]);
    
} catch (PDOException $e) {
    // Rollback transakcie
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri spracovaní protinávrhov v databáze'
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