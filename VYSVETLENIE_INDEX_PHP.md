# Detailné vysvetlenie `index.php` - API Router

## Čo je `index.php`?

`index.php` je **centrálny vstupný bod** všetkých API requestov. Je to **router**, ktorý:
1. Prijme HTTP request od klienta (frontend)
2. Parsuje URL cestu na Controller a metódu
3. Zavola príslušnú Controller metódu
4. Vráti JSON odpoveď

## Workflow - Krok za krokom

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│ const response = await fetch('/index.php?path=/admin/orders/5')  │
│ method: 'PUT'                                                    │
│ body: { price: 150 }                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Reqest
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      index.php (ROUTER)                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Načítaj parametre z URL: path=/admin/orders/5                │
│ 2. Detekuj HTTP metódu: PUT                                     │
│ 3. Parsuj cestu: ['admin', 'orders', '5']                       │
│ 4. Identifikuj Controller: AdminController                      │
│ 5. Identifikuj metódu: updatePrice                              │
│ 6. Extrahy parametre: orderId = 5, data = {price: 150}          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AdminController::updatePrice(5, {...})          │
├─────────────────────────────────────────────────────────────────┤
│ • Validuje vstup                                                │
│ • Volá Model: Order::updatePrice(5, 150)                        │
│ • Vracia: json_response(true, 'Price updated', data)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        index.php (RESPONSE)                      │
├─────────────────────────────────────────────────────────────────┤
│ echo json_encode([                                              │
│   'success' => true,                                            │
│   'message' => 'Price updated',                                 │
│   'data' => {...}                                               │
│ ]);                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP 200 OK + JSON
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│ const result = await response.json();                            │
│ if (result.success) { /* Update UI */ }                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Konkrétne Príklady

### PRÍKLAD 1: Vytvorenie objednávky

**Frontend kód:**
```jsx
const response = await fetch('/index.php?path=/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Ján Štandard',
    email: 'jan@example.sk',
    description: 'Chcem 3D model',
    deadline: '2025-03-15'
  })
});
```

**Co HTTP request vyzerá:**
```
POST /index.php?path=/orders HTTP/1.1
content-Type: application/json

{
  "name": "Ján Štandard",
  "email": "jan@example.sk",
  "description": "Chcem 3D model",
  "deadline": "2025-03-15"
}
```

**Čo sa deje v `index.php`:**

#### Krok 1: Parse príchodu
```php
$path = $_GET['path'] ?? '/';      // path = "/orders"
$method = $_SERVER['REQUEST_METHOD']; // method = "POST"
```

#### Krok 2: Parseovať URL cestu
```php
$pathParts = array_filter(explode('/', trim($path, '/')));
$pathParts = array_values($pathParts);
// $pathParts = ['orders']  (1 prvok)
```

#### Krok 3: Identifikovať Controller a metódu
```php
// Keďže $pathParts[0] == 'orders' (nie 'admin' alebo 'files')
// Ide do else bloku (riadok ~137)

$controllerBase = rtrim('orders', 's');  // "order"
$controllerName = ucfirst('order') . 'Controller';  // "OrderController"

// Keďže count($pathParts) == 1 (len /orders)
// A metóda je POST
// Ide do: if ($method === 'POST')
$methodName = 'create';

// Výsledok:
// $controllerName = "OrderController"
// $methodName = "create"
```

#### Krok 4: Vytvoriť inštanciu a zavolať metódu
```php
// Riadok ~234-239
$controller = new OrderController();

$requestBody = file_get_contents('php://input');
// $requestBody = '{"name":"Ján Štandard", ...}'

$data = json_decode($requestBody, true);
// $data = ['name' => 'Ján Štandard', 'email' => '...', ...]

// Keďže count($pathParts) == 1 (bez ID)
// Ide do posledného else bloku (riadok ~293)
if (!empty($data)) {
    $result = $controller->create($data);  // ← VOLANÍ CONTROLLERA
} else {
    $result = $controller->create();
}
```

#### Krok 5: OrderController::create() sa vykonáva

```php
// src/php/Controllers/OrderController.php
public function create() {
    // Validácia vstupov
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    $name = trim($input['name'] ?? '');
    // ... ďalšia validácia ...
    
    // Volanie Model metódy
    $token = base64_encode('MODELIT-' . rand(100000, 999999));
    $success = Order::create([
        'token' => $token,
        'name' => $name,
        'email' => $email,
        // ...
    ]);
    
    // Vôlá json_response (helper funkcia)
    if ($success) {
        json_response(true, 'Order created', ['order_token' => $token]);
    } else {
        json_response(false, 'Failed to create order', null, 500);
    }
}
```

#### Krok 6: `json_response()` funkcia vraciaa a výjazd
```php
// Riadok ~301
function json_response($success, $message, $data = null, $code = 200) {
    http_response_code($code);  // HTTP 200
    echo json_encode([
        'success' => true,
        'message' => 'Order created',
        'data' => ['order_token' => 'MODELIT-654321']
    ]);
    exit;  // ← KONIEC - Vráti sa do Frontendu
}
```

**Frontend dostane odpoveď:**
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "order_token": "MODELIT-654321"
  }
}
```

---

### PRÍKLAD 2: Admin zmena ceny objednávky

**Frontend kód:**
```jsx
const response = await fetch('/index.php?path=/admin/orders/5/price', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ price: 250 })
});
```

**HTTP Request:**
```
PUT /index.php?path=/admin/orders/5/price HTTP/1.1
Content-Type: application/json

{
  "price": 250
}
```

**Čo sa deje v `index.php`:**

#### Krok 1-2: Parse
```php
$path = '/admin/orders/5/price';
$method = 'PUT';
$pathParts = ['admin', 'orders', '5', 'price'];  // Count = 4
```

#### Krok 3: Detekcia typu route
```php
// Riadok ~55 - je to admin route!
if ($pathParts[0] === 'admin') {
    // Riadok ~61
    $resourcePath = $pathParts[1];  // 'orders'
    
    // Riadok ~64
    if ($resourcePath === 'orders') {
        // Riadok ~71 - count($pathParts) >= 4
        if (count($pathParts) >= 4) {
            $orderId = $pathParts[2];          // '5'
            $action = $pathParts[3];           // 'price'
            
            // Transformuj 'price' na 'updatePrice'
            $methodName = implode('', array_map('ucfirst', explode('-', $action)));
            // $methodName = 'Price'
            
            $methodName = lcfirst($methodName);
            // $methodName = 'price'
            
            $methodName = 'update' . ucfirst($methodName);
            // $methodName = 'updatePrice'
        }
    }
}

// Výsledok:
// $controllerName = 'AdminController'
// $methodName = 'updatePrice'
// $orderId = '5'
```

#### Krok 4: Zavolať metódu
```php
// Riadok ~258-264
if ($pathParts[0] === 'admin' && count($pathParts) >= 3 && $pathParts[1] === 'orders') {
    if (!empty($data)) {
        // $data = ['price' => 250]
        $result = $controller->updatePrice(5, ['price' => 250]);  // ← VOLANIE
    } else {
        $result = $controller->updatePrice(5);
    }
}
```

#### Krok 5: AdminController::updatePrice() sa vykonáva

```php
// src/php/Controllers/AdminController.php
public function updatePrice($orderId, $data) {
    // Validácia
    $price = $data['price'] ?? null;
    
    if (!is_numeric($price) || $price < 0) {
        json_response(false, 'Invalid price', null, 400);
    }
    
    // Volanie Model
    $success = Order::updatePrice($orderId, $price);
    
    if ($success) {
        json_response(true, 'Price updated', ['order_id' => $orderId, 'new_price' => $price]);
    } else {
        json_response(false, 'Failed to update price', null, 500);
    }
}
```

#### Krok 6: Order::updatePrice() sa vykonáva na Model vrstvě

```php
// src/php/Models/Order.php
public static function updatePrice($id, $price) {
    $pdo = getDbConnection();
    // ← BEZPEČNÉ - Prepared statement (NIKDY nie SQL Injection!)
    $stmt = $pdo->prepare("UPDATE orders SET price = ? WHERE id = ?");
    return $stmt->execute([$price, $id]);  // ← DB sa aktualizuje!
}
```

**Frontend dostane odpoveď:**
```json
{
  "success": true,
  "message": "Price updated",
  "data": {
    "order_id": 5,
    "new_price": 250
  }
}
```

---

### PRÍKLAD 3: Admin si pozrie detaily objednávky

**Frontend kód:**
```jsx
const response = await fetch('/index.php?path=/admin/orders/5', {
  method: 'GET'
});
```

**HTTP Request:**
```
GET /index.php?path=/admin/orders/5 HTTP/1.1
```

**Čo sa deje v `index.php`:**

#### Krok 1-2: Parse
```php
$path = '/admin/orders/5';
$method = 'GET';
$pathParts = ['admin', 'orders', '5'];  // Count = 3
```

#### Krok 3: Detekcia
```php
// Riadok ~55 - admin route!
if ($pathParts[0] === 'admin') {
    $resourcePath = $pathParts[1];  // 'orders'
    
    // Riadok ~66 - count($pathParts) === 3
    if (count($pathParts) === 3) {
        $orderId = $pathParts[2];  // '5'
        
        // Metóda závisí od HTTP metódy
        $methodName = $method === 'GET' ? 'getOrderDetails' : 'updateOrder';
        // $methodName = 'getOrderDetails'
    }
}

// Výsledok:
// $controllerName = 'AdminController'
// $methodName = 'getOrderDetails'
// $orderId = '5'
```

#### Krok 4: Zavolať metódu
```php
// Riadok ~258
$result = $controller->getOrderDetails(5);
```

#### Krok 5: AdminController::getOrderDetails()

```php
public function getOrderDetails($orderId) {
    // Kontola autentifikácie
    if (!$this->isAdminAuthenticated()) {
        json_response(false, 'Unauthorized', null, 403);
    }
    
    // Načítaj objednávku z DB
    $order = Order::findById($orderId);
    
    if (!$order) {
        json_response(false, 'Order not found', null, 404);
    }
    
    // Načítaj súbory tejto objednávky
    $files = OrderFile::findByOrderId($orderId);
    
    // Kombinuj dáta
    $orderData = array_merge($order, ['files' => $files]);
    
    json_response(true, 'Order details', $orderData);
}
```

**Frontend dostane:**
```json
{
  "success": true,
  "message": "Order details",
  "data": {
    "id": 5,
    "order_token": "MODELIT-ABC123",
    "customer_name": "Ján Štandard",
    "customer_email": "jan@example.sk",
    "price": 150,
    "status": "new",
    "files": [
      {
        "id": 1,
        "order_id": 5,
        "file_name": "5_model.zip",
        "file_size": 50214912
      }
    ]
  }
}
```

---

### PRÍKLAD 4: Admin zmení názov súboru

**Frontend kód:**
```jsx
const response = await fetch('/index.php?path=/files/3', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file_name: '5_model_v2.zip' })
});
```

**HTTP Request:**
```
PUT /index.php?path=/files/3 HTTP/1.1

{
  "file_name": "5_model_v2.zip"
}
```

**Čo sa deje v `index.php`:**

#### Krok 1-2: Parse
```php
$path = '/files/3';
$method = 'PUT';
$pathParts = ['files', '3'];  // Count = 2
```

#### Krok 3: Detekcia
```php
// Riadok ~88 - files route!
if ($pathParts[0] === 'files') {
    // Riadok ~90 - count($pathParts) === 2
    if (count($pathParts) === 2) {
        $fileId = $pathParts[1];  // '3'
        
        // Metóda závisí od HTTP metódy
        if ($method === 'PUT') {
            $methodName = 'updateFile';  // ← UPDATE operácia!
        }
    }
}

// Výsledok:
// $controllerName = 'OrderController'
// $methodName = 'updateFile'
// $fileId = '3'
```

#### Krok 4: Zavolať metódu
```php
// Riadok ~247-252
if ($pathParts[0] === 'files' && count($pathParts) >= 2) {
    $fileId = $pathParts[1];  // '3'
    if (!empty($data)) {
        // $data = ['file_name' => '5_model_v2.zip']
        $result = $controller->updateFile(3, ['file_name' => '5_model_v2.zip']);
    }
}
```

#### Krok 5: OrderController::updateFile()

```php
public function updateFile($fileId, $data) {
    $newFileName = trim($data['file_name'] ?? '');
    
    // Validácia
    if (empty($newFileName) || strlen($newFileName) < 3) {
        json_response(false, 'Invalid file name', null, 400);
    }
    
    // Nájdi starý súbor
    $file = OrderFile::findById($fileId);
    $oldPath = __DIR__ . '/../uploads/completed/' . $file['file_name'];
    $newPath = __DIR__ . '/../uploads/completed/' . $newFileName;
    
    // FYZICKY PREMENÍ SÚBOR NA DISKU
    if (file_exists($oldPath)) {
        rename($oldPath, $newPath);  // ← Súbor na disku sa premení!
    }
    
    // Aktualizuj DB
    $success = OrderFile::update($fileId, ['file_name' => $newFileName]);
    
    if ($success) {
        json_response(true, 'File name updated', ['file_id' => $fileId, 'new_name' => $newFileName]);
    }
}
```

**Frontend dostane:**
```json
{
  "success": true,
  "message": "File name updated",
  "data": {
    "file_id": 3,
    "new_name": "5_model_v2.zip"
  }
}
```

---

## Zhrnutie - Index.php ako "Traffic Controller"

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND REQUEST                          │
│  /index.php?path=/admin/orders/5/price                     │
│  method: PUT, body: { price: 250 }                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              INDEX.PHP ROUTER - KTO ČOROBÍ?                │
└──────────────────┬──────────────────────────────────────────┘
                   │ Parse URL cestu
                   │ Detekuj HTTP metódu
                   │ Rozpoznaj Controller
                   │ Rozpoznaj Metódu
                   │ Extrahy Parametre
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         CONTROLLER (AdminController::updatePrice)           │
│         • Validuje vstup                                    │
│         • Volá Model                                        │
│         • Vráti JSON response                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         MODEL (Order::updatePrice)                          │
│         • Prepared statement do DB                          │
│         • Ochrážka pred SQL Injection                       │
│         • Vracia `true` či `false`                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│             DATABASE (MySQL)                                │
│               UPDATE orders                                 │
│     SET price = 250 WHERE id = 5                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         INDEX.PHP - JSON RESPONSE                           │
│    { success: true, message: 'Price updated', ... }         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND RESPONSE                         │
│              Ďalej sa obnovuje UI                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Tabuľka všetkých Route

| URL Path | HTTP | Controller | Metóda | Popis |
|----------|------|------------|--------|-------|
| `/orders` | POST | OrderController | create | Nová objednávka |
| `/orders` | GET | OrderController | getAll | Zoznam objednávok |
| `/orders/TOKEN` | GET | OrderController | getOne | Detail objednávky (user) |
| `/admin/orders` | GET | AdminController | getOrders | Všetky objednávky (admin) |
| `/admin/orders/5` | GET | AdminController | getOrderDetails | Detail objednávky (admin) |
| `/admin/orders/5/price` | PUT | AdminController | updatePrice | Zmena ceny |
| `/admin/orders/5/status` | PUT | AdminController | updateStatus | Zmena stavu |
| `/orders/5` | DELETE | OrderController | delete | Zrušenie objednávky |
| `/files/3` | PUT | OrderController | updateFile | Zmena názvu súboru |
| `/files/3` | DELETE | OrderController | deleteFile | Vymazanie súboru |
| `/reviews` | GET | ReviewController | getPublished | Zoznam recenzií |
| `/reviews` | POST | ReviewController | create | Nová recenzia |
| `/auth/admin-login` | POST | AuthController | adminLogin | Prihlásenie admina |
| `/auth/user-login` | POST | AuthController | userLogin | Prihlásenie užívateľa |

---

## Špeciálne Príznaky

### 1. CORS Headers (riadok 12-15)
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```
→ Dovoľuje requesty z Frontendu (JavaScript ako AJAX)

### 2. Autoloader (riadok 25-32)
```php
spl_autoload_register(function ($class) {
    // Automaticky načítať Controllers a Models
    // Keď zavoláme `new OrderController()`, PHP automaticky načíta súbor
});
```

### 3. Error Handling (riadok 17-20)
```php
// Vypne zobrazenie erroru (bezpečnosť)
// Ale zaznamenáva sa v log
error_reporting(E_ALL);
ini_set('display_errors', 0);
```

### 4. Exception Handling (riadok 266-274)
```php
try {
    // Vykonaj metódu
    $result = $controller->$methodName(...);
} catch (Exception $e) {
    // Ak niečo sklopi, vráť error
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
```

---

## Záver

**`index.php` je:**
- ✅ **Centrálny router** - viac všetkých API requestov
- ✅ **Dispatcher** - posúva requesty do správnych Controllers
- ✅ **Bezpečnosť** - validuje paths a metódy
- ✅ **MVC adapter** - prepája Frontend s Backend logickou

**Bez `index.php` by sme museli:**
- Vytvoriť samostatný PHP súbor pre každú akciu (zlo!)
- Ručne parsovať počty URL
- Opakovať validation logiku viackrát
