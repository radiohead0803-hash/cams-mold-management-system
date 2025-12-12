-- 사출기 톤수 기초정보 테이블 확장
-- 생성일: 2025-12-12
-- 금형제작시 필요한 사출기 사양 정보 추가

-- 1. 기존 tonnages 테이블에 컬럼 추가
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

-- 2. 50톤 ~ 3500톤 사출기 사양 데이터 삽입 (기존 데이터 유지, 새 데이터만 추가)
-- 소형 사출기 (50~150톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 50, 'LS엠트론', 'LGE50', 50, 280, 580, 460, 460, 280, 280, 150, 300, 2.5, 80, 28, 63, 57, 2100, 63, 25, 3.5, '3800x1200x1800', 3200, 11, 1, '소형 정밀 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 50 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 50, '우진플라임', 'TE50', 50, 280, 580, 460, 460, 280, 280, 150, 300, 2.5, 80, 28, 63, 57, 2100, 63, 25, 3.5, '3800x1200x1800', 3200, 11, 2, '소형 정밀 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 50 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 80, 'LS엠트론', 'LGE80', 80, 320, 650, 530, 530, 330, 330, 170, 350, 3.5, 100, 32, 103, 94, 2050, 95, 35, 4.5, '4200x1350x1900', 4500, 15, 3, '소형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 80 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 80, '우진플라임', 'TE80', 80, 320, 650, 530, 530, 330, 330, 170, 350, 3.5, 100, 32, 103, 94, 2050, 95, 35, 4.5, '4200x1350x1900', 4500, 15, 4, '소형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 80 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, 'LS엠트론', 'LGE100', 100, 360, 720, 580, 580, 360, 360, 180, 380, 4.5, 110, 36, 147, 134, 2000, 125, 45, 5.5, '4500x1450x2000', 5500, 18.5, 5, '소형~중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 100 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, '우진플라임', 'TE100', 100, 360, 720, 580, 580, 360, 360, 180, 380, 4.5, 110, 36, 147, 134, 2000, 125, 45, 5.5, '4500x1450x2000', 5500, 18.5, 6, '소형~중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 100 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 130, 'LS엠트론', 'LGE130', 130, 400, 780, 640, 640, 400, 400, 200, 420, 5.5, 120, 40, 201, 183, 1950, 160, 55, 6.5, '4900x1550x2100', 6800, 22, 7, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 130 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 130, '우진플라임', 'TE130', 130, 400, 780, 640, 640, 400, 400, 200, 420, 5.5, 120, 40, 201, 183, 1950, 160, 55, 6.5, '4900x1550x2100', 6800, 22, 8, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 130 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 150, 'LS엠트론', 'LGE150', 150, 430, 830, 690, 690, 430, 430, 210, 450, 6.5, 130, 45, 254, 232, 1900, 195, 65, 7.5, '5200x1650x2200', 8000, 26, 9, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 150 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 150, '우진플라임', 'TE150', 150, 430, 830, 690, 690, 430, 430, 210, 450, 6.5, 130, 45, 254, 232, 1900, 195, 65, 7.5, '5200x1650x2200', 8000, 26, 10, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 150 AND manufacturer = '우진플라임');

-- 중형 사출기 (180~350톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 180, 'LS엠트론', 'LGE180', 180, 470, 900, 750, 750, 470, 470, 230, 500, 8.0, 140, 50, 353, 322, 1850, 250, 80, 9.0, '5600x1750x2300', 10000, 30, 11, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 180 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 180, '우진플라임', 'TE180', 180, 470, 900, 750, 750, 470, 470, 230, 500, 8.0, 140, 50, 353, 322, 1850, 250, 80, 9.0, '5600x1750x2300', 10000, 30, 12, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 180 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 220, 'LS엠트론', 'LGE220', 220, 520, 980, 830, 830, 520, 520, 250, 550, 10.0, 150, 55, 475, 433, 1800, 310, 95, 11.0, '6100x1900x2450', 12500, 37, 13, '중형~대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 220 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 220, '우진플라임', 'TE220', 220, 520, 980, 830, 830, 520, 520, 250, 550, 10.0, 150, 55, 475, 433, 1800, 310, 95, 11.0, '6100x1900x2450', 12500, 37, 14, '중형~대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 220 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 280, 'LS엠트론', 'LGE280', 280, 580, 1080, 920, 920, 580, 580, 280, 620, 12.0, 170, 60, 565, 515, 1750, 380, 115, 13.0, '6700x2050x2600', 15500, 45, 15, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 280 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 280, '우진플라임', 'TE280', 280, 580, 1080, 920, 920, 580, 580, 280, 620, 12.0, 170, 60, 565, 515, 1750, 380, 115, 13.0, '6700x2050x2600', 15500, 45, 16, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 280 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, 'LS엠트론', 'LGE350', 350, 650, 1200, 1020, 1020, 650, 650, 300, 700, 15.0, 190, 70, 770, 702, 1700, 480, 140, 16.0, '7400x2200x2800', 19500, 55, 17, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 350 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, '우진플라임', 'TE350', 350, 650, 1200, 1020, 1020, 650, 650, 300, 700, 15.0, 190, 70, 770, 702, 1700, 480, 140, 16.0, '7400x2200x2800', 19500, 55, 18, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 350 AND manufacturer = '우진플라임');

-- 대형 사출기 (450~650톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 450, 'LS엠트론', 'LGE450', 450, 750, 1380, 1150, 1150, 750, 750, 350, 800, 20.0, 220, 80, 1005, 916, 1650, 600, 175, 20.0, '8200x2450x3050', 25000, 75, 19, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 450 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 450, '우진플라임', 'TE450', 450, 750, 1380, 1150, 1150, 750, 750, 350, 800, 20.0, 220, 80, 1005, 916, 1650, 600, 175, 20.0, '8200x2450x3050', 25000, 75, 20, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 450 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 550, 'LS엠트론', 'LGE550', 550, 850, 1530, 1280, 1280, 850, 850, 380, 900, 25.0, 250, 90, 1272, 1160, 1600, 750, 210, 25.0, '9100x2700x3300', 32000, 90, 21, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 550 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 550, '우진플라임', 'TE550', 550, 850, 1530, 1280, 1280, 850, 850, 380, 900, 25.0, 250, 90, 1272, 1160, 1600, 750, 210, 25.0, '9100x2700x3300', 32000, 90, 22, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 550 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 650, 'LS엠트론', 'LGE650', 650, 950, 1700, 1420, 1420, 950, 950, 420, 1000, 30.0, 280, 100, 1571, 1432, 1550, 900, 250, 30.0, '10000x2950x3550', 40000, 110, 23, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 650 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 650, '우진플라임', 'TE650', 650, 950, 1700, 1420, 1420, 950, 950, 420, 1000, 30.0, 280, 100, 1571, 1432, 1550, 900, 250, 30.0, '10000x2950x3550', 40000, 110, 24, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 650 AND manufacturer = '우진플라임');

-- 초대형 사출기 (850~1300톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 850, 'LS엠트론', 'LGE850', 850, 1100, 1950, 1620, 1620, 1100, 1100, 480, 1150, 40.0, 320, 110, 2124, 1937, 1500, 1100, 310, 38.0, '11200x3250x3900', 52000, 132, 25, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 850 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 850, '우진플라임', 'TE850', 850, 1100, 1950, 1620, 1620, 1100, 1100, 480, 1150, 40.0, 320, 110, 2124, 1937, 1500, 1100, 310, 38.0, '11200x3250x3900', 52000, 132, 26, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 850 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1000, 'LS엠트론', 'LGE1000', 1000, 1250, 2200, 1850, 1850, 1250, 1250, 550, 1300, 50.0, 360, 120, 2714, 2474, 1450, 1350, 380, 45.0, '12500x3600x4250', 68000, 160, 27, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1000 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1000, '우진플라임', 'TE1000', 1000, 1250, 2200, 1850, 1850, 1250, 1250, 550, 1300, 50.0, 360, 120, 2714, 2474, 1450, 1350, 380, 45.0, '12500x3600x4250', 68000, 160, 28, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1000 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1300, 'LS엠트론', 'LGE1300', 1300, 1450, 2500, 2100, 2100, 1450, 1450, 620, 1500, 65.0, 420, 140, 3848, 3508, 1400, 1700, 470, 55.0, '14000x4000x4650', 88000, 200, 29, '대형 범퍼, 도어 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1300 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1300, '우진플라임', 'TE1300', 1300, 1450, 2500, 2100, 2100, 1450, 1450, 620, 1500, 65.0, 420, 140, 3848, 3508, 1400, 1700, 470, 55.0, '14000x4000x4650', 88000, 200, 30, '대형 범퍼, 도어 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1300 AND manufacturer = '우진플라임');

-- 특대형 사출기 (1600~2500톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1600, 'LS엠트론', 'LGE1600', 1600, 1650, 2850, 2400, 2400, 1650, 1650, 700, 1750, 80.0, 480, 160, 5027, 4582, 1350, 2100, 580, 68.0, '15800x4500x5100', 115000, 250, 31, '대형 범퍼, 인스트루먼트 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1600 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1600, '우진플라임', 'TE1600', 1600, 1650, 2850, 2400, 2400, 1650, 1650, 700, 1750, 80.0, 480, 160, 5027, 4582, 1350, 2100, 580, 68.0, '15800x4500x5100', 115000, 250, 32, '대형 범퍼, 인스트루먼트 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 1600 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2000, 'LS엠트론', 'LGE2000', 2000, 1900, 3250, 2750, 2750, 1900, 1900, 800, 2000, 100.0, 550, 180, 6362, 5800, 1300, 2600, 720, 85.0, '17500x5000x5600', 150000, 315, 33, '인스트루먼트 패널, 대형 내장재용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 2000 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2000, '우진플라임', 'TE2000', 2000, 1900, 3250, 2750, 2750, 1900, 1900, 800, 2000, 100.0, 550, 180, 6362, 5800, 1300, 2600, 720, 85.0, '17500x5000x5600', 150000, 315, 34, '인스트루먼트 패널, 대형 내장재용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 2000 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2500, 'LS엠트론', 'LGE2500', 2500, 2150, 3700, 3150, 3150, 2150, 2150, 900, 2300, 125.0, 630, 200, 7854, 7160, 1250, 3200, 900, 105.0, '19500x5600x6200', 195000, 400, 35, '초대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 2500 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2500, '우진플라임', 'TE2500', 2500, 2150, 3700, 3150, 3150, 2150, 2150, 900, 2300, 125.0, 630, 200, 7854, 7160, 1250, 3200, 900, 105.0, '19500x5600x6200', 195000, 400, 36, '초대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 2500 AND manufacturer = '우진플라임');

-- 초특대형 사출기 (3000~3500톤)
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3000, 'LS엠트론', 'LGE3000', 3000, 2400, 4200, 3600, 3600, 2400, 2400, 1000, 2600, 150.0, 720, 220, 9503, 8665, 1200, 3900, 1100, 130.0, '21500x6200x6900', 250000, 500, 37, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3000 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3000, '우진플라임', 'TE3000', 3000, 2400, 4200, 3600, 3600, 2400, 2400, 1000, 2600, 150.0, 720, 220, 9503, 8665, 1200, 3900, 1100, 130.0, '21500x6200x6900', 250000, 500, 38, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3000 AND manufacturer = '우진플라임');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3500, 'LS엠트론', 'LGE3500', 3500, 2700, 4700, 4000, 4000, 2700, 2700, 1100, 2900, 180.0, 820, 250, 12272, 11188, 1150, 4700, 1350, 160.0, '24000x6900x7600', 320000, 630, 39, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3500 AND manufacturer = 'LS엠트론');

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 3500, '우진플라임', 'TE3500', 3500, 2700, 4700, 4000, 4000, 2700, 2700, 1100, 2900, 180.0, 820, 250, 12272, 11188, 1150, 4700, 1350, 160.0, '24000x6900x7600', 320000, 630, 40, '초대형 자동차 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE tonnage_value = 3500 AND manufacturer = '우진플라임');

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tonnages_manufacturer ON tonnages(manufacturer);
CREATE INDEX IF NOT EXISTS idx_tonnages_clamping_force ON tonnages(clamping_force);

COMMENT ON TABLE tonnages IS '사출기 톤수 기초정보 - 금형제작시 필요한 사출기 사양 정보';
