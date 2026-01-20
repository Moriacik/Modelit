# Modelit - Systém na správu objednávok 3D modelov

Aplikácia umožňuje zákazníkom zadávať objednávky, komunikovať s administrátorom o cene a sledovať stav vyhotovenia. Administrátor spravuje objednávky, cenové vyjednávania, platby a vyrobu/odovzdanie produktu.

---

## 🎯 Hlavné funkcie

✅ **Zákazníci:**
- Vytvorenie objednávky s opisom práce a referenčnými súbormi
- Prihlásenie a sledovanie objednávky
- Cenové vyjednávania
- Platby v 3 etapách (30% - 40% - 30%)
- Stiahnutie hotových súborov

✅ **Administrátori:**
- Správa všetkých objednávok
- Cenové vyjednávania s zákazníkmi
- Vedenie záznamov o platbách
- Upload finálnych súborov
- Oznamovanie stavu objednávky

✅ **Technológie:**
- Frontend: React + Vite
- Backend: PHP + MySQL
- Deployment: Docker

---

## 📋 Požiadavky

### Lokálne spustenie
- **Node.js** (v18 alebo novšie)
- **PHP** (v8.2 alebo novšie)
- **MySQL** (v8.0 alebo novšie)
- **Git**

### Docker
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
DB_NAME=modelit_db
DB_USER=modelit_user
DB_PASS=$(openssl rand -base64 16)
NODE_ENV=production
EOF

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
│   ├── pages/              # React stránky
│   │   ├── Home/           # Domovská stránka
│   │   ├── Login/          # Prihlasovacia stránka
│   │   ├── Orders/         # Formulár na vytvorenie objednávky
│   │   ├── OrderInfo/      # Detail objednávky (zákazník)
│   │   └── Admin/          # Admin panel
│   ├── components/         # Opakovane použiteľné komponenty
│   ├── php/                # Backend API endpoints
│   │   ├── config.php      # Databázová konfigurácia
│   │   ├── create-order.php
│   │   ├── get-orders.php
│   │   └── ...
│   └── styles/             # CSS štýly
├── database/
│   └── init/
│       └── init.sql        # SQL migrácia (tabuľky + dáta)
├── docker-compose.yml      # Docker konfigurácia
├── Dockerfile              # PHP + Apache kontajner
├── package.json            # Node.js závislosť
└── README.md              # Tento súbor
```

---

## 🛠️ Technologický stack

| Časť | Technológia | Verzia |
|------|------------|--------|
| Frontend | React | 19.x |
| Bundler | Vite | 7.x |
| Routing | React Router | 7.x |
| Backend | PHP | 8.2 |
| Databáza | MySQL | 8.0 |
| Server | Docker + Nginx | Latest |

---

## 🔑 Produkčné prihlasovanie

⚠️ **DÔLEŽITÉ**: V produkcii zmeňte admin heslo!

```bash
# Pristúpte do MySQL
docker-compose exec db mysql -u root -p modelit_db

# V MySQL shell - zmeňte heslo:
UPDATE users SET password = PASSWORD('NOVE_SILNE_HESLO') WHERE username = 'admin';
```

| Typ | Meno | Heslo | Úloha |
|-----|------|-------|-------|
| Admin | `admin` | **ZMEŇTE V PRODUKCII!** | Správa objednávok |
| Zákazník | Kód objednávky | Bez hesla | Sledovanie objednávky |

---

## 📝 Ako používať

### Zákazníci:
1. Prejdite na `/objednavka` a vytvorte objednávku
2. Dostanete **kód objednávky** (formát: `ORD-2026-XXXXXX`)
3. Na `/login` sa prihlaste s kódom a sledujte stav

### Administrátori:
1. Na `/login` sa prihlaste ako **admin** / **admin123** (zmeniť v produkcii!)
2. V admin paneli spravujte objednávky, ceny a platby
3. Uploadujte finálne súbory keď je všetko zaplatené