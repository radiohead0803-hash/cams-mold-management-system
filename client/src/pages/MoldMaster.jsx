import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { moldSpecificationAPI } from '../lib/api';
import { Search, Filter, Eye, FileText, BarChart3, TrendingUp, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react';

export default function MoldMaster() {
  const { user } = useAuthStore();
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getAll({ limit: 100 });
      const specifications = response.data.data.items || [];

      // API 응답 데이터를 화면 표시 형식으로 변환
      const transformedMolds = specifications.map(spec => {
        // part_images JSONB에서 첫 번째 이미지 URL 추출
        let imageUrl = null;
        if (spec.part_images) {
          if (typeof spec.part_images === 'string') {
            try {
              const parsed = JSON.parse(spec.part_images);
              imageUrl = parsed?.url || null;
            } catch (e) {
              console.error('Failed to parse part_images:', e);
            }
          } else if (spec.part_images?.url) {
            imageUrl = spec.part_images.url;
          }
        }

        const makerCompany = spec.makerCompany || spec.MakerCompany;
        const plantCompany = spec.plantCompany || spec.PlantCompany;

        return {
          id: spec.id,
          mold_code: spec.mold_code || spec.mold?.mold_code || spec.Mold?.mold_code || `M-2025-${String(spec.id).padStart(3, '0')}`,
          part_number: spec.part_number,
          part_name: spec.part_name,
          car_model: spec.car_model,
          car_year: spec.car_year,
          mold_type: spec.mold_type,
          cavity_count: spec.cavity_count,
          material: spec.material,
          tonnage: spec.tonnage,
          status: spec.status || 'draft',
          current_location: spec.current_location || plantCompany?.company_name || '본사',
          maker_company: makerCompany?.company_name || '-',
          plant_company: plantCompany?.company_name || '-',
          development_stage: spec.development_stage || '-',
          production_stage: spec.production_stage || '-',
          order_date: spec.order_date,
          target_delivery_date: spec.target_delivery_date,
          estimated_cost: spec.estimated_cost,
          notes: spec.notes,
          image_url: imageUrl,
          total_shots: spec.total_shots || 0
        };
      });
      
      setMolds(transformedMolds);
    } catch (error) {
      console.error('Failed to load molds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    const matchesSearch = 
      mold.mold_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.car_model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || mold.status === statusFilter;
    const matchesStage = stageFilter === 'all' || mold.development_stage === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  // 통계 계산
  const calculateStats = () => {
    const total = molds.length;
    const byStatus = {
      draft: molds.filter(m => m.status === 'draft').length,
      planning: molds.filter(m => m.status === 'planning').length,
      design: molds.filter(m => m.status === 'design').length,
      manufacturing: molds.filter(m => m.status === 'manufacturing').length,
      trial: molds.filter(m => m.status === 'trial').length,
      production: molds.filter(m => m.status === 'production').length
    };
    
    const totalShots = molds.reduce((sum, m) => sum + (m.total_shots || 0), 0);
    const inProduction = molds.filter(m => m.status === 'production').length;
    
    return {
      total,
      byStatus,
      totalShots,
      inProduction
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      planning: 'bg-indigo-100 text-indigo-800',
      design: 'bg-blue-100 text-blue-800',
      manufacturing: 'bg-orange-100 text-orange-800',
      trial: 'bg-purple-100 text-purple-800',
      production: 'bg-green-100 text-green-800'
    };
    return styles[status] || styles.draft;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: '초안',
      planning: '계획',
      design: '설계',
      manufacturing: '제작',
      trial: '시운전',
      production: '양산'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형관리 마스터</h1>
          <p className="text-sm text-gray-600 mt-1">
            전체 {molds.length}개의 금형 (mold_specifications 기준)
          </p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <BarChart3 size={18} />
          <span>{showStats ? '통계 숨기기' : '통계 보기'}</span>
        </button>
      </div>

      {/* 통계 */}
      {showStats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">전체 금형</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">초안</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.byStatus.draft}</p>
              </div>
              <Clock className="text-gray-600" size={32} />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">제작 중</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{stats.byStatus.manufacturing}</p>
              </div>
              <TrendingUp className="text-orange-600" size={32} />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">양산 중</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.byStatus.production}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">누적 타수</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.totalShots.toLocaleString()}</p>
              </div>
              <BarChart3 className="text-indigo-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="금형코드, 부품번호, 부품명, 차종 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input flex-1"
            >
              <option value="all">전체 상태</option>
              <option value="draft">초안</option>
              <option value="planning">계획</option>
              <option value="design">설계</option>
              <option value="manufacturing">제작</option>
              <option value="trial">시운전</option>
              <option value="production">양산</option>
            </select>
          </div>
          
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">전체 개발단계</option>
              <option value="개발">개발</option>
              <option value="양산">양산</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredMolds.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">금형이 없습니다.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className={`overflow-x-auto ${filteredMolds.length > 10 ? 'max-h-[560px] overflow-y-auto' : ''}`}>
            <table className="min-w-max w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이미지</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형코드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">부품번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">부품명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">차종</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형타입</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제작처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생산처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">개발단계</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생산단계</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cavity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">재질</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">톤수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMolds.map((mold) => (
                  <tr key={mold.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.image_url ? (
                        <img
                          src={mold.image_url}
                          alt={mold.part_name}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mold.mold_code}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.part_number || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.part_name || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.car_model || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.mold_type || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(mold.status)}`}>
                        {getStatusLabel(mold.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.maker_company}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.plant_company}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.development_stage}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.production_stage}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.cavity_count || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.material || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.tonnage ? `${mold.tonnage}T` : '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.current_location}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link
                        to={`/molds/specifications/${mold.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye size={16} />
                        <span>상세</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{filteredMolds.length}</span>건의 금형이 조회되었습니다.
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">👉</span>
                좌우로 스크롤하여 추가 정보를 확인하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
