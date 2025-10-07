<?php
// Databázová konfigurácia
// Upravte tieto hodnoty podľa vašej konfigurácie

$host = 'localhost';
$dbname = 'test'; // zmeňte na názov vašej databázy
$db_username = 'root';
$db_password = ''; // vaše databázové heslo

// Funkcia pre pripojenie k databáze
function getDbConnection() {
    global $host, $dbname, $db_username, $db_password;
    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $db_username,
            $db_password
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Chyba pripojenia k databáze: " . $e->getMessage());
    }
}
?>