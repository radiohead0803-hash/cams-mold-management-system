# 금형 문제점 개선 현황 대시보드

## 📊 헤더 집계 및 시각화 기능

### 1. 실시간 집계 데이터 구조

```javascript
{
  // 전체 집계
  summary: {
    total: 156,              // 전체 문제점
    completed: 89,           // 개선 완료
    in_progress: 45,         // 개선 중
    pending: 15,             // 대기 중
    delayed: 7,              // 지연
    completion_rate: 57      // 완료율 (%)
  },
  
  // 차종별 집계
  by_car_model: [
    {
      car_model: "GV80",
      total: 65,
      completed: 42,
      in_progress: 18,
      delayed: 5,
      completion_rate: 65
    },
    {
      car_model: "G80",
      total: 48,
      completed: 30,
      in_progress: 15,
      delayed: 3,
      completion_rate: 63
    },
    {
      car_model: "GV70",
      total: 32,
      completed: 12,
      in_progress: 18,
      delayed: 2,
      completion_rate: 38
    },
    {
      car_model: "G90",
      total: 11,
      completed: 5,
      in_progress: 6,
      delayed: 0,
      completion_rate: 45
    }
  ],
  
  // 문제 유형별 집계
  by_issue_type: [
    {
      issue_type: "설계 불량",
      count: 45,
      percentage: 29
    },
    {
      issue_type: "외관 불량",
      count: 38,
      percentage: 24
    },
    {
      issue_type: "치수 불량",
      count: 32,
      percentage: 21
    },
    {
      issue_type: "성형 불량",
      count: 28,
      percentage: 18
    },
    {
      issue_type: "금형 수리",
      count: 13,
      percentage: 8
    }
  ],
  
  // 단계별 집계
  by_stage: [
    {
      to_stage: "P1",
      count: 35
    },
    {
      to_stage: "T1",
      count: 28
    },
    {
      to_stage: "SOP",
      count: 22
    },
    {
      to_stage: "PRODUCTION",
      count: 18
    }
  ]
}
```

---

## 🔌 API 엔드포인트

### 1. 집계 데이터 조회

```javascript
// 전체 집계 조회
GET /api/mold-issues/statistics
Query Parameters:
  - car_model: 차종 필터 (선택)
  - to_stage: 단계 필터 (선택)
  - issue_type: 문제유형 필터 (선택)
  - status: 상태 필터 (선택)
  - keyword: 키워드 검색 (선택)
  - date_from: 시작일 (선택)
  - date_to: 종료일 (선택)

Response:
{
  summary: {
    total: 156,
    completed: 89,
    in_progress: 45,
    pending: 15,
    delayed: 7,
    completion_rate: 57
  },
  by_car_model: [...],
  by_issue_type: [...],
  by_stage: [...]
}

// 차종별 집계 조회
GET /api/mold-issues/statistics/by-car-model
Response:
{
  car_models: [
    {
      car_model: "GV80",
      total: 65,
      completed: 42,
      in_progress: 18,
      delayed: 5,
      completion_rate: 65
    }
  ]
}

// 문제 유형별 집계 조회
GET /api/mold-issues/statistics/by-issue-type
Response:
{
  issue_types: [
    {
      issue_type: "설계 불량",
      count: 45,
      percentage: 29
    }
  ]
}
```

---

## 💻 백엔드 로직 (SQL)

### 1. 전체 집계 쿼리

```sql
-- 전체 집계
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as pending,
  SUM(CASE 
    WHEN status != 'completed' 
    AND target_completion_date < CURRENT_DATE 
    THEN 1 ELSE 0 
  END) as delayed,
  ROUND(
    (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
    0
  ) as completion_rate
FROM mold_issues
WHERE 1=1
  AND ($1::VARCHAR IS NULL OR car_model = $1)
  AND ($2::VARCHAR IS NULL OR to_stage = $2)
  AND ($3::VARCHAR IS NULL OR issue_type = $3)
  AND ($4::VARCHAR IS NULL OR status = $4)
  AND ($5::VARCHAR IS NULL OR (
    issue_description ILIKE '%' || $5 || '%' OR
    part_number ILIKE '%' || $5 || '%' OR
    part_name ILIKE '%' || $5 || '%'
  ));
```

### 2. 차종별 집계 쿼리

```sql
-- 차종별 집계
SELECT 
  car_model,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE 
    WHEN status != 'completed' 
    AND target_completion_date < CURRENT_DATE 
    THEN 1 ELSE 0 
  END) as delayed,
  ROUND(
    (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
    0
  ) as completion_rate
FROM mold_issues
WHERE 1=1
  AND ($1::VARCHAR IS NULL OR car_model = $1)
GROUP BY car_model
ORDER BY total DESC;
```

### 3. 문제 유형별 집계 쿼리

```sql
-- 문제 유형별 집계
SELECT 
  issue_type,
  COUNT(*) as count,
  ROUND(
    (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM mold_issues)) * 100, 
    0
  ) as percentage
FROM mold_issues
WHERE 1=1
  AND ($1::VARCHAR IS NULL OR car_model = $1)
GROUP BY issue_type
ORDER BY count DESC;
```

---

## 🎨 프론트엔드 컴포넌트 (React)

### 1. 대시보드 헤더 컴포넌트

```javascript
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function MoldIssueDashboardHeader({ filters, onFilterChange }) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 집계 데이터 로드
  useEffect(() => {
    loadStatistics();
  }, [filters]);
  
  async function loadStatistics() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/mold-issues/statistics?${queryParams}`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  return (
    <div className="dashboard-header">
      {/* 전체 집계 카드 */}
      <div className="summary-cards">
        <SummaryCard
          icon="📋"
          title="전체 문제점"
          value={statistics.summary.total}
          color="blue"
        />
        <SummaryCard
          icon="✅"
          title="개선 완료"
          value={statistics.summary.completed}
          percentage={statistics.summary.completion_rate}
          color="green"
        />
        <SummaryCard
          icon="🔄"
          title="개선 중"
          value={statistics.summary.in_progress}
          percentage={Math.round((statistics.summary.in_progress / statistics.summary.total) * 100)}
          color="orange"
        />
        <SummaryCard
          icon="⏸️"
          title="대기 중"
          value={statistics.summary.pending}
          percentage={Math.round((statistics.summary.pending / statistics.summary.total) * 100)}
          color="gray"
        />
        <SummaryCard
          icon="🚨"
          title="지연"
          value={statistics.summary.delayed}
          percentage={Math.round((statistics.summary.delayed / statistics.summary.total) * 100)}
          color="red"
        />
      </div>
      
      {/* 차종별 현황 */}
      <div className="car-model-statistics">
        <h3>📈 차종별 현황</h3>
        <table className="statistics-table">
          <thead>
            <tr>
              <th>차종</th>
              <th>전체</th>
              <th>완료</th>
              <th>진행중</th>
              <th>지연</th>
              <th>진행률</th>
            </tr>
          </thead>
          <tbody>
            {statistics.by_car_model.map((item) => (
              <tr key={item.car_model}>
                <td>{item.car_model}</td>
                <td>{item.total}</td>
                <td>{item.completed}</td>
                <td>{item.in_progress}</td>
                <td>{item.delayed}</td>
                <td>
                  <ProgressBar value={item.completion_rate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 문제 유형별 현황 */}
      <div className="issue-type-statistics">
        <h3>🏷️ 문제 유형별 현황</h3>
        <div className="issue-type-bars">
          {statistics.by_issue_type.map((item) => (
            <div key={item.issue_type} className="issue-type-bar">
              <span className="label">{item.issue_type}</span>
              <span className="count">{item.count}</span>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="percentage">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 요약 카드 컴포넌트
function SummaryCard({ icon, title, value, percentage, color }) {
  return (
    <div className={`summary-card ${color}`}>
      <div className="icon">{icon}</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="value">{value}</div>
        {percentage !== undefined && (
          <div className="percentage">({percentage}%)</div>
        )}
      </div>
    </div>
  );
}

// 진행률 바 컴포넌트
function ProgressBar({ value }) {
  const getColor = (value) => {
    if (value >= 70) return '#4caf50';  // 초록색
    if (value >= 40) return '#ff9800';  // 주황색
    return '#f44336';  // 빨간색
  };
  
  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar-fill" 
        style={{ 
          width: `${value}%`,
          backgroundColor: getColor(value)
        }}
      />
      <span className="progress-text">{value}%</span>
    </div>
  );
}

export default MoldIssueDashboardHeader;
```

### 2. 필터 및 검색 컴포넌트

```javascript
function FilterBar({ filters, onFilterChange }) {
  const [keyword, setKeyword] = useState('');
  
  function handleKeywordSearch(e) {
    e.preventDefault();
    onFilterChange({ ...filters, keyword });
  }
  
  return (
    <div className="filter-bar">
      <div className="filters">
        <select 
          value={filters.car_model || ''} 
          onChange={(e) => onFilterChange({ ...filters, car_model: e.target.value })}
        >
          <option value="">차종 전체</option>
          <option value="GV80">GV80</option>
          <option value="G80">G80</option>
          <option value="GV70">GV70</option>
          <option value="G90">G90</option>
        </select>
        
        <select 
          value={filters.to_stage || ''} 
          onChange={(e) => onFilterChange({ ...filters, to_stage: e.target.value })}
        >
          <option value="">단계 전체</option>
          <option value="PROTO">PROTO</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="M">M</option>
          <option value="SOP">SOP</option>
          <option value="PRODUCTION">PRODUCTION</option>
        </select>
        
        <select 
          value={filters.issue_type || ''} 
          onChange={(e) => onFilterChange({ ...filters, issue_type: e.target.value })}
        >
          <option value="">문제유형 전체</option>
          <option value="설계 불량">설계 불량</option>
          <option value="외관 불량">외관 불량</option>
          <option value="치수 불량">치수 불량</option>
          <option value="성형 불량">성형 불량</option>
          <option value="금형 수리">금형 수리</option>
        </select>
        
        <select 
          value={filters.status || ''} 
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
        >
          <option value="">상태 전체</option>
          <option value="registered">등록</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
        </select>
      </div>
      
      <form onSubmit={handleKeywordSearch} className="search-form">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드 입력... (품번, 품명, 문제점)"
          className="search-input"
        />
        <button type="submit" className="search-button">
          🔍 검색
        </button>
      </form>
    </div>
  );
}
```

---

## 🎨 CSS 스타일

```css
/* 대시보드 헤더 */
.dashboard-header {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 요약 카드 */
.summary-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.summary-card {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-card .icon {
  font-size: 32px;
}

.summary-card .content {
  flex: 1;
}

.summary-card .title {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.summary-card .value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.summary-card .percentage {
  font-size: 14px;
  color: #666;
}

/* 차종별 현황 테이블 */
.car-model-statistics {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.statistics-table {
  width: 100%;
  border-collapse: collapse;
}

.statistics-table th,
.statistics-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.statistics-table th {
  background: #f5f5f5;
  font-weight: bold;
}

/* 진행률 바 */
.progress-bar-container {
  position: relative;
  width: 200px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
}

/* 문제 유형별 현황 */
.issue-type-statistics {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.issue-type-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issue-type-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.issue-type-bar .label {
  width: 120px;
  font-weight: bold;
}

.issue-type-bar .count {
  width: 50px;
  text-align: right;
}

.issue-type-bar .bar-container {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.issue-type-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196f3, #1976d2);
  transition: width 0.3s ease;
}

.issue-type-bar .percentage {
  width: 50px;
  text-align: right;
  font-weight: bold;
}

/* 필터 바 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-form {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
  font-size: 14px;
}

.search-button {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-button:hover {
  background: #1976d2;
}
```

---

## 📊 실시간 업데이트

```javascript
// WebSocket을 통한 실시간 업데이트
function useRealtimeStatistics(filters) {
  const [statistics, setStatistics] = useState(null);
  
  useEffect(() => {
    // WebSocket 연결
    const ws = new WebSocket('ws://localhost:3000/ws/mold-issues-statistics');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatistics(data);
    };
    
    // 필터 변경 시 서버에 전송
    ws.send(JSON.stringify({ type: 'filter', filters }));
    
    return () => ws.close();
  }, [filters]);
  
  return statistics;
}
```
