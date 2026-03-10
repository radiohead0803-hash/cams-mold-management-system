-- ============================================================
-- 장비 마스터 + 업체별 보유장비 테이블 마이그레이션
-- 2026-03-10
-- ============================================================

-- 1) equipment_master: 장비 기초정보 마스터
CREATE TABLE IF NOT EXISTS equipment_master (
  id SERIAL PRIMARY KEY,
  equipment_type VARCHAR(50) NOT NULL DEFAULT 'injection_machine',
    -- injection_machine: 사출기, press: 프레스, cnc: CNC, other: 기타
  manufacturer VARCHAR(100) NOT NULL,
  model_name VARCHAR(100),
  tonnage INTEGER,
  spec_info JSONB DEFAULT '{}',
    -- 추가 사양: { clamping_force, screw_diameter, shot_weight, platen_size ... }
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 중복 방지: 같은 타입+제조사+모델+톤수 조합
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_master_unique
  ON equipment_master (equipment_type, manufacturer, COALESCE(model_name, ''), COALESCE(tonnage, 0))
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_equipment_master_type ON equipment_master (equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_master_manufacturer ON equipment_master (manufacturer);

-- 2) company_equipment: 업체별 보유장비 (마스터 연동 또는 수동입력)
CREATE TABLE IF NOT EXISTS company_equipment (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  equipment_master_id INTEGER REFERENCES equipment_master(id),
    -- NULL이면 수동입력
  equipment_type VARCHAR(50) NOT NULL DEFAULT 'injection_machine',
  manufacturer VARCHAR(100) NOT NULL,
  model_name VARCHAR(100),
  tonnage INTEGER,
  serial_number VARCHAR(100),
  year_installed INTEGER,
  status VARCHAR(30) DEFAULT 'active',
    -- active, maintenance, retired, standby
  daily_capacity INTEGER,
    -- 해당 장비의 일일 생산능력 (개)
  monthly_capacity INTEGER,
  spec_info JSONB DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_equipment_company ON company_equipment (company_id);
CREATE INDEX IF NOT EXISTS idx_company_equipment_master ON company_equipment (equipment_master_id);
CREATE INDEX IF NOT EXISTS idx_company_equipment_type ON company_equipment (equipment_type);
CREATE INDEX IF NOT EXISTS idx_company_equipment_status ON company_equipment (status);

-- 3) 초기 마스터 데이터: 주요 사출기 제조사/모델
INSERT INTO equipment_master (equipment_type, manufacturer, model_name, tonnage, description)
VALUES
  ('injection_machine', 'LS엠트론', 'LGE-III', 130, 'LS엠트론 전동식 130톤'),
  ('injection_machine', 'LS엠트론', 'LGE-III', 180, 'LS엠트론 전동식 180톤'),
  ('injection_machine', 'LS엠트론', 'LGE-III', 220, 'LS엠트론 전동식 220톤'),
  ('injection_machine', 'LS엠트론', 'LGE-III', 350, 'LS엠트론 전동식 350톤'),
  ('injection_machine', 'LS엠트론', 'LGE-III', 450, 'LS엠트론 전동식 450톤'),
  ('injection_machine', 'LS엠트론', 'LGH-III', 650, 'LS엠트론 유압식 650톤'),
  ('injection_machine', 'LS엠트론', 'LGH-III', 850, 'LS엠트론 유압식 850톤'),
  ('injection_machine', 'LS엠트론', 'LGH-III', 1000, 'LS엠트론 유압식 1000톤'),
  ('injection_machine', '우진플라임', 'TE-III', 130, '우진플라임 전동식 130톤'),
  ('injection_machine', '우진플라임', 'TE-III', 180, '우진플라임 전동식 180톤'),
  ('injection_machine', '우진플라임', 'TE-III', 220, '우진플라임 전동식 220톤'),
  ('injection_machine', '우진플라임', 'TH-III', 450, '우진플라임 유압식 450톤'),
  ('injection_machine', '우진플라임', 'TH-III', 650, '우진플라임 유압식 650톤'),
  ('injection_machine', '동성화인', 'DSF', 100, '동성화인 100톤'),
  ('injection_machine', '동성화인', 'DSF', 150, '동성화인 150톤'),
  ('injection_machine', 'Engel', 'Victory', 500, 'Engel Victory 500톤'),
  ('injection_machine', 'Engel', 'Victory', 800, 'Engel Victory 800톤'),
  ('injection_machine', 'Engel', 'Victory', 1000, 'Engel Victory 1000톤'),
  ('injection_machine', 'Engel', 'Duo', 1500, 'Engel Duo 1500톤'),
  ('injection_machine', 'Engel', 'Duo', 2000, 'Engel Duo 2000톤'),
  ('injection_machine', 'Arburg', 'Allrounder', 500, 'Arburg Allrounder 500톤'),
  ('injection_machine', 'Arburg', 'Allrounder', 800, 'Arburg Allrounder 800톤'),
  ('injection_machine', 'Arburg', 'Allrounder', 1200, 'Arburg Allrounder 1200톤'),
  ('injection_machine', 'Arburg', 'Allrounder', 2000, 'Arburg Allrounder 2000톤'),
  ('injection_machine', 'KraussMaffei', 'GX', 450, 'KraussMaffei GX 450톤'),
  ('injection_machine', 'KraussMaffei', 'GX', 650, 'KraussMaffei GX 650톤'),
  ('injection_machine', 'KraussMaffei', 'MX', 1000, 'KraussMaffei MX 1000톤'),
  ('injection_machine', 'Sumitomo', 'SE-EV', 350, 'Sumitomo SE-EV 전동식 350톤'),
  ('injection_machine', 'Sumitomo', 'SE-EV', 500, 'Sumitomo SE-EV 전동식 500톤'),
  ('injection_machine', 'Sumitomo', 'SE-EV', 800, 'Sumitomo SE-EV 전동식 800톤'),
  ('injection_machine', 'Sumitomo', 'SE-HD', 1200, 'Sumitomo SE-HD 1200톤'),
  ('injection_machine', 'Haitian', 'Jupiter III', 500, 'Haitian Jupiter III 500톤'),
  ('injection_machine', 'Haitian', 'Jupiter III', 750, 'Haitian Jupiter III 750톤'),
  ('injection_machine', 'Haitian', 'Jupiter III', 1000, 'Haitian Jupiter III 1000톤'),
  ('injection_machine', 'Fanuc', 'Roboshot', 130, 'Fanuc Roboshot 전동식 130톤'),
  ('injection_machine', 'Fanuc', 'Roboshot', 220, 'Fanuc Roboshot 전동식 220톤'),
  ('injection_machine', 'Fanuc', 'Roboshot', 350, 'Fanuc Roboshot 전동식 350톤'),
  ('injection_machine', 'Nissei', 'NEX-III', 180, 'Nissei NEX-III 전동식 180톤'),
  ('injection_machine', 'Nissei', 'NEX-III', 350, 'Nissei NEX-III 전동식 350톤')
ON CONFLICT DO NOTHING;

-- 4) 기존 companies.injection_machines jsonb 데이터를 company_equipment로 마이그레이션
DO $$
DECLARE
  r RECORD;
  machine JSONB;
  master_id INTEGER;
BEGIN
  FOR r IN SELECT id, injection_machines FROM companies WHERE injection_machines IS NOT NULL AND jsonb_array_length(injection_machines) > 0
  LOOP
    FOR machine IN SELECT jsonb_array_elements(r.injection_machines)
    LOOP
      -- 마스터에서 매칭 검색
      SELECT em.id INTO master_id
      FROM equipment_master em
      WHERE em.manufacturer = machine->>'manufacturer'
        AND em.tonnage = (machine->>'tonnage')::INTEGER
        AND em.is_active = true
      LIMIT 1;

      INSERT INTO company_equipment (
        company_id, equipment_master_id, equipment_type,
        manufacturer, model_name, tonnage, year_installed,
        status, is_active
      ) VALUES (
        r.id, master_id, 'injection_machine',
        COALESCE(machine->>'manufacturer', ''),
        COALESCE(machine->>'model', machine->>'machine_name', ''),
        (machine->>'tonnage')::INTEGER,
        CASE WHEN machine->>'year' ~ '^\d+$' THEN (machine->>'year')::INTEGER ELSE NULL END,
        'active', true
      );
    END LOOP;
  END LOOP;
END $$;
