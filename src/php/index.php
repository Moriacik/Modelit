<?php
/**
 * API Entry Point - Hlavný vstupný bod pre všetky API requesty
 * 
 * Użitie: /app/src/php/index.php?path=/auth/admin-login
 */

// Zapnúť error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Výber metódy
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Načítať config
require_once 'config.php';

// Autoloader pre Classes
spl_autoload_register(function ($class) {
    $dirs = ['Controllers', 'Models'];
    foreach ($dirs as $dir) {
        $file = __DIR__ . '/' . $dir . '/' . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Získať path z URL parametra
$path = $_GET['path'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'];
$pathParts = array_filter(explode('/', trim($path, '/')));
$pathParts = array_values($pathParts); // Re-index array

if (count($pathParts) < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid route']);
    exit;
}

// Kontrola autentifikácie pre admin routes
if ($pathParts[0] === 'admin') {
    session_start();
    
    // Skontrolovať či je admin prihlásený
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized - Admin login required',
            'data' => null
        ]);
        exit;
    }
}

// Špecialny prípad pre admin routes
if ($pathParts[0] === 'admin') {
    if (count($pathParts) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid admin route']);
        exit;
    }
    
    $controllerName = 'AdminController';
    $resourcePath = $pathParts[1]; // orders, stats, atď
    
    // Určiť metódu podľa kontextu
    if ($resourcePath === 'orders') {
        if (count($pathParts) === 2) {
            // /admin/orders
            $methodName = $method === 'GET' ? 'getOrders' : 'createOrder';
        } elseif (count($pathParts) === 3) {
            // /admin/orders/:id
            $orderId = $pathParts[2];
            $methodName = $method === 'GET' ? 'getOrderDetails' : 'updateOrder';
        } elseif (count($pathParts) >= 4) {
            // /admin/orders/:id/status
            $orderId = $pathParts[2];
            $action = $pathParts[3];
            $methodName = implode('', array_map('ucfirst', explode('-', $action)));
            $methodName = lcfirst($methodName);
            $methodName = 'update' . ucfirst($methodName); // updateStatus
        }
    } elseif ($resourcePath === 'stats') {
        // /admin/stats
        $methodName = 'getStats';
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Unknown admin resource']);
        exit;
    }
} elseif ($pathParts[0] === 'files') {
    // Files routes: /files/:id
    $controllerName = 'OrderController';
    
    if (count($pathParts) === 2) {
        // /files/:id
        $fileId = $pathParts[1];
        if ($method === 'PUT') {
            $methodName = 'updateFile';
        } elseif ($method === 'DELETE') {
            $methodName = 'deleteFile';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid files route']);
        exit;
    }
} elseif ($pathParts[0] === 'reviews') {
    // Reviews routes: /reviews
    $controllerName = 'ReviewController';
    
    if (count($pathParts) === 1) {
        // /reviews
        if ($method === 'GET') {
            $methodName = 'getPublished';
        } elseif ($method === 'POST') {
            $methodName = 'create';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid reviews route']);
        exit;
    }
} else {
    // Preložiť plurál na singulár (orders → order)
    $controllerBase = rtrim($pathParts[0], 's');
    $controllerName = ucfirst($controllerBase) . 'Controller';

    // Určiť metódu na základe path a HTTP metódy
    if (count($pathParts) == 1) {
        // /orders alebo /auth
        if ($method === 'GET') {
            $methodName = 'getAll';
        } elseif ($method === 'POST') {
            $methodName = 'create';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }
    } elseif (count($pathParts) == 2) {
        // /orders/:id alebo /auth/login
        // Detekujeme či je to parameter (token, id) alebo metóda (admin-login)
        $potentialMethod = $pathParts[1];
        
        // Ak obsahuje čísla, pomlčku ako MODELIT-XXXX, alebo veľké písmená, je to parameter
        if (preg_match('/^[A-Z0-9\-]+$/', $potentialMethod) && strpos($potentialMethod, '-') !== false) {
            // Je to parameter ako MODELIT-AAA6EEA14
            if ($method === 'GET') {
                $methodName = 'getOne';
            } elseif ($method === 'DELETE') {
                $methodName = 'delete';
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                exit;
            }
        } elseif (ctype_digit($potentialMethod)) {
            // Je to číslo - ID objednávky
            if ($method === 'GET') {
                $methodName = 'getOne';
            } elseif ($method === 'PUT') {
                $methodName = 'updateStatus';
            } elseif ($method === 'DELETE') {
                $methodName = 'delete';
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                exit;
            }
        } else {
            // Je to metóda ako admin-login
            $methodName = implode('', array_map('ucfirst', explode('-', $potentialMethod)));
            $methodName = lcfirst($methodName);
        }
    } elseif (count($pathParts) >= 3) {
        // /orders/:id/status alebo /orders/:token/accept-price alebo /orders/:token/files atď
        $action = $pathParts[2];
        
        // Špeciálne spracovanie
        if ($action === 'download' && count($pathParts) >= 4) {
            $methodName = 'downloadFile';
        } else if ($action === 'files') {
            $methodName = 'getUploadedFiles';
        } else {
            $methodName = implode('', array_map('ucfirst', explode('-', $action)));
            $methodName = lcfirst($methodName);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid route']);
        exit;
    }
}

// Skontrolovať či trieda existuje
if (!class_exists($controllerName)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Controller not found']);
    exit;
}

// Skontrolovať či metóda existuje
$controller = new $controllerName();
if (!method_exists($controller, $methodName)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Method not found: ' . $methodName]);
    exit;
}

// Spracovať request body (JSON)
$requestBody = file_get_contents('php://input');
$data = !empty($requestBody) ? json_decode($requestBody, true) : [];

// Vykonať metódu s parametrami ak existujú
try {
    $result = null;
    
    // Pre files routes s ID (/files/:id)
    if ($pathParts[0] === 'files' && count($pathParts) >= 2) {
        $fileId = $pathParts[1];
        if (!empty($data)) {
            $result = $controller->$methodName($fileId, $data);
        } else {
            $result = $controller->$methodName($fileId);
        }
    } elseif ($pathParts[0] === 'admin' && count($pathParts) >= 3 && $pathParts[1] === 'orders') {
        // Máme $orderId nastavené z parseru vyššie
        if (!empty($data)) {
            $result = $controller->$methodName($orderId, $data);
        } else {
            $result = $controller->$methodName($orderId);
        }
    } elseif ($pathParts[0] === 'reviews') {
        // Reviews routes
        if (!empty($data)) {
            $result = $controller->$methodName($data);
        } else {
            $result = $controller->$methodName();
        }
    } elseif (count($pathParts) >= 2 && isset($pathParts[1]) && $pathParts[1] !== 'stats') {
        // Passer ID ako parameter (napr /orders/:id)
        
        // Špeciálne spracovanie pre downloadFile s dodatočným parametrom
        if (count($pathParts) >= 4 && $pathParts[2] === 'download') {
            // /orders/:token/download/:fileName
            $token = $pathParts[1];
            $fileName = $pathParts[3];
            $result = $controller->$methodName($token, $fileName);
        } elseif (!empty($data)) {
            $result = $controller->$methodName($pathParts[1], $data);
        } else {
            $result = $controller->$methodName($pathParts[1]);
        }
    } else {
        // Bez parametrov (napr /orders, /admin/stats)
        if (!empty($data)) {
            $result = $controller->$methodName($data);
        } else {
            $result = $controller->$methodName();
        }
    }
    
    // Ak funkcia vrátila výsledok, vypiš ho
    if (is_array($result) || is_object($result)) {
        echo json_encode($result);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Helper funkcia na JSON response
 */
function json_response($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
?>

