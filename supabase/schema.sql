-- ============================================================
-- LAUNDRY MANAGEMENT SYSTEM — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor to bootstrap the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'received',
  'in_progress',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM ('cash', 'mpesa');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE staff_role AS ENUM ('admin', 'manager', 'attendant', 'driver');
CREATE TYPE shift_status AS ENUM ('scheduled', 'active', 'completed', 'absent');
CREATE TYPE inventory_category AS ENUM (
  'detergent',
  'softener',
  'bleach',
  'packaging',
  'equipment',
  'other'
);
CREATE TYPE inventory_unit AS ENUM ('kg', 'litres', 'pieces', 'rolls', 'boxes');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role staff_role NOT NULL DEFAULT 'attendant',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  loyalty_points INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- ============================================================
-- SERVICE TYPES (pricing catalogue)
-- ============================================================

CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,              -- e.g. "Normal Wash", "Dry Clean", "Express"
  description TEXT,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  turnaround_hours INT NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default services
INSERT INTO service_types (name, description, price_per_kg, turnaround_hours) VALUES
  ('Normal Wash', 'Standard wash and fold', 150, 24),
  ('Express Wash', 'Same-day service (if dropped before 10am)', 250, 6),
  ('Dry Clean', 'Dry cleaning for delicates and suits', 500, 48),
  ('Wash & Iron', 'Wash, dry and iron', 220, 36),
  ('Duvet/Blanket', 'Heavy items — duvet, blanket, curtain', 300, 48);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,   -- e.g. "ORD-2024-0001"
  customer_id UUID NOT NULL REFERENCES customers(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  status order_status NOT NULL DEFAULT 'received',
  weight_kg NUMERIC(8, 2) NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  special_instructions TEXT,
  received_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  pickup_date DATE,
  pickup_time_slot TEXT,             -- e.g. "09:00-12:00"
  delivery_address TEXT,
  is_delivery BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount NUMERIC(12, 2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  -- M-Pesa specific fields
  mpesa_transaction_id TEXT,
  mpesa_phone TEXT,
  mpesa_receipt_number TEXT,
  mpesa_checkout_request_id TEXT,
  -- Cash specific
  received_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- ============================================================
-- STAFF SHIFTS
-- ============================================================

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status shift_status NOT NULL DEFAULT 'scheduled',
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_staff ON shifts(staff_id);
CREATE INDEX idx_shifts_date ON shifts(shift_date);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category inventory_category NOT NULL,
  unit inventory_unit NOT NULL,
  current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- reorder alert threshold
  unit_cost NUMERIC(10, 2),
  supplier TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  type TEXT NOT NULL CHECK (type IN ('restock', 'usage', 'adjustment', 'waste')),
  quantity NUMERIC(12, 2) NOT NULL,   -- positive = in, negative = out
  balance_after NUMERIC(12, 2) NOT NULL,
  unit_cost NUMERIC(10, 2),
  total_cost NUMERIC(12, 2),
  reference TEXT,    -- PO number, order ID, etc.
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);

-- ============================================================
-- SEQUENCE FOR ORDER NUMBERS
-- ============================================================

CREATE SEQUENCE order_number_seq START 1;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log status history when order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, NEW.received_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Update customer stats after order changes
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers SET
    total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status != 'cancelled'),
    total_spent = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE customer_id = NEW.customer_id AND status = 'paid')
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Update inventory balance after transaction
CREATE OR REPLACE FUNCTION update_inventory_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory_items SET
    current_stock = current_stock + NEW.quantity
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_balance
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION update_inventory_balance();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated read all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read order_history" ON order_status_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read shifts" ON shifts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read inventory" ON inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read inventory_txn" ON inventory_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read service_types" ON service_types FOR ALL TO authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================================
-- SEED INVENTORY ITEMS
-- ============================================================

INSERT INTO inventory_items (name, category, unit, current_stock, minimum_stock, unit_cost) VALUES
  ('Ariel Detergent', 'detergent', 'kg', 50, 10, 350),
  ('Comfort Softener', 'softener', 'litres', 20, 5, 280),
  ('Jik Bleach', 'bleach', 'litres', 15, 3, 180),
  ('Laundry Bags (Small)', 'packaging', 'pieces', 200, 50, 15),
  ('Laundry Bags (Large)', 'packaging', 'pieces', 150, 30, 25),
  ('Hangers (Plastic)', 'packaging', 'pieces', 500, 100, 8),
  ('Shrink Wrap Roll', 'packaging', 'rolls', 10, 2, 450),
  ('Stain Remover Spray', 'detergent', 'pieces', 12, 3, 320);

-- ============================================================
-- ANALYTICS VIEW
-- ============================================================

CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(created_at) AS day,
  SUM(amount) AS total_revenue,
  COUNT(*) AS payment_count,
  method
FROM payments
WHERE status = 'paid'
GROUP BY DATE(created_at), method
ORDER BY day DESC;

CREATE OR REPLACE VIEW order_summary AS
SELECT
  status,
  COUNT(*) AS count,
  SUM(total) AS total_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
