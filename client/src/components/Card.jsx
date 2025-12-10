// 기본 카드 컴포넌트
export default function Card({ 
  children, 
  className = '',
  padding = 'md',
  hover = false,
  onClick = null
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200
        ${paddings[padding] || paddings.md}
        ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// 카드 헤더
export function CardHeader({ title, subtitle, action, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon size={20} className="text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// 카드 바디
export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

// 카드 푸터
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// 통계 카드
export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // 'up' | 'down' | 'neutral'
  icon: Icon,
  color = 'blue',
  onClick
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const changeColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <Card hover={!!onClick} onClick={onClick} padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {changeType === 'up' && '↑ '}
              {changeType === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color] || colors.blue}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  );
}

// 리스트 카드
export function ListCard({ title, items, emptyMessage = '항목이 없습니다', action }) {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      {items.length === 0 ? (
        <p className="text-center text-gray-500 py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon size={18} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
                </div>
              </div>
              {item.value && (
                <span className="text-sm font-medium text-gray-600">{item.value}</span>
              )}
              {item.action && item.action}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
