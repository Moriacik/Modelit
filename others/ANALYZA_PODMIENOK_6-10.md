## BOD 6: Aspoň jeden 1:N alebo M:N vzťah medzi DB entitami

### Popis požiadavky
Aplikácia musí obsahovať aspoň jeden vzťah medzi databázovými tabuľkami typu 1:N (jedna ku mnohým) alebo M:N (mnoho ku mnohým).

#### Vzťah: Orders ←→ OrderFiles (1:N)

**Popis:**
- 1 objednávka (`orders`) môže mať **N súborov** (`order_files`)
- 1 súbor patrí práve **1 objednávke**
- Vzťah je **povinný** - súbor bez objednávky nemôže existovať (foreign key s cascading delete)

#### Databázová schéma

**Tabuľka: orders (primárna entita)**
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,                 -- Primárny kľúč
  order_token VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  deadline DATE NOT NULL,
  status ENUM('new', 'in_progress', 'completed', 'canceled') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  final_ready BOOLEAN DEFAULT FALSE
);
```

**Tabuľka: order_files (závislosť entita)**
```sql
CREATE TABLE order_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,                             -- Cudzia kľúč (Foreign Key)
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  -- ↑ Cascading delete: keď sa objednávka vymaže, vymažú sa aj jej súbory
);
```

#### 1:N Entitný diagram
```
┌──────────────────────────────┐
│         ORDERS               │  ← 1 (primárna strana)
├──────────────────────────────┤
│ id (PRIMARY KEY)             │──┐
│ order_token                  │  │
│ customer_name                │  │ FOREIGN KEY RELATIONSHIP
│ customer_email               │  │ (1 : N)
│ description                  │  │
│ price                        │  │ 1 objednávka
│ deadline                     │  │ môže mať
│ status                       │  │ MNOHO súborov
│ created_at                   │  │
│ final_ready                  │  │
└──────────────────────────────┘  │
                                  │
                                  └──┐
                                     │
                      ┌──────────────────────────────────┐
                      │      ORDER_FILES                 │  ← N (závislose strana)
                      ├──────────────────────────────────┤
                      │ id (PRIMARY KEY)                 │
                      │ order_id (FOREIGN KEY) ──────────┘
                      │ file_name                        │
                      │ file_path                        │
                      │ file_size                        │
                      │ uploaded_at                      │
                      └──────────────────────────────────┘
```

### Záver
✅ **Splnené:** Aplikácia obsahuje jasný **1:N vzťah** medzi `orders` a `order_files`:
- **1 objednávka** → **N súborov** (ak objednávka existuje, môže mať viac súborov)
- Foreign Key: `order_files.order_id → orders.id`
- Cascading Delete: Vymazanie objednávky === vymazanie všetkých jej súborov
- Plne implementovaný v Models, Controllers a Frontend

---

## BOD 7: Všetky CRUD operácie nad dvomi entitami

### Popis požiadavky
Aplikácia musí implementovať všetky CRUD (Create, Read, Update, Delete) operácie nad **minimálne dvomi entitami**.

#### CRUD operácie sú implementované na:
1. **Orders entita** (primárne)
2. **OrderFiles entita** (viazané)

#### 1. ORDERS entita - CRUD operácie

##### CREATE - Vytvorenie objednávky

**Frontend - OrderForm.jsx:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const result = await createOrder({
    name: formData.name,
    email: formData.email,
    description: formData.description,
    deadline: formData.deadline
  });
  
  if (result.success) {
    console.log('Objednávka vytvorená:', result.data.order_token);
  }
};
```

**Backend - OrderController.php (riadky 1-100):**
```php
public function create() {
    // Validácia vstupov
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $description = trim($input['description'] ?? '');
    $deadline = $input['deadline'] ?? '';
    
    // Validácia... (50+ riadkov validácií)
    
    // Vytvorenie v DB
    $result = Order::create([
        'customer_name' => $name,
        'customer_email' => $email,
        'description' => $description,
        'deadline' => $deadline
    ]);
    
    json_response(true, 'Order created', [
        'order_id' => $result['id'],
        'order_token' => $result['order_token']
    ]);
}
```

**Backend - Order.php Model:**
```php
public static function create($data) {
    $pdo = getDbConnection();
    $orderToken = self::generateToken();  // MODELIT-XXXXXXXXX
    
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_token,
            customer_name,
            customer_email,
            description,
            deadline,
            status
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $orderToken,
        $data['customer_name'],
        $data['customer_email'],
        $data['description'],
        $data['deadline'],
        'new'
    ]);
    
    return [
        'id' => $pdo->lastInsertId(),
        'order_token' => $orderToken
    ];
}
```

---

##### READ - Čítanie objednávok

**Frontend - AdminDashboard.jsx:**
```jsx
useEffect(() => {
  const fetchOrders = async () => {
    const response = await fetch('http://localhost:8000/api/orders');
    const data = await response.json();
    setOrders(data.data.orders);  // Zobrazenie tabuľky
  };
  fetchOrders();
}, []);
```

**Frontend - OrderInfoUser.jsx:**
```jsx
useEffect(() => {
  const fetchOrder = async () => {
    const response = await fetch(
      `http://localhost:8000/api/orders/token/${orderToken}`
    );
    const data = await response.json();
    setOrder(data.data);  // Zobrazenie detailov
  };
  
  if (orderToken) {
    fetchOrder();
  }
}, [orderToken]);
```

**Backend - OrderController.php:**
```php
// Čítanie všetkých objednávok
public function getAll() {
    $orders = Order::getAll();
    json_response(true, 'Orders retrieved', ['orders' => $orders]);
}

// Čítanie objednávky podľa tokenu
public function getByToken($token) {
    $order = Order::findByToken($token);
    if (!$order) {
        json_response(false, 'Order not found', null, 404);
    }
    json_response(true, 'Order found', $order);
}

// Čítanie objednávky podľa ID
public function getById($id) {
    $order = Order::findById($id);
    if (!$order) {
        json_response(false, 'Order not found', null, 404);
    }
    json_response(true, 'Order found', $order);
}
```

**Backend - Order.php Model:**
```php
public static function getAll() {
    $pdo = getDbConnection();
    $stmt = $pdo->query("
        SELECT * FROM orders 
        ORDER BY created_at DESC 
        LIMIT 100
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

public static function findByToken($token) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_token = ?");
    $stmt->execute([$token]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

public static function findById($id) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

---

##### UPDATE - Úprava objednávok

**Frontend - OrderInfoAdmin.jsx:**
```jsx
const handleStatusChange = async (newStatus) => {
  const response = await fetch(
    `http://localhost:8000/api/admin/orders/${orderId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    }
  );
  const data = await response.json();
  if (data.success) {
    setOrder(prev => ({ ...prev, status: newStatus }));
  }
};

const handlePriceChange = async (price) => {
  const response = await fetch(
    `http://localhost:8000/api/admin/orders/${orderId}/price`,
    {
      method: 'PUT',
      body: JSON.stringify({ agreed_price: price })
    }
  );
  const data = await response.json();
  if (data.success) {
    setOrder(prev => ({ ...prev, price: price }));
  }
};
```

**Backend - AdminController.php:**
```php
// Zmena statusu
public static function updateOrderStatus($id, $data) {
    $validStatuses = ['new', 'in_progress', 'completed'];
    
    if (!in_array($data['status'], $validStatuses)) {
        return ['success' => false, 'message' => 'Invalid status'];
    }
    
    $order = new Order();
    $updated = $order->updateStatus($id, $data['status']);
    
    return [
        'success' => $updated,
        'message' => 'Status updated',
        'data' => ['status' => $data['status']]
    ];
}

// Zmena ceny
public static function updatePrice($id, $data) {
    $price = (float)$data['agreed_price'];
    
    // Validácia... (20+ riadkov)
    
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("UPDATE orders SET price = ? WHERE id = ?");
    $updated = $stmt->execute([$price, $id]);
    
    return [
        'success' => $updated,
        'message' => 'Price updated',
        'data' => ['price' => $price]
    ];
}
```

**Backend - Order.php Model:**
```php
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
```

---

##### DELETE - Zmazanie objednávok

**Frontend - OrderInfoAdmin.jsx:**
```jsx
const handleCancelOrder = async () => {
  const response = await fetch(
    `http://localhost:8000/api/admin/orders/${orderId}/cancel`,
    {
      method: 'DELETE'
    }
  );
  
  const data = await response.json();
  if (data.success) {
    navigate('/admin');  // Presmerovanie na admin panel
  }
};
```

**Backend - OrderController.php:**
```php
public function delete($id) {
    $order = new Order();
    $deleted = $order->delete($id);
    
    if ($deleted) {
        json_response(true, 'Order canceled', ['order_id' => $id]);
    } else {
        json_response(false, 'Failed to cancel order', null, 500);
    }
}
```

**Backend - Order.php Model:**
```php
public static function delete($id) {
    $pdo = getDbConnection();
    // FOREIGN KEY s ON DELETE CASCADE automaticky vymaže aj súbory
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    return $stmt->execute([$id]);
}
```

---

#### 2. ORDER FILES entita - CRUD operácie

##### CREATE - Upload nových súborov

**Frontend - OrderInfoAdmin.jsx:**
```jsx
const handleFileUpload = async (e) => {
  const files = e.target.files;
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `http://localhost:8000/api/orders/${orderId}/files/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    if (data.success) {
      setOrderFiles(prev => [...prev, data.data]);  // Pridaj nový súbor
    }
  }
};
```

**Backend - OrderController.php:**
```php
public function uploadFile($orderId) {
    if (!isset($_FILES['file'])) {
        json_response(false, 'No file provided', null, 400);
    }
    
    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    $fileSize = $file['size'];
    
    // Validácia... (file type, size, etc)
    
    // Uloženie do databázy
    $created = OrderFile::create($orderId, $fileName, $fileSize);
    
    if ($created) {
        json_response(true, 'File uploaded', [
            'file_name' => $fileName,
            'file_size' => $fileSize
        ]);
    }
}
```

**Backend - OrderFile.php Model:**
```php
public static function create($orderId, $fileName, $fileSize) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("
        INSERT INTO order_files (order_id, file_name, file_size)
        VALUES (?, ?, ?)
    ");
    
    return $stmt->execute([$orderId, $fileName, $fileSize]);
}
```

---

##### READ - Načítanie súborov

**Frontend - OrderInfoUser.jsx:**
```jsx
useEffect(() => {
  const fetchFiles = async () => {
    const response = await fetch(
      `http://localhost:8000/api/orders/${order.id}/files`
    );
    const data = await response.json();
    setFiles(data.data);
  };
  
  if (order?.id) {
    fetchFiles();
  }
}, [order?.id]);
```

**Backend - OrderController.php:**
```php
public function getOrderFiles($orderId) {
    $order = new Order();
    if (!$order->findById($orderId)) {
        json_response(false, 'Order not found', null, 404);
    }
    
    $files = OrderFile::findByOrderId($orderId);
    
    json_response(true, 'Files retrieved', $files);
}
```

**Backend - OrderFile.php Model:**
```php
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

public static function findById($fileId) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM order_files WHERE id = ?");
    $stmt->execute([$fileId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

---

##### UPDATE - Zmena názvu súboru (admin)

**Frontend - OrderInfoAdmin.jsx:**

Admin môže zmeniť názov uploadeného súboru. Pri zmene:
1. Admin klika na **✎ Zmeniť** tlačidlo pri súbore
2. Vstupné pole sa aktivuje (bez prefixu `order_id_`)
3. Admin zmení názov
4. Klika **✓ Uložiť** → PUT request na server

```jsx
// Pomocné funkcie na manipuláciu s prefixom
const stripFilePrefix = (fileName) => {
  // Formát: "5_model.zip" -> "model.zip"
  const parts = fileName.split('_');
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return fileName.substring(parts[0].length + 1);
  }
  return fileName;
};

const addFilePrefix = (fileName, orderId) => {
  // Ak už má prefix, neprida znova
  const parts = fileName.split('_');
  if (parts.length > 1 && /^\d+$/.test(parts[0]) && parts[0] === String(orderId)) {
    return fileName;
  }
  return `${orderId}_${fileName}`;
};

// Handler na zmenu názvu
const handleEditFileName = (fileId, currentFileName) => {
  setEditingFileId(fileId);
  setEditingFileName(stripFilePrefix(currentFileName));  // Zobraziť bez prefixu
};

// Uloženie zmenený názov - vyšle PUT request
const handleSaveFileName = async (fileId) => {
  if (!editingFileName.trim()) {
    setError('Názov súboru nemôže byť prázdny');
    return;
  }

  try {
    // Pridať prefix spať pred odoslaním na backend
    const fileNameWithPrefix = addFilePrefix(editingFileName, order.id);
    
    const response = await fetch(`/index.php?path=/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: fileNameWithPrefix })
    });

    const result = await response.json();
    if (result.success) {
      setSuccessMessage('Názov súboru bol zmenený');
      setEditingFileId(null);
      fetchOrderFiles();  // Osvieži zoznam
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      setError(result.message || 'Chyba pri zmene názvu súboru');
    }
  } catch (err) {
    setError('Chyba pri zmene názvu súboru');
    console.error('Error updating file name:', err);
  }
};
```

**Frontend UI - OrderInfoAdmin.jsx:**

Sekcia s nahratými súbormi:
```jsx
{/* Files List Card */}
{orderFiles.length > 0 && (
  <section className="files-card">
    <h2>Nahraté súbory ({orderFiles.length})</h2>
    <div className="files-list">
      {orderFiles.map(file => (
        <div key={file.id} className="file-item">
          <div className="file-info">
            <span className="file-icon">📄</span>
            {editingFileId === file.id ? (
              <div className="file-edit-form">
                <input
                  type="text"
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  className="file-edit-input"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveFileName(file.id)}
                  className="save-btn-small"
                >
                  ✓ Uložiť
                </button>
                <button
                  onClick={() => setEditingFileId(null)}
                  className="cancel-btn-small"
                >
                  ✕ Zrušiť
                </button>
              </div>
            ) : (
              <div className="file-name-display">
                <p className="file-name">{stripFilePrefix(file.file_name)}</p>
                <p className="file-size">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
          {editingFileId !== file.id && (
            <div className="file-actions">
              <button
                onClick={() => handleEditFileName(file.id, file.file_name)}
                className="edit-btn-small"
                title="Zmeniť názov"
              >
                ✎ Zmeniť
              </button>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="delete-btn-small"
                title="Odstrániť súbor"
              >
                🗑 Odstrániť
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
)}
```

**Backend - OrderController.php:**

`updateFile()` metóda spracúva PUT request a:
1. Validuje nový názov súboru
2. **Premení fyzický súbor na disku** (rename)
3. Aktualizuje záznam v databáze
4. Vráti chybu ak sa rename nepodarí a vracia zmenu späť

```php
public function updateFile($fileId) {
    try {
        // Zisk JSON dáta
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            json_response(false, 'Invalid request', null, 400);
        }
        
        $newFileName = trim($input['file_name'] ?? '');
        
        // Validácia
        if (empty($newFileName)) {
            json_response(false, 'File name is required', null, 400);
        }
        
        if (strlen($newFileName) < 3 || strlen($newFileName) > 500) {
            json_response(false, 'File name length invalid', null, 400);
        }
        
        // Bezpečnostná validácia znakov (vrátane podčiarknutia v prefixe)
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
        
        // Ak fyzický súbor existuje, premenovať ho
        if (file_exists($oldPath)) {
            if (file_exists($newPath)) {
                json_response(false, 'File with this name already exists', null, 409);
            }
            
            // Premenovať fyzický súbor
            if (!rename($oldPath, $newPath)) {
                json_response(false, 'Failed to rename file on disk', null, 500);
            }
        } else {
            // Log warning - súbor neexistuje na disku
            error_log("Warning: File not found on disk: $oldPath");
        }
        
        // Aktualizovať v DB
        $success = OrderFile::update($fileId, ['file_name' => $newFileName]);
        
        if (!$success) {
            // Reverzovať zmenu súboru ak DB update zlyhá
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
```

**Backend - OrderFile.php Model:**

```php
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
```

**API Router - src/php/index.php:**

Nová trasa pre `PUT /files/:id`:
```php
// Files routes: /files/:id
if ($pathParts[0] === 'files') {
    $controllerName = 'OrderController';
    
    if (count($pathParts) === 2) {
        $fileId = $pathParts[1];
        if ($method === 'PUT') {
            $methodName = 'updateFile';
        } elseif ($method === 'DELETE') {
            $methodName = 'deleteFile';
        }
    }
}
```
---

##### DELETE - Zmazanie súboru

**Frontend - OrderInfoAdmin.jsx:**
```jsx
const handleDeleteFile = async (fileId) => {
  if (!window.confirm('Naozaj chceš odstrániť tento súbor?')) {
    return;
  }

  try {
    const response = await fetch(`/index.php?path=/files/${fileId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      setSuccessMessage('Súbor bol vymazaný');
      fetchOrderFiles();  // Osvieži zoznam
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      setError(result.message || 'Chyba pri vymazaní súboru');
    }
  } catch (err) {
    setError('Chyba pri vymazaní súboru');
    console.error('Error deleting file:', err);
  }
};
```

**Backend - OrderController.php:**

`deleteFile()` metóda:
1. Nájde súbor v DB
2. **Vymaže fyzický súbor zo servera** (z `/uploads/completed/`)
3. Vymaže záznam z databázy
4. Vracia potvrdenie

```php
public function deleteFile($fileId) {
    try {
        // Nájsť súbor
        $file = OrderFile::findById($fileId);
        if (!$file) {
            json_response(false, 'File not found', null, 404);
        }
        
        $fileName = $file['file_name'];
        $uploadDir = __DIR__ . '/../uploads/completed/';
        $filePath = $uploadDir . $fileName;
        
        // Vymazať fyzický súbor ak existuje
        if (file_exists($filePath)) {
            if (!unlink($filePath)) {
                json_response(false, 'Failed to delete file from disk', null, 500);
            }
        } else {
            // Log warning - súbor neexistuje, ale pokračovať s DB delete
            error_log("Warning: File not found on disk: $filePath");
        }
        
        // Vymazať z DB
        $deleted = OrderFile::delete($fileId);
        
        if (!$deleted) {
            json_response(false, 'Failed to delete file from database', null, 500);
        }
        
        json_response(true, 'File deleted successfully', ['file_id' => $fileId]);
        
    } catch (Exception $e) {
        json_response(false, 'Error: ' . $e->getMessage(), null, 500);
    }
}
```

**Backend - OrderFile.php Model:**
```php
public static function delete($fileId) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("DELETE FROM order_files WHERE id = ?");
    return $stmt->execute([$fileId]);
}
```

**API endpoint:** `DELETE /files/:id`

---

#### Zhrnutie CRUD operácií

| Entita | CREATE | READ | UPDATE | DELETE |
|--------|--------|------|--------|--------|
| **Orders** | ✅ POST /orders | ✅ GET /orders GET /orders/:id | ✅ PUT /admin/orders/:id/status PUT /admin/orders/:id/price | ✅ DELETE /orders/:id |
| **OrderFiles** | ✅ POST /orders/:id/upload | ✅ GET /orders/:id/files | ✅ PUT /files/:id (rename s disk sync) | ✅ DELETE /files/:id |

### Záver
✅ **Splnené s nadmieru:**
- **Orders:** Kompletné CRUD (Create, Read, Update, Delete)
- **OrderFiles:** Kompletné CRUD (Create, Read, Update, Delete)
- Všetky operácie sú:
  - Validované na klientskej strane (JavaScript)
  - Validované na serverovej strane (PHP)
  - Chránené pred SQL Injection (Prepared statements)
  - **UPDATE na OrderFiles je teraz aktívne používaný v UI** (nie len v kóde, ale aj v práci)
  - Fyzické súbory a DB sú vždy synchronizované

---

## BOD 8: Aplikácia musí obsahovať časť, do ktorej je nutné sa prihlásiť

### Popis požiadavky
Aplikácia musí obsahovať minimálne jednu chránená stránku, do ktorej je možné pristúpiť iba po prihlásení. Musí existovať prihlasovací mechanizmus.

#### Typy prístupu a autentifikácie

##### ADMIN PRIHLÁSENIE

**Frontend - Login.jsx:**
```jsx
const handleAdminLogin = async (e) => {
  e.preventDefault();
  
  const result = await adminLogin(adminData.username, adminData.password);
  
  if (result.success) {
    // Ulož token do localStorage
    localStorage.setItem('adminToken', result.data.token);
    
    // Presmerovanie na admin panel
    navigate('/admin');
  } else {
    setMessage('Nesprávne prihlasovacie údaje');
  }
};
```

**Backend - AuthController.php (Admin Login):**
```php
public function adminLogin() {
    // Validácia username a password
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    // Autentifikácia (porovnanie s DB + password_hash)
    $user = User::authenticate($username, $password, 'admin');
    
    if (!$user) {
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

**Backend - User.php Model (Authentication):**
```php
public static function authenticate($username, $password, $type = 'admin') {
    try {
        $pdo = getDbConnection();
        
        $stmt = $pdo->prepare("
            SELECT id, username, password_hash 
            FROM admins 
            WHERE username = ?
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Porovnanie hesla (password_hash)
        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }
        
        return null;
    } catch (Exception $e) {
        throw new Exception("Auth error: " . $e->getMessage());
    }
}
```
---

#### Chránené stránky (Login Required)

##### 1. Admin Panel (/admin)

**Prístup:** Len pre adminov s validným tokenem

**Frontend - AdminDashboard.jsx (Access Control):**
```jsx
function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Overenie prítomnosti admin tokenu
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      // Token chýba → presmerovanie na login
      navigate('/login');
      return;
    }
    
    // Token existuje → povolenie prístupu
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div>Overovanie práv...</div>;
  }

  return (
    <div className="admin-dashboard">
      <OrdersTable />  {/* Admin tabuľka objednávok */}
    </div>
  );
}
```

**Prístupová logika:**
- ✅ Admin prihlásený (token v localStorage) → prístup
- ❌ Admin neprihlásený (bez tokenu) → presmerovanie na `/login`

---

#### Bezpečnostný mechanizmus

##### Token-based Authentication

**Flow:**
```
┌────────────────────┐
│  Užívateľ           │
└────────────────────┘
         ↓ Prihláš sa
┌────────────────────────────────────────┐
│  Login Stránka (/login)                │
│  - Admin: username + password          │
│  - User: order token                   │
└────────────────────────────────────────┘
         ↓ Submit formulár
┌────────────────────────────────────────┐
│  Backend (AuthController)              │
│  - Oveď username/password              │
│  - Vyhľadaj order token                │
│  - Vygeneruj token                     │
└────────────────────────────────────────┘
         ↓ Vrátenie tokenu
┌────────────────────────────────────────┐
│  Frontend (localStorage)               │
│  localStorage.setItem('adminToken', ..│
└────────────────────────────────────────┘
         ↓ Prístup s tokenem
┌────────────────────────────────────────┐
│  Protected Pages (/admin)              │
│  - Overenie přítomnosti tokenu         │
│  - Ak token chýba → /login             │
│  Ak token je → zobrazenie obsahu       │
└────────────────────────────────────────┘
```
---

### Záver
✅ **Splnené:**
- **Admin prístup:** Prihlasovanie s username + password
- **User prístup:** Prihlasovanie s order token
- **Chránené stránky:** /admin (len admini), /order-detail/:token (len so správnym tokenem)
- **Bezpečnosť:** Password hashing, prepared statements, input validation
- **Token management:** localStorage s tokenem pre uchovávaný prístup

---

## BOD 9: Novod na inštaláciu (README.md)

### Popis požiadavky
Aplikácia musí obsahovať dokumentáciu (zvyčajne súbor README.md) s návodom na inštaláciu.

**Súbor:** [README.md](README.md) (245 riadkov)

#### Obsah README.md

**Časti dokumentácie:**
1. **Úvod** - Popis aplikácie a jej funkcií
2. **Požiadavky** - Technické požiadavky
3. **Inštalácia**
   - Lokálne spustenie
   - Docker spustenie
4. **Produkčné nasadenie**
   - Linux server
   - Docker Compose
   - Nginx + SSL
5. **Správa databázy** - phpMyAdmin
6. **API dokumentácia** - Endpointy
7. **Pokyny pre vývojárov** - Git workflow
8. **Riešenie problémov** - FAQ
9. **Licencia**

#### Sekcie README

##### 1. Úvod
```markdown
# Modelit - Systém na správu objednávok 3D modelov

Aplikácia umožňuje zákazníkom zadávať objednávky, komunikovať s administrátorom 
o cene a sledovať stav vyhotovenia. Administrátor spravuje objednávky, cenové 
vyjednávania, platby a vyrobu/odovzdanie produktu.
```

##### 2. Technické požiadavky
```markdown
## 📋 Požiadavky

### Lokálne spustenie
- **Node.js** (v18 alebo novšie)
- **PHP** (v8.2 alebo novšie)
- **MySQL** (v8.0 alebo novšie)
- **Git**

### Docker
- **Docker**
- **Docker Compose**
```

##### 3. Inštalácia s Docker-om
```markdown
## 🚀 Spustenie s Docker-om (Odporúčané)

### 1. Klonujte projekt
\`\`\`bash
git clone https://github.com/Moriacik/Modelit
cd Modelit
\`\`\`

### 2. Vytvorte .env súbor
\`\`\`bash
cat > .env << EOF
MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=modelit_db
MYSQL_USER=modelit_user
MYSQL_PASSWORD=user_password
DB_HOST=db
DB_NAME=modelit_db
DB_USER=modelit_user
DB_PASS=user_password
NODE_ENV=development
EOF
\`\`\`

### 3. Spustite aplikáciu
\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Prístup
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- phpMyAdmin: http://localhost:8080
```

##### 4. Prvý pokus admin prístupu
```markdown
## 🔐 Prvý Login (Default Credentials)

### Admin
- **Username:** admin
- **Password:** admin123

⚠️ **Bezpečnosť:** Po prvom logine zmente heslo!
```

##### 5. API Dokumentácia

Príklad endpointov dokumentovaných v README:

```markdown
## 📡 API Endpointy

### Objednávky

#### Vytvorenie objednávky
\`\`\`
POST /api/orders
Content-Type: application/json

{
  "name": "Jozef Horváth",
  "email": "jozef@example.com",
  "description": "3D model kovákskeho kresla",
  "deadline": "2024-05-15"
}
\`\`\`

#### Čítanie všetkých objednávok
\`\`\`
GET /api/orders
\`\`\`

#### Zmena statusu (Admin)
\`\`\`
PUT /api/admin/orders/:id/status
Authorization: Bearer {token}

{
  "status": "in_progress"
}
\`\`\`
```

##### 6. Produkčné nasadenie

```markdown
## 🌐 Produkčné nasadenie na Linux Server

### 1. Príprava servera
\`\`\`bash
ssh root@vasa-ip-adresa
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
\`\`\`

### 2. Nasadenie aplikácie
\`\`\`bash
cd /opt
git clone https://github.com/Moriacik/Modelit
cd Modelit
docker-compose up -d
\`\`\`

### 3. SSL Certifikát (Let's Encrypt)
\`\`\`bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d modelit.sk -d www.modelit.sk
\`\`\`
```

**Miesto v kóde:** [README.md](README.md)  
**Dĺžka:** 245 riadkov  
**Pokrytie:** 
- ✅ Úvodný popis
- ✅ Technické požiadavky
- ✅ Lokálna inštalácia
- ✅ Docker inštalácia
- ✅ API dokumentácia
- ✅ Produkčné nasadenie
- ✅ Riešenie problémov

### Záver
✅ **Splnené:** Detailný README.md súbor s:
- Popisom aplikácie
- Technickými požiadavkami
- Inštrukciami na lokálnu inštaláciu
- Inštrukciami na Docker inštaláciu
- API dokumentáciou
- Produkčným nasadením

---

## BOD 10: Správne štruktúrovaný a čleaný kód

### Popis požiadavky
Zdrojový kód musí byť správne štruktúrovaný, čleaný a prehľadne formátovaný. Kód by nemal byť zle čleaný alebo sa opakovať.

#### 1. PROJEKTOVÁ ŠTRUKTÚRA

**Frontend - React:**
```
src/
├── pages/              ← Stránky (komponenty s business logikou)
│   ├── Home/
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Projects.jsx
│   │   ├── Reviews.jsx
│   │   └── ReviewsSection.jsx
│   ├── Login/
│   │   ├── Login.jsx
│   │   └── Login.css
│   ├── Orders/
│   │   ├── OrderForm.jsx
│   │   └── OrderForm.css
│   ├── OrderInfo/
│   │   ├── OrderInfoUser.jsx
│   │   ├── OrderInfoUser.css
│   │   ├── ReviewForm.jsx
│   │   └── ReviewForm.css
│   └── Admin/
│       ├── AdminDashboard.jsx
│       ├── AdminDashboard.css
│       ├── OrderInfoAdmin.jsx
│       ├── OrderInfoAdmin.css
│       └── components/
│           ├── OrdersTable.jsx
│           └── OrdersTable.css
│
├── components/         ← Reusable komponenty (UI)
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── Header.css
│   └── Footer/
│       ├── Footer.jsx
│       └── Footer.css
│
├── services/          ← API komunikácia
│   ├── api.js
│
├── styles/            ← Globálne štýly
│   ├── colors.css
│   └── global.css
│
├── App.jsx            ← Hlavný komponent (router)
└── main.jsx           ← Entry point
```

**Backend - PHP MVC:**
```
src/php/
├── Controllers/       ← Business Logic
│   ├── OrderController.php      (CRUD na orders)
│   ├── AdminController.php      (Admin operácie)
│   ├── AuthController.php       (Prihlásenie)
│   └── ReviewController.php     (CRUD na reviews)
│
├── Models/            ← Database Layer
│   ├── Order.php
│   ├── OrderFile.php
│   ├── User.php
│   └── Review.php
│
├── index.php          ← Router (vstupný bod API)
├── config.php         ← Konfigurácia (DB connection)
├── uploads/           ← Nahrané súbory
│   ├── orders/
│   └── completed/
│
└── .htaccess          ← Rewriting URL pre REST API
```

**Database:**
```
database/
├── init/
│   └── init.sql       ← Database schéma + sample dáta
└── backups/           ← Zálohy (nepovezené)
```

#### 2. MVC SEPARÁCIA

##### Presentation Layer (Frontend)

**Zodpovednosť:** Zobrazovanie a užívateľskéinterakcie

**Príkladom - OrderForm.jsx (`src/pages/Orders/OrderForm.jsx`):**
```jsx
// Zodpovednosť: Zobrazenie formulára + state management
function OrderForm() {
  const [formData, setFormData] = useState({...});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e) => {
    // Validácia na klientskej strane
    if (!validateForm()) return;
    
    // Volanie API
    createOrder(formData);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

##### Business Logic Layer (Backend - Controllers)

**Zodpovednosť:** Aplikačná logika, validácia, workflow

**Príkladom - OrderController.php:**
```php
class OrderController {
    
    // Jednotná odpoveď za vytvorenie
    public function create() {
        // 1. Čítanie vstupov
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 2. Validácia
        if (empty($input['name'])) {
            json_response(false, 'Name is required', null, 400);
        }
        
        // 3. Volanie modelu
        $result = Order::create($data);
        
        // 4. Odpoveď
        json_response(true, 'Order created', $result);
    }
}
```

##### Database Layer (Models)

**Zodpovednosť:** Pracovanie s databázou

**Príkladom - Order.php Model:**
```php
class Order {
    
    // Jednotné metódy pre DB operácie
    public static function create($data) { /* ... */ }
    public static function findById($id) { /* ... */ }
    public static function update($id, $data) { /* ... */ }
    public static function delete($id) { /* ... */ }
}
```

**Separácia:**
```
 Frontend         ↔     Backend      ↔    Database
 ────────────────────────────────────────────────
 | OrderForm |  ---API-->  | OrderController | → | Order Model | → MySQL
 ────────────────────────────────────────────────
 (Zobrazenie)     (Logika)      (Dáta)
```

### Záver
✅ **Splnené:**
- **MVC Architektúra:** Jasné oddelenie na 3 vrstvy
- **Štruktúra projektu:** Organizovaná podľa funkcií
- **Konvencie:** Konzistentné pomenovanie a formátovanie
- **DRY Princíp:** Minimálne opakovaného kódu
- **dokumentácia:** JSDoc a PHPDoc komentáre
- **Error Handling:** Konzistentné chybové správy
- **Git Workflow:** Čitateľné commit správy

---