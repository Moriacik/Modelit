<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iba POST requesty pre login
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Získanie dát z request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['password'])) {
    echo json_encode(['success' => false, 'message' => 'Chýbajú prihlasovacie údaje']);
    exit;
}

$username = trim($input['username']);
$password = trim($input['password']);

// Nastavenia databázy
$host = 'localhost';
$dbname = 'test'; // zmeňte na názov vašej databázy
$db_username = 'root';
$db_password = ''; // vaše databázové heslo

try {
    // Pripojenie k databáze
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $db_username, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Hľadanie admin používateľa v databáze
    $stmt = $pdo->prepare("SELECT id, name, password_hash FROM admin WHERE name = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin && password_verify($password, $admin['password_hash'])) {
        // Úspešné prihlásenie
        session_start();
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['name'];
        $_SESSION['login_time'] = time();
        
        // Generovanie jednoduchého tokenu (v produkcii použiť JWT)
        $token = base64_encode($admin['name'] . ':' . time() . ':' . rand(1000, 9999));
        
        echo json_encode([
            'success' => true,
            'message' => 'Prihlásenie úspešné',
            'token' => $token,
            'username' => $admin['name']
        ]);
    } else {
        // Neúspešné prihlásenie
        echo json_encode([
            'success' => false,
            'message' => 'Nesprávne používateľské meno alebo heslo'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Chyba databázy'
    ]);
}
?>