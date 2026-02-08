# Modelit - Systém na správu objednávok 3D modelov

Web aplikácia na správu objednávok 3D modelov. Zákazníci zadávajú objednávky, komunikujú s administrátorom o cene a sledujú stav vyhotovenia. Administrátor spravuje všetky objednávky, cenové vyjednávania a platby.

---

## 🎯 Hlavné funkcie

✅ **Zákazníci:**
- Vytvorenie objednávky s opisom práce
- Prihlásenie a sledovanie objednávky
- Schvalenie ceny objednávky
- Stiahnutie hotových súborov

✅ **Administrátori:**
- Správa všetkých objednávok
- Stanovenie ceny objednávky
- Upload finálnych súborov

✅ **Technológie:**
- Frontend: React + Vite
- Backend: PHP + MySQL
- Deployment: Docker

---

## 📋 Požiadavky
+)
- **PHP** (v8.2+)
- **MySQL** (v8.0+)
- **Docker + Docker Compose** (odporúčané
- **Docker**
- **Docker Compose** (zvyčajne súčasť Docker Desktop)

---

## 🌐 Produkčné nasadenie

### **Linux Server s Docker-om (AWS/Azure/DigitalOcean/Hetzner)**

#### 1. **Príprava servera**

```bash
# Prihláste sa na server
ssh root@vasa-ip-adresa

# Aktualizujte systém
apt update && apt upgrade -y

# Nainštalujte Docker a Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Pridajte oprávnenia
usermod -aG docker $USER
```

#### 2. **Nasadenie aplikácie**

```bash
# Klonujte projekt
cd /opt
git clone https://github.com/Moriacik/Modelit
cd Modelit

# Vytvorte produkčný .env súbor
cat > .env << EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
MYSQL_DATABASE=modelit_db
MYSQL_USER=modelit_user
MYSQL_PASSWORD=$(openssl rand -base64 16)
DB_HOST=db
DB_NAME=modelitvaii_semestralka
MYSQL_USER=vaii_user
MYSQL_PASSWORD=$(openssl rand -base64 16)
DB_HOST=db
DB_NAME=vaii_semestralka
DB_USER=vaii
# Spustite Docker v produkcii
docker-compose up -d

# Skontrolujte, či všetky kontajnery bežia
docker-compose ps
```

#### 3. **Nastavenie domény a SSL**

Nainštalujte Nginx ako reverse proxy:

```bash
apt install -y nginx certbot python3-certbot-nginx

# Vytvorte Nginx konfigu
cat > /etc/nginx/sites-available/modelit << 'EOF'
server {
    listen 80;
    server_name modelit.sk www.modelit.sk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name modelit.sk www.modelit.sk;

    ssl_certificate /etc/letsencrypt/live/modelit.sk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/modelit.sk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend - React (Vite build)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /app/src/php/ {
        proxy_pass http://localhost:8000/app/src/php/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optimalizácie
    client_max_body_size 100M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# Aktivujte konfiguráciu
ln -s /etc/nginx/sites-available/modelit /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Nastavte SSL certifikát
certbot certonly --nginx -d modelit.sk -d www.modelit.sk
```

#### 4. **Automatické obnovenie SSL certifikátu**

```bash
# Certbot automaticky obnovuje, skontrolujte:
certbot renew --dry-run
```

#### 5. **Bezpečnosť a backup**

```bash
# Nastavte firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Zálohovanie databázy
docker-compose exec db mysqldump -u modelit_user -p modelit_db > backup_$(date +%Y%m%d).sql
```

---

## 📁 Štruktúra projektu

```
Modelit/
├── src/
│   ├── pages/                    # React/CSS
│   │   ├── Home/                 # Domovská stránka + Reviews
│   │   ├── Login/                # Prihlasovacia stránka (Admin + User)
│   │   ├── Orders/               # OrderForm.jsx - vytvorenie objednávky
│   │   ├── OrderInfo/            # OrderInfoUser.jsx - detail zákazníka
│   │   ├── Admin/                # AdminDashboard.jsx + OrderInfoAdmin.jsx
│   │   │   └── components/       # OrdersTable.jsx - admin tabuľka objednávok
│   │   └── ...(ďalšie stránky)
│   ├── components/               # Header/Footer
│   │   ├── Header/
│   │   └── Footer/
│   ├── services/                 # Frontend API Services
│   │   └── api.js
│   ├── php/                      # PHP
│   │   ├── Controllers/
│   │   │   ├── AuthController.php       # Login/Logout
│   │   │   ├── OrderController.php      # Order CRUD
│   │   │   ├── AdminController.php      # Admin operations
│   │   │   └── ReviewController.php     # Reviews
│   │   ├── Models/
│   │   │   ├── User.php          # User authentication
│   │   │   ├── Order.php         # Order operations
│   │   │   ├── OrderFile.php     # File management
│   │   │   └── Review.php        # Reviews
│   │   ├── index.php             # API Router
│   │   └── config.php            # DB konfigurácia
│   ├── styles/                   # CSS Styles
│   │   ├── global.css
│   │   └── colors.css
│   ├── App.jsx                   # Frontend Router
│   └── main.jsx                  # React entry point
├── docker-compose.yml            # Docker + MySQL
├── Dockerfile                    # PHP 8.2 + Apache image
├── package.json                  # Node.js dependencies
├── vite.config.js               # Vite bundler config
└── README.md                    # Dokumentácia
```

---

## 🛠️ Technologický stack

| Časť | Technológia | Verzia |
|------|------------|--------|
| Frontend | React | 19.1.1 |
| Bundler | Vite | 7.1.7 |
| Routing | React Router | 7.9.3 |
| Backend | PHP | 8.2 |
| Databáza | MySQL | 8.0 |
| Štruktúra | MVC (4 Controllers, 4 Models) | Custom |

---

## 🔑 Produkčné prihlasovanie

⚠️ **DÔLEŽITÉ**: V produkcii zmeňte admin heslo!

```bash
# Pristúpte do MySQL
docker-compose exec db mysql -u root -p modelit_db

# V MySQL shell - zmeňte heslo:
UPDATE users SET password = PASSWORD('NOVE_SILNE_HESLO') WHERE username = 'admin';
```

---

## 📝 Ako používať

### Zákazníci:
1. Prejdite na `/objednavka` a vytvorte objednávku s popisom práce
2. Dostanete **kód objednávky** (formát: `MODELIT-XXXXXXXXXX`, napr. `MODELIT-ABC123XYZ`)
3. Na `/login` sa prihlaste s kódom a sledujte stav

### Administrátori:
1. Na `/login` sa prihlaste s admin účtom (username + password)
2. V admin paneli (`/admin`) spravujete:
   - Zoznam objednávok (filtrovanie podľa statusu)
   - Detaily každej objednávky (popis, deadline, súbory)
   - Upload finálnych súborov po zaplatení
3. Systém automaticky sleduje stav objednávky