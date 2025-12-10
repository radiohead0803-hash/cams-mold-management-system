import { useState } from 'react';

// 탭 컴포넌트
export default function Tabs({ 
  tabs, 
  defaultTab, 
  onChange,
  variant = 'underline', // 'underline' | 'pills' | 'boxed'
  className = '' 
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variants = {
    underline: {
      container: 'border-b border-gray-200',
      tab: (active) => `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active 
          ? 'text-blue-600 border-blue-600' 
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
      }`,
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: (active) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      }`,
    },
    boxed: {
      container: 'border border-gray-200 rounded-lg p-1',
      tab: (active) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`,
    }
  };

  const style = variants[variant] || variants.underline;

  return (
    <div className={`flex ${style.container} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={style.tab(activeTab === tab.id)}
          disabled={tab.disabled}
        >
          <span className="flex items-center gap-2">
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// 탭 패널 컴포넌트
export function TabPanel({ children, value, activeValue }) {
  if (value !== activeValue) return null;
  return <div className="py-4">{children}</div>;
}

// 탭 컨테이너 (탭 + 패널 통합)
export function TabContainer({ 
  tabs, 
  defaultTab,
  variant = 'underline',
  className = '' 
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      <Tabs 
        tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon, count: t.count }))} 
        defaultTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
      />
      {tabs.map((tab) => (
        <TabPanel key={tab.id} value={tab.id} activeValue={activeTab}>
          {tab.content}
        </TabPanel>
      ))}
    </div>
  );
}
