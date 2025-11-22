-- CAMS Mold Management System - Initial Database Schema
-- Railway PostgreSQL Database Setup

-- 1. Users and Authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('system_admin', 'mold_developer', 'maker', 'plant')),
  
  company_id INTEGER,
  company_name VARCHAR(100),
  company_type VARCHAR(20) CHECK (company_type IN ('hq', 'maker', 'plant')),
  
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_company_type ON users(company_type);

-- 2. Mold Specifications (HQ)
CREATE TABLE mold_specifications (
  id SERIAL PRIMARY KEY,
  
  part_number VARCHAR(50) NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  car_model VARCHAR(100),
  car_year VARCHAR(10),
  
  mold_type VARCHAR(50),
  cavity_count INTEGER,
  material VARCHAR(100),
  tonnage INTEGER,
  
  target_maker_id INTEGER REFERENCES users(id),
  development_stage VARCHAR(20),
  production_stage VARCHAR(20),
  
  order_date DATE,
  target_delivery_date DATE,
  estimated_cost DECIMAL(15,2),
  
  mold_code VARCHAR(50) UNIQUE,
  qr_token VARCHAR(100) UNIQUE,
  
  status VARCHAR(20) DEFAULT 'planning',
  notes TEXT,
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mold_specs_part_number ON mold_specifications(part_number);
CREATE INDEX idx_mold_specs_mold_code ON mold_specifications(mold_code);
CREATE INDEX idx_mold_specs_qr_token ON mold_specifications(qr_token);
CREATE INDEX idx_mold_specs_status ON mold_specifications(status);

-- 3. Maker Specifications
CREATE TABLE maker_specifications (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  
  design_start_date DATE,
  design_end_date DATE,
  manufacturing_start_date DATE,
  manufacturing_end_date DATE,
  
  production_progress INTEGER DEFAULT 0,
  current_stage VARCHAR(50),
  
  technical_notes TEXT,
  quality_check VARCHAR(50),
  maker_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maker_specs_mold_spec ON maker_specifications(mold_spec_id);

-- 4. Plant Molds
CREATE TABLE plant_molds (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  
  plant_id INTEGER REFERENCES users(id),
  installation_date DATE,
  
  total_shots INTEGER DEFAULT 0,
  target_shots INTEGER,
  
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  
  current_location VARCHAR(200),
  plant_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plant_molds_mold_spec ON plant_molds(mold_spec_id);
CREATE INDEX idx_plant_molds_plant ON plant_molds(plant_id);

-- 5. QR Sessions
CREATE TABLE qr_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qr_sessions_token ON qr_sessions(session_token);
CREATE INDEX idx_qr_sessions_user ON qr_sessions(user_id);

-- 6. Daily Checklists
CREATE TABLE daily_checklists (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  plant_id INTEGER REFERENCES users(id),
  
  check_date DATE NOT NULL,
  shift VARCHAR(20),
  
  inspector_id INTEGER REFERENCES users(id),
  inspector_name VARCHAR(100),
  
  total_items INTEGER DEFAULT 0,
  checked_items INTEGER DEFAULT 0,
  ng_items INTEGER DEFAULT 0,
  
  overall_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_checklists_mold ON daily_checklists(mold_spec_id);
CREATE INDEX idx_daily_checklists_date ON daily_checklists(check_date);

-- 7. Daily Checklist Items
CREATE TABLE daily_checklist_items (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES daily_checklists(id) ON DELETE CASCADE,
  
  category VARCHAR(50),
  item_name VARCHAR(200) NOT NULL,
  check_point TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',
  result VARCHAR(20),
  
  ng_reason TEXT,
  corrective_action TEXT,
  
  checked_at TIMESTAMP,
  checked_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_items_checklist ON daily_checklist_items(checklist_id);

-- 8. Periodic Inspections
CREATE TABLE periodic_inspections (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  
  inspection_type VARCHAR(50),
  inspection_date DATE NOT NULL,
  
  inspector_id INTEGER REFERENCES users(id),
  inspector_name VARCHAR(100),
  
  total_items INTEGER DEFAULT 0,
  checked_items INTEGER DEFAULT 0,
  ng_items INTEGER DEFAULT 0,
  
  overall_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_periodic_inspections_mold ON periodic_inspections(mold_spec_id);
CREATE INDEX idx_periodic_inspections_date ON periodic_inspections(inspection_date);

-- 9. Periodic Inspection Items
CREATE TABLE periodic_inspection_items (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES periodic_inspections(id) ON DELETE CASCADE,
  
  category VARCHAR(50),
  item_name VARCHAR(200) NOT NULL,
  check_point TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',
  result VARCHAR(20),
  
  measurement_value VARCHAR(100),
  standard_value VARCHAR(100),
  
  ng_reason TEXT,
  corrective_action TEXT,
  
  checked_at TIMESTAMP,
  checked_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_periodic_items_inspection ON periodic_inspection_items(inspection_id);

-- 10. Production Quantities
CREATE TABLE production_quantities (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  plant_id INTEGER REFERENCES users(id),
  
  production_date DATE NOT NULL,
  shift VARCHAR(20),
  
  quantity INTEGER NOT NULL,
  ok_quantity INTEGER DEFAULT 0,
  ng_quantity INTEGER DEFAULT 0,
  
  cumulative_shots INTEGER DEFAULT 0,
  
  operator_id INTEGER REFERENCES users(id),
  operator_name VARCHAR(100),
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_production_mold ON production_quantities(mold_spec_id);
CREATE INDEX idx_production_date ON production_quantities(production_date);

-- 11. NG Records
CREATE TABLE ng_records (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  production_id INTEGER REFERENCES production_quantities(id),
  
  ng_date DATE NOT NULL,
  ng_type VARCHAR(100),
  ng_quantity INTEGER NOT NULL,
  
  defect_location VARCHAR(200),
  defect_description TEXT,
  
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  
  status VARCHAR(20) DEFAULT 'open',
  
  reported_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ng_records_mold ON ng_records(mold_spec_id);
CREATE INDEX idx_ng_records_date ON ng_records(ng_date);

-- 12. Mold Repairs
CREATE TABLE mold_repairs (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL REFERENCES mold_specifications(id) ON DELETE CASCADE,
  
  repair_request_date DATE NOT NULL,
  repair_type VARCHAR(50),
  
  problem_description TEXT,
  repair_content TEXT,
  
  repair_start_date DATE,
  repair_end_date DATE,
  
  repair_cost DECIMAL(15,2),
  liability VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'requested',
  
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_repairs_mold ON mold_repairs(mold_spec_id);
CREATE INDEX idx_repairs_status ON mold_repairs(status);

-- Insert default admin user
INSERT INTO users (username, password_hash, name, email, user_type, company_type, is_active)
VALUES ('admin', '$2b$10$rKvVPZqGsYKHXq8xQx5nEeYGXZJYZ8K3vXxXxXxXxXxXxXxXxXxXx', 'System Admin', 'admin@cams.com', 'system_admin', 'hq', TRUE);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mold_specs_updated_at BEFORE UPDATE ON mold_specifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maker_specs_updated_at BEFORE UPDATE ON maker_specifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plant_molds_updated_at BEFORE UPDATE ON plant_molds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_checklists_updated_at BEFORE UPDATE ON daily_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periodic_inspections_updated_at BEFORE UPDATE ON periodic_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ng_records_updated_at BEFORE UPDATE ON ng_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON mold_repairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
