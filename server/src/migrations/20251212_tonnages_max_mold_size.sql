-- 사출기 톤수 기초정보 테이블에 최대 금형 사이즈 컬럼 추가
-- 생성일: 2025-12-12
-- 금형이 올라갈 수 있는 최대 사이즈 정보

-- 1. 최대 금형 사이즈 컬럼 추가
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS max_mold_width INTEGER;   -- 최대 금형 가로 (mm)
ALTER TABLE tonnages ADD COLUMN IF NOT EXISTS max_mold_height INTEGER;  -- 최대 금형 세로 (mm)

-- 2. 기존 데이터에 최대 금형 사이즈 정보 업데이트
-- 최대 금형 사이즈 = 타이바 간격 - 여유분(약 20~50mm)
-- 실제로는 플래튼 크기와 타이바 간격 중 작은 값 기준

-- 50톤 (타이바 280x280)
UPDATE tonnages SET max_mold_width = 260, max_mold_height = 260 WHERE tonnage_value = 50;

-- 80톤 (타이바 330x330)
UPDATE tonnages SET max_mold_width = 310, max_mold_height = 310 WHERE tonnage_value = 80;

-- 100톤 (타이바 360x360)
UPDATE tonnages SET max_mold_width = 340, max_mold_height = 340 WHERE tonnage_value = 100;

-- 130톤 (타이바 400x400)
UPDATE tonnages SET max_mold_width = 380, max_mold_height = 380 WHERE tonnage_value = 130;

-- 150톤 (타이바 430x430)
UPDATE tonnages SET max_mold_width = 410, max_mold_height = 410 WHERE tonnage_value = 150;

-- 180톤 (타이바 470x470)
UPDATE tonnages SET max_mold_width = 450, max_mold_height = 450 WHERE tonnage_value = 180;

-- 200톤 (타이바 500x500)
UPDATE tonnages SET max_mold_width = 480, max_mold_height = 480 WHERE tonnage_value = 200;

-- 220톤 (타이바 520x520)
UPDATE tonnages SET max_mold_width = 500, max_mold_height = 500 WHERE tonnage_value = 220;

-- 250톤 (타이바 550x550)
UPDATE tonnages SET max_mold_width = 530, max_mold_height = 530 WHERE tonnage_value = 250;

-- 280톤 (타이바 580x580)
UPDATE tonnages SET max_mold_width = 560, max_mold_height = 560 WHERE tonnage_value = 280;

-- 300톤 (타이바 620x620)
UPDATE tonnages SET max_mold_width = 600, max_mold_height = 600 WHERE tonnage_value = 300;

-- 350톤 (타이바 650x650)
UPDATE tonnages SET max_mold_width = 630, max_mold_height = 630 WHERE tonnage_value = 350;

-- 400톤 (타이바 700x700)
UPDATE tonnages SET max_mold_width = 680, max_mold_height = 680 WHERE tonnage_value = 400;

-- 420톤 (타이바 720x720)
UPDATE tonnages SET max_mold_width = 700, max_mold_height = 700 WHERE tonnage_value = 420;

-- 450톤 (타이바 750x750)
UPDATE tonnages SET max_mold_width = 730, max_mold_height = 730 WHERE tonnage_value = 450;

-- 500톤 (타이바 800x800)
UPDATE tonnages SET max_mold_width = 780, max_mold_height = 780 WHERE tonnage_value = 500;

-- 550톤 (타이바 850x850)
UPDATE tonnages SET max_mold_width = 830, max_mold_height = 830 WHERE tonnage_value = 550;

-- 650톤 (타이바 950x950)
UPDATE tonnages SET max_mold_width = 930, max_mold_height = 930 WHERE tonnage_value = 650;

-- 800톤 (타이바 1050x1050)
UPDATE tonnages SET max_mold_width = 1030, max_mold_height = 1030 WHERE tonnage_value = 800;

-- 850톤 (타이바 1100x1100)
UPDATE tonnages SET max_mold_width = 1080, max_mold_height = 1080 WHERE tonnage_value = 850;

-- 1000톤 (타이바 1250x1250)
UPDATE tonnages SET max_mold_width = 1230, max_mold_height = 1230 WHERE tonnage_value = 1000;

-- 1300톤 (타이바 1450x1450)
UPDATE tonnages SET max_mold_width = 1430, max_mold_height = 1430 WHERE tonnage_value = 1300;

-- 1600톤 (타이바 1650x1650)
UPDATE tonnages SET max_mold_width = 1630, max_mold_height = 1630 WHERE tonnage_value = 1600;

-- 2000톤 (타이바 1900x1900)
UPDATE tonnages SET max_mold_width = 1880, max_mold_height = 1880 WHERE tonnage_value = 2000;

-- 2500톤 (타이바 2150x2150)
UPDATE tonnages SET max_mold_width = 2130, max_mold_height = 2130 WHERE tonnage_value = 2500;

-- 3000톤 (타이바 2400x2400)
UPDATE tonnages SET max_mold_width = 2380, max_mold_height = 2380 WHERE tonnage_value = 3000;

-- 3500톤 (타이바 2700x2700)
UPDATE tonnages SET max_mold_width = 2680, max_mold_height = 2680 WHERE tonnage_value = 3500;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tonnages_max_mold_size ON tonnages(max_mold_width, max_mold_height);

COMMENT ON COLUMN tonnages.max_mold_width IS '최대 금형 가로 크기 (mm) - 타이바 간격 기준';
COMMENT ON COLUMN tonnages.max_mold_height IS '최대 금형 세로 크기 (mm) - 타이바 간격 기준';
