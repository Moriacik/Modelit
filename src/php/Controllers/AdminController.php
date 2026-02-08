<?php
/**
 * AdminController - Spravuje admin operácie
 */

class AdminController {

  /**
   * GET /admin/orders - Vracia všetky objednávky
   */
  public static function getOrders() {
    try {
      $order = new Order();
      $orders = $order->getAll();

      return [
        'success' => true,
        'message' => 'Objednávky načítané',
        'data' => [
          'count' => count($orders),
          'orders' => $orders
        ]
      ];
    } catch (Exception $e) {
      return [
        'success' => false,
        'message' => 'Chyba pri načítaní objednávok: ' . $e->getMessage(),
        'data' => null
      ];
    }
  }

  /**
   * PUT /admin/orders/:id/status - Zmení status objednávky
   */
  public static function updateOrderStatus($id, $data) {
    try {
      if (!isset($data['status'])) {
        return [
          'success' => false,
          'message' => 'Status je povinný',
          'data' => null
        ];
      }

      $validStatuses = ['new', 'in_progress', 'completed'];
      if (!in_array($data['status'], $validStatuses)) {
        return [
          'success' => false,
          'message' => 'Neplatný status: ' . $data['status'],
          'data' => null
        ];
      }

      $order = new Order();
      $updated = $order->updateStatus($id, $data['status']);

      if ($updated) {
        return [
          'success' => true,
          'message' => 'Status bol zmenený',
          'data' => ['status' => $data['status']]
        ];
      } else {
        return [
          'success' => false,
          'message' => 'Chyba pri zmene statusu',
          'data' => null
        ];
      }
    } catch (Exception $e) {
      return [
        'success' => false,
        'message' => 'Chyba: ' . $e->getMessage(),
        'data' => null
      ];
    }
  }

  /**
   * GET /admin/orders/:id - Vracia detaily konkrétnej objednávky
   */
  public static function getOrderDetails($id) {
    try {
      $order = new Order();
      $orderData = $order->findById($id);

      if (!$orderData) {
        return [
          'success' => false,
          'message' => 'Objednávka nenájdená',
          'data' => null
        ];
      }

      return [
        'success' => true,
        'message' => 'Objednávka načítaná',
        'data' => $orderData
      ];
    } catch (Exception $e) {
      return [
        'success' => false,
        'message' => 'Chyba pri načítaní objednávky: ' . $e->getMessage(),
        'data' => null
      ];
    }
  }

  /**
   * PUT /admin/orders/:id/price - Admin navrhne cenu (price sa nastaví, status ostane 'new')
   */
  public static function updatePrice($id, $data) {
    try {
      // Check if price is set
      if (!isset($data['agreed_price']) || $data['agreed_price'] === '') {
        return [
          'success' => false,
          'message' => 'Cena je povinná',
          'data' => null
        ];
      }

      // Convert to float
      $price = (float)$data['agreed_price'];

      // Check if valid number
      if (!is_numeric($data['agreed_price'])) {
        return [
          'success' => false,
          'message' => 'Cena musí byť číslo',
          'data' => null
        ];
      }

      // Check minimum value
      if ($price < 0.01) {
        return [
          'success' => false,
          'message' => 'Cena musí byť aspoň 0.01 €',
          'data' => null
        ];
      }

      // Check maximum value
      if ($price > 999999.99) {
        return [
          'success' => false,
          'message' => 'Cena je príliš vysoká (max. 999999.99 €)',
          'data' => null
        ];
      }

      // Check decimal places
      if (!preg_match('/^\d+(\.\d{1,2})?$/', (string)$data['agreed_price'])) {
        return [
          'success' => false,
          'message' => 'Cena môže mať maximálne 2 desatinné miesta',
          'data' => null
        ];
      }

      $pdo = getDbConnection();
      $stmt = $pdo->prepare("
        UPDATE orders 
        SET price = ?
        WHERE id = ?
      ");
      $updated = $stmt->execute([$price, $id]);

      if ($updated) {
        return [
          'success' => true,
          'message' => 'Cena bola navrhnutá zákazníkovi',
          'data' => ['price' => $price]
        ];
      } else {
        return [
          'success' => false,
          'message' => 'Chyba pri zmene ceny',
          'data' => null
        ];
      }
    } catch (Exception $e) {
      return [
        'success' => false,
        'message' => 'Chyba: ' . $e->getMessage(),
        'data' => null
      ];
    }
  }

  /**
   * GET /admin/stats - Vracia štatistiky objednávok
   */
  public static function getStats() {
    try {
      $order = new Order();
      $orders = $order->getAll();

      $stats = [
        'total' => count($orders),
        'new' => 0,
        'in_progress' => 0,
        'completed' => 0,
        'total_budget' => 0,
        'total_agreed' => 0
      ];

      foreach ($orders as $o) {
        $stats[$o['status']] = ($stats[$o['status']] ?? 0) + 1;
        $stats['total_agreed'] += (float)($o['price'] ?? 0);
      }

      return [
        'success' => true,
        'message' => 'Štatistiky načítané',
        'data' => $stats
      ];
    } catch (Exception $e) {
      return [
        'success' => false,
        'message' => 'Chyba pri načítaní štatistík: ' . $e->getMessage(),
        'data' => null
      ];
    }
  }
}
?>
