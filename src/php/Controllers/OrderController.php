<?php
/**
 * OrderController - Spravovanie objednávok
 */

class OrderController {
    
    /**
     * Vytvorenie novej objednávky
     * Očakáva: POST JSON { name, email, description, deadline }
     * Budget sa vyplní admin neskôr
     */
    public function create() {
        // Zisk JSON dáta
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            json_response(false, 'Invalid request: ' . (json_last_error_msg() ?? 'unknown'), null, 400);
        }
        
        // Validácia vstupov
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $description = trim($input['description'] ?? '');
        $deadline = $input['deadline'] ?? '';
        
        // Name validation
        if (empty($name)) {
            json_response(false, 'Name is required', null, 400);
        }
        if (strlen($name) < 2) {
            json_response(false, 'Name must be at least 2 characters', null, 400);
        }
        if (strlen($name) > 100) {
            json_response(false, 'Name too long', null, 400);
        }
        
        // Email validation
        if (empty($email)) {
            json_response(false, 'Email is required', null, 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'Invalid email format', null, 400);
        }
        if (strlen($email) > 100) {
            json_response(false, 'Email too long', null, 400);
        }
        
        // Description validation
        if (empty($description)) {
            json_response(false, 'Description is required', null, 400);
        }
        if (strlen($description) < 10) {
            json_response(false, 'Description must be at least 10 characters', null, 400);
        }
        if (strlen($description) > 5000) {
            json_response(false, 'Description too long', null, 400);
        }
        
        // Deadline validation
        if (empty($deadline)) {
            json_response(false, 'Deadline is required', null, 400);
        }
        
        $deadlineTime = strtotime($deadline);
        $now = time();
        $minDeadline = strtotime('+2 days', $now);
        $maxDeadline = strtotime('+1 year', $now);
        
        if ($deadlineTime === false) {
            json_response(false, 'Invalid deadline format', null, 400);
        }
        if ($deadlineTime <= $now) {
            json_response(false, 'Deadline must be in the future', null, 400);
        }
        if ($deadlineTime < $minDeadline) {
            json_response(false, 'Deadline must be at least 2 days from now', null, 400);
        }
        if ($deadlineTime > $maxDeadline) {
            json_response(false, 'Deadline cannot be more than 1 year from now', null, 400);
        }
        
        // Vytvoriť objednávku (bez ceny - admin ju nastaví neskôr)
        $order = Order::create([
            'customer_name' => $name,
            'customer_email' => $email,
            'description' => $description,
            'price' => 0,
            'deadline' => $deadline
        ]);
        
        if (!$order) {
            json_response(false, 'Failed to create order', null, 500);
        }
        
        json_response(true, 'Order created successfully', [
            'order_id' => $order['id'],
            'order_token' => $order['order_token']
        ]);
    }
    
    /**
     * Získať všetky objednávky (admin)
     * GET /orders
     */
    public function getAll() {
        $orders = Order::getAll();
        
        json_response(true, 'Orders retrieved', [
            'orders' => $orders,
            'count' => count($orders)
        ]);
    }
    
    /**
     * Získať objednávku podľa tokenu (user alebo admin)
     * GET /orders/:token
     */
    public function getOne($token) {
        $order = Order::findByToken($token);
        
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        json_response(true, 'Order retrieved', $order);
    }
    
    /**
     * Aktualizovať status objednávky (admin)
     * PUT /orders/:id/status
     */
    public function updateStatus($orderId) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['status'])) {
            json_response(false, 'Status is required', null, 400);
        }
        
        $status = $input['status'];
        
        // Povolené stavy
        $allowedStatuses = ['new', 'in_progress', 'completed', 'canceled'];
        if (!in_array($status, $allowedStatuses)) {
            json_response(false, 'Invalid status', null, 400);
        }
        
        $success = Order::updateStatus($orderId, $status);
        
        if (!$success) {
            json_response(false, 'Failed to update order', null, 500);
        }
        
        json_response(true, 'Order status updated', ['status' => $status]);
    }
    
    /**
     * Prijať cenu - zákazník akceptuje navrhnutú cenu
     * PUT /orders/:token/accept-price
     */
    public function acceptPrice($token) {
        // Nájsť objednávku
        $order = Order::findByToken($token);
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Overiť, že price je nastavená
        if (empty($order['price'])) {
            json_response(false, 'No price to accept', null, 400);
        }
        
        // Aktualizovať status na in_progress
        $success = Order::updateStatus($order['id'], 'in_progress');
        
        if (!$success) {
            json_response(false, 'Failed to accept price', null, 500);
        }
        
        json_response(true, 'Price accepted successfully', [
            'status' => 'in_progress',
            'price' => $order['price']
        ]);
    }
    
    /**
     * Odmietnuť cenu - zákazník odmietne navrhnutú cenu
     * PUT /orders/:token/reject-price
     */
    /**
     * Odmietnuť cenu - zákazník odmietne navrhnutú cenu
     * PUT /orders/:token/reject-price
     */
    public function rejectPrice($token) {
        // Nájsť objednávku
        $order = Order::findByToken($token);
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Overiť, že price je nastavená
        if (empty($order['price'])) {
            json_response(false, 'No price to reject', null, 400);
        }
        
        // Zmeniť status na canceled - objednávka je skončená
        $success = Order::updateStatus($order['id'], 'canceled');
        
        if (!$success) {
            json_response(false, 'Failed to reject price', null, 500);
        }
        
        json_response(true, 'Price rejected successfully - order canceled', [
            'status' => 'canceled',
            'price' => $order['price']
        ]);
    }
    
    /**
     * Nahrať finálne súbory - admin nahrá hotové súbory
     * POST /orders/:id/upload
     */
    public function upload($id) {
        // Overí či objednávka existuje
        $order = Order::findById($id);
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Overí či sú súbory nahrané
        if (empty($_FILES) || empty($_FILES['files'])) {
            json_response(false, 'No files uploaded', null, 400);
        }
        
        try {
            $uploadDir = __DIR__ . '/../uploads/completed/';
            
            // Vytvoriť adresár ak neexistuje
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $uploadedFiles = [];
            $failedFiles = [];
            $files = $_FILES['files'];
            
            // Spracovať každý súbor
            $fileCount = is_array($files['name']) ? count($files['name']) : 1;
            
            for ($i = 0; $i < $fileCount; $i++) {
                $fileName = is_array($files['name']) ? $files['name'][$i] : $files['name'];
                $fileTmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                $fileSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
                $fileError = is_array($files['error']) ? $files['error'][$i] : $files['error'];
                
                // Skontrolovať PHP upload error
                if ($fileError !== UPLOAD_ERR_OK) {
                    $failedFiles[] = $fileName . ' (PHP error: ' . $fileError . ')';
                    continue;
                }
                
                // Validácia - max 50MB
                if ($fileSize > 50 * 1024 * 1024) {
                    $failedFiles[] = $fileName . ' (príliš veľký)';
                    continue;
                }
                
                // Bezpečný názov súboru: order_id_filename
                $safeName = $id . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);
                $filePath = $uploadDir . $safeName;
                
                // Nahrať súbor
                if (move_uploaded_file($fileTmp, $filePath)) {
                    $uploadedFiles[] = $safeName;
                    
                    // Uložiť info o súbore do tabuľky order_files
                    OrderFile::create($id, $safeName, $fileSize);
                } else {
                    $failedFiles[] = $fileName . ' (chyba pri nahrávaní - tmp: ' . $fileTmp . ')';
                }
            }
            
            // Ak sa nenahral žiadny súbor, vrátiť chybu
            if (count($uploadedFiles) === 0) {
                json_response(false, 'Nie je možné nahrať súbory: ' . implode(', ', $failedFiles), null, 400);
            }
            
            // Aktualizovať final_ready flag a zmeniť status na completed
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("UPDATE orders SET final_ready = 1, status = 'completed' WHERE id = ?");
            $stmt->execute([$id]);
            
            $responseMsg = $uploadedFiles ? 'Súbory boli nahrané úspešne' : 'Niektoré súbory sa nepodarilo nahrať';
            
            json_response(true, $responseMsg, [
                'order_id' => $id,
                'uploaded_files' => $uploadedFiles,
                'failed_files' => $failedFiles,
                'count' => count($uploadedFiles),
                'status' => 'completed'
            ]);
            
        } catch (Exception $e) {
            json_response(false, 'Error: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Zoznam nahraných súborov - zákazník si môže stiahnuť alebo admin si vie previesť
     * GET /orders/:token/files alebo GET /orders/:id/files
     */
    public function getUploadedFiles($tokenOrId) {
        // Nájsť objednávku - pokúsiť sa nájsť buď pomocou tokenu alebo ID
        $order = null;
        
        if (is_numeric($tokenOrId)) {
            // Je to ID
            $order = Order::findById($tokenOrId);
        } else {
            // Je to token
            $order = Order::findByToken($tokenOrId);
        }
        
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Overí či sú súbory hotové (ak je to user-side request)
        if (!is_numeric($tokenOrId) && !$order['final_ready']) {
            json_response(false, 'Files not ready yet', null, 400);
        }
        
        try {
            // Načítať súbory z tabuľky order_files
            $files = OrderFile::findByOrderId($order['id']);
            
            // Upraviť formát pre frontend
            $formattedFiles = [];
            foreach ($files as $file) {
                $formattedFiles[] = [
                    'id' => $file['id'],
                    'file_name' => $file['file_name'],
                    'name' => $file['file_name'],
                    'size' => $file['file_size'],
                    'file_size' => $file['file_size'],
                    'displaySize' => $this->formatFileSize($file['file_size']),
                    'uploadedAt' => $file['uploaded_at']
                ];
            }
            
            json_response(true, 'Files retrieved', $formattedFiles);
            
        } catch (Exception $e) {
            json_response(false, 'Error: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Stiahnutie súboru - zákazník si môže stiahnuť súbor
     * GET /orders/:token/download/:fileName
     */
    public function downloadFile($token, $fileName) {
        // Nájsť objednávku
        $order = Order::findByToken($token);
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Overí či súbor patrí tejto objednávke a existuje v tabuľke
        $fileRecord = OrderFile::findByFileName($order['id'], $fileName);
        if (!$fileRecord) {
            json_response(false, 'File not found or unauthorized access', null, 403);
        }
        
        try {
            $filePath = __DIR__ . '/../uploads/completed/' . $fileName;
            
            // Overí existenciu súboru
            if (!file_exists($filePath) || !is_file($filePath)) {
                json_response(false, 'File not found on disk', null, 404);
            }
            
            // Bezpečnosť - zabráni path traversal
            $realPath = realpath($filePath);
            $uploadDir = realpath(__DIR__ . '/../uploads/completed/');
            if (strpos($realPath, $uploadDir) !== 0) {
                json_response(false, 'Invalid file path', null, 403);
            }
            
            // Stiahnutie súboru - extrahovať pôvodný názov z safe name (order_id_filename)
            $parts = explode('_', $fileRecord['file_name'], 2);
            $originalName = isset($parts[1]) ? $parts[1] : $fileRecord['file_name'];
            
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $originalName . '"');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
            
        } catch (Exception $e) {
            json_response(false, 'Error: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Aktualizovať názov súboru (admin)
     * PUT /files/:id
     * Očakáva: PUT JSON { file_name: string } - nazov UZ s prefixom (order_id_filename)
     * - Premení fyzický súbor na disku
     * - Aktualizuje DB
     */
    public function updateFile($fileId) {
        try {
            // Zisk JSON dáta
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                json_response(false, 'Invalid request', null, 400);
            }
            
            // Validácia vstupov
            $newFileName = trim($input['file_name'] ?? '');
            
            if (empty($newFileName)) {
                json_response(false, 'File name is required', null, 400);
            }
            
            if (strlen($newFileName) < 3) {
                json_response(false, 'File name must be at least 3 characters', null, 400);
            }
            
            if (strlen($newFileName) > 500) {
                json_response(false, 'File name too long', null, 400);
            }
            
            // Validácia bezpečnosti - skontrolovať či súbor obsahuje iba povolené znaky
            // Povolujeme aj podčiarknutie pretože sa nachádza v prefixe (order_id_)
            if (!preg_match('/^[\d_a-zA-Z0-9._\-čščžžďť]+$/', $newFileName)) {
                json_response(false, 'File name contains invalid characters', null, 400);
            }
            
            // Nájsť súbor
            $file = OrderFile::findById($fileId);
            if (!$file) {
                json_response(false, 'File not found', null, 404);
            }
            
            $oldFileName = $file['file_name'];
            $uploadDir = __DIR__ . '/../uploads/completed/';
            $oldPath = $uploadDir . $oldFileName;
            $newPath = $uploadDir . $newFileName;
            
            // Ak fyzický súbor existuje na disku, premenovať ho
            if (file_exists($oldPath)) {
                // Bezpečnosť: skontrolovať či nový súbor už neexistuje
                if (file_exists($newPath)) {
                    json_response(false, 'File with this name already exists', null, 409);
                }
                
                // Premenovať fyzický súbor
                if (!rename($oldPath, $newPath)) {
                    json_response(false, 'Failed to rename file on disk', null, 500);
                }
            } else {
                // Súbor na disku neexistuje - log warning ale pokračovať
                // (možné že bol manuálne vymazaný, ale DB record zostal)
                error_log("Warning: File not found on disk: $oldPath");
            }
            
            // Aktualizovať názov v DB (aj keď fyzický súbor neexistoval)
            $success = OrderFile::update($fileId, ['file_name' => $newFileName]);
            
            if (!$success) {
                // Ak sa DB update nepodaril ale súbor bol premmenovaný, vrátiť zmenu
                if (file_exists($newPath)) {
                    rename($newPath, $oldPath);
                }
                json_response(false, 'Failed to update file name in database', null, 500);
            }
            
            json_response(true, 'File name updated successfully', [
                'file_id' => $fileId,
                'old_file_name' => $oldFileName,
                'new_file_name' => $newFileName
            ]);
            
        } catch (Exception $e) {
            json_response(false, 'Error: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * DELETE /orders/:id
     */
    public function delete($id) {
        try {
            $order = Order::findById($id);
            if (!$order) {
                json_response(false, 'Order not found', null, 404);
            }
            
            $success = Order::delete($id);
            
            if (!$success) {
                json_response(false, 'Failed to delete order', null, 500);
            }
            
            json_response(true, 'Order deleted successfully', ['order_id' => $id]);
            
        } catch (Exception $e) {
            json_response(false, 'Error: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Pomocná funkcia na formátovanie veľkosti súboru
     */
    private function formatFileSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
?>
