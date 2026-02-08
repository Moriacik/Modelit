# Detailné vysvetlenie `services/api.js` - API Service Layer

## Čo je `api.js`?

`api.js` je **Frontend Service Layer** - helper knižnica, ktorá:
1. **Centralizuje všetky API volania** z React komponentov
2. **Abstrahuje detaily** HTTP komunikácie
3. **Poskytuje ES6 exportované funkcie** pre React komponenty
4. **Spravuje chybovosť** a error handling

## Arhitektura

```
┌──────────────────────────────────────────────────────────────┐
│                  REACT KOMPONENTY                            │
│           (OrderForm.jsx, AdminDashboard.jsx, ...)           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  import { adminGetOrders, createOrder } from services/api   │
│                                                              │
└────────────────────┬─────────────────────────────────────────┘
                     │ Volá funkcie
                     │ (nie priamo fetch)
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                  SERVICES/API.JS                            │
│           (Centralizovaná API komunikácia)                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  export adminGetOrders = () => apiGet('/admin/orders')     │
│  export createOrder = (data) => apiPost('/orders', data)   │
│  export adminUpdatePrice = (id, price) => ...              │
│                                                              │
└────────────────────┬─────────────────────────────────────────┘
                     │ Všetky funkcie voľajú
                     │ Core `api()` helper
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│           CORE API HELPER - api(path, data, method)         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  const api = async (path, data = {}, method = 'POST') => {  │
│    // Konštrukcia URL                                        │
│    // Spracovanie parametrov                                │
│    // fetch() volanie                                        │
│    // Error handling                                         │
│    // JSON parsing                                           │
│  }                                                           │
│                                                              │
└────────────────────┬─────────────────────────────────────────┘
                     │ Asynchrónny fetch
                     │ HTTP Request
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              HTTP / Network                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              /index.php (Backend Router)                    │
│     (spracovanie requestu na backendu)                     │
└────────────────────┬─────────────────────────────────────────┘
                     │ JSON Response
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              React Komponent - Promise                       │
│         const result = await api()                           │
│         if (result.success) { ... }                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Konkrétne Príklady

### PRÍKLAD 1: Admin sa prihláša

**Frontend - Login.jsx:**
```jsx
import { adminLogin } from '../services/api';

const handleAdminLogin = async (e) => {
  e.preventDefault();
  
  // Volá API funkciu z api.js
  const result = await adminLogin(username, password);
  
  if (result.success) {
    localStorage.setItem('adminToken', result.data.token);
    navigate('/admin');
  }
};
```

**Čo sa zavolá v `api.js`:**

```javascript
// Riadok 37
export const adminLogin = (username, password) => 
  apiPost('/auth/admin-login', { username, password });
  //      ↓                     ↓
  //    path                 dáta
```

**Rozvinutie volania:**

```javascript
apiPost('/auth/admin-login', { username: 'admin', password: 'admin123' })
  // ↓ Ide do helper funkcie

const apiPost = (path, data) => api(path, data, 'POST');
  // ↓ Volá core funkciu

const api = async (path, data = {}, method = 'POST') => {
  try {
    // Riadok 8 - Postaviť URL
    const url = `/index.php?path=${encodeURIComponent('/auth/admin-login')}`;
    // url = '/index.php?path=%2Fauth%2Fadmin-login'
    
    // Riadok 9-13 - Postaviť options
    const options = {
      method: 'POST',  // ← POST je explicitný
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    };
    
    // Riadok 20 - Asynchrónny fetch
    const response = await fetch(url, options);
    // ↓ Frontend pošle HTTP request na backend
    
    // Riadok 21-23 - Skontrolovať status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Riadok 24 - Vrátiť JSON
    return await response.json();
    // { success: true, data: { token: '...', username: 'admin' } }
    
  } catch (error) {
    // Riadok 25-27 - Error handling
    console.error('API Error:', error);
    return { success: false, message: 'Network error: ...', data: null };
  }
};
```

**HTTP Request ktorý sa pošle:**
```http
POST /index.php?path=%2Fauth%2Fadmin-login HTTP/1.1
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Backend (index.php) vráti:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "YWRtaW46MTczNzEyMzQ1Njo4MjQ5",
    "username": "admin"
  }
}
```

**Frontend React Komponent:**
```jsx
const result = await adminLogin('admin', 'admin123');

// result = {
//   success: true,
//   message: "Login successful",
//   data: { token: "...", username: "admin" }
// }

if (result.success) {
  localStorage.setItem('adminToken', result.data.token);
  navigate('/admin');
}
```

---

### PRÍKLAD 2: Admin si načíta zoznam objednávok

**Frontend - AdminDashboard.jsx:**
```jsx
import { adminGetOrders } from '../services/api';

useEffect(() => {
  const fetchOrders = async () => {
    // Volá API funkciu bez parametrov
    const result = await adminGetOrders();
    
    if (result.success) {
      setOrders(result.data);  // Naplní tabuľku
    }
  };
  
  fetchOrders();
}, []);
```

**Čo sa zavolá v `api.js`:**

```javascript
// Riadok 45
export const adminGetOrders = () => 
  apiGet('/admin/orders');
```

**Rozvinutie:**
```javascript
apiGet('/admin/orders')
  // ↓ Ide do helper

const apiGet = (path) => api(path, {}, 'GET');
  // ↓ Volá core s GET metódou

const api = async (path, data = {}, method = 'GET') => {
  // path = '/admin/orders'
  // data = {} (prázdne)
  // method = 'GET'
  
  const url = `/index.php?path=${encodeURIComponent('/admin/orders')}`;
  // url = '/index.php?path=%2Fadmin%2Forders'
  
  const options = {
    method: 'GET',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    // ← U GET metódy sa nepridáva body (riadok 17-18)
    // if (['POST', 'PUT', 'DELETE'].includes(method) && ...)
    //   body nie sa nepridáva
  };
  
  const response = await fetch(url, options);
  // ↓ Asynchrónny GET request na backend
  
  return await response.json();
  // { success: true, data: [ ... objednávky ... ] }
};
```

**HTTP Request:**
```http
GET /index.php?path=%2Fadmin%2Forders HTTP/1.1
Content-Type: application/json
```

**Backend response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_token": "MODELIT-ABC123",
      "customer_name": "Ján Štandard",
      "price": 150,
      "status": "new"
    },
    {
      "id": 2,
      "order_token": "MODELIT-XYZ789",
      "customer_name": "Mária Nová",
      "price": 200,
      "status": "in_progress"
    }
  ]
}
```

**Frontend React:**
```jsx
const result = await adminGetOrders();

// result.data = [
//   { id: 1, order_token: 'MODELIT-ABC123', ... },
//   { id: 2, order_token: 'MODELIT-XYZ789', ... }
// ]

setOrders(result.data);  // Naplní state
// React renderuje <OrdersTable orders={orders} />
```

---

### PRÍKLAD 3: Admin zmení cenu objednávky

**Frontend - OrderInfoAdmin.jsx:**
```jsx
import { adminUpdatePrice } from '../services/api';

const handlePriceChange = async () => {
  const newPrice = 250;
  
  // Volá API funkciu s ID a cenou
  const result = await adminUpdatePrice(5, newPrice);
  
  if (result.success) {
    setOrder(prev => ({ ...prev, price: newPrice }));
  }
};
```

**Čo sa zavolá v `api.js`:**

```javascript
// Riadok 49
export const adminUpdatePrice = (id, price) => 
  apiPut(`/admin/orders/${id}/price`, { agreed_price: price });
  //     ↓                            ↓
  //   path s ID                   dáta s cenou
```

**Rozvinutie:**
```javascript
apiPut(`/admin/orders/5/price`, { agreed_price: 250 })
  // ↓

const apiPut = (path, data) => api(path, data, 'PUT');
  // ↓

const api = async (path, data = {}, method = 'PUT') => {
  // path = '/admin/orders/5/price'
  // data = { agreed_price: 250 }
  // method = 'PUT'
  
  const url = `/index.php?path=${encodeURIComponent('/admin/orders/5/price')}`;
  // url = '/index.php?path=%2Fadmin%2Forders%2F5%2Fprice'
  
  const options = {
    method: 'PUT',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agreed_price: 250 })  // ← PUT == posli body
  };
  
  const response = await fetch(url, options);
  return await response.json();
};
```

**HTTP Request:**
```http
PUT /index.php?path=%2Fadmin%2Forders%2F5%2Fprice HTTP/1.1
Content-Type: application/json

{
  "agreed_price": 250
}
```

**Backend response:**
```json
{
  "success": true,
  "data": {
    "order_id": 5,
    "new_price": 250
  }
}
```

**Frontend React:**
```jsx
const result = await adminUpdatePrice(5, 250);

if (result.success) {
  setOrder(prev => ({ ...prev, price: 250 }));
  setSuccessMessage('Price updated');
}
```

---

### PRÍKLAD 4: Stiahnuť súbor

**Frontend - OrderInfoUser.jsx:**
```jsx
import { downloadFile } from '../services/api';

const handleDownload = (fileName) => {
  const token = order.order_token;
  
  // Špeciálne spracovanie pre download
  downloadFile(token, fileName);
};
```

**Čo sa zavolá v `api.js`:**

```javascript
// Riadok 63-71 - ŠPECIÁLNY PRÍPAD
export const downloadFile = (token, fileName) => {
  // ← Neprechádzaza core `api()` - priama manipulácia s DOM!
  
  const url = `/index.php?path=${encodeURIComponent(`/orders/${token}/download/${fileName}`)}`;
  // url = '/index.php?path=%2Forders%2FMODELITABC123%2Fdownload%2Fmodel.zip'
  
  const link = document.createElement('a');  // Vytvor <a> tag
  link.href = url;                            // Nastav href
  link.download = fileName;                   // Nastav download atribút
  document.body.appendChild(link);            // Pridaj do DOM
  link.click();                               // Simuluj klik
  document.body.removeChild(link);            // Vymaž z DOM
  
  // ← Výsledok: Browser si stiahnuje súbor namiesto JSON response!
};
```

**HTTP Request:**
```http
GET /index.php?path=%2Forders%2FMODELITABC123%2Fdownload%2Fmodel.zip HTTP/1.1
```

**Backend (OrderController::downloadFile) vracia:**
```php
// Vypošle binárny obsah súboru (nie JSON!)
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="model.zip"');
readfile($filePath);
```

**Frontend:**
```jsx
handleDownload('model.zip');
// ← Browsers si automaticky stiahnuť súbor z /uploads/completed/
```

---

## Tabuľka všetkých API funkcií

| Funkcia | HTTP | Path | Parametre | Príklad |
|---------|------|------|-----------|---------|
| `adminLogin` | POST | /auth/admin-login | username, password | `adminLogin('admin', 'pass')` |
| `userLogin` | POST | /auth/user-login | orderCode | `userLogin('MODELIT-ABC')` |
| `adminLogout` | POST | /auth/admin-logout | žiadne | `adminLogout()` |
| `createOrder` | POST | /orders/create | orderData | `createOrder({name, email, ...})` |
| `getOrders` | GET | /orders | žiadne | `getOrders()` |
| `getOrder` | GET | /orders/:id | id | `getOrder('MODELIT-ABC')` |
| `updateOrderStatus` | PUT | /orders/:id/status | id, status | `updateOrderStatus(1, 'completed')` |
| `adminGetOrders` | GET | /admin/orders | žiadne | `adminGetOrders()` |
| `adminGetOrderDetails` | GET | /admin/orders/:id | id | `adminGetOrderDetails(5)` |
| `adminUpdateOrderStatus` | PUT | /admin/orders/:id/status | id, status | `adminUpdateOrderStatus(5, 'completed')` |
| `adminUpdatePrice` | PUT | /admin/orders/:id/price | id, price | `adminUpdatePrice(5, 250)` |
| `adminGetStats` | GET | /admin/stats | žiadne | `adminGetStats()` |
| `getUploadedFiles` | GET | /orders/:token/files | token | `getUploadedFiles('MODELIT-ABC')` |
| `downloadFile` | GET | /orders/:token/download/:file | token, file | `downloadFile('MODELIT-ABC', 'model.zip')` |
| `createReview` | POST | /reviews | reviewData | `createReview({rating, message})` |
| `getPublishedReviews` | GET | /reviews | žiadne | `getPublishedReviews()` |
| `getReviewsByOrderId` | GET | /reviews/order/:id | orderId | `getReviewsByOrderId(5)` |

---

## Flow Diagram - Admin Login do Admin Prihlásenia

```
FRONTEND (React)                      API.JS                       BACKEND (PHP)
═════════════════════════════════════════════════════════════════════════════════════

handleAdminLogin()
    │
    ├─→ adminLogin('admin', 'pass')
    │        │
    │        └─→ apiPost('/auth/admin-login', {...})
    │             │
    │             └─→ api('/auth/admin-login', {...}, 'POST')
    │                  │
    │                  ├─→ Konštrukcia URL
    │                  │   /index.php?path=%2Fauth%2Fadmin-login
    │                  │
    │                  ├─→ fetch(url, options)
    │                  │   ─────────────────────────────────────────→ HTTP POST Request
    │                  │                                                    │
    │                  │                                              index.php
    │                  │                                                    │
    │                  │                                            Parse: /auth/admin-login
    │                  │                                            Identifikuj: AuthController::adminLogin
    │                  │                                                    │
    │                  │                                            AuthController::adminLogin()
    │                  │                                                    ├─ Validácia
    │                  │                                                    ├─ User::authenticate()
    │                  │                                                    └─ json_response()
    │                  │<────────────────────────────────────────── HTTP 200 + JSON {...}
    │                  │
    │                  └─→ response.json()
    │                       {'success': true, 'data': {'token': '...'}}
    │
    ├─→ result = await (Promise vráti odpoveď z backendu)
    │
    if (result.success) {
      localStorage.setItem('adminToken', result.data.token)
      navigate('/admin')
    }

Render: <AdminDashboard />
```

---

## Výhody API Layer

**Bez api.js (BAD):**
```jsx
// V každom komponente opakovať volania
const response = await fetch('/index.php?path=%2Fadmin%2Forders', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
const result = await response.json();
if (result.ok) { ... }
// ^ Opakovať vo 10+ komponentoch!
```

**S api.js (GOOD):**
```jsx
// Importuj a voľaj
import { adminGetOrders } from '../services/api';
const result = await adminGetOrders();
if (result.success) { ... }
// ^ Čistý, krátkej, DRY princíp!
```

### Výhody:
- ✅ **DRY** - neopakovať fetch logiku
- ✅ **Centralizácia** - zmena API v jednom mieste
- ✅ **Error handling** - jednotný spôsob
- ✅ **Čitateľnosť** - jasné funkcné mená
- ✅ **Testovateľnosť** - ľahko mockovať v testoch

---

## Shrnutie

**`api.js` je:**
- ✅ **Service Layer** - abstrakcia nad HTTP communication
- ✅ **Helper Library** - DRY princíp (nepakuj volania)
- ✅ **ES6 Exports** - čisté API pre React komponenty
- ✅ **Error Handling** - jednotný spôsob spracovať chyby
- ✅ **Proxy k Backend Routeru** - všetko ide cez `index.php?path=...`

**Flow:**
```
React Komponenta
    ↓
api.js funkcia (eg. adminGetOrders)
    ↓
Core api() helper (konštrukcia URL, fetch, JSON)
    ↓
HTTP Request na /index.php?path=...
    ↓
Backend: index.php Router
    ↓
Controller → Model → Database
    ↓
JSON Response
    ↓
Promise v React
    ↓
Aktualizácia State → Re-render UI
```
