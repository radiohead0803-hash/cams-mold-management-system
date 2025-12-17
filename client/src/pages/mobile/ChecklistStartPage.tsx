import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import type { UserRole } from '../../constants/moldMenus';

interface Template {
  id: number;
  name: string;
  category: 'daily' | 'regular';
  shot_interval?: number;
  description?: string;
}

interface Mold {
  id: number;
  code: string;
  name: string;
  shotCounter: number;
  maxShots: number;
}

export default function ChecklistStartPage() {
  const { moldId, category } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const auth = JSON.parse(localStorage.getItem('cams_auth') || '{}');
  const scannedMold = JSON.parse(localStorage.getItem('cams_scanned_mold') || '{}');
  
  const role: UserRole = (state as any)?.role || auth.role || 'production';
  const [mold, setMold] = useState<Mold | null>((state as any)?.mold || scannedMold.mold || null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [moldId, category]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 금형 정보 없으면 백엔드에서 조회
      if (!mold && moldId) {
        const moldRes = await api.get(`/mobile/mold/${moldId}`);
        setMold(moldRes.data.data);
      }

      // 카테고리별 활성 템플릿 조회
      const tmpRes = await api.get(
        `/mobile/molds/${moldId}/checklist-templates`,
        {
          params: { category },
        }
      );
      
      console.log('[ChecklistStart] Templates:', tmpRes.data);
      setTemplates(tmpRes.data.data || []);
    } catch (err: any) {
      console.error('[ChecklistStart] Fetch error:', err);
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (templateId: number) => {
    if (!moldId) return;

    try {
      console.log('[ChecklistStart] Starting checklist:', { moldId, templateId, category, role });

      const res = await api.post(
        `/mobile/molds/${moldId}/checklists/start`,
        {
          templateId,
          siteRole: role,
          category,
        }
      );

      const { instanceId, template } = res.data.data;

      console.log('[ChecklistStart] Instance created:', instanceId);

      // 체크리스트 폼 페이지로 이동
      navigate(`/mobile/checklists/${instanceId}`, {
        state: {
          instanceId,
          template,
          mold,
          role,
        },
      });
    } catch (err: any) {
      console.error('[ChecklistStart] Start error:', err);
      setError(err.response?.data?.message || '체크리스트 시작에 실패했습니다.');
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'daily':
        return '일상점검';
      case 'regular':
        return '정기점검';
      default:
        return '점검';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-500">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-[10px] text-slate-500">금형코드</div>
              <div className="text-sm font-semibold text-slate-900">
                {mold?.code || `M-${moldId}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-600" />
            <span className="text-xs font-semibold text-slate-900">
              {getCategoryLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* 금형 정보 */}
        {mold && (
          <section className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-[10px] text-slate-500 mb-2">금형 정보</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">{mold.name}</div>
              <div className="text-xs text-slate-600">
                현재 샷수: {mold.shotCounter?.toLocaleString() || 0} / {mold.maxShots?.toLocaleString() || 0}
              </div>
            </div>
          </section>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-rose-700">{error}</div>
          </div>
        )}

        {/* 템플릿 선택 */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-900">
            {getCategoryLabel()} 템플릿 선택
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList size={32} className="mx-auto text-slate-300 mb-2" />
              <div className="text-xs text-slate-500">
                사용 가능한 {getCategoryLabel()} 템플릿이 없습니다.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="w-full text-left border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900 mb-1">
                        {template.name}
                      </div>
                      {template.description && (
                        <div className="text-[10px] text-slate-600 mb-1">
                          {template.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                          {template.category === 'daily' ? '일상점검' : '정기점검'}
                        </span>
                        {template.shot_interval && (
                          <span>
                            {template.shot_interval.toLocaleString()} Shot 주기
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-400">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="text-[10px] text-blue-900 font-semibold mb-1">
            💡 점검 시작 안내
          </div>
          <div className="text-[10px] text-blue-700 space-y-0.5">
            <div>• 템플릿을 선택하면 점검이 시작됩니다.</div>
            <div>• 모든 항목을 확인하고 체크해주세요.</div>
            <div>• NG 항목이 있으면 수리요청이 자동 생성됩니다.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
