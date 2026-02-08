<?php
/**
 * ReviewController - Spravovanie recenzií
 */

class ReviewController {
    
    /**
     * Vytvoriť novú recenziu
     */
    public static function create($data) {
        try {
            // Validácia
            if (!isset($data['customer_name']) || trim($data['customer_name']) === '') {
                return [
                    'success' => false,
                    'message' => 'Meno je povinné'
                ];
            }
            
            // Validácia mena (2-100 znakov)
            if (strlen($data['customer_name']) < 2 || strlen($data['customer_name']) > 100) {
                return [
                    'success' => false,
                    'message' => 'Meno musí mať 2-100 znakov'
                ];
            }
            
            if (!isset($data['customer_role']) || trim($data['customer_role']) === '') {
                return [
                    'success' => false,
                    'message' => 'Rola je povinná'
                ];
            }
            
            // Validácia role (2-50 znakov)
            if (strlen($data['customer_role']) < 2 || strlen($data['customer_role']) > 50) {
                return [
                    'success' => false,
                    'message' => 'Rola musí mať 2-50 znakov'
                ];
            }
            
            if (!isset($data['text']) || trim($data['text']) === '') {
                return [
                    'success' => false,
                    'message' => 'Text recenzie je povinný'
                ];
            }
            
            // Validácia textu (10-1000 znakov)
            if (strlen($data['text']) < 10 || strlen($data['text']) > 1000) {
                return [
                    'success' => false,
                    'message' => 'Text recenzie musí mať 10-1000 znakov'
                ];
            }
            
            // Validácia ratingu (1-5)
            $rating = isset($data['rating']) ? (int)$data['rating'] : 5;
            if ($rating < 1 || $rating > 5) {
                return [
                    'success' => false,
                    'message' => 'Hodnotenie musí byť 1-5'
                ];
            }
            
            // Vytvorit recenziu
            $result = Review::create([
                'customer_name' => htmlspecialchars(trim($data['customer_name'])),
                'customer_role' => htmlspecialchars(trim($data['customer_role'])),
                'text' => htmlspecialchars(trim($data['text'])),
                'rating' => $rating
            ]);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => 'Recenzia bola úspešne vytvorená',
                    'data' => $result
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Chyba pri vytváraní recenzie'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Chyba servera: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Zistiť všetky publikované recenzie (pre home page)
     */
    public static function getPublished($limit = 6) {
        try {
            $reviews = Review::getAllPublished($limit);
            return [
                'success' => true,
                'data' => $reviews
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Chyba pri načítaní recenzií: ' . $e->getMessage()
            ];
        }
    }
}
?>
