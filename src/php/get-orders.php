<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iba GET requesty
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Include databázovej konfigurácie
require_once 'config.php';

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Získanie všetkých objednávok
    $sql = "SELECT 
                id, 
                meno, 
                email, 
                popis_prace, 
                odhadovana_cena, 
                deadline, 
                referencne_subory, 
                status, 
                order_token, 
                datum_vytvorenia, 
                datum_aktualizacie 
            FROM orders 
            ORDER BY datum_vytvorenia DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Spracovanie dát pre frontend
    foreach ($orders as &$order) {
        // Dekódovanie JSON súborov
        if ($order['referencne_subory']) {
            $order['referencne_subory'] = json_decode($order['referencne_subory'], true) ?: [];
        } else {
            $order['referencne_subory'] = [];
        }
        
        // Formátovanie ceny
        if ($order['odhadovana_cena']) {
            $order['odhadovana_cena'] = number_format($order['odhadovana_cena'], 2, '.', '');
        }
    }
    
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'total_count' => count($orders)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri načítaní objednávok'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Neočakávaná chyba'
    ]);
}
?>