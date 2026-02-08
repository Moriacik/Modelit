<?php
/**
 * Order Model - Databázové operácie s objednávkami
 */

class Order {
    
    /**
     * Vytvoriť novú objednávku
     */
    public static function create($data) {
        try {
            $pdo = getDbConnection();
            
            // Generovať unique order token (17 znakov)
            $orderToken = self::generateToken();
            
            // Vložiť do DB
            $stmt = $pdo->prepare("
                INSERT INTO orders (
                    order_token,
                    customer_name,
                    customer_email,
                    description,
                    price,
                    deadline,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $orderToken,
                $data['customer_name'],
                $data['customer_email'],
                $data['description'],
                $data['price'] ?? 0,
                $data['deadline'],
                'new'
            ]);
            
            // Vrátit vytvoreného orderu
            return [
                'id' => $pdo->lastInsertId(),
                'order_token' => $orderToken
            ];
            
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Nájsť objednávku podľa tokenu
     */
    public static function findByToken($token) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                SELECT 
                    id, order_token, customer_name, customer_email,
                    description, price, deadline, status, created_at, final_ready
                FROM orders 
                WHERE order_token = ?
            ");
            $stmt->execute([$token]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $order ?: null;
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Nájsť objednávku podľa ID
     */
    public static function findById($id) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                SELECT 
                    id, order_token, customer_name, customer_email,
                    description, price, deadline, status, created_at, final_ready
                FROM orders 
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $order ?: null;
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Získať všetky objednávky
     */
    public static function getAll() {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->query("
                SELECT 
                    id, order_token, customer_name, customer_email,
                    description, price, deadline, status, created_at, final_ready
                FROM orders 
                ORDER BY created_at DESC
            ");
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Aktualizovať status objednávky
     */
    public static function updateStatus($id, $status) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                UPDATE orders 
                SET status = ?
                WHERE id = ?
            ");
            
            return $stmt->execute([$status, $id]);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Aktualizovať dohodnutú cenu
     */
    public static function updatePrice($id, $price) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                UPDATE orders 
                SET price = ?
                WHERE id = ?
            ");
            
            return $stmt->execute([$price, $id]);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Aktualizovať status a cenu (napr. keď zákazník odmietne cenu)
     */
    public static function updateStatusAndPrice($id, $status, $price) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                UPDATE orders 
                SET status = ?, price = ?
                WHERE id = ?
            ");
            
            return $stmt->execute([$status, $price, $id]);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Vymazať objednávku a všetky jej súbory
     */
    public static function delete($id) {
        try {
            $pdo = getDbConnection();
            
            // Vymazať všetky súbory súvisiace s objednávkou (CASCADE)
            // Musíme to urobiť aj manuálne, aby sme vymazali fyzické súbory
            $orderFiles = OrderFile::findByOrderId($id);
            foreach ($orderFiles as $file) {
                $filePath = __DIR__ . '/../uploads/completed/' . $file['file_name'];
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                OrderFile::delete($file['id']);
            }
            
            // Vymazať objednávku z tabuľky
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Generovať unique order token (17 znakov)
     * Formát: MODELIT-XXXXXXXXXX (12 znakov random)
     */
    private static function generateToken() {
        $prefix = 'MODELIT-';
        $random = strtoupper(substr(bin2hex(random_bytes(6)), 0, 9));
        return $prefix . $random;
    }
}
?>
