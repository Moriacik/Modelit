<?php
// Skript pre vytvorenie prvého admin používateľa
// Spustite tento súbor raz cez prehliadač alebo CLI

// Nastavenia databázy
$host = 'localhost';
$dbname = 'test'; // zmeňte na názov vašej databázy
$username = 'root';
$password = ''; // vaše databázové heslo

try {
    // Pripojenie k databáze
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vytvorenie tabuľky admin ak neexistuje
    $createTable = "
        CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($createTable);
    
    // Adminove údaje
    $adminName = 'admin';
    $adminPassword = 'admin'; // plain text heslo, ktoré bude zahashované
    
    // Overenie či admin už existuje
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM admin WHERE name = ?");
    $checkStmt->execute([$adminName]);
    
    if ($checkStmt->fetchColumn() > 0) {
        echo "Admin používateľ '$adminName' už existuje!<br>";
    } else {
        // Hashovanie hesla
        $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
        
        // Vloženie admin používateľa
        $insertStmt = $pdo->prepare("INSERT INTO admin (id,name, password_hash) VALUES (1,?, ?)");
        $insertStmt->execute([$adminName, $passwordHash]);
        
        echo "✅ Admin používateľ vytvorený úspešne!<br>";
        echo "📝 Meno: $adminName<br>";
        echo "🔑 Heslo: $adminPassword<br>";
        echo "🔒 Hash: $passwordHash<br><br>";
        echo "⚠️ Tento skript zmaž alebo chráň po prvom spustení!<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Chyba databázy: " . $e->getMessage();
    echo "<br><br>📋 Skontrolujte:";
    echo "<br>• Názov databázy: '$dbname'";
    echo "<br>• Databázové prihlasovacie údaje";
    echo "<br>• Či je databáza spustená";
}
?>
