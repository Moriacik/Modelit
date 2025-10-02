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

// Zatiaľ neimplementované
echo json_encode([
    'success' => false,
    'message' => 'Prihlásenie zákazníkov bude dostupné čoskoro'
]);

/*
TODO: Implementácia user loginu
1. Overiť číslo objednávky v databáze
2. Overiť email priradený k objednávke
3. Vygenerovať unikátny login link
4. Odoslať email s linkom
5. Link bude platný napr. 24 hodín
*/
?>