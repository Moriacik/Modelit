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

// Získanie order ID z URL parametrov
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Chýba ID objednávky']);
    exit;
}

$orderId = $_GET['id'];

try {
    // Pripojenie k databáze
    $pdo = getDbConnection();
    
    // Získanie detailov objednávky
    $sql = "SELECT 
                id, 
                customer_name as meno, 
                customer_email as email, 
                description as popis_prace, 
                estimated_price as odhadovana_cena, 
                admin_price,
                agreed_price,
                price_status,
                deadline, 
                referencne_subory, 
                final_files,
                status, 
                order_token,
                deposit_paid_at,
                midway_paid_at,
                final_paid_at,
                created_at as datum_vytvorenia, 
                updated_at as datum_aktualizacie 
            FROM orders 
            WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id', $orderId, PDO::PARAM_INT);
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Objednávka s týmto ID nebola nájdená']);
        exit;
    }
    
    // Získanie histórie cenových vyjednávaní
    $negotiationsSql = "SELECT 
                           id,
                           price,
                           offered_by,
                           note,
                           status,
                           created_at,
                           responded_at
                       FROM price_negotiations 
                       WHERE order_id = :order_id 
                       ORDER BY created_at ASC";
    
    $negotiationsStmt = $pdo->prepare($negotiationsSql);
    $negotiationsStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $negotiationsStmt->execute();
    $negotiations = $negotiationsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Spracovanie dát pre frontend
    // Dekódovanie JSON súborov
    if ($order['referencne_subory']) {
        $order['referencne_subory'] = json_decode($order['referencne_subory'], true) ?: [];
    } else {
        $order['referencne_subory'] = [];
    }
    
    // Dekódovanie finálnych súborov
    if ($order['final_files']) {
        $order['final_files'] = json_decode($order['final_files'], true) ?: [];
    } else {
        $order['final_files'] = [];
    }
    
    // Formátovanie cien
    if ($order['odhadovana_cena']) {
        $order['odhadovana_cena'] = number_format($order['odhadovana_cena'], 2, '.', '');
    }
    
    if ($order['admin_price']) {
        $order['admin_price'] = number_format($order['admin_price'], 2, '.', '');
    }
    
    if ($order['agreed_price']) {
        $order['agreed_price'] = number_format($order['agreed_price'], 2, '.', '');
    }
    
    // Formátovanie vyjednávaní
    foreach ($negotiations as &$negotiation) {
        $negotiation['price'] = number_format($negotiation['price'], 2, '.', '');
    }
    
    // Nastavenie defaultných hodnôt
    if (!$order['price_status']) {
        $order['price_status'] = 'pending';
    }
    
    echo json_encode([
        'success' => true,
        'order' => $order,
        'negotiations' => $negotiations
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri načítaní objednávky'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Neočakávaná chyba'
    ]);
}
?>