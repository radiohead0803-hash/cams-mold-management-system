import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, ArrowLeft, Save, Settings, Calendar, Wrench, 
  Trash2, FileCheck, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import api from '../lib/api';

// 알림 유형 설정
const NOTIFICATION_TYPES = [
  {
    category: '점검 알림',
    icon: Calendar,
    color: 'blue',
    items: [
      { key: 'inspection_due_shots', label: '타수 기준 점검 예정', description: '목표 타수 90% 도달 시' },
      { key: 'inspection_due_date', label: '일자 기준 점검 예정', description: 'D-7, D-3, D-1 알림' },
      { key: 'inspection_overdue', label: '점검 지연', description: '예정일 초과 시' }
    ]
  },
  {
    category: '유지보전 알림',
    icon: Wrench,
    color: 'orange',
    items: [
      { key: 'maintenance_due', label: '유지보전 예정', description: '다음 유지보전 예정일/타수 도달 시' },
      { key: 'maintenance_completed', label: '유지보전 완료', description: '유지보전 작업 완료 시' }
    ]
  },
  {
    category: '체크리스트 알림',
    icon: FileCheck,
    color: 'green',
    items: [
      { key: 'pre_production_checklist_reminder', label: '제작전 체크리스트 알림', description: 'D-7, D-5, D-3, D-1 알림' },
      { key: 'pre_production_checklist_submitted', label: '체크리스트 제출', description: '체크리스트 제출 시' },
      { key: 'pre_production_checklist_approved', label: '체크리스트 승인', description: '체크리스트 승인 시' },
      { key: 'pre_production_checklist_rejected', label: '체크리스트 반려', description: '체크리스트 반려 시' }
    ]
  },
  {
    category: '폐기 알림',
    icon: Trash2,
    color: 'red',
    items: [
      { key: 'scrapping_requested', label: '폐기 요청', description: '새 폐기 요청 시' },
      { key: 'scrapping_approved', label: '폐기 승인', description: '폐기 승인 완료 시' }
    ]
  },
  {
    category: '수리 알림',
    icon: AlertTriangle,
    color: 'yellow',
    items: [
      { key: 'repair_requested', label: '수리 요청', description: '새 수리 요청 시' },
      { key: 'repair_status', label: '수리 상태 변경', description: '수리 진행 상태 변경 시' },
      { key: 'liability_negotiation', label: '귀책 협의', description: '귀책 협의 필요 시' }
    ]
  },
  {
    category: '이관 알림',
    icon: Clock,
    color: 'purple',
    items: [
      { key: 'transfer_requested', label: '이관 요청', description: '새 이관 요청 시' },
      { key: 'transfer_4m_required', label: '4M 체크리스트 필요', description: '4M 체크리스트 작성 필요 시' }
    ]
  }
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // 기본값으로 모든 알림 활성화
      const defaultSettings = {};
      NOTIFICATION_TYPES.forEach(category => {
        category.items.forEach(item => {
          defaultSettings[item.key] = { enabled: true, email: false, push: true };
        });
      });
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key, field) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: !prev[key]?.[field]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // 설정 저장 API 호출 (추후 구현)
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunAlertCheck = async () => {
    try {
      const response = await api.post('/alerts/check-all');
      if (response.data.success) {
        const { maintenance, inspection } = response.data.data;
        alert(`알람 체크 완료!\n- 유지보전: ${maintenance.dateAlerts + maintenance.shotsAlerts}건\n- 정기점검: ${inspection.shotsAlerts + inspection.dateAlerts}건`);
      }
    } catch (error) {
      console.error('Failed to run alert check:', error);
      alert('알람 체크에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">로딩 중...</div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
            <p className="text-sm text-gray-600 mt-1">알림 유형별 수신 설정을 관리합니다</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRunAlertCheck}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Bell size={18} />
            알람 체크 실행
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>

      {/* 알림 유형별 설정 */}
      <div className="space-y-6">
        {NOTIFICATION_TYPES.map((category) => {
          const Icon = category.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            orange: 'bg-orange-100 text-orange-600',
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            purple: 'bg-purple-100 text-purple-600'
          };

          return (
            <div key={category.category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 카테고리 헤더 */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[category.color]}`}>
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{category.category}</h2>
              </div>

              {/* 알림 항목 */}
              <div className="divide-y divide-gray-100">
                {category.items.map((item) => (
                  <div key={item.key} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* 앱 알림 */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[item.key]?.enabled ?? true}
                          onChange={() => handleToggle(item.key, 'enabled')}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">앱</span>
                      </label>
                      {/* 푸시 알림 */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[item.key]?.push ?? true}
                          onChange={() => handleToggle(item.key, 'push')}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">푸시</span>
                      </label>
                      {/* 이메일 알림 */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[item.key]?.email ?? false}
                          onChange={() => handleToggle(item.key, 'email')}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">이메일</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 알림 테스트 섹션 */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 테스트</h3>
        <p className="text-sm text-gray-600 mb-4">
          예방 알람 체크를 수동으로 실행하여 유지보전 예정, 정기점검 예정 알림을 생성합니다.
        </p>
        <button
          onClick={handleRunAlertCheck}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Settings size={18} />
          예방 알람 체크 실행
        </button>
      </div>
    </div>
  );
}
