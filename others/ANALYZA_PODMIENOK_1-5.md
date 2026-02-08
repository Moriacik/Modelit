## BOD 1: Aplikačná logika oddelená od prezentačnej vrstvy

### Popis požiadavky
Aplikácia musí oddělať aplikačnú logiku (business logic) od prezentačnej vrstvy (UI). Toto znamená, že logika pre manipuláciu s dátami by mala byť na serveri (backend), nie v prezentácii.

#### Frontend - Prezentačná vrstva (React)
Umiestnenie: `src/pages/`, `src/components/`

**Súbory:**
- `src/pages/Home/Home.jsx` - Zobrazenie domovskej stránky
- `src/pages/Login/Login.jsx` - Komponent prihlasovacieho formulára
- `src/pages/Orders/OrderForm.jsx` - Komponent formulára pre vytváranie objednávky
- `src/pages/OrderInfo/OrderInfoUser.jsx` - Zobrazenie detailov objednávky pre zákazníka
- `src/pages/Admin/AdminDashboard.jsx` - Admin panel s tabuľkou objednávok
- `src/pages/OrderInfo/ReviewForm.jsx` - Komponent pre recenzie

**Úloha frontend:** 
- Zobrazovanie dát
- Validácia formulárov na strane klienta
- Odesílání žiadostí na API
- Riadenie UI stavov (loading, errors, success)

#### Backend - Aplikačná logika (PHP MVC)
Umiestnenie: `src/php/`

**Štruktúra:**
```
src/php/
├── Controllers/          ← Business Logic (aplikačná logika)
│   ├── OrderController.php
│   ├── AdminController.php
│   ├── AuthController.php
│   └── ReviewController.php
├── Models/              ← Database Layer (dátová vrstva)
│   ├── Order.php
│   ├── OrderFile.php
│   ├── Review.php
│   └── User.php
├── index.php            ← Router
└── config.php           ← Konfigurácia
```

#### Tok dát v aplikácii
```
[React Frontend]
    ↓ HTTP API call
    ↓ JSON
[PHP Router] (index.php)
    ↓
[Controller] (OrderController::create())
    ↓ Business Logic & Validation
    ↓
[Model] (Order::create())
    ↓ SQL Query
    ↓
[Database] (MySQL)
    ↓
[Model] (vrátenie výsledku)
    ↓
[Controller] (formátovanie odpovede)
    ↓ JSON response
[React Frontend] (update UI)
```

### Záver
✅ **Splnené:** Aplikačná logika je jasne oddelená na tri vrstvy:
1. **Presentation Layer** - React komponenty (JSX)
2. **Business Logic Layer** - PHP Controllers
3. **Database Layer** - PHP Models

---

## BOD 2: Minimálne 5 dynamických stránok

### Popis požiadavky
Aplikácia musí obsahovať aspoň 5 rôznych podstránok s dynamickým obsahom (stránky kľúčové nie sú počítané ako samostatné).

#### Stránky v aplikácii
Umiestnenie: `src/pages/`

**Router konfigúrácia - App.jsx (riadky 15-23):**
```jsx
<Routes>
  <Route path="/" element={<Home />} />                    {/* Stránka 1 */}
  <Route path="/login" element={<Login />} />              {/* Stránka 2 */}
  <Route path="/objednavka" element={<OrderForm />} />     {/* Stránka 3 */}
  <Route path="/admin" element={<AdminDashboard />} />     {/* Stránka 4 */}
  <Route path="/admin/orders/:id" element={<OrderInfoAdmin />} />  {/* Stránka 5 */}
  <Route path="/order-detail/:orderToken" element={<OrderInfoUser />} /> {/* Stránka 6 */}
</Routes>
```

### Záver
✅ **Splnené s nadmieru:** Aplikácia obsahuje **6 dynamických stránok**:
- **3 verejné stránky:** Domov, Prihlásenie, Nová objednávka
- **3 chránené stránky:** Admin panel, Detail admin, Detail zákazníka
- Všetky načítavajú dáta z API (dynamický obsah)

---

## BOD 3: Minimálne 50 vlastných riadkov kódu v JavaScripte

### Popis požiadavky
Aplikácia musí obsahovať vlastný JavaScript/TypeScript kód s minimálnou dĺžkou 50 riadkov. Kód musí byť zmysluplný a používaný v aplikácii.

#### Počet riadkov podľa súboru
```
OrderInfoUser.jsx        344 riadkov
OrderForm.jsx            245 riadkov
Home.jsx                 249 riadkov
Login.jsx                231 riadkov
OrderInfoAdmin.jsx       328 riadkov
ReviewForm.jsx           173 riadkov
OrdersTable.jsx          144 riadkov
AdminDashboard.jsx        90 riadkov
Projects.jsx              49 riadkov
ReviewsSection.jsx       109 riadkov
Reviews.jsx               48 riadkov
Footer.jsx                21 riadkov
Header.jsx                31 riadkov
────────────────────────────────
CELKEM:                ~2153 riadkov
```

#### Zmysluplný vlastný JavaScript kód

**1. Validácia formulára - OrderForm.jsx (60+ riadkov vlastného kódu):**
```javascript
const validateForm = () => {
  const name = formData.name.trim();
  const email = formData.email.trim();
  const description = formData.description.trim();
  const deadline = formData.deadline;

  // Name validation
  if (!name) {
    setMessage('Meno je povinné');
    return false;
  }
  if (name.length < 2) {
    setMessage('Meno musí mať aspoň 2 znaky');
    return false;
  }
  if (name.length > 100) {
    setMessage('Meno môže mať maximálne 100 znakov');
    return false;
  }
  if (!/^[a-zA-Z0-9\s\-áäčéíóôšťúýžÁÄČÉÍÓÔŠŤÚÝŽ]+$/.test(name)) {
    setMessage('Meno obsahuje nepovolené znaky');
    return false;
  }

  // Email validation
  if (!email) {
    setMessage('Email je povinný');
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setMessage('Neplatný formát emailu');
    return false;
  }
  if (email.length > 100) {
    setMessage('Email je príliš dlhý');
    return false;
  }

  // Description validation
  if (!description) {
    setMessage('Popis práce je povinný');
    return false;
  }
  if (description.length < 10) {
    setMessage('Popis musí mať aspoň 10 znakov');
    return false;
  }
  if (description.length > 5000) {
    setMessage('Popis môže mať maximálne 5000 znakov');
    return false;
  }

  // Deadline validation
  if (!deadline) {
    setMessage('Deadline je povinný');
    return false;
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const minDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  if (deadlineDate <= now) {
    setMessage('Deadline musí byť v budúcnosti');
    return false;
  }
  if (deadlineDate < minDeadline) {
    setMessage('Deadline musí byť aspoň za 2 dni');
    return false;
  }
  if (deadlineDate > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
    setMessage('Deadline nemôže byť viac ako 1 rok v budúcnosti');
    return false;
  }

  return true;
};
```

### Záver
✅ **Splnené s mimoriadnym nadmieru:** 
- **Celkový počet riadkov JS:** 2153 riadkov (42x viac než požadovane)
- **Zmysluplný kód:** Všetky komponenty obsahujú:
  - State management (useState, useEffect)
  - Validácia formulárov
  - API volania (fetch)
  - Filtrovanie a triedenie
  - Chybové správy a loading stavu

---

## BOD 4: Minimálne 20 vlastných CSS pravidiel

### Popis požiadavky
Aplikácia musí obsahovať najmenej 20 CSS pravidiel. Nezapočítavajú sa CSS frameworky ako Bootstrap.

#### Počet CSS pravidiel podľa súboru
```
OrderInfoUser.css       289 pravidiel
Home.css                136 pravidiel
OrderInfoAdmin.css       98 pravidiel
Login.css                68 pravidiel
OrderForm.css            63 pravidiel
OrdersTable.css          36 pravidiel
Reviews.css              34 pravidiel
Header.css               31 pravidiel
ReviewForm.css           30 pravidiel
Footer.css               25 pravidiel
AdminDashboard.css       26 pravidiel
────────────────────────────────
CELKEM:               ~850 pravidiel
```

#### Príklady CSS pravidiel (nepovinný Bootstrap)

**1. OrderInfoUser.css - Animovaný gradient background (10+ pravidiel):**
```css
/* OrderInfoUser Page - Modern Card-Based Design */
.order-info-page {
  min-height: 100vh;
  padding: 80px 20px 40px;
  background: var(--gradient-bg-dark);
  position: relative;
  overflow: hidden;
}

/* Animated Background Elements */
.order-info-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, var(--color-primary-transparent-light) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, var(--color-accent-light-transparent) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, var(--color-accent-dark-transparent) 0%, transparent 50%);
  animation: backgroundMove 20s ease-in-out infinite;
  z-index: 0;
}

@keyframes backgroundMove {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(20px, -20px) rotate(120deg); }
  66% { transform: translate(-10px, 15px) rotate(240deg); }
}
```

### Záver
✅ **Splnené s mimoriadnym nadmieru:**
- **Celkový počet CSS pravidiel:** 850+ pravidiel (42x viac než požadovane)
- **Vlastný CSS bez frameworkov:**
  - Animácie (backgroundMove, float, slideIn)
  - Grid a Flexbox layouts
  - Hover efekty a transitions
  - Responsive design (media queries)
  - CSS custom properties (variables)
  - Pseudo-elementy (::before, ::after)
  - Gradients a transformácie

---

## BOD 5: Minimálne 3 zmysluplné DB entity, všetky použité

### Popis požiadavky
Aplikácia musí obsahovať minimálne 3 databázové tabuľky s zmysluplnými dátami. Tabuľka `users/admins` sa do počtu nezapočítava. Všetky entity musia byť v aplikácii reálne použité.

#### Databázové entity (Models v PHP)

| # | Entity | Súbor Model | Tabuľka | Stĺpce | Použitie |
|---|--------|-------------|---------|--------|----------|
| 1 | **Objednávky** | `Models/Order.php` | `orders` | id, order_token, customer_name, customer_email, description, price, deadline, status, created_at, final_ready | Hlavná entita - spravuje všetky objednávky |
| 2 | **Súbory objednávky** | `Models/OrderFile.php` | `order_files` | id, order_id, file_name, file_path, file_size, uploaded_at | Súbory pri objednávke (viazané 1:N) |
| 3 | **Recenzie** | `Models/Review.php` | `reviews` | id, customer_name, customer_role, text, rating, created_at | Recenzie zákazníkov na domovskej stránke |
| 4 | **Admini** | `Models/User.php` | `admins` | id, username, password_hash, created_at | Prihlásenie adminov (aux, nezapúča sa) |

#### 1. OBJEDNÁVKY (Orders) - Primárna entita

**Umiestnenie:**
- Model: `src/php/Models/Order.php`
- Controller: `src/php/Controllers/OrderController.php`
- Frontend: `src/pages/Orders/OrderForm.jsx`, `src/pages/OrderInfo/OrderInfoUser.jsx`, `src/pages/Admin/AdminDashboard.jsx`

**Štruktúra tabuľky:**
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_token VARCHAR(20) UNIQUE NOT NULL,  -- Pre tvorbu linku zákazníka
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,  -- Nastavuje admin neskôr
  deadline DATE NOT NULL,
  status ENUM('new', 'in_progress', 'completed', 'canceled') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  final_ready BOOLEAN DEFAULT FALSE
);
```

#### 2. SÚBORY OBJEDNÁVKY (Order Files) - Viazané na Objednávky

**Umiestnenie:**
- Model: `src/php/Models/OrderFile.php`
- Controller: `src/php/Controllers/OrderController.php`
- Frontend: `src/pages/OrderInfo/OrderInfoUser.jsx`

**Štruktúra tabuľky:**
```sql
CREATE TABLE order_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

**Vzťah s Orders:**
```
orders (1) ──── (N) order_files
  ↓                     ↓
  id                   order_id
```

#### 3. RECENZIE (Reviews) - Nezávislá entita

**Umiestnenie:**
- Model: `src/php/Models/Review.php`
- Controller: `src/php/Controllers/ReviewController.php`
- Frontend: `src/pages/Home/Home.jsx`, `src/pages/OrderInfo/ReviewForm.jsx`

**Štruktúra tabuľky:**
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(100) NOT NULL,
  customer_role VARCHAR(100),
  text TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Záver
✅ **Splnené s nadmieru:**
- **4 databázové entity:** orders, order_files, reviews + admins (aux)
- **3 zmysluplné entity:** Orders (primárna), OrderFiles (viazané), Reviews (nezávislá)
- **Všetky entity sú reálne používané:**
  - ✅ Orders - vytvárajú sa cez formulár, spravuje admin, sledujú zákazníci
  - ✅ OrderFiles - uploadujú admin, sťahujú zákazníci
  - ✅ Reviews - vytvárajú zákazníci, zobrazujú sa na home page
- **1:N vzťah:** Orders ──── OrderFiles (1 objednávka, N súborov)
- **Všetky CRUD operácie:**
  - CREATE: Vytvorenie nových záznamov
  - READ: Čítanie záznamov podľa ID alebo tokenu
  - UPDATE: Zmena statusu, ceny objednávky
  - DELETE: Zmazanie súborov alebo soft-delete objednávok

---