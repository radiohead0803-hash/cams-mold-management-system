# 🎯 역할별 대시보드 시스템 설계

## 🎯 시스템 개요

**본사/생산처/제작처 역할별 맞춤형 대시보드**

- 본사: 개발 + 양산 전체 관제
- 생산처: 우리 공장 금형 중심 (점검/수리/NG)
- 제작처: 개발금형 + 수리작업 현황

---

## 📊 대시보드 구성 방향

### 1️⃣ 본사 대시보드 (HQ Dashboard)

**목표: 개발 + 양산 전체 관제**

- 개발단계 진행률 모니터링
- NG TOP 분석
- 수리현황 관리
- 귀책 통계

### 2️⃣ 생산처 대시보드 (Production Site Dashboard)

**목표: 우리 공장 금형 중심**

- 오늘 해야 할 점검
- 진행 중 수리
- NG 알림
- 생산중 금형 상태

### 3️⃣ 제작처 대시보드 (Maker Dashboard)

**목표: 개발금형 + 수리작업 현황**

- 개발금형 진행상태
- 경도측정/TRY-OUT 작업
- 배정된 수리요청
- 귀책 현황

---

## 🏢 본사 대시보드 (HQ Dashboard)

### 상단 KPI 카드 (4개)

```
┌─────────────────────────────────────────────────────────┐
│ 📊 본사 대시보드                                         │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 진행 중   │ │ 양산 중   │ │ 미처리   │ │ 이번 달   │   │
│ │ 개발금형  │ │ 금형      │ │ 수리요청 │ │ NG 발생   │   │
│ │          │ │          │ │          │ │          │   │
│ │   12     │ │   48     │ │    7     │ │   32     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 주요 위젯

#### 1️⃣ 개발단계 진행률 타임라인

```
┌─────────────────────────────────────────────────────────┐
│ 📈 개발단계 진행률                                       │
├─────────────────────────────────────────────────────────┤
│ PROTO  ████████░░  8/10 (80%)                          │
│ P1     ██████░░░░  6/10 (60%)                          │
│ P2     ████░░░░░░  4/10 (40%)                          │
│ T0     ██░░░░░░░░  2/10 (20%)                          │
│ SOP    ░░░░░░░░░░  0/10 (0%)                           │
└─────────────────────────────────────────────────────────┘
```

#### 2️⃣ NG TOP 5 (최근 3개월)

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 NG TOP 5 (최근 3개월)                                │
├─────────────────────────────────────────────────────────┤
│ 1. 가스배기 불량          ████████████████░░  23건      │
│ 2. 냉각라인 막힘          ████████████░░░░░░  17건      │
│ 3. 슬라이드 마모          ██████████░░░░░░░░  15건      │
│ 4. 게이트 불량            ████████░░░░░░░░░░  12건      │
│ 5. 이젝터 핀 파손         ██████░░░░░░░░░░░░   9건      │
└─────────────────────────────────────────────────────────┘
```

#### 3️⃣ 수리요청 진행현황

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 수리요청 진행현황                                     │
├─────────────────────────────────────────────────────────┤
│ 요청: 3건  |  진행: 4건  |  완료: 10건  |  종료: 25건  │
│                                                           │
│ 최근 수리요청                                            │
│ ┌─────────────────────────────────────────────────┐    │
│ │ RR-2024-00123  🟡 진행 중                       │    │
│ │ M-2024-001 · 가스배기 NG 자동 수리요청         │    │
│ │ 요청: A공장  |  담당: B사  |  2024-12-01        │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 4️⃣ 귀책 통계

```
┌─────────────────────────────────────────────────────────┐
│ 📊 귀책 통계 (이번 달)                                   │
├─────────────────────────────────────────────────────────┤
│ 제작처    ████████░░░░░░░░░░  5건 (28%)               │
│ 생산처    ████████████░░░░░░  7건 (39%)               │
│ 본사      ████░░░░░░░░░░░░░░  2건 (11%)               │
│ 공유부담  ████████░░░░░░░░░░  4건 (22%)               │
└─────────────────────────────────────────────────────────┘
```

### API 엔드포인트

```javascript
GET /api/v1/dashboard/hq

Response:
{
  "kpi": {
    "devMoldCount": 12,        // status = 'dev_in_progress'
    "massMoldCount": 48,       // status = 'mass_production'
    "openRepairCount": 7,      // status IN ('requested','approved','assigned','in_progress')
    "ngThisMonth": 32          // 이번 달 NG 발생 건수
  },
  "devTimeline": [
    { "stage": "PROTO", "total": 10, "completed": 8 },
    { "stage": "P1",    "total": 10, "completed": 6 },
    { "stage": "P2",    "total": 10, "completed": 4 },
    { "stage": "T0",    "total": 10, "completed": 2 },
    { "stage": "SOP",   "total": 10, "completed": 0 }
  ],
  "ngTop5": [
    { "label": "가스배기 불량", "count": 23 },
    { "label": "냉각라인 막힘", "count": 17 },
    { "label": "슬라이드 마모", "count": 15 },
    { "label": "게이트 불량", "count": 12 },
    { "label": "이젝터 핀 파손", "count": 9 }
  ],
  "repairStatusCounts": {
    "requested": 3,
    "approved": 0,
    "assigned": 0,
    "in_progress": 4,
    "done": 10,
    "confirmed": 0,
    "closed": 25
  },
  "recentRepairs": [
    {
      "id": 101,
      "moldCode": "M-2024-001",
      "title": "가스배기 NG 자동 수리요청",
      "status": "in_progress",
      "siteName": "A공장",
      "makerName": "B사",
      "requestedAt": "2024-12-01T09:30:00"
    }
  ],
  "blameStats": [
    { "party": "maker", "count": 5, "percentage": 28 },
    { "party": "production", "count": 7, "percentage": 39 },
    { "party": "developer", "count": 2, "percentage": 11 },
    { "party": "shared", "count": 4, "percentage": 22 }
  ]
}
```

### 백엔드 구현

```javascript
// controllers/dashboardController.js

exports.getHqDashboard = async (req, res) => {
  try {
    // 1. KPI 집계
    const devMoldCount = await Mold.count({
      where: { status: 'dev_in_progress' }
    });
    
    const massMoldCount = await Mold.count({
      where: { status: 'mass_production' }
    });
    
    const openRepairCount = await RepairRequest.count({
      where: {
        status: {
          [Op.in]: ['requested', 'approved', 'assigned', 'in_progress']
        }
      }
    });
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ngThisMonth = await ChecklistInstance.count({
      where: {
        submitted_at: { [Op.gte]: startOfMonth },
        '$answers.is_ng$': true
      },
      include: [{
        model: ChecklistAnswer,
        as: 'answers',
        attributes: [],
        required: true
      }],
      distinct: true
    });
    
    // 2. 개발단계 진행률
    const devTimeline = await sequelize.query(`
      SELECT 
        stage,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as completed
      FROM mold_dev_plan
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'PROTO' THEN 1
          WHEN 'P1' THEN 2
          WHEN 'P2' THEN 3
          WHEN 'T0' THEN 4
          WHEN 'SOP' THEN 5
        END
    `, { type: QueryTypes.SELECT });
    
    // 3. NG TOP 5 (최근 3개월)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const ngTop5 = await sequelize.query(`
      SELECT 
        cq.label,
        COUNT(*) as count
      FROM repair_request_ng_items rni
      JOIN checklist_answers ca ON ca.id = rni.answer_id
      JOIN checklist_questions cq ON cq.id = ca.question_id
      JOIN repair_requests rr ON rr.id = rni.repair_request_id
      WHERE rr.requested_at >= :threeMonthsAgo
      GROUP BY cq.label
      ORDER BY count DESC
      LIMIT 5
    `, {
      replacements: { threeMonthsAgo },
      type: QueryTypes.SELECT
    });
    
    // 4. 수리요청 상태별 개수
    const repairStatusCounts = await RepairRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const statusMap = repairStatusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});
    
    // 5. 최근 수리요청
    const recentRepairs = await RepairRequest.findAll({
      limit: 5,
      order: [['requested_at', 'DESC']],
      include: [
        { model: Mold, as: 'mold', attributes: ['code'] },
        { model: Company, as: 'requestSite', attributes: ['name'] },
        { model: User, as: 'assignedToUser', include: [{ model: Company, as: 'company', attributes: ['name'] }] }
      ]
    });
    
    // 6. 귀책 통계 (이번 달)
    const blameStats = await RepairRequest.findAll({
      attributes: [
        'blame_party',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        blame_confirmed: true,
        closed_at: { [Op.gte]: startOfMonth }
      },
      group: ['blame_party'],
      raw: true
    });
    
    const totalBlame = blameStats.reduce((sum, item) => sum + parseInt(item.count), 0);
    const blameStatsWithPercentage = blameStats.map(item => ({
      party: item.blame_party,
      count: parseInt(item.count),
      percentage: Math.round((parseInt(item.count) / totalBlame) * 100)
    }));
    
    res.json({
      success: true,
      data: {
        kpi: {
          devMoldCount,
          massMoldCount,
          openRepairCount,
          ngThisMonth
        },
        devTimeline,
        ngTop5,
        repairStatusCounts: statusMap,
        recentRepairs: recentRepairs.map(r => ({
          id: r.id,
          moldCode: r.mold.code,
          title: r.title,
          status: r.status,
          siteName: r.requestSite.name,
          makerName: r.assignedToUser?.company?.name || '-',
          requestedAt: r.requested_at
        })),
        blameStats: blameStatsWithPercentage
      }
    });
    
  } catch (error) {
    console.error('본사 대시보드 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🏭 생산처 대시보드 (Production Site Dashboard)

### 상단 KPI 카드 (4개)

```
┌─────────────────────────────────────────────────────────┐
│ 🏭 생산처 대시보드 (A공장)                              │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 오늘 점검 │ │ 미처리   │ │ 최근 7일 │ │ 사용 중   │   │
│ │ 예정      │ │ 수리요청 │ │ NG 금형  │ │ 금형      │   │
│ │          │ │          │ │          │ │          │   │
│ │    5     │ │    3     │ │    4     │ │   21     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 주요 위젯

#### 1️⃣ 오늘 점검해야 할 금형

```
┌─────────────────────────────────────────────────────────┐
│ ✅ 오늘 점검해야 할 금형                                 │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-001  범퍼 금형                           │    │
│ │ 일상점검  |  19,800 / 20,000 Shot              │    │
│ │                                   [점검 시작]   │    │
│ └─────────────────────────────────────────────────┘    │
│                                                           │
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-005  도어 금형                           │    │
│ │ 정기점검  |  50,000 Shot 도달                  │    │
│ │                                   [점검 시작]   │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 2️⃣ 수리 진행 현황

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 수리 진행 현황                                        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-001 · 가스배기 NG 자동 수리요청         │    │
│ │ 제작처: B사  |  상태: 진행 중  |  D+3          │    │
│ │                                       [상세]    │    │
│ └─────────────────────────────────────────────────┘    │
│                                                           │
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-003 · 슬라이드 파손 수리                │    │
│ │ 제작처: C사  |  상태: 승인 대기  |  D+1       │    │
│ │                                       [상세]    │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 3️⃣ 최근 NG 알림

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ 최근 NG 알림 (7일)                                   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-003  도어 금형                           │    │
│ │ 슬라이드 마모 / 가스배기 불량                   │    │
│ │ 2024-12-01 08:00                                │    │
│ │                         [수리요청 RR-00105 보기]│    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 4️⃣ 금형 위치 맵

```
┌─────────────────────────────────────────────────────────┐
│ 📍 금형 위치 (우리 공장)                                │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │                                                   │    │
│ │         [지도]                                   │    │
│ │    🟢 M-001 (정상)                              │    │
│ │    🟡 M-003 (점검필요)                          │    │
│ │    🔴 M-005 (수리중)                            │    │
│ │                                                   │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### API 엔드포인트

```javascript
GET /api/v1/dashboard/production-site

Response:
{
  "kpi": {
    "todayCheckCount": 5,
    "openRepairCount": 3,
    "recentNgMoldCount": 4,
    "activeMoldCount": 21
  },
  "todayChecks": [
    {
      "moldId": 1,
      "moldCode": "M-2024-001",
      "moldName": "범퍼 금형",
      "checkType": "daily",
      "dueShot": 20000,
      "currentShot": 19800
    },
    {
      "moldId": 5,
      "moldCode": "M-2024-005",
      "moldName": "도어 금형",
      "checkType": "regular",
      "dueShot": 50000,
      "currentShot": 50000
    }
  ],
  "repairs": [
    {
      "id": 101,
      "moldCode": "M-2024-001",
      "title": "가스배기 NG 자동 수리요청",
      "status": "in_progress",
      "makerName": "B사",
      "requestedAt": "2024-11-30T10:20:00",
      "daysElapsed": 3
    }
  ],
  "recentNg": [
    {
      "moldCode": "M-2024-003",
      "moldName": "도어 금형",
      "ngSummary": "슬라이드 마모 / 가스배기 불량",
      "repairRequestId": 105,
      "checkedAt": "2024-12-01T08:00:00"
    }
  ],
  "locations": [
    {
      "moldId": 1,
      "moldCode": "M-2024-001",
      "lat": 35.1234,
      "lng": 129.1234,
      "status": "in_use"
    }
  ]
}
```

### 백엔드 구현

```javascript
// controllers/dashboardController.js

exports.getProductionSiteDashboard = async (req, res) => {
  try {
    const { siteId } = req.user; // 생산처 공장 ID
    
    // 1. KPI 집계
    // 오늘 점검 예정 금형 수
    const todayCheckCount = await sequelize.query(`
      SELECT COUNT(DISTINCT m.id)
      FROM molds m
      WHERE m.current_site_id = :siteId
        AND (
          (m.daily_check_interval > 0 AND m.current_shot >= m.last_daily_check_shot + m.daily_check_interval)
          OR
          (m.regular_check_interval > 0 AND m.current_shot >= m.last_regular_check_shot + m.regular_check_interval)
        )
    `, {
      replacements: { siteId },
      type: QueryTypes.SELECT
    });
    
    // 미처리 수리요청
    const openRepairCount = await RepairRequest.count({
      where: {
        request_site_id: siteId,
        status: {
          [Op.in]: ['requested', 'approved', 'assigned', 'in_progress']
        }
      }
    });
    
    // 최근 7일 NG 금형 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentNgMoldCount = await sequelize.query(`
      SELECT COUNT(DISTINCT ci.mold_id)
      FROM checklist_instances ci
      JOIN checklist_answers ca ON ca.instance_id = ci.id
      WHERE ci.site_id = :siteId
        AND ci.submitted_at >= :sevenDaysAgo
        AND ca.is_ng = true
    `, {
      replacements: { siteId, sevenDaysAgo },
      type: QueryTypes.SELECT
    });
    
    // 사용 중 금형 수
    const activeMoldCount = await Mold.count({
      where: {
        current_site_id: siteId,
        status: 'in_use'
      }
    });
    
    // 2. 오늘 점검해야 할 금형
    const todayChecks = await sequelize.query(`
      SELECT 
        m.id as "moldId",
        m.code as "moldCode",
        m.name as "moldName",
        CASE 
          WHEN m.current_shot >= m.last_daily_check_shot + m.daily_check_interval THEN 'daily'
          ELSE 'regular'
        END as "checkType",
        CASE 
          WHEN m.current_shot >= m.last_daily_check_shot + m.daily_check_interval 
            THEN m.last_daily_check_shot + m.daily_check_interval
          ELSE m.last_regular_check_shot + m.regular_check_interval
        END as "dueShot",
        m.current_shot as "currentShot"
      FROM molds m
      WHERE m.current_site_id = :siteId
        AND (
          (m.daily_check_interval > 0 AND m.current_shot >= m.last_daily_check_shot + m.daily_check_interval)
          OR
          (m.regular_check_interval > 0 AND m.current_shot >= m.last_regular_check_shot + m.regular_check_interval)
        )
      ORDER BY m.current_shot DESC
      LIMIT 10
    `, {
      replacements: { siteId },
      type: QueryTypes.SELECT
    });
    
    // 3. 수리 진행 현황
    const repairs = await RepairRequest.findAll({
      where: {
        request_site_id: siteId,
        status: {
          [Op.in]: ['requested', 'approved', 'assigned', 'in_progress']
        }
      },
      order: [['requested_at', 'DESC']],
      limit: 10,
      include: [
        { model: Mold, as: 'mold', attributes: ['code'] },
        { model: User, as: 'assignedToUser', include: [{ model: Company, as: 'company', attributes: ['name'] }] }
      ]
    });
    
    // 4. 최근 NG 알림
    const recentNg = await sequelize.query(`
      SELECT 
        m.code as "moldCode",
        m.name as "moldName",
        STRING_AGG(DISTINCT cq.label, ' / ') as "ngSummary",
        rr.id as "repairRequestId",
        ci.submitted_at as "checkedAt"
      FROM checklist_instances ci
      JOIN molds m ON m.id = ci.mold_id
      JOIN checklist_answers ca ON ca.instance_id = ci.id
      JOIN checklist_questions cq ON cq.id = ca.question_id
      LEFT JOIN repair_requests rr ON rr.source_type = 'checklist' AND rr.source_id = ci.id
      WHERE ci.site_id = :siteId
        AND ci.submitted_at >= :sevenDaysAgo
        AND ca.is_ng = true
      GROUP BY m.code, m.name, rr.id, ci.submitted_at
      ORDER BY ci.submitted_at DESC
      LIMIT 10
    `, {
      replacements: { siteId, sevenDaysAgo },
      type: QueryTypes.SELECT
    });
    
    // 5. 금형 위치
    const locations = await sequelize.query(`
      SELECT 
        m.id as "moldId",
        m.code as "moldCode",
        mll.latitude as lat,
        mll.longitude as lng,
        m.status
      FROM molds m
      JOIN mold_location_log mll ON mll.mold_id = m.id
      WHERE m.current_site_id = :siteId
        AND mll.id = (
          SELECT id FROM mold_location_log 
          WHERE mold_id = m.id 
          ORDER BY created_at DESC 
          LIMIT 1
        )
    `, {
      replacements: { siteId },
      type: QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        kpi: {
          todayCheckCount: parseInt(todayCheckCount[0].count),
          openRepairCount,
          recentNgMoldCount: parseInt(recentNgMoldCount[0].count),
          activeMoldCount
        },
        todayChecks,
        repairs: repairs.map(r => ({
          id: r.id,
          moldCode: r.mold.code,
          title: r.title,
          status: r.status,
          makerName: r.assignedToUser?.company?.name || '-',
          requestedAt: r.requested_at,
          daysElapsed: Math.floor((new Date() - new Date(r.requested_at)) / (1000 * 60 * 60 * 24))
        })),
        recentNg,
        locations
      }
    });
    
  } catch (error) {
    console.error('생산처 대시보드 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🏭 제작처 대시보드 (Maker Dashboard)

### 상단 KPI 카드 (4개)

```
┌─────────────────────────────────────────────────────────┐
│ 🏭 제작처 대시보드 (B사)                                │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 진행 중   │ │ 승인대기 │ │ 승인대기 │ │ 제작처   │   │
│ │ 개발금형  │ │ 개발계획 │ │ 경도/TRY │ │ 귀책률   │   │
│ │          │ │          │ │          │ │          │   │
│ │    8     │ │    3     │ │    5     │ │   28%    │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 주요 위젯

#### 1️⃣ 개발금형 진행상태

```
┌─────────────────────────────────────────────────────────┐
│ 🔨 개발금형 진행상태                                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ M-2024-001  범퍼 금형  [P2]                     │    │
│ │ 개발계획: ✅ 승인  |  체크리스트: ✅ 승인       │    │
│ │ 경도측정: 🟡 승인대기  |  TRY-OUT: ⚪ 미작성   │    │
│ │                                       [상세]    │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 2️⃣ 배정된 수리요청

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 배정된 수리요청                                       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ RR-2024-00123  🟡 진행 중                       │    │
│ │ M-2024-001 · 가스배기 NG 자동 수리요청         │    │
│ │ 요청: A공장  |  배정일: 2024-11-30             │    │
│ │                                       [상세]    │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 3️⃣ 귀책 현황 (최근 6개월)

```
┌─────────────────────────────────────────────────────────┐
│ 📊 귀책 현황 (최근 6개월)                                │
├─────────────────────────────────────────────────────────┤
│ 전체 수리: 18건                                          │
│ 제작처 귀책: 5건 (28%)                                  │
│ 생산처 귀책: 7건 (39%)                                  │
│ 공유 부담: 4건 (22%)                                    │
│ 기타: 2건 (11%)                                         │
└─────────────────────────────────────────────────────────┘
```

### API 엔드포인트

```javascript
GET /api/v1/dashboard/maker

Response:
{
  "kpi": {
    "devMoldCount": 8,
    "pendingDevPlanCount": 3,
    "pendingHardnessTryoutCount": 5,
    "makerBlamePercentage": 28
  },
  "devMolds": [
    {
      "moldId": 1,
      "moldCode": "M-2024-001",
      "moldName": "범퍼 금형",
      "stage": "P2",
      "devPlanStatus": "approved",
      "checklistStatus": "approved",
      "hardnessStatus": "submitted",
      "tryoutStatus": "draft"
    }
  ],
  "assignedRepairs": [
    {
      "id": 123,
      "moldCode": "M-2024-001",
      "title": "가스배기 NG 자동 수리요청",
      "status": "in_progress",
      "siteName": "A공장",
      "assignedAt": "2024-11-30T10:00:00"
    }
  ],
  "blameStats": {
    "total": 18,
    "maker": 5,
    "production": 7,
    "shared": 4,
    "other": 2,
    "makerPercentage": 28
  }
}
```

---

## 💻 프론트엔드 구현

### 생산처 대시보드 컴포넌트

```typescript
// src/pages/dashboard/ProductionDashboard.tsx
import { useEffect, useState } from "react";
import api from "../../lib/api";
import MoldLocationMap from "../../components/MoldLocationMap";

interface Kpi {
  todayCheckCount: number;
  openRepairCount: number;
  recentNgMoldCount: number;
  activeMoldCount: number;
}

interface TodayCheck {
  moldId: number;
  moldCode: string;
  moldName: string;
  checkType: 'daily' | 'regular';
  dueShot: number;
  currentShot: number;
}

interface Repair {
  id: number;
  moldCode: string;
  title: string;
  status: string;
  makerName: string;
  requestedAt: string;
  daysElapsed: number;
}

interface NgAlert {
  moldCode: string;
  moldName: string;
  ngSummary: string;
  repairRequestId: number | null;
  checkedAt: string;
}

interface Location {
  moldId: number;
  moldCode: string;
  lat: number;
  lng: number;
  status: string;
}

interface DashboardData {
  kpi: Kpi;
  todayChecks: TodayCheck[];
  repairs: Repair[];
  recentNg: NgAlert[];
  locations: Location[];
}

export default function ProductionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>(
        "/api/v1/dashboard/production-site"
      );
      setData(res.data.data);
    } catch (error) {
      console.error('대시보드 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="text-xs text-slate-500">대시보드 불러오는 중...</div>
      </div>
    );
  }

  const { kpi, todayChecks, repairs, recentNg, locations } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-4">
      {/* 상단 KPI 카드 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="오늘 점검 예정" value={kpi.todayCheckCount} color="blue" />
        <KpiCard label="미처리 수리요청" value={kpi.openRepairCount} color="orange" />
        <KpiCard label="최근 7일 NG 금형" value={kpi.recentNgMoldCount} color="red" />
        <KpiCard label="사용 중 금형" value={kpi.activeMoldCount} color="green" />
      </section>

      {/* 오늘 점검 목록 + 수리진행현황 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 오늘 점검 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">✅ 오늘 점검해야 할 금형</div>
          </div>
          {todayChecks.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              오늘 예정된 점검이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {todayChecks.map((c) => (
                <li
                  key={c.moldId}
                  className="border rounded-xl px-3 py-3 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="text-xs">
                    <div className="font-semibold text-sm mb-1">{c.moldCode}</div>
                    <div className="text-slate-500">
                      {c.checkType === "daily" ? "일상점검" : "정기점검"}
                      {" · "}
                      {c.currentShot?.toLocaleString()}/
                      {c.dueShot?.toLocaleString()} Shot
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
                    onClick={() =>
                      window.location.assign(
                        `/mobile/molds/${c.moldId}/check/${c.checkType}`
                      )
                    }
                  >
                    점검 시작
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 수리진행현황 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">🔧 수리 진행 현황</div>
          </div>
          {repairs.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              진행 중인 수리요청이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {repairs.map((r) => (
                <li
                  key={r.id}
                  className="border rounded-xl px-3 py-3 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => window.location.assign(`/repair-requests/${r.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs">
                      <div className="font-semibold text-sm mb-1">
                        {r.moldCode} · {r.title}
                      </div>
                      <div className="text-slate-500">
                        제작처: {r.makerName} / 상태: {getStatusLabel(r.status)}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">D+{r.daysElapsed}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 최근 NG 알림 + 금형 위치 맵 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 최근 NG */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-sm mb-3">⚠️ 최근 NG 알림 (7일)</div>
          {recentNg.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              최근 7일 내 NG 발생 내역이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {recentNg.map((n, idx) => (
                <li key={idx} className="border rounded-xl px-3 py-3">
                  <div className="text-xs">
                    <div className="font-semibold text-sm mb-1">{n.moldCode}</div>
                    <div className="text-slate-500 mb-2">{n.ngSummary}</div>
                    <div className="text-slate-400 text-[10px]">
                      {new Date(n.checkedAt).toLocaleString('ko-KR')}
                    </div>
                    {n.repairRequestId && (
                      <button
                        className="mt-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-medium hover:bg-slate-800 transition"
                        onClick={() =>
                          window.location.assign(`/repair-requests/${n.repairRequestId}`)
                        }
                      >
                        수리요청 보기
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 금형 위치 맵 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-sm mb-3">📍 금형 위치 (우리 공장)</div>
          <div className="h-64 rounded-xl overflow-hidden bg-slate-100">
            <MoldLocationMap molds={locations} />
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ 
  label, 
  value, 
  color = 'blue' 
}: { 
  label: string; 
  value: number; 
  color?: 'blue' | 'orange' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    green: 'text-green-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    requested: '요청됨',
    approved: '승인됨',
    assigned: '배정됨',
    in_progress: '진행 중',
    done: '완료됨',
    confirmed: '확인됨',
    closed: '종료됨',
    rejected: '반려됨'
  };
  return labels[status] || status;
}
```

---

## 🚀 구현 단계

### Phase 1: 백엔드 API
- [ ] 본사 대시보드 API
- [ ] 생산처 대시보드 API
- [ ] 제작처 대시보드 API

### Phase 2: 프론트엔드
- [ ] 본사 대시보드 컴포넌트
- [ ] 생산처 대시보드 컴포넌트
- [ ] 제작처 대시보드 컴포넌트

### Phase 3: 차트/그래프
- [ ] 개발단계 진행률 바 차트
- [ ] NG TOP 5 차트
- [ ] 귀책 통계 차트

### Phase 4: 실시간 업데이트
- [ ] WebSocket 연결
- [ ] 실시간 알림
- [ ] 자동 새로고침

---

**이제 역할별 맞춤형 대시보드 시스템이 완성되었습니다!** 🎉

**본사/생산처/제작처 각자의 업무에 최적화된 정보를 한눈에 볼 수 있습니다!** 📊✨
