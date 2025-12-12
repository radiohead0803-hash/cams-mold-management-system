-- 사출기 톤수 기초정보 - 다른 제조사 사양 추가
-- 생성일: 2025-12-12
-- 우진플라임, 엥겔(Engel), 크라우스마파이(KraussMaffei), 동성화인 등

-- 우진플라임 (Woojin Plaimm) - 국내 2위 사출기 제조사
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 50, '우진플라임', 'TE50', 50, 280, 580, 460, 460, 280, 280, 150, 300, 260, 260, 2.5, 80, 28, 63, 57, 2100, 63, 25, 3.5, '3850x1220x1820', 3300, 11, 101, '소형 정밀 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 50);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, '우진플라임', 'TE100', 100, 360, 720, 580, 580, 360, 360, 180, 380, 340, 340, 4.5, 110, 36, 147, 134, 2000, 125, 45, 5.5, '4550x1470x2020', 5600, 18.5, 102, '소형~중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 150, '우진플라임', 'TE150', 150, 430, 830, 690, 690, 430, 430, 210, 450, 410, 410, 6.5, 130, 45, 254, 232, 1900, 195, 65, 7.5, '5250x1670x2220', 8100, 26, 103, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 150);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 200, '우진플라임', 'TE200', 200, 500, 950, 800, 800, 500, 500, 240, 530, 480, 480, 9.0, 145, 52, 400, 365, 1820, 280, 88, 10.0, '5950x1870x2420', 11600, 34, 104, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 200);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 280, '우진플라임', 'TE280', 280, 580, 1080, 920, 920, 580, 580, 280, 620, 560, 560, 12.0, 170, 60, 565, 515, 1750, 380, 115, 13.0, '6750x2070x2620', 15700, 45, 105, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 280);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, '우진플라임', 'TE350', 350, 650, 1200, 1020, 1020, 650, 650, 300, 700, 630, 630, 15.0, 190, 70, 770, 702, 1700, 480, 140, 16.0, '7450x2220x2820', 19700, 55, 106, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 350);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 450, '우진플라임', 'TE450', 450, 750, 1380, 1150, 1150, 750, 750, 350, 800, 730, 730, 20.0, 220, 80, 1005, 916, 1650, 600, 175, 20.0, '8250x2470x3070', 25200, 75, 107, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 450);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 650, '우진플라임', 'TE650', 650, 950, 1700, 1420, 1420, 950, 950, 420, 1000, 930, 930, 30.0, 280, 100, 1571, 1432, 1550, 900, 250, 30.0, '10050x2970x3570', 40500, 110, 108, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 650);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 850, '우진플라임', 'TE850', 850, 1100, 1950, 1620, 1620, 1100, 1100, 480, 1150, 1080, 1080, 40.0, 320, 110, 2124, 1937, 1500, 1100, 310, 38.0, '11250x3270x3920', 52500, 132, 109, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 850);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1000, '우진플라임', 'TE1000', 1000, 1250, 2200, 1850, 1850, 1250, 1250, 550, 1300, 1230, 1230, 50.0, 360, 120, 2714, 2474, 1450, 1350, 380, 45.0, '12550x3620x4270', 68500, 160, 110, '범퍼, 대형 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 1000);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1300, '우진플라임', 'TE1300', 1300, 1450, 2500, 2100, 2100, 1450, 1450, 620, 1500, 1430, 1430, 65.0, 420, 140, 3848, 3508, 1400, 1700, 470, 55.0, '14050x4020x4670', 88500, 200, 111, '대형 범퍼, 도어 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 1300);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1600, '우진플라임', 'TE1600', 1600, 1650, 2850, 2400, 2400, 1650, 1650, 700, 1750, 1630, 1630, 80.0, 480, 160, 5027, 4582, 1350, 2100, 580, 68.0, '15850x4520x5120', 115500, 250, 112, '대형 범퍼, 인스트루먼트 패널용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 1600);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2000, '우진플라임', 'TE2000', 2000, 1900, 3250, 2750, 2750, 1900, 1900, 800, 2000, 1880, 1880, 100.0, 550, 180, 6362, 5800, 1300, 2600, 720, 85.0, '17550x5020x5620', 150500, 315, 113, '인스트루먼트 패널, 대형 내장재용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '우진플라임' AND tonnage_value = 2000);

-- 엥겔 (Engel) - 오스트리아 세계 1위 사출기 제조사
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 50, '엥겔', 'victory 50', 50, 280, 580, 460, 460, 280, 280, 150, 300, 260, 260, 2.8, 85, 28, 65, 59, 2150, 68, 28, 3.8, '3900x1250x1850', 3400, 12, 201, '소형 정밀 부품용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 50);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, '엥겔', 'victory 100', 100, 365, 730, 590, 590, 365, 365, 185, 390, 345, 345, 5.0, 115, 38, 155, 141, 2050, 135, 50, 6.0, '4600x1500x2050', 5800, 20, 202, '소형~중형 부품용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 200, '엥겔', 'victory 200', 200, 510, 970, 820, 820, 510, 510, 250, 545, 490, 490, 10.0, 155, 55, 420, 383, 1870, 300, 95, 11.0, '6050x1920x2480', 12200, 37, 203, '중형 부품용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 200);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, '엥겔', 'victory 350', 350, 660, 1220, 1040, 1040, 660, 660, 310, 720, 640, 640, 16.0, 200, 72, 810, 738, 1750, 510, 150, 17.0, '7550x2280x2880', 20500, 60, 204, '대형 부품용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 350);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 500, '엥겔', 'duo 500', 500, 820, 1500, 1250, 1250, 820, 820, 380, 880, 800, 800, 24.0, 250, 88, 1200, 1094, 1650, 720, 210, 24.0, '8850x2650x3250', 30000, 90, 205, '대형 외장 부품용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 500);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 800, '엥겔', 'duo 800', 800, 1080, 1920, 1600, 1600, 1080, 1080, 480, 1130, 1060, 1060, 38.0, 320, 108, 2000, 1823, 1550, 1050, 305, 37.0, '11000x3200x3800', 50000, 130, 206, '범퍼, 대형 패널용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 800);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1100, '엥겔', 'duo 1100', 1100, 1300, 2300, 1950, 1950, 1300, 1300, 580, 1380, 1280, 1280, 55.0, 400, 130, 2900, 2643, 1480, 1450, 410, 50.0, '13200x3800x4400', 75000, 180, 207, '대형 범퍼, 도어 패널용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 1100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1500, '엥겔', 'duo 1500', 1500, 1600, 2780, 2350, 2350, 1600, 1600, 680, 1700, 1580, 1580, 75.0, 470, 155, 4700, 4284, 1380, 2000, 560, 65.0, '15500x4400x5000', 110000, 240, 208, '대형 범퍼, 인스트루먼트 패널용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 1500);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2000, '엥겔', 'duo 2000', 2000, 1950, 3320, 2820, 2820, 1950, 1950, 820, 2080, 1930, 1930, 105.0, 580, 185, 6700, 6108, 1320, 2750, 760, 90.0, '18000x5200x5800', 160000, 340, 209, '인스트루먼트 패널, 대형 내장재용 (유럽형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '엥겔' AND tonnage_value = 2000);

-- 크라우스마파이 (KraussMaffei) - 독일 프리미엄 사출기 제조사
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, '크라우스마파이', 'CX 100', 100, 370, 740, 600, 600, 370, 370, 190, 400, 350, 350, 5.2, 120, 40, 160, 146, 2100, 140, 52, 6.2, '4700x1550x2100', 6000, 22, 301, '소형~중형 부품용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 200, '크라우스마파이', 'CX 200', 200, 520, 990, 840, 840, 520, 520, 260, 560, 500, 500, 10.5, 160, 58, 440, 401, 1900, 320, 100, 11.5, '6200x1980x2550', 12800, 40, 302, '중형 부품용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 200);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, '크라우스마파이', 'CX 350', 350, 670, 1240, 1060, 1060, 670, 670, 320, 740, 650, 650, 17.0, 210, 75, 850, 775, 1780, 540, 160, 18.0, '7700x2350x2950', 21500, 65, 303, '대형 부품용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 350);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 500, '크라우스마파이', 'GX 500', 500, 840, 1540, 1280, 1280, 840, 840, 400, 900, 820, 820, 26.0, 260, 92, 1280, 1167, 1680, 760, 225, 26.0, '9100x2750x3350', 32000, 100, 304, '대형 외장 부품용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 500);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 800, '크라우스마파이', 'GX 800', 800, 1100, 1960, 1640, 1640, 1100, 1100, 500, 1160, 1080, 1080, 42.0, 340, 112, 2150, 1960, 1580, 1120, 330, 40.0, '11300x3300x3900', 54000, 145, 305, '범퍼, 대형 패널용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 800);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1100, '크라우스마파이', 'GX 1100', 1100, 1320, 2340, 1980, 1980, 1320, 1320, 600, 1420, 1300, 1300, 58.0, 420, 135, 3100, 2826, 1500, 1520, 440, 55.0, '13500x3900x4500', 80000, 195, 306, '대형 범퍼, 도어 패널용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 1100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 1500, '크라우스마파이', 'MX 1500', 1500, 1620, 2820, 2380, 2380, 1620, 1620, 700, 1740, 1600, 1600, 80.0, 500, 160, 5000, 4558, 1400, 2100, 600, 70.0, '15800x4500x5100', 118000, 260, 307, '대형 범퍼, 인스트루먼트 패널용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 1500);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 2000, '크라우스마파이', 'MX 2000', 2000, 1980, 3380, 2880, 2880, 1980, 1980, 850, 2120, 1960, 1960, 110.0, 600, 190, 7100, 6472, 1350, 2850, 800, 95.0, '18500x5300x5900', 170000, 360, 308, '인스트루먼트 패널, 대형 내장재용 (독일형)', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '크라우스마파이' AND tonnage_value = 2000);

-- 동성화인 (Dongsung Hifine) - 국내 사출기 제조사
INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 100, '동성화인', 'DS100', 100, 355, 710, 575, 575, 355, 355, 175, 375, 335, 335, 4.3, 105, 35, 140, 128, 1980, 120, 42, 5.3, '4450x1430x1980', 5400, 17.5, 401, '소형~중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 100);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 150, '동성화인', 'DS150', 150, 425, 820, 680, 680, 425, 425, 205, 440, 405, 405, 6.2, 125, 43, 245, 223, 1880, 185, 62, 7.2, '5180x1640x2180', 7900, 25, 402, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 150);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 200, '동성화인', 'DS200', 200, 495, 940, 790, 790, 495, 495, 235, 520, 475, 475, 8.5, 140, 50, 385, 351, 1800, 265, 85, 9.5, '5850x1830x2380', 11200, 33, 403, '중형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 200);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 280, '동성화인', 'DS280', 280, 575, 1070, 910, 910, 575, 575, 275, 610, 555, 555, 11.5, 165, 58, 540, 492, 1730, 365, 110, 12.5, '6680x2030x2580', 15200, 43, 404, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 280);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 350, '동성화인', 'DS350', 350, 645, 1190, 1010, 1010, 645, 645, 295, 690, 625, 625, 14.5, 185, 68, 740, 675, 1680, 460, 135, 15.5, '7380x2180x2780', 19200, 53, 405, '대형 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 350);

INSERT INTO tonnages (tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke, daylight_opening, platen_size_h, platen_size_v, tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness, max_mold_width, max_mold_height, ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight, injection_pressure, injection_rate, plasticizing_capacity, nozzle_contact_force, machine_dimensions, machine_weight, motor_power, sort_order, description, is_active)
SELECT 450, '동성화인', 'DS450', 450, 745, 1370, 1140, 1140, 745, 745, 345, 790, 725, 725, 19.0, 215, 78, 970, 884, 1630, 580, 170, 19.0, '8180x2430x3030', 24700, 72, 406, '대형 외장 부품용', true
WHERE NOT EXISTS (SELECT 1 FROM tonnages WHERE manufacturer = '동성화인' AND tonnage_value = 450);

-- 인덱스 업데이트
REINDEX INDEX idx_tonnages_manufacturer;
