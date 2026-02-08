<?php
/**
 * OrderFile Model - Pracovný so súbormi objednávok
 */

class OrderFile {
    
    /**
     * Vložiť nový súbor do tabuľky
     */
    public static function create($orderId, $fileName, $fileSize) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            INSERT INTO order_files (order_id, file_name, file_size)
            VALUES (?, ?, ?)
        ");
        
        return $stmt->execute([$orderId, $fileName, $fileSize]);
    }
    
    /**
     * Nájsť všetky súbory pre objednávku
     */
    public static function findByOrderId($orderId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT * FROM order_files
            WHERE order_id = ?
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute([$orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Nájsť súbor podľa ID
     */
    public static function findById($fileId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT * FROM order_files WHERE id = ?");
        $stmt->execute([$fileId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Nájsť súbor podľa názvu a order ID (bezpečnostná kontrola)
     */
    public static function findByFileName($orderId, $fileName) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT * FROM order_files
            WHERE order_id = ? AND file_name = ?
        ");
        $stmt->execute([$orderId, $fileName]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Vymazať súbor zo tabuľky
     */
    public static function delete($fileId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("DELETE FROM order_files WHERE id = ?");
        return $stmt->execute([$fileId]);
    }
    
    /**
     * Vymazať všetky súbory objednávky
     */
    public static function deleteByOrderId($orderId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("DELETE FROM order_files WHERE order_id = ?");
        return $stmt->execute([$orderId]);
    }
    
    /**
     * Počet súborov pre objednávku
     */
    public static function countByOrderId($orderId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM order_files WHERE order_id = ?");
        $stmt->execute([$orderId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    }

    /**
     * Aktualizovať názov súboru
     */
    public static function update($fileId, $data) {
        $pdo = getDbConnection();
        
        // Bezpečný update s prípravou
        $updates = [];
        $params = [];
        
        if (isset($data['file_name'])) {
            $updates[] = 'file_name = ?';
            $params[] = $data['file_name'];
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $fileId;
        $query = "UPDATE order_files SET " . implode(', ', $updates) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        return $stmt->execute($params);
    }
}
?>
