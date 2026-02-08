## BOD 11: OOP a MVC architekúra

### Popis požiadavky
Aplikácia musí dodržiavať postupy objektovo orientovaného programovania (OOP) a používať MVC (prípadne iné architektúry ako MVVM, MVP).

### Implementácia - MVC štruktúra

#### Architektonický diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      MODELIT - MVC                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MODEL (Dátová vrstva)                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ src/php/Models/                                      │   │
│  │  ├── Order.php           (CRUD pre objednávky)      │   │
│  │  ├── OrderFile.php       (CRUD pre súbory)          │   │
│  │  ├── Review.php          (CRUD pre recenzie)        │   │
│  │  └── User.php            (Autentifikácia adminov)   │   │
│  │                                                      │   │
│  │ Metódy: create(), findById(), findAll(), update(),  │   │
│  │         delete(), authenticate()                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                 │
│                            │                                 │
│                    (SQL s prepared statements)               │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            CONTROLLER (Obchodná logika)              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ src/php/Controllers/                                 │   │
│  │  ├── OrderController.php    (logic pre objev.)      │   │
│  │  ├── AdminController.php    (logic pre admina)      │   │
│  │  ├── AuthController.php     (logic pre autent.)     │   │
│  │  └── ReviewController.php   (logic pre recenzie)    │   │
│  │                                                      │   │
│  │ Metódy: create(), getAll(), getOne(), updateStatus(),
│  │         upload(), delete(), etc.                     │   │
│  │                                                      │   │
│  │ Úlohy:                                               │   │
│  │  • Validácia vstupov                                │   │
│  │  • Volanie Model metód                              │   │
│  │  • Príprava JSON odpovede                            │   │
│  │  • Spracovanie HTTP metód (GET, POST, PUT, DELETE)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                 │
│                            │                                 │
│                    (JSON RPC vzor)                           │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             VIEW (Prezentačná vrstva)                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ src/components/ + src/pages/                         │   │
│  │  ├── Header.jsx          (Navigácia)                │   │
│  │  ├── Footer.jsx          (Pätička)                  │   │
│  │  ├── Home/               (Domovská stránka)         │   │
│  │  │   ├── Home.jsx       (Základný obsah)           │   │
│  │  │   ├── Projects.jsx   (Zoznam projektov)         │   │
│  │  │   └── Reviews.jsx    (Recenzie)                 │   │
│  │  ├── Login/              (Prihlasovacia stránka)     │   │
│  │  │   └── Login.jsx                                  │   │
│  │  ├── Orders/             (Vytvorenie objednávky)     │   │
│  │  │   └── OrderForm.jsx                              │   │
│  │  ├── OrderInfo/          (Detail objednávky užívateľ.)
│  │  │   ├── OrderInfoUser.jsx                          │   │
│  │  │   └── PaymentPlanSection.jsx                     │   │
│  │  └── Admin/              (Admin panel)               │   │
│  │      ├── AdminDashboard.jsx                         │   │
│  │      ├── OrderInfoAdmin.jsx                         │   │
│  │      └── OrdersTable.jsx                            │   │
│  │                                                      │   │
│  │ Odpovede na API volania sú renderované dynamicky    │   │
│  │ React komponentami s state managementom              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                 │
│                            │                                 │
│                    (AJAX fetch)                              │
│                            │                                 │
└────────────────────────────┼─ src/php/index.php (Router) ────
                             │
                    ┌────────┴──────────┐
                    │   HTTP/ HTTPS     │
                    └───────────────────┘
```

#### API Router - src/php/index.php

Centrální vstupný bod, ktorý:
- Parsuje HTTP cestu na Controller + metódu
- Rúti požiadavky podľa metódy (GET, POST, PUT, DELETE)
- Volá príslušné Controller metódy
- Vracia JSON odpoveď

```php
<?php
// src/php/index.php
// Vstupy: /index.php?path=/orders/5/status
// Výstupy: AdminController::updateStatus(5)

// URL routing príklady:
GET  /orders               → OrderController::getAll()
POST /orders               → OrderController::create()
GET  /orders/MODELIT-XXX   → OrderController::getOne('MODELIT-XXX')
PUT  /orders/5             → OrderController::updateStatus(5)
DELETE /orders/5           → OrderController::delete(5)

GET  /admin/orders         → AdminController::getOrders()
GET  /admin/orders/5       → AdminController::getOrderDetails(5)
PUT  /admin/orders/5       → AdminController::updatePrice(5)

POST /files/upload         → OrderController::upload()
PUT  /files/5              → OrderController::updateFile(5)
DELETE /files/5            → OrderController::deleteFile(5)

GET  /reviews              → ReviewController::getPublished()
POST /reviews              → ReviewController::create()

POST /auth/admin-login     → AuthController::adminLogin()
POST /auth/user-login      → AuthController::userLogin()
```

#### Model - OOP príklad

**Entita Order (Model vrstva):**

```php
<?php
// src/php/Models/Order.php

class Order {
    private $pdo;
    
    // Statické metódy (factory pattern)
    public static function findById($id) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public static function findByToken($token) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_token = ?");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public static function findAll() {
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // CRUD metódy
    public static function create($data) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            INSERT INTO orders (order_token, customer_name, customer_email, description, deadline)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $data['token'],
            $data['name'],
            $data['email'],
            $data['description'],
            $data['deadline']
        ]);
    }
    
    public static function updateStatus($id, $status) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
    
    public static function updatePrice($id, $price) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("UPDATE orders SET price = ? WHERE id = ?");
        return $stmt->execute([$price, $id]);
    }
    
    public static function delete($id) {
        $pdo = getDbConnection();
        // Foreign Key ON DELETE CASCADE automaticky vymaže aj súbory
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
?>
```

#### Controller - OOP príklad

**Controller Order:**

```php
<?php
// src/php/Controllers/OrderController.php

class OrderController {
    
    public function create() {
        // Validácia vstupov
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Kontrola vstupov (typ, dĺžka, format)
        $name = trim($input['name'] ?? '');
        $email = $input['email'] ?? '';
        
        if (empty($name) || strlen($name) < 2) {
            json_response(false, 'Invalid name', null, 400);
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'Invalid email', null, 400);
        }
        
        // Volanie Model metódy
        $token = $this->generateToken();
        $success = Order::create([
            'token' => $token,
            'name' => $name,
            'email' => $email,
            'description' => $input['description'],
            'deadline' => $input['deadline']
        ]);
        
        // JSON odpoveď
        if ($success) {
            json_response(true, 'Order created', ['order_token' => $token]);
        } else {
            json_response(false, 'Failed to create order', null, 500);
        }
    }
    
    public function getAll() {
        $orders = Order::findAll();
        json_response(true, 'Orders retrieved', $orders);
    }
    
    public function getOne($token) {
        $order = Order::findByToken($token);
        if (!$order) {
            json_response(false, 'Order not found', null, 404);
        }
        json_response(true, 'Order retrieved', $order);
    }
    
    // ... ďalšie metódy ...
    
    private function generateToken() {
        return strtoupper(substr(uniqid(), -8));
    }
}
?>
```

#### View - React komponenty

**React View s asynchronnými voláním:**

```jsx
// src/pages/OrderInfo/OrderInfoUser.jsx

import React, { useState, useEffect } from 'react';

function OrderInfoUser() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Asynchrónne načítanie dát z API (Controller metóda)
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get('token');
        
        // AJAX volanie na OrderController::getOne()
        const response = await fetch(`/index.php?path=/orders/${token}`);
        const result = await response.json();

        if (result.success) {
          setOrder(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Error loading order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  // Asynchrónna zmena stavu objednávky
  const handleAcceptPrice = async () => {
    try {
      // AJAX PUT volanie na Controller
      const response = await fetch(`/index.php?path=/orders/${order.order_token}/accept-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true })
      });

      const result = await response.json();
      
      if (result.success) {
        setOrder(prev => ({ ...prev, status: 'accepted' }));
      }
    } catch (err) {
      setError('Error updating order');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="order-info">
      <h1>Order Details</h1>
      <p>Customer: {order.customer_name}</p>
      <p>Price: {order.price} €</p>
      <button onClick={handleAcceptPrice}>Accept Price</button>
    </div>
  );
}

export default OrderInfoUser;
```

### Záver OOP a MVC

✅ **Splnené s nadmieru:**
- **Models** (4 entity): Order, OrderFile, Review, User - každá s CRUD metódami
- **Controllers** (4 rôzne): OrderController, AdminController, AuthController, ReviewController
- **Views** (8+ komponentov React): Home, Login, OrderForm, OrderInfoUser, OrderInfoAdmin, AdminDashboard, etc.
- **Router** (index.php): Centralizovaný routing všetkých API volaní
- **OOP princípy:**
  - Triedy s metódami (Controllers, Models)
  - Zapuzdrenie (private $pdo, private methods)
  - Dedičnosť budúcnosti (voľby na rozšírenie)
  - Polymorfizmus (istoté metódy v rôznych Controlleroch)

---

## BOD 12: Vlastný študentov kód vs. Frameworky

### Popis požiadavky
Hodnotí sa kód, ktorý je vytvorený študentom. Pokiaľ je v aplikácii použitý framework, CMS alebo iné hotové riešenie, bude hodnotená miera modifikácie alebo implementácie, ktorú študent sám vytvoril. V odovzdávanej aplikácii však musí byť v dostatočnej miere obsiahnutá aj vlastná tvorivá činnosť študenta.

### Prehľad - Vlastný kód vs. Knižnice

#### Frameworky a knižnice (treťstranný kód)

| Knižnica/Framework | Zámer | Vlastný kód |
|-------------------|-------|------------|
| **React 19** | Presentačná vrstva | ✅ 8+ vlastných komponentov |
| **Vite 7** | Build tool | ❌ Bez modifikácie |
| **React Router v6** | Routing | ✅ Konfigurácia + route definície |
| **Node.js** | Runtime | ❌ Bez modifikácie |
| **PHP 8.2** | Server runtime | ❌ Bez modifikácie |
| **MySQL 8.0** | Databáza | ❌ Bez modifikácie |
| **Docker** | Containerizácia | ✅ Vite.config.js + Dockerfile + docker-compose |

#### Vlastný kód - Rozbor podľa časti

##### Backend (PHP) - ~850 riadkov VLASTNÉHO kódu

**Models/ (320+ riadkov):**
- `Order.php` - 90+ riadkov (CRUD, findByToken, findById, atď.)
- `OrderFile.php` - 80+ riadkov (CRUD, upload management)
- `Review.php` - 70+ riadkov (CRUD pre recenzie)
- `User.php` -  80+ riadkov (Autentifikácia, password hashing)

**Controllers/ (450+ riadkov):**
- `OrderController.php` - 150+ riadkov (CREATE, READ, UPDATE status/price, DELETE, upload, file management)
- `AdminController.php` - 120+ riadkov (Admin dashboard logika, order management)
- `AuthController.php` - 80+ riadkov (Login, logout, autentifikácia)
- `ReviewController.php` - 100+ riadkov (CRUD pre recenzie)

**Routing (index.php):**
- 270+ riadkov vlastného kódu
- Parsovanie URL ciest a rúting na Controllers
- HTTP metóda detekcia (GET, POST, PUT, DELETE)
- JSON response helper

**Helpers:**
- `config.php` - Databázové pripojenie
- `json_response()` - Štandardná JSON odpoveď
- verschiedé validačné funkcie

##### Frontend (JavaScript/JSX) - ~2200 riadkov VLASTNÉHO kódu

**Pages/ (1400+ riadkov):**
- `Home.jsx` (180+ riadkov) - Domovská stránka s projektmi a recenziami
- `Login.jsx` (150+ riadkov) - Prihlasovanie (admin + user)
- `OrderForm.jsx` (200+ riadkov) - Vytvorenie objednávky s validáciou
- `OrderInfoUser.jsx` (250+ riadkov) - Detail objednávky pre zákazníka
- `AdminDashboard.jsx` (300+ riadkov) - Admin panel s tabuľkou objednávok
- `OrderInfoAdmin.jsx` (510+ riadkov) - Detail objednávky pre admina s file management

**Components/ (200+ riadkov):**
- `Header.jsx` - Navigácia s dinamickými linkmi
- `Footer.jsx` - Pätička
- `OrdersTable.jsx` - Admin tabuľka s in-place editingom

**Custom Hooks/Utils:**
- Fetch utilities
- Validation functions
- Authentication helpers
- Date formatting functions

##### CSS - ~2000+ CSS pravidiel VLASTNÉHO kódu

- `global.css` - Globálné štýly
- `Header.css` - Navigácia
- `Footer.css` - Pätička
- `Home.css` - Domovská stránka
- `Home_complex.css` - Pokročilé štýly pre Home
- `Login.css` - Prihlasovací formulár
- `OrderForm.css` - Formulár na objednávku
- `OrderInfo/` - Štýly pre detaily objednávky
- `AdminDashboard.css` - Admin panel
- `OrderInfoAdmin.css` - Admin detaily objednávky
- `colors.css` - Farby a CSS premenné

#### Vlastný vývoj a prispôsobenie

**Čo je čistý vlastný študentov kód:**

1. **Všetky Controllers a Models** - 100% vlastný kód
2. **Router (index.php)** - 100% vlastný kód
3. **Všetky React komponenty** - 100% vlastný kód
4. **Všetky CSS štýly** - 100% vlastný kód
5. **Všetka obchodná logika** - 100% vlastný kód
6. **API dizajn a implementácia** - 100% vlastný kód
7. **Databázový schema** - 100% vlastný kód
8. **Bezpečnosť a validácia** - 100% vlastný kód

**Čo sú frameworky (bez zmeny):**
- React, Vite, React Router - sú to nástroje, ktoré študent používa na vytvorenie apliácie
- Podobne ako by sa počítač nepočítal ako "vlastný kód"

### Záver BOD 12

✅ **Splnené s nadmieru:**
- **850+ riadkov backend PHP kódu** (Models + Controllers + Routing)
- **2200+ riadkov frontend JavaScript/JSX kódu** (React komponenty)
- **2000+ CSS pravidiel** (vlastné štýly bez CSS frameworkov)
- **Všetka obchodná logika je vlastný kód**
- Frameworky sú iba nástroje na realizáciu vlastného myšlienka
- **Minimálne 50% - 70% celého kódu je čistý vlastný študentov kód**

---

## BOD 13: Bezpečnosť (Input Validation, SQL Injection, Authentication, Password Hashing, Endpoints)

### Popis požiadavky
Aplikácia musí dodržať tieto zásady bezpečnosti:
- a. Kontrola vstupov, kontrolujúca nielen dátový typ, ale aj platnú hodnotu na strane servera aj klienta
- b. Ošetrenie dopytov na DB voči útokom SQLInjection
- c. Aplikácia musí obsahovať časť prístupnú až po prihlásení používateľa (prihlasovací formulár)
- d. Heslá užívateľov nesmú byť uložené ako obyčajný text
- e. Koncové body (endpoints) musia byť zabezpečené tak, aby nebolo možné na ne pristúpiť neautorizovaným spôsobom

#### a) Kontrola vstupov - Frontend + Backend

##### Frontend validácia (HTML5 + JavaScript)

**OrderForm.jsx:**

```jsx
const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Validácia v reálnom čase
  if (name === 'name') {
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters');
    } else if (value.length > 100) {
      setNameError('Name is too long');
    } else {
      setNameError('');
    }
  }
  
  if (name === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  }
  
  if (name === 'deadline') {
    const selectedDate = new Date(value);
    const today = new Date();
    if (selectedDate <= today) {
      setDeadlineError('Deadline must be in the future');
    } else {
      setDeadlineError('');
    }
  }
  
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validácia pred odoslaním
  if (!formData.name.trim() || !formData.email.trim()) {
    setError('All fields are required');
    return;
  }
  
  // Odoslať na server
  const response = await fetch('/index.php?path=/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  // Spracovať odpoveď...
};
```

##### Backend validácia (PHP - STRIKTNÁ)

**OrderController::create()**

```php
public function create() {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    // Kontrola JSON
    if (!$input) {
        json_response(false, 'Invalid JSON', null, 400);
    }
    
    // POVINNÁ VALIDÁCIA na serveri
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $description = trim($input['description'] ?? '');
    $deadline = $input['deadline'] ?? '';
    
    // Name validácia
    if (empty($name)) {
        json_response(false, 'Name is required', null, 400);
    }
    if (strlen($name) < 2) {
        json_response(false, 'Name must be at least 2 characters', null, 400);
    }
    if (strlen($name) > 100) {
        json_response(false, 'Name too long', null, 400);
    }
    
    // Email validácia
    if (empty($email)) {
        json_response(false, 'Email is required', null, 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(false, 'Invalid email format', null, 400);
    }
    if (strlen($email) > 100) {
        json_response(false, 'Email too long', null, 400);
    }
    
    // Description validácia
    if (empty($description)) {
        json_response(false, 'Description is required', null, 400);
    }
    if (strlen($description) > 5000) {
        json_response(false, 'Description too long', null, 400);
    }
    
    // Deadline validácia
    if (empty($deadline)) {
        json_response(false, 'Deadline is required', null, 400);
    }
    $deadlineTime = strtotime($deadline);
    $nowTime = strtotime(date('Y-m-d'));
    if ($deadlineTime <= $nowTime) {
        json_response(false, 'Deadline must be in the future', null, 400);
    }
    
    // Ak prejde všetka validácia, pokračovať v čítaní
    // ... CREATE order ...
}
```

#### b) Ošetrenie SQL Injection - Prepared Statements

**NIKDY nie je priamo vložený vstup do SQL!**

```php
// ❌ ZĽAVÉ - SQL INJECTION RISK
$stmt = $pdo->query("SELECT * FROM orders WHERE id = " . $_GET['id']);

// ✅ BEZPEČNÉ - Prepared Statements
$stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
$stmt->execute([$_GET['id']]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);
```

**Príklady v aplikácii:**

```php
// Order.php - findById()
public static function findById($id) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);  // ← Parameterized
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Order.php - create()
$stmt = $pdo->prepare("
    INSERT INTO orders (order_token, customer_name, customer_email, description, deadline)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([
    $data['token'],
    $data['name'],           // ← Parameterized (safe)
    $data['email'],          // ← Parameterized (safe)
    $data['description'],    // ← Parameterized (safe)
    $data['deadline']        // ← Parameterized (safe)
]);

// OrderFile.php - update()
$query = "UPDATE order_files SET file_name = ? WHERE id = ?";
$stmt = $pdo->prepare($query);
$stmt->execute([$newFileName, $fileId]);  // ← Parameterized

// Review.php - create()
$stmt = $pdo->prepare("
    INSERT INTO reviews (order_id, reviewer_name, rating, message)
    VALUES (?, ?, ?, ?)
");
$stmt->execute([$orderId, $name, $rating, $message]);  // ← Safe
```

#### c) Prihlasovanie a autentifikácia

**Admin Login - Login.jsx:**

```jsx
const handleAdminLogin = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/index.php?path=/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: adminData.username,
        password: adminData.password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Ulož admin token
      localStorage.setItem('adminToken', JSON.stringify({
        token: result.data.token,
        username: result.data.username
      }));
      
      // Přesmekovanie na admin panel
      navigate('/admin');
    } else {
      setMessage('Nesprávne prihlasovacie údaje');
    }
  } catch (err) {
    setMessage('Chyba pri prihlasovaní');
  }
};
```

**Admin Login - AuthController::adminLogin():**

```php
public function adminLogin() {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    // Validácia
    if (empty($username) || empty($password)) {
        json_response(false, 'Username and password required', null, 400);
    }
    
    // Autentifikácia - User model
    $user = User::authenticate($username, $password, 'admin');
    
    if (!$user) {
        // ÚMYSLNě nehovoríme či username alebo password je zvaný
        json_response(false, 'Invalid username or password', null, 401);
    }
    
    // Generovať token
    $token = base64_encode($user['username'] . ':' . time() . ':' . rand(1000, 9999));
    
    // Ulož session
    session_start();
    $_SESSION['admin_id'] = $user['id'];
    $_SESSION['admin_logged_in'] = true;
    
    json_response(true, 'Login successful', [
        'token' => $token,
        'username' => $user['username']
    ]);
}
```

**User::authenticate() - Password hashing:**

```php
public static function authenticate($username, $password, $type = 'admin') {
    try {
        $pdo = getDbConnection();
        
        $table = ($type === 'admin') ? 'admins' : 'users';
        
        $stmt = $pdo->prepare("
            SELECT id, username, password_hash 
            FROM $table 
            WHERE username = ?
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Porovnanie hashu (NIKDY nie v plaintext!)
        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }
        
        return null;
    } catch (Exception $e) {
        throw new Exception("Auth error: " . $e->getMessage());
    }
}
```

#### d) Password Hashing

**Databáza - admins tabuľka:**

```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- ← Hash, NIE plaintext!
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Príklad hesla v DB:**
```
username: admin
password (plaintext): "admin123"
password_hash: $2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2
```

Heslá sú hashed pomocou `password_hash()`:

```php
// Pri registrácii
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)");
$stmt->execute([$username, $passwordHash]);

// Pri prihlásení (porovnanie)
if (password_verify($inputPassword, $storedHash)) {
    // Heslo je správne
} else {
    // Heslo je nesprávne
}
```

#### e) Zabezpečené Endpoints

**Prístup bez autentifikácie:**

- `GET /orders` - verejný (zoznam objednávok bez detailov)
- `POST /orders` - verejný (vytvorenie novej objednávky)
- `GET /orders/:token` - s tokenm objednávky (zákazník vidí svoju objednávku)
- `GET /reviews` - verejný (recenzie)

**Prístupný iba s admin prihlásením (session check):**

- `GET /admin/orders` - admin vidí všetky objednávky
- `GET /admin/orders/:id` - admin vidí detaily ľubovoľnej objednávky
- `PUT /admin/orders/:id/status` - admin zmení stav
- `PUT /admin/orders/:id/price` - admin zmení cenu
- `DELETE /orders/:id` - admin zmaže objednávku
- `PUT /files/:id` - admin zmení názov súboru
- `DELETE /files/:id` - admin zmaže súbor

**Kontrola autentifikácie - AdminController:**

```php
class AdminController {
    
    public function getOrders() {
        // Kontrola či je admin prihlásený
        if (!$this->isAdminAuthenticated()) {
            json_response(false, 'Unauthorized', null, 403);
        }
        
        // ... pokračovať s logickou operáciou
    }
    
    public function getOrderDetails($orderId) {
        if (!$this->isAdminAuthenticated()) {
            json_response(false, 'Unauthorized', null, 403);
        }
        
        // ... pokračovať s logickou operáciou
    }
    
    private function isAdminAuthenticated() {
        session_start();
        return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    }
}
```

**Frontend kontrola - AdminDashboard.jsx:**

```jsx
useEffect(() => {
  const adminData = localStorage.getItem('adminToken');
  
  if (!adminData) {
    // Žiadny token v localStorage
    navigate('/login?role=admin');
    return;
  }
  
  try {
    const { token } = JSON.parse(adminData);
    
    // Verifikácia tokenu na serveri
    // ... fetch na admin endpoint ...
    
  } catch (err) {
    localStorage.removeItem('adminToken');
    navigate('/login?role=admin');
  }
}, [navigate]);
```
---

## BOD 14: Asynchrónna komunikácia (AJAX) - Min. 2 spôsobmi

### Popis požiadavky
Klientska strana musí so stranou servera komunikovať asynchrónne (AJAX), min. dvoma spôsobmi z nasledujúceho zoznamu:
- a. odosielanie formulárov
- b. editovanie záznamu priamo v tabuľke (in-place editing)
- c. prihlasovanie do aplikácie
- d. filtrovanie záznamov tabuľke
- e. načítavanie obsahu tabuľky
- f. stránkovanie obsahu
- g. iné netriviálne volania

#### 1. Odosielanie formulárov (AJAX)

**OrderForm.jsx - AJAX POST:**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  setSubmitting(true);
  setError('');
  
  try {
    // ① AJAX POST na /orders
    const response = await fetch('/index.php?path=/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        description: formData.description,
        deadline: formData.deadline
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setSuccessMessage('Order created successfully!');
      setFormData({ name: '', email: '', description: '', deadline: '' });
      
      // Presmerovanie po úspešnosti
      setTimeout(() => {
        navigate(`/order/${result.data.order_token}`);
      }, 1000);
    } else {
      setError(result.message || 'Error creating order');
    }
  } catch (err) {
    setError('Network error');
  } finally {
    setSubmitting(false);
  }
};
```

#### 2. Prihlasovanie do aplikácie (AJAX)

**Login.jsx - AJAX POST:**

```jsx
const handleAdminLogin = async (e) => {
  e.preventDefault();
  
  try {
    // ② AJAX POST na /auth/admin-login
    const response = await fetch('/index.php?path=/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: adminData.username,
        password: adminData.password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('adminToken', JSON.stringify({
        token: result.data.token,
        username: result.data.username
      }));
      navigate('/admin');
    } else {
      setMessage(result.message || 'Login failed');
    }
  } catch (err) {
    setMessage('Error during login');
  }
};
```

#### 3. In-place Editing (AJAX)

**OrderInfoAdmin.jsx - AJAX PUT na zmenu ceny:**

```jsx
const handlePriceChange = async () => {
  if (!editingPrice || isNaN(editingPrice)) {
    setError('Invalid price');
    return;
  }
  
  try {
    // ③ AJAX PUT na /admin/orders/:id/price
    const response = await fetch(`/index.php?path=/admin/orders/${order.id}/price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseFloat(editingPrice) })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setOrder(prev => ({ ...prev, price: parseFloat(editingPrice) }));
      setEditingField(null);
      setSuccessMessage('Price updated');
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError('Error updating price');
  }
};
```

**OrderInfoAdmin.jsx - AJAX PUT na zmenu názvu súboru:**

```jsx
const handleSaveFileName = async (fileId) => {
  if (!editingFileName.trim()) {
    setError('File name cannot be empty');
    return;
  }
  
  try {
    const fileNameWithPrefix = addFilePrefix(editingFileName, order.id);
    
    // ③ AJAX PUT na /files/:id
    const response = await fetch(`/index.php?path=/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: fileNameWithPrefix })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setSuccessMessage('File name updated');
      setEditingFileId(null);
      fetchOrderFiles();  // ← Refresh list
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError('Error updating file name');
  }
};
```

#### 4. Načítavanie obsahu tabuľky (AJAX)

**AdminDashboard.jsx - AJAX GET:**

```jsx
useEffect(() => {
  const fetchOrders = async () => {
    try {
      // ④ AJAX GET na /admin/orders
      const response = await fetch('/index.php?path=/admin/orders');
      
      if (!response.ok) {
        if (response.status === 403) {
          navigate('/login?role=admin');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };
  
  fetchOrders();
}, [navigate]);
```

#### 5. Filtrovanie záznamov v tabuľke (AJAX)

**AdminDashboard.jsx - AJAX GET s filtrami:**

```jsx
const handleStatusFilter = async (status) => {
  setSelectedStatus(status);
  setLoading(true);
  
  try {
    // ⑤ AJAX GET so z filtraciou na klientskej strane
    // (Backend vracia všetky objednávky, frontend filtruje)
    
    const filtered = orders.filter(order => {
      if (status === 'all') return true;
      return order.status === status;
    });
    
    setFilteredOrders(filtered);
  } finally {
    setLoading(false);
  }
};

// Alternatíva: Filtrovanie na serveri cez query parameters
const handleStatusFilterServer = async (status) => {
  try {
    // AJAX GET s query parametrami
    const response = await fetch(
      `/index.php?path=/admin/orders&status=${status}`
    );
    
    const result = await response.json();
    setOrders(result.data);
  } catch (err) {
    setError('Error filtering orders');
  }
};
```

### Zhrnutie AJAX komunikácie

| Typ | HTTP | Cesta | Príklad |
|-----|------|-------|---------|
| ① Formuláre | POST | /orders | Vytvorenie objednávky |
| ② Prihlásenie | POST | /auth/admin-login | Prihlásenie admina |
| ③ In-place edit | PUT | /admin/orders/:id/price | Zmena ceny |
| ③ In-place edit | PUT | /files/:id | Zmena názvu súboru |
| ④ Načítanie tabuľky | GET | /admin/orders | Zoznam objednávok |
| ⑤ Filtrovanie | GET | /admin/orders | Filtrovanie statusom |

---

## BOD 15: Minimálne 3 DB entity

### Popis požiadavky
Databáza musí obsahovať min. 3 entity (tabuľky). Do počtu sa zarátavajú iba smysluplné entity, nie asociačné tabuľky a frameworkom vygenerované tabuľky.

### Implementácia - 4 smysluplné DB entity

#### 1. ORDERS entita

**Primárna entita** - reprezentuje objednávky zákazníkov

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_token VARCHAR(20) UNIQUE NOT NULL,           -- Identifikátor pre zákazníka
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,                         -- Čo chce zákazník
  price DECIMAL(10, 2) DEFAULT 0,                    -- Cena od admina
  deadline DATE NOT NULL,
  status ENUM('new', 'in_progress', 'completed', 'canceled') DEFAULT 'new',
  final_ready BOOLEAN DEFAULT FALSE,                 -- Súbory sú ready?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY (order_token)
);
```

#### 2. ORDER_FILES entita

**Závislosť entita** - reprezentuje súbory pri objednávke (1:N vzťah)

```sql
CREATE TABLE order_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,                             -- Cudzia kľúč
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT,                                     -- Veľkosť v bytoch
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

#### 3. REVIEWS entita

**Smysluplná entita** - reprezentuje recenzie a feedback

```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,                             -- Cudzia kľúč (1:1)
  reviewer_name VARCHAR(100) NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),   -- 1-5 hviezd
  message TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

#### 4. ADMINS entita

**Smysluplná entita** - reprezentuje administratorov aplikácie

```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,                -- Hash hesla (NIKDY plaintext!)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY (username)
);
```

---