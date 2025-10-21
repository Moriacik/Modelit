<?php
// Databázová konfigurácia pre Docker

// Použitie environment premenných pre Docker
$host = getenv('DB_HOST') ?: 'db'; // Docker service name
$dbname = getenv('DB_NAME') ?: 'vaii_semestralka';
$db_username = getenv('DB_USER') ?: 'vaii_user';
$db_password = getenv('DB_PASS') ?: 'vaii_pass';

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