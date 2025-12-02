# 🔧 TRY-OUT 모듈 구현 가이드

## 📋 개요

**금형육성(TRY-OUT) 모듈에 생산처 작성 권한 추가**

- 제작처: T0~PPAP 작성 가능
- 생산처: MASS-001~ 작성 가능 (신규)
- 본사: 승인/반려만 가능
- 다른 모듈(개발계획/체크리스트/경도)은 변경 없음

---

## 🚀 구현 순서

### Phase 1: DB 마이그레이션 ✅
### Phase 2: 백엔드 API 구현
### Phase 3: 프론트엔드 UI 구현
### Phase 4: 메뉴 통합
### Phase 5: 테스트

---

## 📊 Phase 1: DB 마이그레이션 (완료)

**파일:** `server/migrations/010_create_mold_tryout_system.sql`

이미 생성 완료:
- ✅ `mold_tryout` (헤더)
- ✅ `mold_tryout_conditions` (성형 조건)
- ✅ `mold_tryout_defects` (불량 기록)
- ✅ `mold_tryout_files` (파일 첨부)
- ✅ `mold_tryout_history` (변경 이력)

**마이그레이션 실행:**
```bash
# PostgreSQL
psql -U postgres -d cams_db -f server/migrations/010_create_mold_tryout_system.sql

# 또는 Sequelize
npx sequelize-cli db:migrate
```

---

## 🔧 Phase 2: 백엔드 API 구현

### 2-1. Sequelize 모델 생성

**파일:** `server/src/models/MoldTryout.js`

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MoldTryout = sequelize.define('MoldTryout', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mold_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'molds', key: 'id' }
    },
    maker_id: {
      type: DataTypes.INTEGER,
      references: { model: 'companies', key: 'id' }
    },
    plant_id: {
      type: DataTypes.INTEGER,
      references: { model: 'companies', key: 'id' }
    },
    trial_no: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    trial_date: {
      type: DataTypes.DATEONLY
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft'
    },
    machine_name: DataTypes.TEXT,
    tonnage: DataTypes.INTEGER,
    resin: DataTypes.TEXT,
    resin_maker: DataTypes.TEXT,
    color: DataTypes.TEXT,
    cavity_used: DataTypes.INTEGER,
    shot_weight_g: DataTypes.DECIMAL(8, 2),
    cycle_sec: DataTypes.DECIMAL(6, 2),
    overall_quality: DataTypes.STRING(20),
    is_mass_ready: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    use_as_mass_condition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    comment: DataTypes.TEXT,
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updated_by: DataTypes.INTEGER,
    submitted_at: DataTypes.DATE,
    approved_by: DataTypes.INTEGER,
    approved_at: DataTypes.DATE,
    approval_comment: DataTypes.TEXT
  }, {
    tableName: 'mold_tryout',
    timestamps: true,
    underscored: true
  });

  MoldTryout.associate = (models) => {
    MoldTryout.belongsTo(models.Mold, { foreignKey: 'mold_id', as: 'mold' });
    MoldTryout.belongsTo(models.Company, { foreignKey: 'maker_id', as: 'maker' });
    MoldTryout.belongsTo(models.Company, { foreignKey: 'plant_id', as: 'plant' });
    MoldTryout.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    MoldTryout.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    MoldTryout.hasMany(models.MoldTryoutCondition, { foreignKey: 'tryout_id', as: 'conditions' });
    MoldTryout.hasMany(models.MoldTryoutDefect, { foreignKey: 'tryout_id', as: 'defects' });
    MoldTryout.hasMany(models.MoldTryoutFile, { foreignKey: 'tryout_id', as: 'files' });
  };

  return MoldTryout;
};
```

**파일:** `server/src/models/MoldTryoutCondition.js`

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MoldTryoutCondition = sequelize.define('MoldTryoutCondition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tryout_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    value: DataTypes.TEXT,
    unit: DataTypes.TEXT,
    target_value: DataTypes.TEXT,
    tolerance: DataTypes.TEXT,
    is_critical: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'mold_tryout_conditions',
    timestamps: true,
    underscored: true
  });

  MoldTryoutCondition.associate = (models) => {
    MoldTryoutCondition.belongsTo(models.MoldTryout, { foreignKey: 'tryout_id' });
  };

  return MoldTryoutCondition;
};
```

**파일:** `server/src/models/MoldTryoutDefect.js`

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MoldTryoutDefect = sequelize.define('MoldTryoutDefect', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tryout_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    defect_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    location: DataTypes.TEXT,
    description: DataTypes.TEXT,
    cause_analysis: DataTypes.TEXT,
    action_plan: DataTypes.TEXT,
    is_resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    resolved_at: DataTypes.DATE,
    resolved_by: DataTypes.INTEGER
  }, {
    tableName: 'mold_tryout_defects',
    timestamps: true,
    underscored: true
  });

  MoldTryoutDefect.associate = (models) => {
    MoldTryoutDefect.belongsTo(models.MoldTryout, { foreignKey: 'tryout_id' });
    MoldTryoutDefect.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'resolver' });
  };

  return MoldTryoutDefect;
};
```

### 2-2. 컨트롤러 구현

**파일:** `server/src/controllers/tryoutController.js`

```javascript
const { MoldTryout, MoldTryoutCondition, MoldTryoutDefect, MoldTryoutFile, Mold, Company, User } = require('../models/newIndex');

// 금형별 TRY-OUT 목록 조회
exports.listByMold = async (req, res) => {
  try {
    const { moldId } = req.params;
    
    const tryouts = await MoldTryout.findAll({
      where: { mold_id: moldId },
      include: [
        { model: Company, as: 'maker', attributes: ['id', 'name'] },
        { model: Company, as: 'plant', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] }
      ],
      order: [['trial_date', 'DESC']]
    });
    
    res.json({ success: true, data: tryouts });
  } catch (error) {
    console.error('TRY-OUT 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// TRY-OUT 상세 조회
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tryout = await MoldTryout.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: Company, as: 'maker' },
        { model: Company, as: 'plant' },
        { model: MoldTryoutCondition, as: 'conditions', order: [['order_index', 'ASC']] },
        { model: MoldTryoutDefect, as: 'defects' },
        { model: MoldTryoutFile, as: 'files' },
        { model: User, as: 'creator' },
        { model: User, as: 'approver' }
      ]
    });
    
    if (!tryout) {
      return res.status(404).json({ success: false, error: 'TRY-OUT을 찾을 수 없습니다.' });
    }
    
    res.json({ success: true, data: tryout });
  } catch (error) {
    console.error('TRY-OUT 상세 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// TRY-OUT 생성/수정
exports.createOrUpdate = async (req, res) => {
  try {
    const { moldId } = req.params;
    const { role, companyId, siteId } = req.user;
    const { id, trial_no, conditions, defects, ...tryoutData } = req.body;
    
    // 금형 조회
    const mold = await Mold.findByPk(moldId);
    if (!mold) {
      return res.status(404).json({ success: false, error: '금형을 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    if (role === 'maker' && mold.maker_id !== companyId) {
      return res.status(403).json({ success: false, error: '다른 제작처의 금형은 수정할 수 없습니다.' });
    }
    
    if (role === 'production' && mold.production_site_id !== siteId) {
      return res.status(403).json({ success: false, error: '다른 공장의 금형은 수정할 수 없습니다.' });
    }
    
    let tryout;
    
    if (id) {
      // 수정
      tryout = await MoldTryout.findByPk(id);
      
      if (!tryout) {
        return res.status(404).json({ success: false, error: 'TRY-OUT을 찾을 수 없습니다.' });
      }
      
      // draft 또는 rejected 상태만 수정 가능
      if (tryout.status !== 'draft' && tryout.status !== 'rejected') {
        return res.status(400).json({ success: false, error: '승인 대기 중이거나 승인된 TRY-OUT은 수정할 수 없습니다.' });
      }
      
      await tryout.update({
        ...tryoutData,
        updated_by: req.user.id
      });
    } else {
      // 생성
      tryout = await MoldTryout.create({
        mold_id: moldId,
        maker_id: role === 'maker' ? companyId : null,
        plant_id: role === 'production' ? siteId : null,
        trial_no,
        ...tryoutData,
        created_by: req.user.id,
        status: 'draft'
      });
    }
    
    // 성형 조건 업데이트
    if (conditions && conditions.length > 0) {
      await MoldTryoutCondition.destroy({ where: { tryout_id: tryout.id } });
      await MoldTryoutCondition.bulkCreate(
        conditions.map(c => ({ ...c, tryout_id: tryout.id }))
      );
    }
    
    // 불량 기록 업데이트
    if (defects && defects.length > 0) {
      await MoldTryoutDefect.destroy({ where: { tryout_id: tryout.id } });
      await MoldTryoutDefect.bulkCreate(
        defects.map(d => ({ ...d, tryout_id: tryout.id }))
      );
    }
    
    res.json({ success: true, data: tryout });
  } catch (error) {
    console.error('TRY-OUT 생성/수정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// TRY-OUT 제출 (승인 요청)
exports.submit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tryout = await MoldTryout.findByPk(id, {
      include: [
        { model: MoldTryoutCondition, as: 'conditions' }
      ]
    });
    
    if (!tryout) {
      return res.status(404).json({ success: false, error: 'TRY-OUT을 찾을 수 없습니다.' });
    }
    
    // draft 또는 rejected 상태만 제출 가능
    if (tryout.status !== 'draft' && tryout.status !== 'rejected') {
      return res.status(400).json({ success: false, error: '이미 제출된 TRY-OUT입니다.' });
    }
    
    // 필수 필드 검증
    if (!tryout.trial_no || !tryout.trial_date) {
      return res.status(400).json({ success: false, error: '회차와 시험일을 입력해주세요.' });
    }
    
    if (!tryout.conditions || tryout.conditions.length === 0) {
      return res.status(400).json({ success: false, error: '성형 조건을 입력해주세요.' });
    }
    
    // 상태 변경
    await tryout.update({
      status: 'submitted',
      submitted_at: new Date()
    });
    
    // TODO: 본사에 알림 발송
    
    res.json({ success: true, data: tryout });
  } catch (error) {
    console.error('TRY-OUT 제출 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// TRY-OUT 승인
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, use_as_mass_condition } = req.body;
    
    const tryout = await MoldTryout.findByPk(id, {
      include: [{ model: MoldTryoutCondition, as: 'conditions' }]
    });
    
    if (!tryout) {
      return res.status(404).json({ success: false, error: 'TRY-OUT을 찾을 수 없습니다.' });
    }
    
    if (tryout.status !== 'submitted') {
      return res.status(400).json({ success: false, error: '승인 대기 중인 TRY-OUT만 승인할 수 있습니다.' });
    }
    
    // 승인 처리
    await tryout.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      approval_comment: comment,
      use_as_mass_condition: use_as_mass_condition || false
    });
    
    // 양산 기준 조건으로 사용 시 금형사양에 반영
    if (use_as_mass_condition) {
      const { MoldSpec } = require('../models/newIndex');
      
      const moldSpec = await MoldSpec.findOne({ where: { mold_id: tryout.mold_id } });
      
      if (moldSpec) {
        await moldSpec.update({
          recommended_conditions: {
            trial_no: tryout.trial_no,
            machine: tryout.machine_name,
            resin: tryout.resin,
            cycle_sec: tryout.cycle_sec,
            conditions: tryout.conditions.map(c => ({
              category: c.category,
              name: c.name,
              value: c.value,
              unit: c.unit
            }))
          }
        });
      }
    }
    
    // TODO: 제작처/생산처에 알림 발송
    
    res.json({ success: true, data: tryout });
  } catch (error) {
    console.error('TRY-OUT 승인 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// TRY-OUT 반려
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ success: false, error: '반려 사유를 입력해주세요.' });
    }
    
    const tryout = await MoldTryout.findByPk(id);
    
    if (!tryout) {
      return res.status(404).json({ success: false, error: 'TRY-OUT을 찾을 수 없습니다.' });
    }
    
    if (tryout.status !== 'submitted') {
      return res.status(400).json({ success: false, error: '승인 대기 중인 TRY-OUT만 반려할 수 있습니다.' });
    }
    
    // 반려 처리
    await tryout.update({
      status: 'rejected',
      approved_by: req.user.id,
      approved_at: new Date(),
      approval_comment: comment
    });
    
    // TODO: 제작처/생산처에 알림 발송
    
    res.json({ success: true, data: tryout });
  } catch (error) {
    console.error('TRY-OUT 반려 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 승인 대기 목록 조회
exports.getPending = async (req, res) => {
  try {
    const tryouts = await MoldTryout.findAll({
      where: { status: 'submitted' },
      include: [
        { model: Mold, as: 'mold' },
        { model: Company, as: 'maker' },
        { model: Company, as: 'plant' },
        { model: User, as: 'creator' }
      ],
      order: [['submitted_at', 'ASC']]
    });
    
    res.json({ success: true, data: tryouts });
  } catch (error) {
    console.error('승인 대기 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### 2-3. 라우트 등록

**파일:** `server/src/routes/tryout.js`

```javascript
const express = require('express');
const router = express.Router();
const tryoutController = require('../controllers/tryoutController');
const { authenticate, requireRole } = require('../middleware/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 금형별 TRY-OUT 목록 (전체 역할)
router.get(
  '/molds/:moldId/tryouts',
  requireRole('maker', 'developer', 'production'),
  tryoutController.listByMold
);

// TRY-OUT 상세 조회 (전체 역할)
router.get(
  '/tryouts/:id',
  requireRole('maker', 'developer', 'production'),
  tryoutController.getDetail
);

// TRY-OUT 생성/수정 (제작처 + 생산처)
router.post(
  '/molds/:moldId/tryouts',
  requireRole('maker', 'production'),
  tryoutController.createOrUpdate
);

// TRY-OUT 제출 (제작처 + 생산처)
router.post(
  '/tryouts/:id/submit',
  requireRole('maker', 'production'),
  tryoutController.submit
);

// TRY-OUT 승인 (본사)
router.post(
  '/tryouts/:id/approve',
  requireRole('developer'),
  tryoutController.approve
);

// TRY-OUT 반려 (본사)
router.post(
  '/tryouts/:id/reject',
  requireRole('developer'),
  tryoutController.reject
);

// 승인 대기 목록 (본사)
router.get(
  '/tryouts/pending',
  requireRole('developer'),
  tryoutController.getPending
);

module.exports = router;
```

**파일:** `server/src/app.js` (라우트 등록)

```javascript
// 기존 라우트들...
const tryoutRouter = require('./routes/tryout');

// 라우트 등록
app.use('/api/v1', tryoutRouter);
```

---

## 🎨 Phase 3: 프론트엔드 UI 구현

### 3-1. TRY-OUT 히스토리 페이지

**파일:** `client/src/pages/mobile/TryoutHistoryPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function TryoutHistoryPage() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tryouts, setTryouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTryouts();
  }, [moldId]);

  const fetchTryouts = async () => {
    try {
      const response = await fetch(`/api/v1/molds/${moldId}/tryouts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTryouts(data.data);
      }
    } catch (error) {
      console.error('TRY-OUT 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={16} /> 승인됨
          </span>
        );
      case 'submitted':
        return (
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock size={16} /> 승인 대기
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle size={16} /> 반려됨
          </span>
        );
      default:
        return <span className="text-gray-600">작성 중</span>;
    }
  };

  const canCreateTryout = user?.role === 'maker' || user?.role === 'production';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">금형육성(TRY-OUT) 히스토리</h1>
        </div>
      </div>

      {/* 새 TRY-OUT 추가 버튼 */}
      {canCreateTryout && (
        <div className="p-4">
          <button
            onClick={() => navigate(`/mobile/molds/${moldId}/tryout/new`)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            새 TRY-OUT 추가
          </button>
        </div>
      )}

      {/* TRY-OUT 목록 */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : tryouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            TRY-OUT 이력이 없습니다.
          </div>
        ) : (
          tryouts.map((tryout) => (
            <div
              key={tryout.id}
              onClick={() => navigate(`/mobile/tryouts/${tryout.id}`)}
              className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{tryout.trial_no}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(tryout.trial_date).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(tryout.status)}
              </div>
              
              <div className="text-sm text-gray-700 space-y-1">
                <p>사출기: {tryout.machine_name} | 수지: {tryout.resin}</p>
                <p>싸이클: {tryout.cycle_sec}s | 캐비티: {tryout.cavity_used}</p>
              </div>
              
              {tryout.use_as_mass_condition && (
                <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  ⭐ 양산 기준 조건
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 3-2. TRY-OUT 상세/편집 페이지

**파일:** `client/src/pages/mobile/TryoutDetailPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Save, Send } from 'lucide-react';

export default function TryoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tryout, setTryout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic'); // basic, conditions, quality

  useEffect(() => {
    if (id && id !== 'new') {
      fetchTryout();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchTryout = async () => {
    try {
      const response = await fetch(`/api/v1/tryouts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTryout(data.data);
      }
    } catch (error) {
      console.error('TRY-OUT 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 편집 가능 여부
  const canEdit = (user?.role === 'maker' || user?.role === 'production');
  const editable = canEdit && (!tryout || tryout.status === 'draft' || tryout.status === 'rejected');
  
  // 승인 가능 여부
  const canApprove = user?.role === 'developer' && tryout?.status === 'submitted';

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/molds/${tryout.mold_id}/tryouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(tryout)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('저장되었습니다.');
        fetchTryout();
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!confirm('승인 요청하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/v1/tryouts/${tryout.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('승인 요청되었습니다.');
        navigate(-1);
      }
    } catch (error) {
      console.error('제출 오류:', error);
      alert('제출에 실패했습니다.');
    }
  };

  const handleApprove = async () => {
    const useAsMass = confirm(
      '이 조건을 양산 기준 조건으로 사용하시겠습니까?\n(금형사양에 성형 조건이 자동 반영됩니다)'
    );
    
    const comment = prompt('승인 코멘트를 입력하세요.');
    
    try {
      const response = await fetch(`/api/v1/tryouts/${tryout.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment, use_as_mass_condition: useAsMass })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('승인되었습니다.');
        navigate(-1);
      }
    } catch (error) {
      console.error('승인 오류:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    const comment = prompt('반려 사유를 입력하세요. (필수)');
    if (!comment) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/tryouts/${tryout.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('반려되었습니다.');
        navigate(-1);
      }
    } catch (error) {
      console.error('반려 오류:', error);
      alert('반려에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">
              TRY-OUT: {tryout?.trial_no || '새 TRY-OUT'}
            </h1>
          </div>
          
          {/* 버튼 영역 */}
          <div className="flex gap-2">
            {canEdit && editable && (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg"
                >
                  <Save size={16} />
                  저장
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <Send size={16} />
                  제출
                </button>
              </>
            )}
            
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg"
                >
                  승인
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg"
                >
                  반려
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* 탭 */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 ${activeTab === 'basic' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('conditions')}
            className={`flex-1 py-3 ${activeTab === 'conditions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            성형 조건
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex-1 py-3 ${activeTab === 'quality' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            품질 평가
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4">
        {activeTab === 'basic' && (
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">회차</label>
              <input
                type="text"
                value={tryout?.trial_no || ''}
                onChange={(e) => setTryout({ ...tryout, trial_no: e.target.value })}
                disabled={!editable}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="T0, T1, T2, PPAP..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">시험일</label>
              <input
                type="date"
                value={tryout?.trial_date || ''}
                onChange={(e) => setTryout({ ...tryout, trial_date: e.target.value })}
                disabled={!editable}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">사출기</label>
              <input
                type="text"
                value={tryout?.machine_name || ''}
                onChange={(e) => setTryout({ ...tryout, machine_name: e.target.value })}
                disabled={!editable}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            {/* 추가 필드들... */}
          </div>
        )}
        
        {activeTab === 'conditions' && (
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600">성형 조건 입력 UI (구현 예정)</p>
          </div>
        )}
        
        {activeTab === 'quality' && (
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600">품질 평가 UI (구현 예정)</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔗 Phase 4: 메뉴 통합

### 4-1. 금형 상세 드롭다운 메뉴 업데이트

**파일:** `client/src/constants/moldMenus.ts` (수정)

```typescript
// 기존 메뉴에 TRY-OUT 추가
export const moldMenus = {
  // ... 기존 메뉴들
  
  development: {
    label: '금형개발',
    items: [
      {
        id: 'dev-plan',
        label: '개발계획',
        path: '/mobile/molds/:moldId/dev-plan',
        allowedRoles: ['maker', 'developer']  // 제작처, 본사만
      },
      {
        id: 'checklist',
        label: '금형 체크리스트',
        path: '/mobile/molds/:moldId/checklist',
        allowedRoles: ['maker', 'developer']  // 제작처, 본사만
      },
      {
        id: 'hardness',
        label: '경도측정',
        path: '/mobile/molds/:moldId/hardness',
        allowedRoles: ['maker', 'developer']  // 제작처, 본사만
      },
      {
        id: 'tryout',
        label: '금형육성(TRY-OUT)',
        path: '/mobile/molds/:moldId/tryout',
        allowedRoles: ['maker', 'production', 'developer']  // 제작처, 생산처, 본사
      }
    ]
  }
};
```

### 4-2. 라우트 등록

**파일:** `client/src/App.jsx` (추가)

```jsx
import TryoutHistoryPage from './pages/mobile/TryoutHistoryPage';
import TryoutDetailPage from './pages/mobile/TryoutDetailPage';

// 라우트 추가
<Route path="/mobile/molds/:moldId/tryout" element={<TryoutHistoryPage />} />
<Route path="/mobile/tryouts/:id" element={<TryoutDetailPage />} />
```

---

## ✅ Phase 5: 테스트 체크리스트

### 5-1. 제작처 (maker) 테스트

- [ ] QR 로그인 → 금형 상세 → "금형육성" 메뉴 보임
- [ ] 새 TRY-OUT 추가 버튼 보임
- [ ] TRY-OUT 생성 가능 (T0, T1, T2...)
- [ ] draft 상태에서 수정 가능
- [ ] 제출 후 submitted 상태로 변경
- [ ] submitted 상태에서 수정 불가
- [ ] 승인/반려 버튼 안 보임
- [ ] 다른 제작처 금형은 403 에러

### 5-2. 생산처 (production) 테스트

- [ ] QR 로그인 → 금형 상세 → "금형육성" 메뉴 보임
- [ ] 새 TRY-OUT 추가 버튼 보임
- [ ] TRY-OUT 생성 가능 (MASS-001, MASS-002...)
- [ ] draft 상태에서 수정 가능
- [ ] 제출 후 submitted 상태로 변경
- [ ] 다른 공장 금형은 403 에러
- [ ] 개발계획/경도측정 메뉴는 안 보임 (또는 읽기 전용)

### 5-3. 본사 (developer) 테스트

- [ ] 대시보드에서 승인 대기 목록 보임
- [ ] TRY-OUT 상세 조회 가능
- [ ] 내용 수정 불가 (읽기 전용)
- [ ] submitted 상태에서 승인/반려 버튼 보임
- [ ] 승인 시 양산 기준 조건 선택 가능
- [ ] 승인 시 금형사양에 조건 자동 반영 확인
- [ ] 반려 시 코멘트 필수

### 5-4. 통합 테스트

- [ ] 제작처 T0 작성 → 제출 → 본사 승인
- [ ] 생산처 MASS-001 작성 → 제출 → 본사 승인
- [ ] 승인된 조건이 금형사양에 반영되는지 확인
- [ ] 생산처 QR 로그인 → 금형사양에서 추천 조건 조회
- [ ] 다른 모듈(개발계획/체크리스트/경도)은 기존대로 동작하는지 확인

---

## 📝 구현 완료 후 확인사항

### ✅ 백엔드
- [ ] DB 마이그레이션 실행 완료
- [ ] Sequelize 모델 생성 완료
- [ ] 컨트롤러 구현 완료
- [ ] 라우트 등록 완료
- [ ] 권한 체크 로직 동작 확인

### ✅ 프론트엔드
- [ ] TRY-OUT 히스토리 페이지 구현
- [ ] TRY-OUT 상세/편집 페이지 구현
- [ ] 역할별 버튼 표시/숨김 동작 확인
- [ ] 메뉴 통합 완료
- [ ] 라우트 등록 완료

### ✅ 테스트
- [ ] 제작처 시나리오 테스트 완료
- [ ] 생산처 시나리오 테스트 완료
- [ ] 본사 시나리오 테스트 완료
- [ ] 다른 모듈 영향 없음 확인

---

**이 가이드를 따라 구현하면 TRY-OUT 모듈에 생산처 작성 권한이 추가되고, 다른 모듈은 영향받지 않습니다!** 🎉
