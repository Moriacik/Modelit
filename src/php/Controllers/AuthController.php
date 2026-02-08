<?php
/**
 * AuthController - Spravovanie prihlásenia
 */

class AuthController {
    
    /**
     * Admin Login
     * Očakáva: POST JSON { username, password }
     */
    public function adminLogin() {
        // Zisk JSON dáta
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_response(false, 'Invalid request', null, 400);
        }
        
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        
        // Validácia username
        if (empty($username)) {
            json_response(false, 'Username is required', null, 400);
        }
        
        if (strlen($username) < 3) {
            json_response(false, 'Username must be at least 3 characters', null, 400);
        }
        
        if (strlen($username) > 50) {
            json_response(false, 'Username too long', null, 400);
        }
        
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            json_response(false, 'Username can only contain letters, numbers and underscore', null, 400);
        }
        
        // Validácia password
        if (empty($password)) {
            json_response(false, 'Password is required', null, 400);
        }
        
        if (strlen($password) < 6) {
            json_response(false, 'Password must be at least 6 characters', null, 400);
        }
        
        if (strlen($password) > 100) {
            json_response(false, 'Password too long', null, 400);
        }
        
        // Autentifikovať užívateľa
        $user = User::authenticate($username, $password, 'admin');
        
        if (!$user) {
            json_response(false, 'Invalid username or password', null, 401);
        }
        
        // Úspešné prihlásenie
        session_start();
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        $_SESSION['admin_logged_in'] = true;
        
        // Generovať token
        $token = base64_encode($user['username'] . ':' . time() . ':' . rand(1000, 9999));
        
        json_response(true, 'Login successful', [
            'token' => $token,
            'username' => $user['username'],
            'admin_id' => $user['id']
        ]);
    }
    
    /**
     * User Login (podľa order code)
     * Očakáva: POST JSON { orderCode }
     */
    public function userLogin() {
        // Zisk JSON dáta
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_response(false, 'Invalid request', null, 400);
        }
        
        $orderCode = trim($input['orderCode'] ?? '');
        
        // Validácia order code
        if (empty($orderCode)) {
            json_response(false, 'Order code is required', null, 400);
        }
        
        if (strlen($orderCode) !== 17) {
            json_response(false, 'Order code must be exactly 17 characters', null, 400);
        }
        
        if (!preg_match('/^[A-Z0-9\-]+$/', $orderCode)) {
            json_response(false, 'Invalid order code format', null, 400);
        }
        
        // Nájsť objednávku
        $order = Order::findByToken($orderCode);
        
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        
        // Úspešné prihlásenie
        session_start();
        $_SESSION['user_token'] = $orderCode;
        $_SESSION['order_id'] = $order['id'];
        $_SESSION['user_logged_in'] = true;
        
        json_response(true, 'Login successful', [
            'orderToken' => $orderCode,
            'token' => $orderCode,
            'order_id' => $order['id']
        ]);
    }
    
    /**
     * Logout
     */
    public function adminLogout() {
        session_start();
        session_destroy();
        json_response(true, 'Logged out successfully');
    }
}
?>
