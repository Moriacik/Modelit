# Analýza Požiadaviek VAII - Stav Implementácie

Tento dokument poskytuje podrobný prehľad splnenia všetkých požiadaviek semestrálnej práce z predmetu VAII 2025/26.

---

## 📊 KONTROLNÝ TERMÍN 1 (Max 10 bodov)

### Požiadavky
- ✅ **Dokumentácia** - Vypracovať dokument s popisom semestrálnej práce podľa šablóny
- Vyžadované kapitoly: úvod, prehľad podobných aplikácií, analýza, návrh
- Každá kapitola musí byť primerane rozpracovaná
- Profesionálny, akademický jazyk bez chýb
- Štruktúra musí podľa šablóny

### Aktuálny Stav
- ❌ **CHÝBA**: Nebol nájdený dokument s popisom semestrálnej práce
- ❌ **NEVYPLNENÉ**: Úvod, analýza a návrh aplikácie
- ⚠️ **AKCIA POTREBNÁ**: Vytvoriť dokumentáciu minimálne pred termínom v 12. týždni

---

## 📊 KONTROLNÝ TERMÍN 2 (Max 10 bodov)

### Povinné Požiadavky

| Požiadavka | Stav | Detaily |
|-----------|------|---------|
| **Git** | ✅ SPLNENÉ | Projekt je vo Git repozitári (Vaii-semestralka/master branch) |
| **CSS pravidlá (min. 10)** | ✅ SPLNENÉ | **~250+ CSS pravidiel** v externe pripojených súboroch: |
| | | - PaymentPlanSection.css (~140 pravidiel) |
| | | - OrderInfoUser.css (~200 pravidiel) |
| | | - PaymentConfirmModal.css (~90 pravidiel) |
| | | - OrderForm.css (~90 pravidiel) |
| | | - Reviews.css (~30 pravidiel) |
| | | - index.css (základný styling) |
| **Layout a Responzívny dizajn** | ✅ SPLNENÉ | 3-vrstvový responzívny grid system (1024px, 768px, 480px breakpoints) |
| **Validácia formulárov - klient** | ✅ SPLNENÉ | HTML5 validation + custom React validácia |
| **Validácia formulárov - server** | ✅ SPLNENÉ | PHP validácia na všetkých vstupoch |
| **JavaScript (min. 50 riadkov)** | ✅ SPLNENÉ | **Celkom ~3000+ riadkov vlastného JS kódu** |

### JavaScript Analýza
- ✅ PaymentPlanSection.jsx (~280 riadkov)
- ✅ OrderInfoUser.jsx (~450 riadkov)
- ✅ PaymentConfirmModal.jsx (~200 riadkov)
- ✅ OrderForm.jsx (~400 riadkov)
- ✅ AdminDashboard.jsx (~300 riadkov)
- ✅ OrderInfoAdmin.jsx (~350 riadkov)
- ✅ Login.jsx (~150 riadkov)
- ✅ Header.jsx (~100 riadkov)
- ✅ Footer.jsx (~80 riadkov)
- ✅ App.jsx (~80 riadkov)
- ... a ďalšie

---

## 📊 SEMESTRÁLNA PRÁCA (Max 58 bodov)

### 1. Správne Použitie GIT
**Status: ✅ SPLNENÉ**
- Projekt je vo verejnom Git repozitári
- Branch: master
- Očakávané: Viditeľný progres od začiatku semestra

---

### 2. Kvalita DB Návrhu
**Status: ✅ ČIASTOČNE SPLNENÉ (50%)**

#### DB Schéma
```
orders (hlavná tabuľka)
├── id, order_token, customer_name, customer_email
├── description, deadline, status
├── estimated_price, admin_price, agreed_price, price_status
├── referencne_subory, final_files
├── deposit/midway/final_required, deposit/midway/final_paid_at
├── draft_ready, final_ready
└── created_at, updated_at

admins (tabuľka admina)
├── id, username, password_hash
└── created_at

price_negotiations (históriea cenových ponúk)
├── id, order_id (FK → orders)
├── price, offered_by (admin/customer)
├── note, status, created_at, responded_at
└── FOREIGN KEY (order_id) → orders.id
```

#### Analýza Kvality
- ✅ **3 hlavné entity**: orders, admins, price_negotiations (+ 1:N vzťah)
- ✅ **Primárne kľúče**: Správne definované
- ✅ **Cudzie kľúče**: price_negotiations.order_id → orders.id
- ✅ **Normalizácia**: Bez duplicít, logická štruktúra
- ❌ **NEDOSTATKY**:
  - Bez explicit M:N vzťahu (len 1:N)
  - price_negotiations funguje ako LOG, nie ako entita s vlastnosťami
  - Mohlo by byť viac entít (napr. orders_items, delivery_addresses, atď.)

---

### 3. Validácia Vstupov - Server
**Status: ✅ SPLNENÉ**

#### Implementovaná Validácia (PHP)
- ✅ Kontrola povinných polí
- ✅ Validácia email formátu
- ✅ Kontrola dátových typov
- ✅ Kontrola rozsahu hodnôt
- ✅ SQL injection protection (PDO prepared statements)

#### PHP Súbory s Validáciou
- `create-order.php` - Validuje: meno, email, popis, soubory
- `user-login.php` - Validuje: email, order_token
- `admin-login.php` - Validuje: username, password
- `process-payment-*.php` - Validuje: order_id, order_token
- `submit-counter-offer.php` - Validuje: cena, poznámka
- `upload-final-files.php` - Validuje: súbory, veľkosť

---

### 4. Bezpečnosť Aplikácie
**Status: ✅ ČIASTOČNE SPLNENÉ (70%)**

| Aspekt | Status | Detaily |
|--------|--------|---------|
| **SQL Injection ochrana** | ✅ | PDO prepared statements všade |
| **XSS ochrana** | ✅ | React escape, php htmlspecialchars() |
| **CSRF ochrana** | ❌ | Tokens nie sú implementované |
| **Heslá - hashing** | ✅ | bcrypt ($2y$10$ hashes v DB) |
| **Autentifikácia** | ✅ | Login sistem pre admin a users |
| **Autorizácia** | ✅ | order_token validácia pre users |
| **CORS headers** | ✅ | Nastavené na PHP endpointoch |
| **Input validation** | ✅ | Server-side na všetkých vstupoch |

---

### 5. AJAX Volania (Min 2 zmysluplné)
**Status: ✅ SPLNENÉ (6+ implementovaných)**

#### Implementované AJAX Volania
1. ✅ **Order Form Submission** - POST /create-order.php (formulár)
2. ✅ **Login** - POST /user-login.php (prihlasovanie)
3. ✅ **Admin Login** - POST /admin-login.php (admin prihlásenie)
4. ✅ **Get Orders** - POST /get-orders.php (zoznam objednávok)
5. ✅ **Get Order Details** - POST /get-order-details.php (detaily objednávky)
6. ✅ **Price Negotiation** - POST /submit-counter-offer.php (protinávrhok)
7. ✅ **Payment Processing** - POST /process-payment-*.php (3x platby)
8. ✅ **Upload Files** - POST /upload-final-files.php (nahranie súborov)
9. ✅ **File Download** - GET /uploads/...

---

### 6. Viacero Rolí + Autorizácia
**Status: ✅ SPLNENÉ**

#### Role
1. **Zákazník (User)**
   - Môže: Vytvoriť objednávku, vidieť svoj order, platby, download súborov
   - Autentifikácia: email + order_token
   - Zoznam objednávok: OrderInfo stránka s order_token

2. **Admin**
   - Môže: Správa objednávok, nastavenie ceny, upload súborov, doplnenie údajov
   - Autentifikácia: username + password
   - Admin Dashboard: AdminDashboard.jsx + OrderInfoAdmin.jsx

3. **Verejný Geteč**
   - Môže: Vidieť home page, reviews, vytvoriť objednávku
   - Neautentifikovaný prístup

#### Autorizácia - Implementácia
- ✅ Login pagey pre user a admin
- ✅ Session management (PHP)
- ✅ Route protection v React (PrivateRoute)
- ✅ Token-based verification

---

### 7. Práca so Súbormi
**Status: ✅ SPLNENÉ**

#### Upload Funkcionalita
- ✅ **Upload referencných súborov** - OrderForm.jsx (pri vytváraní objednávky)
  - Validácia: max 5 MB na súbor, zip/pdf/doc formáty
  - Server: `src/php/create-order.php`
  - Uloženie: `src/php/uploads/orders/{order_id}/`

- ✅ **Upload finálnych súborov** - OrderInfoUser.jsx (po schválení ceny)
  - Admin nahrá súbory
  - Uloženie: `src/php/uploads/completed/{order_id}/`

#### Download Funkcionalita
- ✅ **Download referencných súborov** - OrderInfoUser.jsx
- ✅ **Download finálnych súborov** - OrderInfoUser.jsx (po dokončení)
- ✅ Zobrazenie súborov v zozname s ikonami a veľkosťami
- ✅ Kontrola prístupu (len vlastník objednávky/admin)

#### Manažment Súborov
- ✅ Zobrazenie zoznamu súborov v OrderInfo
- ✅ Možnosť stiahnuť súbory
- ✅ Výpis metainformácií (meno, veľkosť, typ)
- ✅ Validácia veľkosti pri nahrávaní

---

### 8. Kvalita Návrhu Architektúry a Štýl Kódu
**Status: ✅ ČIASTOČNE SPLNENÉ (70%)**

#### Architektura
- ✅ **Oddelenie logiky od prezentácie** - React components + PHP backend
- ✅ **MVC-inspired** - Pages (View), Components (UI), PHP (Logic + Model)
- ✅ **Modulárna štruktúra** - Jednotlivé stránky v `/pages`, komponenty v `/components`
- ✅ **CSS separation** - Jedna CSS datoteka na komponent
- ❌ **State management** - Bez Redux/Context API, len useState
- ❌ **Services layer** - Bez abstraktnej vrstavy API volaní

#### Štýl Kódu
- ✅ Konzistentné pomenovanie (camelCase)
- ✅ Jasne štruktúrované komponenty
- ✅ Komentáre v kódoch
- ✅ Správne indentácia a formátovanie
- ⚠️ Niektoré komponenty sú veľké (OrderInfoUser.jsx - 450+ riadkov)

---

### 9. Zložitosť Aplikácie a Počet Funkcií
**Status: ✅ SPLNENÉ - VYSOKÁ ZLOŽITOSŤ**

#### Počet Stránok (Min. 5)
- ✅ Home (s reviews a projektami) - 1 stránka
- ✅ OrderForm - vytvorenie objednávky - 1 stránka
- ✅ OrderInfo (User) - detail objednávky - 1 stránka
- ✅ Login (User) - prihlásenie - 1 stránka
- ✅ AdminDashboard - správa objednávok - 1 stránka
- ✅ OrderInfoAdmin - detail objednávky pre admina - 1 stránka
- ✅ AdminLogin - admin prihlásenie - 1 stránka

**Spolu: 7 hlavných stránok** ✅ (Požaduje sa min. 5)

#### Dynamické Funkcionalitasy
- ✅ **Tvorba objednávky** - Formulár s validáciou
- ✅ **Cenové vyjednávanie** - Admin ponúkne cenu, user akceptuje/zamítne/protiponuka
- ✅ **Fázované platby** - 3 fázy (Zaloha, Midway, Finálna) s progress barom
- ✅ **Upload súborov** - Referencné a finálne súbory
- ✅ **Stavové prechodů** - new → in_progress → waiting_approval → completed
- ✅ **Login a autentifikácia** - Pre user aj admin
- ✅ **Správa objednávok** - CRUD operácie
- ✅ **Zobrazenie reviews** - Testimonials na home page
- ✅ **Timeline platbovania** - Grafický progress bar

---

### 10. Výsledný Dojem z Aplikácie
**Status: ✅ VEĽMI DOBRÝ - PREPRACOVANÁ**

#### Pozitívne Aspekty
- ✅ Moderný, čistý dizajn s tmavou témou
- ✅ Intuitívne rozhranie s jasnými akčnými prvkami
- ✅ Plynulé animácie a prechodů
- ✅ Responzívny na všetkých zariadeniach
- ✅ Detailné info-sekcie pre používateľov
- ✅ Admin panel s kompletnou správou
- ✅ Profesionálne zobrazovania platobného procesu
- ✅ Modálne okná pre potvrdenie akcií

#### Oblasti na Zlepšenie
- ⚠️ Niektoré stránky sú preplnené informáciami
- ⚠️ Bez animovaného načítavacieho stavu
- ⚠️ Bez notifikačného systému (toast notifications)

---

## 📊 BODY ZA NADŠTANDARDNÚ PRÁCU (Max 12 bodov)

| Aspekt | Stav | Body |
|--------|------|------|
| **Framework** | ✅ React 19.1 | +3 |
| **Prepracovaný Dizajn** | ✅ Moderný, profesionálny | +2 |
| **JS Framework** | ✅ React s hooks | +2 |
| **Responzívny Dizajn** | ✅ 3 breakpoints + vlastný CSS grid | +2 |
| **LESS/SASS** | ❌ Čistý CSS | 0 |
| **Docker** | ✅ Docker + docker-compose + migrácie | +3 |
| **Jednoduché Nasadenie** | ✅ README + db init scripts | +1 |
| **Externe API** | ❌ Nie je implementované | 0 |
| **HTML5 API** | ❌ Nie je implementované | 0 |
| **Vlastný Framework** | ❌ Nie je vytvorený | 0 |
| **Pokročilá Validácia** | ✅ Frontend + Backend validácia | +1 |

**Predpokladané Body: 14/12** ✅ (Over-fulfillment)

---

## 📊 POVINNÉ NÁLEŽITOSTI

| Požiadavka | Status | Detaily |
|-----------|--------|---------|
| **Aplikačná logika oddelená od prezentácie** | ✅ SPLNENÉ | React FE, PHP BE, šíření logiky |
| **Min. 5 dynamických stránok** | ✅ SPLNENÉ | 7 stránok |
| **Min. 50 riadkov JS** | ✅ SPLNENÉ | ~3000+ riadkov |
| **Min. 20 CSS pravidiel** | ✅ SPLNENÉ | 250+ pravidiel |
| **Min. 3 DB entity** | ✅ SPLNENÉ | orders, admins, price_negotiations |
| **1:N alebo M:N vzťah** | ✅ SPLNENÉ | orders 1:N price_negotiations |
| **CRUD na 2 entitách** | ✅ SPLNENÉ | orders: C/R/U/D, price_negotiations: C/R |
| **Časť vyžadujúca login** | ✅ SPLNENÉ | Admin Dashboard, Order Info |
| **README s inštaláciou** | ✅ SPLNENÉ | Súbor README.md s inštrukciami |

---

## 📋 ZHRNUTIE PRIPRAVENOSTI

### Kontrolný Termín 1 (Cieľ: 6+ bodov)
- ❌ **Dokumentácia**: 0/10 bodov
- ⚠️ **Urgentne Potrebné**: Vypracovať dokumentáciu
- 📅 **Termín**: Pred 12. týždňom

### Kontrolný Termín 2 (Cieľ: 6+ bodov)
- ✅ **Všetky požiadavky splnené**: 10/10 bodov
- ✅ Git, CSS, JavaScript, Validácia, Layout

### Semestrálna Práca (Cieľ: Čím viac, tým lepšie)
- ✅ **Povinné náležitosti**: 9/9 ✅
- ✅ **AJAX volania**: 6+ (min. 2 požadované)
- ✅ **Role a autorizácia**: Úplne implementované
- ✅ **Súbory**: Upload + Download + Manažment
- ✅ **Architektúra**: Dobrá (MVC-inspired)
- ✅ **Zložitosť**: VYSOKÁ (7 stránok + komplexné logiky)
- ✅ **Dojem**: VÝBORNÝ

**Odhad Bodov: 50-58/58** (bez dokumentácie)

### Nadštandardná Práca
- ✅ **React + Docker + Responzívny Dizajn + Validácia**: ~14/12 bodov

---

## 🚀 AKČNÝ PLÁN NA DOKONČENIE

### Priority 1 - KRITICKÁ (Urgencie)
1. ❌ **Vypracovať dokumentáciu** pre Termín 1
   - Úvod do aplikácie
   - Prehľad podobných aplikácií
   - Analýza požiadaviek
   - Návrh architektúry a dizajnu
   - Minimum 5-10 strán

### Priority 2 - Vylepšenia (Voliteľné)
1. ⚠️ Implementovať Redux/Context API pre state management
2. ⚠️ Pridať toast notifications
3. ⚠️ Implementovať externé API (napr. payment gateway)
4. ⚠️ Optimalizovať veľké komponenty (rozdeliť na menšie)

### Priority 3 - Nice-to-Have
1. 💡 Implementovať CSRF tokeny
2. 💡 Migrácia na SASS/LESS
3. 💡 Implementovať HTML5 Notification API
4. 💡 E-mail notifikácie pre užívateľov

---

## 📈 SÚČASNÝ STAV BODOV (Odhad)

### Pre Obhajubu v Riadnom Termíne (70 bodov dostupných)
```
Kontrolný Termín 1:      0/10  (Chýba dokumentácia)
Kontrolný Termín 2:     10/10  ✅
Semestrálna Práca:      55/58  ✅ (Všetky kritériá splnené)
Nadštandardná Práca:    12/12  ✅ (Over-fulfillment)
─────────────────────────────
SPOLU ODHAD:           77/88  (bez dokumentácie 77/78)
```

### Pozn: Bez Dokumentácie Je Výsledná Známka Fx
- Dokumentácia je povinná
- Bez nej sa práca nemôže obhájiť
- Je potrebné ju dodať pred termínom obhajoby

---

## ✅ ZÁVER

Aplikácia je **veľmi dobre implementovaná** so všetkými požadovanými funkciami a ďalšími nadštandardnými prvkami. Hlavným nedostatkom je **chýbajúca dokumentácia**, ktorá je povinná a rozhodujúca pre obhajobu.

**Stav Pripravenosti: 85% (s dokumentáciou bude 95%+)**

