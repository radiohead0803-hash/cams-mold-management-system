-- 사출조건 표준양식 템플릿 추가 (이미 Railway DB에 INSERT 완료, ID=2067)
-- 이 파일은 기록용입니다.

INSERT INTO standard_document_templates (template_code, template_name, template_type, version, status, items, created_at, updated_at)
VALUES (
  'INJ-STD-001',
  '사출조건 표준양식',
  'injection_condition',
  '1.0',
  'deployed',
  '[
    {
      "id": "product_info",
      "title": "1. 금형/제품 정보",
      "writer_type": "auto",
      "items": [
        {"id": "mold_code", "item_name": "금형코드", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "mold_name", "item_name": "금형명", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "part_name", "item_name": "품명", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "part_number", "item_name": "품번", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "car_model", "item_name": "차종", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "material", "item_name": "재질", "field_type": "text", "is_required": true, "auto_fill": true},
        {"id": "writer_type", "item_name": "작성처 구분", "field_type": "select", "is_required": true, "options": ["maker", "plant", "mold_developer"]}
      ]
    },
    {
      "id": "material_info",
      "title": "2. 원재료 정보",
      "writer_type": "developer",
      "items": [
        {"id": "material_spec", "item_name": "MS SPEC (원재료)", "field_type": "text", "is_required": true},
        {"id": "material_grade", "item_name": "그레이드", "field_type": "text"},
        {"id": "material_supplier", "item_name": "원재료 업체", "field_type": "text"},
        {"id": "material_shrinkage", "item_name": "원재료 수축율 (%)", "field_type": "number", "step": "0.001"},
        {"id": "mold_shrinkage", "item_name": "금형 수축율 (%)", "field_type": "number", "step": "0.001"},
        {"id": "material_density", "item_name": "비중 (g/cm³)", "field_type": "number", "step": "0.001"}
      ]
    },
    {
      "id": "injection_condition",
      "title": "3. 사출 조건",
      "writer_type": "plant",
      "items": [
        {"id": "speed_group", "item_name": "속도 설정", "field_type": "group", "fields": ["speed_1","speed_2","speed_3","speed_4","speed_cooling"], "labels": ["1차","2차","3차","4차","냉"]},
        {"id": "position_group", "item_name": "위치 설정", "field_type": "group", "fields": ["position_pv","position_1","position_2","position_3"], "labels": ["PV","#","43","21"]},
        {"id": "pressure_group", "item_name": "압력 설정", "field_type": "group", "fields": ["pressure_1","pressure_2","pressure_3","pressure_4"], "labels": ["1차","2차","3차","4차"]},
        {"id": "time_group", "item_name": "시간 설정 (sec)", "field_type": "group", "fields": ["time_injection","time_holding","time_holding_3","time_holding_4","time_cooling"], "labels": ["사출","보압","보3","보4","냉각"]},
        {"id": "metering_speed_group", "item_name": "계량 속도", "field_type": "group", "fields": ["metering_speed_vp","metering_speed_1","metering_speed_2","metering_speed_3"], "labels": ["VP","계1","계2","계3"]},
        {"id": "metering_detail_group", "item_name": "계량 위치/압력", "field_type": "group", "fields": ["metering_position_1","metering_position_2","metering_pressure_2","metering_pressure_3","metering_pressure_4"], "labels": ["위치1","위치2","압력2","압력3","압력4"]},
        {"id": "holding_pressure_group", "item_name": "보압 설정", "field_type": "group", "fields": ["holding_pressure_1","holding_pressure_2","holding_pressure_3","holding_pressure_4"], "labels": ["1차","2차","3차","4차"]},
        {"id": "holding_pressure_h_group", "item_name": "보압 H 설정", "field_type": "group", "fields": ["holding_pressure_1h","holding_pressure_2h","holding_pressure_3h"], "labels": ["1H","2H","3H"]},
        {"id": "cycle_time", "item_name": "사이클타임 (sec)", "field_type": "number", "is_required": true},
        {"id": "design_weight", "item_name": "설계중량 (g)", "field_type": "number", "step": "0.01"},
        {"id": "management_weight", "item_name": "관리중량 (g)", "field_type": "number", "step": "0.01"},
        {"id": "remarks", "item_name": "비고", "field_type": "text"}
      ]
    },
    {
      "id": "temperature",
      "title": "4. 온도 설정",
      "writer_type": "plant",
      "items": [
        {"id": "barrel_temp_group", "item_name": "BARREL 온도 (°C)", "field_type": "group", "fields": ["barrel_temp_1","barrel_temp_2","barrel_temp_3","barrel_temp_4","barrel_temp_5","barrel_temp_6","barrel_temp_7","barrel_temp_8","barrel_temp_9"], "labels": ["1","2","3","4","5","6","7","8","9"]},
        {"id": "chiller_temp_group", "item_name": "칠러온도 (°C)", "field_type": "group", "fields": ["chiller_temp_main","chiller_temp_moving","chiller_temp_fixed"], "labels": ["메인","가동","고정"]},
        {"id": "hot_runner_installed", "item_name": "핫런너 설치", "field_type": "toggle"},
        {"id": "hot_runner_type", "item_name": "핫런너 타입", "field_type": "select", "options": ["open","valve_gate"], "depends_on": "hot_runner_installed"},
        {"id": "hr_temp_group", "item_name": "핫런너 온도 (°C)", "field_type": "group", "fields": ["hr_temp_1","hr_temp_2","hr_temp_3","hr_temp_4","hr_temp_5","hr_temp_6","hr_temp_7","hr_temp_8"], "labels": ["1","2","3","4","5","6","7","8"], "depends_on": "hot_runner_installed"},
        {"id": "valve_gate_data", "item_name": "밸브게이트 설정", "field_type": "dynamic_table", "columns": ["seq","sequence","moving","fixed","cycle_time","used"], "depends_on": "hot_runner_type=valve_gate"}
      ]
    }
  ]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
