<?php
/**
 * User Model - Databázové operácie pre admina/užívateľa
 */

class User {
    
    /**
     * Autentifikovať admin užívateľa
     */
    public static function authenticate($username, $password, $type = 'admin') {
        try {
            $pdo = getDbConnection();
            
            if ($type === 'admin') {
                // Hľadať v tabuľke admins
                $stmt = $pdo->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user && password_verify($password, $user['password_hash'])) {
                    return $user;
                }
            }
            
            return null;
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}

/**
 * Order Model - Operácie s objednávkami
 */
class Order {
    
    /**
     * Nájsť objednávku podľa tokenu
     */
    public static function findByToken($token) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("SELECT id, order_token, status, description, budget, deadline FROM orders WHERE order_token = ?");
            $stmt->execute([$token]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $order ?: null;
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
?>
