-- 사출기 톤수 기초정보 테이블 확장
-- 생성일: 2025-12-12
-- 금형제작시 필요한 사출기 사양 정보 추가

-- 1. unique 제약조건 제거 (제조사별 여러 레코드 허용)
ALTER TABLE tonnages DROP CONSTRAINT IF EXISTS tonnages_tonnage_value_key;

-- 2. 기존 tonnages 테이블에 컬럼 추가
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS clamping_force INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS clamping_stroke INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS daylight_opening INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS platen_size_h INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS platen_size_v INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS tiebar_spacing_h INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS tiebar_spacing_v INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS min_mold_thickness INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS max_mold_thickness INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS ejector_force DECIMAL(10,2);
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS ejector_stroke INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS screw_diameter INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS shot_volume INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS shot_weight INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS injection_pressure INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS injection_rate INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS plasticizing_capacity INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS nozzle_contact_force DECIMAL(10,2);
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS machine_dimensions VARCHAR(100);
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS machine_weight INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS oil_tank_capacity INTEGER;
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS motor_power DECIMAL(10,2);

-- 3. 기존 데이터 업데이트 (LS엠트론 기준)
UPDATE tonnages SET manufacturer = 'LS엠트론', model_name = 'LGE' || tonnage_value WHERE manufacturer IS NULL;

-- 50톤
UPDATE tonnages SET clamping_stroke = 280, daylight_opening = 580, platen_size_h = 460, platen_size_v = 460, tiebar_spacing_h = 280, tiebar_spacing_v = 280, min_mold_thickness = 150, max_mold_thickness = 300, ejector_force = 2.5, ejector_stroke = 80, screw_diameter = 28, shot_volume = 63, shot_weight = 57, injection_pressure = 2100, injection_rate = 63, plasticizing_capacity = 25, nozzle_contact_force = 3.5, machine_dimensions = '3800x1200x1800', machine_weight = 3200, motor_power = 11, description = '소형 정밀 부품용' WHERE tonnage_value = 50;

-- 100톤
UPDATE tonnages SET clamping_stroke = 360, daylight_opening = 720, platen_size_h = 580, platen_size_v = 580, tiebar_spacing_h = 360, tiebar_spacing_v = 360, min_mold_thickness = 180, max_mold_thickness = 380, ejector_force = 4.5, ejector_stroke = 110, screw_diameter = 36, shot_volume = 147, shot_weight = 134, injection_pressure = 2000, injection_rate = 125, plasticizing_capacity = 45, nozzle_contact_force = 5.5, machine_dimensions = '4500x1450x2000', machine_weight = 5500, motor_power = 18.5, description = '소형~중형 부품용' WHERE tonnage_value = 100;

-- 150톤
UPDATE tonnages SET clamping_stroke = 430, daylight_opening = 830, platen_size_h = 690, platen_size_v = 690, tiebar_spacing_h = 430, tiebar_spacing_v = 430, min_mold_thickness = 210, max_mold_thickness = 450, ejector_force = 6.5, ejector_stroke = 130, screw_diameter = 45, shot_volume = 254, shot_weight = 232, injection_pressure = 1900, injection_rate = 195, plasticizing_capacity = 65, nozzle_contact_force = 7.5, machine_dimensions = '5200x1650x2200', machine_weight = 8000, motor_power = 26, description = '중형 부품용' WHERE tonnage_value = 150;

-- 180톤
UPDATE tonnages SET clamping_stroke = 470, daylight_opening = 900, platen_size_h = 750, platen_size_v = 750, tiebar_spacing_h = 470, tiebar_spacing_v = 470, min_mold_thickness = 230, max_mold_thickness = 500, ejector_force = 8.0, ejector_stroke = 140, screw_diameter = 50, shot_volume = 353, shot_weight = 322, injection_pressure = 1850, injection_rate = 250, plasticizing_capacity = 80, nozzle_contact_force = 9.0, machine_dimensions = '5600x1750x2300', machine_weight = 10000, motor_power = 30, description = '중형 부품용' WHERE tonnage_value = 180;

-- 200톤
UPDATE tonnages SET clamping_stroke = 500, daylight_opening = 950, platen_size_h = 800, platen_size_v = 800, tiebar_spacing_h = 500, tiebar_spacing_v = 500, min_mold_thickness = 240, max_mold_thickness = 530, ejector_force = 9.0, ejector_stroke = 145, screw_diameter = 52, shot_volume = 400, shot_weight = 365, injection_pressure = 1820, injection_rate = 280, plasticizing_capacity = 88, nozzle_contact_force = 10.0, machine_dimensions = '5900x1850x2400', machine_weight = 11500, motor_power = 34, description = '중형 부품용' WHERE tonnage_value = 200;

-- 250톤
UPDATE tonnages SET clamping_stroke = 550, daylight_opening = 1030, platen_size_h = 870, platen_size_v = 870, tiebar_spacing_h = 550, tiebar_spacing_v = 550, min_mold_thickness = 260, max_mold_thickness = 580, ejector_force = 11.0, ejector_stroke = 160, screw_diameter = 58, shot_volume = 520, shot_weight = 474, injection_pressure = 1780, injection_rate = 350, plasticizing_capacity = 105, nozzle_contact_force = 12.0, machine_dimensions = '6400x2000x2550', machine_weight = 14000, motor_power = 41, description = '중형~대형 부품용' WHERE tonnage_value = 250;

-- 280톤
UPDATE tonnages SET clamping_stroke = 580, daylight_opening = 1080, platen_size_h = 920, platen_size_v = 920, tiebar_spacing_h = 580, tiebar_spacing_v = 580, min_mold_thickness = 280, max_mold_thickness = 620, ejector_force = 12.0, ejector_stroke = 170, screw_diameter = 60, shot_volume = 565, shot_weight = 515, injection_pressure = 1750, injection_rate = 380, plasticizing_capacity = 115, nozzle_contact_force = 13.0, machine_dimensions = '6700x2050x2600', machine_weight = 15500, motor_power = 45, description = '대형 부품용' WHERE tonnage_value = 280;

-- 300톤
UPDATE tonnages SET clamping_stroke = 620, daylight_opening = 1140, platen_size_h = 970, platen_size_v = 970, tiebar_spacing_h = 620, tiebar_spacing_v = 620, min_mold_thickness = 290, max_mold_thickness = 660, ejector_force = 13.5, ejector_stroke = 180, screw_diameter = 65, shot_volume = 663, shot_weight = 604, injection_pressure = 1720, injection_rate = 430, plasticizing_capacity = 128, nozzle_contact_force = 14.5, machine_dimensions = '7100x2150x2700', machine_weight = 17500, motor_power = 50, description = '대형 부품용' WHERE tonnage_value = 300;

-- 350톤
UPDATE tonnages SET clamping_stroke = 650, daylight_opening = 1200, platen_size_h = 1020, platen_size_v = 1020, tiebar_spacing_h = 650, tiebar_spacing_v = 650, min_mold_thickness = 300, max_mold_thickness = 700, ejector_force = 15.0, ejector_stroke = 190, screw_diameter = 70, shot_volume = 770, shot_weight = 702, injection_pressure = 1700, injection_rate = 480, plasticizing_capacity = 140, nozzle_contact_force = 16.0, machine_dimensions = '7400x2200x2800', machine_weight = 19500, motor_power = 55, description = '대형 부품용' WHERE tonnage_value = 350;

-- 400톤
UPDATE tonnages SET clamping_stroke = 700, daylight_opening = 1290, platen_size_h = 1090, platen_size_v = 1090, tiebar_spacing_h = 700, tiebar_spacing_v = 700, min_mold_thickness = 330, max_mold_thickness = 760, ejector_force = 18.0, ejector_stroke = 210, screw_diameter = 75, shot_volume = 884, shot_weight = 806, injection_pressure = 1680, injection_rate = 540, plasticizing_capacity = 158, nozzle_contact_force = 18.0, machine_dimensions = '7800x2350x2950', machine_weight = 22500, motor_power = 65, description = '대형 외장 부품용' WHERE tonnage_value = 400;

-- 420톤
UPDATE tonnages SET clamping_stroke = 720, daylight_opening = 1330, platen_size_h = 1120, platen_size_v = 1120, tiebar_spacing_h = 720, tiebar_spacing_v = 720, min_mold_thickness = 340, max_mold_thickness = 780, ejector_force = 19.0, ejector_stroke = 215, screw_diameter = 78, shot_volume = 943, shot_weight = 860, injection_pressure = 1660, injection_rate = 570, plasticizing_capacity = 168, nozzle_contact_force = 19.0, machine_dimensions = '8000x2400x3000', machine_weight = 23500, motor_power = 70, description = '대형 외장 부품용' WHERE tonnage_value = 420;

-- 450톤
UPDATE tonnages SET clamping_stroke = 750, daylight_opening = 1380, platen_size_h = 1150, platen_size_v = 1150, tiebar_spacing_h = 750, tiebar_spacing_v = 750, min_mold_thickness = 350, max_mold_thickness = 800, ejector_force = 20.0, ejector_stroke = 220, screw_diameter = 80, shot_volume = 1005, shot_weight = 916, injection_pressure = 1650, injection_rate = 600, plasticizing_capacity = 175, nozzle_contact_force = 20.0, machine_dimensions = '8200x2450x3050', machine_weight = 25000, motor_power = 75, description = '대형 외장 부품용' WHERE tonnage_value = 450;

-- 500톤
UPDATE tonnages SET clamping_stroke = 800, daylight_opening = 1460, platen_size_h = 1220, platen_size_v = 1220, tiebar_spacing_h = 800, tiebar_spacing_v = 800, min_mold_thickness = 365, max_mold_thickness = 850, ejector_force = 22.5, ejector_stroke = 235, screw_diameter = 85, shot_volume = 1134, shot_weight = 1034, injection_pressure = 1620, injection_rate = 680, plasticizing_capacity = 195, nozzle_contact_force = 22.5, machine_dimensions = '8650x2580x3180', machine_weight = 28500, motor_power = 82, description = '대형 외장 부품용' WHERE tonnage_value = 500;

-- 650톤
UPDATE tonnages SET clamping_stroke = 950, daylight_opening = 1700, platen_size_h = 1420, platen_size_v = 1420, tiebar_spacing_h = 950, tiebar_spacing_v = 950, min_mold_thickness = 420, max_mold_thickness = 1000, ejector_force = 30.0, ejector_stroke = 280, screw_diameter = 100, shot_volume = 1571, shot_weight = 1432, injection_pressure = 1550, injection_rate = 900, plasticizing_capacity = 250, nozzle_contact_force = 30.0, machine_dimensions = '10000x2950x3550', machine_weight = 40000, motor_power = 110, description = '대형 외장 부품용' WHERE tonnage_value = 650;

-- 800톤
UPDATE tonnages SET clamping_stroke = 1050, daylight_opening = 1880, platen_size_h = 1560, platen_size_v = 1560, tiebar_spacing_h = 1050, tiebar_spacing_v = 1050, min_mold_thickness = 460, max_mold_thickness = 1100, ejector_force = 36.0, ejector_stroke = 300, screw_diameter = 105, shot_volume = 1924, shot_weight = 1754, injection_pressure = 1520, injection_rate = 1000, plasticizing_capacity = 290, nozzle_contact_force = 35.0, machine_dimensions = '10800x3150x3750', machine_weight = 48000, motor_power = 125, description = '범퍼, 대형 패널용' WHERE tonnage_value = 800;

-- 850톤
UPDATE tonnages SET clamping_stroke = 1100, daylight_opening = 1950, platen_size_h = 1620, platen_size_v = 1620, tiebar_spacing_h = 1100, tiebar_spacing_v = 1100, min_mold_thickness = 480, max_mold_thickness = 1150, ejector_force = 40.0, ejector_stroke = 320, screw_diameter = 110, shot_volume = 2124, shot_weight = 1937, injection_pressure = 1500, injection_rate = 1100, plasticizing_capacity = 310, nozzle_contact_force = 38.0, machine_dimensions = '11200x3250x3900', machine_weight = 52000, motor_power = 132, description = '범퍼, 대형 패널용' WHERE tonnage_value = 850;

-- 1000톤
UPDATE tonnages SET clamping_stroke = 1250, daylight_opening = 2200, platen_size_h = 1850, platen_size_v = 1850, tiebar_spacing_h = 1250, tiebar_spacing_v = 1250, min_mold_thickness = 550, max_mold_thickness = 1300, ejector_force = 50.0, ejector_stroke = 360, screw_diameter = 120, shot_volume = 2714, shot_weight = 2474, injection_pressure = 1450, injection_rate = 1350, plasticizing_capacity = 380, nozzle_contact_force = 45.0, machine_dimensions = '12500x3600x4250', machine_weight = 68000, motor_power = 160, description = '범퍼, 대형 패널용' WHERE tonnage_value = 1000;

-- 1300톤
UPDATE tonnages SET clamping_stroke = 1450, daylight_opening = 2500, platen_size_h = 2100, platen_size_v = 2100, tiebar_spacing_h = 1450, tiebar_spacing_v = 1450, min_mold_thickness = 620, max_mold_thickness = 1500, ejector_force = 65.0, ejector_stroke = 420, screw_diameter = 140, shot_volume = 3848, shot_weight = 3508, injection_pressure = 1400, injection_rate = 1700, plasticizing_capacity = 470, nozzle_contact_force = 55.0, machine_dimensions = '14000x4000x4650', machine_weight = 88000, motor_power = 200, description = '대형 범퍼, 도어 패널용' WHERE tonnage_value = 1300;

-- 1600톤
UPDATE tonnages SET clamping_stroke = 1650, daylight_opening = 2850, platen_size_h = 2400, platen_size_v = 2400, tiebar_spacing_h = 1650, tiebar_spacing_v = 1650, min_mold_thickness = 700, max_mold_thickness = 1750, ejector_force = 80.0, ejector_stroke = 480, screw_diameter = 160, shot_volume = 5027, shot_weight = 4582, injection_pressure = 1350, injection_rate = 2100, plasticizing_capacity = 580, nozzle_contact_force = 68.0, machine_dimensions = '15800x4500x5100', machine_weight = 115000, motor_power = 250, description = '대형 범퍼, 인스트루먼트 패널용' WHERE tonnage_value = 1600;

-- 2000톤
UPDATE tonnages SET clamping_stroke = 1900, daylight_opening = 3250, platen_size_h = 2750, platen_size_v = 2750, tiebar_spacing_h = 1900, tiebar_spacing_v = 1900, min_mold_thickness = 800, max_mold_thickness = 2000, ejector_force = 100.0, ejector_stroke = 550, screw_diameter = 180, shot_volume = 6362, shot_weight = 5800, injection_pressure = 1300, injection_rate = 2600, plasticizing_capacity = 720, nozzle_contact_force = 85.0, machine_dimensions = '17500x5000x5600', machine_weight = 150000, motor_power = 315, description = '인스트루먼트 패널, 대형 내장재용' WHERE tonnage_value = 2000;

-- 4. 추가 톤수 데이터 삽입 (기존에 없는 톤수)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 80, 'LS엠트론', 'LGE80', 80, 320, 650, 530, 530, 330, 330, 170, 350, 3.5, 100, 32, 103, 94, 2050, 95, 35, 4.5, '4200x1350x1900', 4500, 15, 3, '소형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 80);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 130, 'LS엠트론', 'LGE130', 130, 400, 780, 640, 640, 400, 400, 200, 420, 5.5, 120, 40, 201, 183, 1950, 160, 55, 6.5, '4900x1550x2100', 6800, 22, 7, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 130);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 220, 'LS엠트론', 'LGE220', 220, 520, 980, 830, 830, 520, 520, 250, 550, 10.0, 150, 55, 475, 433, 1800, 310, 95, 11.0, '6100x1900x2450', 12500, 37, 13, '중형~대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 220);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 550, 'LS엠트론', 'LGE550', 550, 850, 1530, 1280, 1280, 850, 850, 380, 900, 25.0, 250, 90, 1272, 1160, 1600, 750, 210, 25.0, '9100x2700x3300', 32000, 90, 21, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 550);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2500, 'LS엠트론', 'LGE2500', 2500, 2150, 3700, 3150, 3150, 2150, 2150, 900, 2300, 125.0, 630, 200, 7854, 7160, 1250, 3200, 900, 105.0, '19500x5600x6200', 195000, 400, 35, '초대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 2500);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3000, 'LS엠트론', 'LGE3000', 3000, 2400, 4200, 3600, 3600, 2400, 2400, 1000, 2600, 150.0, 720, 220, 9503, 8665, 1200, 3900, 1100, 130.0, '21500x6200x6900', 250000, 500, 37, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3000);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3500, 'LS엠트론', 'LGE3500', 3500, 2700, 4700, 4000, 4000, 2700, 2700, 1100, 2900, 180.0, 820, 250, 12272, 11188, 1150, 4700, 1350, 160.0, '24000x6900x7600', 320000, 630, 39, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3500);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tonnages_manufacturer ON tonnages(manufacturer);
CREATE INDEX IF NOT EXISTS idx_tonnages_clamping_force ON tonnages(clamping_force);

COMMENT ON TABLE tonnages IS '사출기 톤수 기초정보 - 금형제작시 필요한 사출기 사양 정보';
