<?php
/**
 * Review Model - Operácie s recenziami
 */

class Review {
    
    /**
     * Vytvoriť novú recenziu
     */
    public static function create($data) {
        try {
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO reviews (customer_name, customer_role, text, rating)
                VALUES (?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $data['customer_name'],
                $data['customer_role'],
                $data['text'],
                $data['rating'] ?? 5
            ]);
            
            if ($result) {
                return [
                    'id' => $pdo->lastInsertId(),
                    'success' => true
                ];
            }
            return ['success' => false];
            
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Nájsť všetky recenzie (verejné)
     */
    public static function getAllPublished($limit = 6) {
        try {
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("
                SELECT id, customer_name, customer_role, text, rating, created_at
                FROM reviews
                ORDER BY created_at DESC
                LIMIT ?
            ");
            $stmt->bindParam(1, $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
?>
