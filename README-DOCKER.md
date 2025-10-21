# VAII Semestralka - Docker Setup

## Požiadavky
- Docker Desktop nainštalovaný
- Git (pre verzovanie)

## Inštalácia a spustenie

### 1. Stiahnutie projektu
```bash
git clone https://github.com/Moriacik/Vaii-semestralka.git
cd Vaii-semestralka
```

### 2. Spustenie Docker kontajnerov
```bash
# Spustenie v pozadí
docker-compose up -d

# Alebo spustenie s logmi
docker-compose up
```

## Prístup k aplikácii
- **React Frontend**: http://localhost:5173
- **PHP Backend**: http://localhost:8000
- **phpMyAdmin**: http://localhost:8080
- **Databáza**: localhost:3306

### 4. Zastavenie
```bash
docker-compose down
```

## Databázové prístupy

### phpMyAdmin
- **Server**: db
- **Username**: root
- **Password**: root

### Priama databáza
- **Host**: localhost:3306
- **Database**: vaii_semestralka
- **Username**: vaii_user
- **Password**: vaii_pass

## Vývoj

### Zmeny v kóde
Všetky zmeny v súboroch sa automaticky reflektujú v kontajneri vďaka volume mounting.

### Restart kontajnerov
```bash
docker-compose restart
```

### Rebuild po zmenách v Dockerfile
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Užitočné príkazy

```bash
# Zobrazenie bežiacich kontajnerov
docker ps

# Prístup do webového kontajnera
docker exec -it vaii_web bash

# Prístup do databázy
docker exec -it vaii_db mysql -u root -p

# Zobrazenie logov
docker-compose logs web
docker-compose logs db
```