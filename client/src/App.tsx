import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DailyInspectionPage from './pages/inspections/DailyInspectionPage';
// ... other imports

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes */}
        <Route path="/checklist/daily" element={<DailyInspectionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
