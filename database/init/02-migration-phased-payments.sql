-- Migration: Add phased payment columns to orders table
USE vaii_semestralka;

-- Add payment columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_required DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midway_required DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midway_paid_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_required DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS draft_ready TINYINT(1) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_ready TINYINT(1) DEFAULT 0;

-- Update test data: Add agreed_price and payment info to first order
UPDATE orders 
SET agreed_price = 1500.00,
    price_status = 'agreed',
    status = 'in_progress',
    deposit_required = 450.00,
    deposit_paid_at = NOW(),
    midway_required = 600.00,
    final_required = 450.00,
    draft_ready = 1
WHERE order_token = 'ORD-2025-ABC12345';

-- Update test data: Add agreed_price to second order (but not paid yet)
UPDATE orders 
SET agreed_price = 2500.00,
    price_status = 'agreed',
    status = 'in_progress',
    deposit_required = 750.00,
    midway_required = 1000.00,
    final_required = 750.00
WHERE order_token = 'ORD-2025-XYZ67890';

-- Create initial price_negotiations for first order (already paid)
INSERT IGNORE INTO price_negotiations (order_id, price, offered_by, note, status, created_at)
SELECT id, 1500.00, 'customer', NULL, 'accepted', NOW() FROM orders WHERE order_token = 'ORD-2025-ABC12345';

-- Create initial price_negotiations for second order
INSERT IGNORE INTO price_negotiations (order_id, price, offered_by, note, status, created_at)
SELECT id, 2500.00, 'customer', NULL, 'accepted', NOW() FROM orders WHERE order_token = 'ORD-2025-XYZ67890';
