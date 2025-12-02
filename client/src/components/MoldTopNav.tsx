import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MOLD_MENU_GROUPS, UserRole } from '../constants/moldMenus';
import { ChevronDown } from 'lucide-react';

interface Props {
  role: UserRole;
}

export default function MoldTopNav({ role }: Props) {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const handleGo = (path: string, enabled: boolean) => {
    if (!enabled) return;
    navigate(`/mobile/molds/${moldId}/${path}`, { state: { role } });
    setOpenGroupId(null);
  };

  // 현재 경로에 맞춰 활성 그룹/아이템 찾기
  const currentPath = location.pathname;

  return (
    <nav className="flex items-center gap-2">
      {MOLD_MENU_GROUPS.map((group) => {
        const groupEnabled = group.allowedRoles.includes(role);
        const isOpen = openGroupId === group.id;

        // 현재 경로가 이 그룹에 속하는지 확인
        const isActiveGroup = group.items.some((item) =>
          currentPath.includes(item.path)
        );

        return (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => groupEnabled && setOpenGroupId(group.id)}
            onMouseLeave={() => setOpenGroupId(null)}
          >
            {/* 상단 탭 버튼 */}
            <button
              disabled={!groupEnabled}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium
                flex items-center gap-1 transition-all
                ${
                  groupEnabled
                    ? isActiveGroup
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                }
              `}
            >
              {group.label}
              {groupEnabled && (
                <ChevronDown 
                  size={12} 
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* 드롭다운 메뉴 */}
            {groupEnabled && isOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                {group.items.map((item) => {
                  const itemEnabled = item.allowedRoles.includes(role);
                  const active = currentPath.includes(item.path);

                  return (
                    <button
                      key={item.id}
                      disabled={!itemEnabled}
                      onClick={() => handleGo(item.path, itemEnabled)}
                      className={`
                        w-full text-left px-4 py-2 text-xs
                        transition-colors
                        ${
                          itemEnabled
                            ? active
                              ? 'bg-slate-900 text-white font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                            : 'text-slate-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {item.label}
                      {!itemEnabled && (
                        <span className="ml-2 text-[10px]">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
