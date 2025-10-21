-- Inicializácia databázy pre VAII semestralku
CREATE DATABASE IF NOT EXISTS vaii_semestralka;
USE vaii_semestralka;

-- Tabuľka pre objednávky
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_token VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_price DECIMAL(10,2),
    admin_price DECIMAL(10,2),
    agreed_price DECIMAL(10,2),
    price_status ENUM('pending', 'negotiating', 'agreed', 'rejected') DEFAULT 'pending',
    deadline DATE,
    referencne_subory TEXT,
    final_files TEXT,
    status ENUM('new', 'in_progress', 'waiting_approval', 'completed', 'cancelled') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabuľka pre adminov
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabuľka pre históriu cenových vyjednávaní
CREATE TABLE IF NOT EXISTS price_negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    offered_by ENUM('admin', 'customer') NOT NULL,
    note TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'counter_offered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Vloženie default admina (username: admin, password: admin123)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2y$10$XmpqGE/sdarjF4vCw3UN1uzkaBEg0Ud5meItBnb5pAFw0MIEc6oS6')
ON DUPLICATE KEY UPDATE password_hash = '$2y$10$XmpqGE/sdarjF4vCw3UN1uzkaBEg0Ud5meItBnb5pAFw0MIEc6oS6';

-- Príklad objednávky
INSERT IGNORE INTO orders (order_token, customer_name, customer_email, description, estimated_price, deadline, status)
VALUES 
('ORD-2025-ABC12345', 'Ján Novák', 'jan.novak@email.com', 'Vytvorenie webstránky pre firmu', 1500.00, '2025-12-31', 'new'),
('ORD-2025-XYZ67890', 'Anna Svobodová', 'anna.svoboda@email.com', 'E-shop s platobnou bránou', 2500.00, '2025-11-30', 'in_progress');