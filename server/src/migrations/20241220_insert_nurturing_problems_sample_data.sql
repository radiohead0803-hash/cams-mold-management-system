-- 금형육성 문제점 샘플 데이터 삽입
-- 시스템에 등록된 모든 금형에 대해 각 3개씩 문제점 데이터 추가

-- 먼저 기존 샘플 데이터가 있으면 삭제하지 않고 추가만 함

-- 금형별 문제점 데이터 삽입 함수
DO $$
DECLARE
    mold_rec RECORD;
    problem_count INTEGER := 0;
    problem_num VARCHAR(50);
    today_str VARCHAR(8);
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- 모든 금형 조회 (mold_specifications 테이블 기준)
    FOR mold_rec IN 
        SELECT id, mold_id, mold_code, mold_name, part_name 
        FROM mold_specifications 
        WHERE is_active = true OR is_active IS NULL
        ORDER BY id
    LOOP
        -- 문제점 1: TRY 1차 - 외관 문제 (Minor)
        problem_count := problem_count + 1;
        problem_num := 'MNP-' || today_str || '-' || LPAD(problem_count::TEXT, 3, '0');
        
        INSERT INTO mold_nurturing_problems (
            problem_number, mold_id, mold_spec_id, nurturing_stage,
            occurrence_date, discovered_by, problem_types, problem_summary,
            problem_detail, occurrence_location, severity,
            cause_types, cause_detail, recurrence_risk,
            improvement_required, improvement_action, action_responsible,
            improvement_methods, planned_completion_date,
            action_status, verification_stage, result_description,
            is_recurred, final_judgment, status,
            created_by, created_by_name, created_at, updated_at
        ) VALUES (
            problem_num,
            COALESCE(mold_rec.mold_id, mold_rec.id),
            mold_rec.id,
            'TRY_1',
            CURRENT_DATE - INTERVAL '30 days',
            'maker',
            '["외관"]'::JSONB,
            '웰드라인 발생 - ' || COALESCE(mold_rec.part_name, mold_rec.mold_name, '제품'),
            '게이트 반대편 합류부에서 웰드라인이 발생하여 외관 품질 저하. 특히 조명 조건에서 육안으로 확인됨.',
            '게이트 반대편 합류부',
            'minor',
            '["사출조건", "설계"]'::JSONB,
            '수지 온도 및 금형 온도가 낮아 합류부에서 융착 불량 발생. 게이트 위치 검토 필요.',
            'medium',
            TRUE,
            '1. 수지 온도 10°C 상향 조정\n2. 금형 온도 5°C 상향 조정\n3. 사출 속도 조정',
            'maker',
            '["조건변경"]'::JSONB,
            CURRENT_DATE - INTERVAL '20 days',
            'completed',
            'same_try',
            '수지 온도 및 금형 온도 조정 후 웰드라인 개선 확인. 양산 조건 반영 완료.',
            FALSE,
            'ok',
            'closed',
            1, '시스템관리자',
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE - INTERVAL '15 days'
        ) ON CONFLICT (problem_number) DO NOTHING;
        
        -- 문제점 2: TRY 2차 - 치수 문제 (Major)
        problem_count := problem_count + 1;
        problem_num := 'MNP-' || today_str || '-' || LPAD(problem_count::TEXT, 3, '0');
        
        INSERT INTO mold_nurturing_problems (
            problem_number, mold_id, mold_spec_id, nurturing_stage,
            occurrence_date, discovered_by, problem_types, problem_summary,
            problem_detail, occurrence_location, severity,
            cause_types, cause_detail, recurrence_risk,
            improvement_required, improvement_action, action_responsible,
            improvement_methods, planned_completion_date,
            action_status, verification_stage,
            is_recurred, status,
            created_by, created_by_name, created_at, updated_at
        ) VALUES (
            problem_num,
            COALESCE(mold_rec.mold_id, mold_rec.id),
            mold_rec.id,
            'TRY_2',
            CURRENT_DATE - INTERVAL '15 days',
            'mold_developer',
            '["치수"]'::JSONB,
            '조립부 치수 공차 초과 - ' || COALESCE(mold_rec.part_name, mold_rec.mold_name, '제품'),
            '상대물 조립부 치수가 도면 공차 상한을 0.15mm 초과. 조립 시 간섭 발생 우려.',
            '조립부 보스 홀',
            'major',
            '["가공", "설계"]'::JSONB,
            '수축률 적용 오류로 인한 치수 편차 발생. 가공 시 공차 관리 미흡.',
            'high',
            TRUE,
            '1. 코어 재가공 (0.2mm 축소)\n2. 수축률 재계산 및 적용\n3. 3차원 측정 검증',
            'maker',
            '["금형수정"]'::JSONB,
            CURRENT_DATE - INTERVAL '5 days',
            'completed',
            'next_try',
            FALSE,
            'verifying',
            1, '시스템관리자',
            CURRENT_DATE - INTERVAL '15 days',
            CURRENT_DATE - INTERVAL '3 days'
        ) ON CONFLICT (problem_number) DO NOTHING;
        
        -- 문제점 3: 초기양산 - 취출 문제 (Critical)
        problem_count := problem_count + 1;
        problem_num := 'MNP-' || today_str || '-' || LPAD(problem_count::TEXT, 3, '0');
        
        INSERT INTO mold_nurturing_problems (
            problem_number, mold_id, mold_spec_id, nurturing_stage,
            occurrence_date, discovered_by, problem_types, problem_summary,
            problem_detail, occurrence_location, severity,
            cause_types, cause_detail, recurrence_risk,
            improvement_required, improvement_action, action_responsible,
            improvement_methods, planned_completion_date,
            action_status, status,
            created_by, created_by_name, created_at, updated_at
        ) VALUES (
            problem_num,
            COALESCE(mold_rec.mold_id, mold_rec.id),
            mold_rec.id,
            'INITIAL_PRODUCTION',
            CURRENT_DATE - INTERVAL '5 days',
            'plant',
            '["취출", "외관"]'::JSONB,
            '이젝터 핀 자국 및 취출 불량 - ' || COALESCE(mold_rec.part_name, mold_rec.mold_name, '제품'),
            '연속 생산 시 이젝터 핀 자국이 심하게 발생하고, 간헐적으로 취출 시 제품 변형 발생. 생산 중단 필요.',
            '이젝터 핀 위치 (하면부)',
            'critical',
            '["설계", "관리 미흡"]'::JSONB,
            '이젝터 핀 직경 및 위치 부적합. 냉각 시간 부족으로 인한 조기 취출.',
            'high',
            TRUE,
            '1. 이젝터 핀 직경 확대 (Ø3 → Ø5)\n2. 이젝터 핀 추가 (2EA)\n3. 냉각 시간 2초 연장\n4. 이형제 도포 강화',
            'maker',
            '["금형수정", "조건변경", "작업표준변경"]'::JSONB,
            CURRENT_DATE + INTERVAL '7 days',
            'not_started',
            'analyzing',
            1, '시스템관리자',
            CURRENT_DATE - INTERVAL '5 days',
            CURRENT_DATE
        ) ON CONFLICT (problem_number) DO NOTHING;
        
    END LOOP;
    
    RAISE NOTICE '총 % 개의 문제점 데이터가 생성되었습니다.', problem_count;
END $$;

-- 결과 확인
SELECT 
    ms.mold_code,
    ms.mold_name,
    COUNT(mnp.id) as problem_count
FROM mold_specifications ms
LEFT JOIN mold_nurturing_problems mnp ON ms.id = mnp.mold_spec_id
GROUP BY ms.id, ms.mold_code, ms.mold_name
ORDER BY ms.id;
