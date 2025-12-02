import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import QRLogin from './pages/QRLogin'
import Dashboard from './pages/Dashboard'
import SystemAdminDashboard from './pages/dashboards/SystemAdminDashboard'
import MoldDeveloperDashboard from './pages/dashboards/MoldDeveloperDashboard'
import MakerDashboard from './pages/dashboards/MakerDashboard'
import PlantDashboard from './pages/dashboards/PlantDashboard'
import MakerMobileDashboard from './pages/dashboards/MakerMobileDashboard'
import PlantMobileDashboard from './pages/dashboards/PlantMobileDashboard'
import DeveloperMobileDashboard from './pages/dashboards/DeveloperMobileDashboard'
import MoldList from './pages/MoldList'
import MoldDetail from './pages/MoldDetail'
import MoldRegistration from './pages/MoldRegistration'
import MoldNew from './pages/MoldNew'
import MoldBulkUpload from './pages/MoldBulkUpload'
import MoldMaster from './pages/MoldMaster'
import MoldLifecycle from './pages/MoldLifecycle'
import MoldSpecificationDetail from './pages/MoldSpecificationDetail'
import DailyChecklist from './pages/DailyChecklistNew'
import PeriodicInspection from './pages/PeriodicInspectionNew'
import TransferManagement from './pages/TransferManagement'
import Alerts from './pages/Alerts'
import ChecklistMaster from './pages/ChecklistMaster'
import RepairManagement from './pages/RepairManagement'
import MoldDocuments from './pages/MoldDocuments'
import MoldPhotoGallery from './pages/MoldPhotoGallery'
import CompanyManagement from './pages/CompanyManagement'
import CompanyDetail from './pages/CompanyDetail'
import UserRequests from './pages/UserRequests'
import MasterData from './pages/MasterData'
import ScanInfoPage from './pages/ScanInfoPage'
import RepairRequestPage from './pages/RepairRequestPage'
import HqRepairListPage from './pages/HqRepairListPage'
import MakerRepairListPage from './pages/MakerRepairListPage'
import MoldOverviewPage from './pages/mobile/MoldOverviewPage'
import ChecklistStartPage from './pages/mobile/ChecklistStartPage'
import RepairRequestListPage from './pages/mobile/RepairRequestListPage'
import QrScanPage from './pages/qr/QrScanPage'
import DailyInspectionPageQr from './pages/qr/DailyInspectionPage'
import PeriodicInspectionPageQr from './pages/qr/PeriodicInspectionPage'
import DailyInspectionPage from './pages/inspections/DailyInspectionPage'
import PeriodicInspectionPage from './pages/inspections/PeriodicInspectionPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { isAuthenticated, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/qr-login" element={<QRLogin />} />
      <Route path="/scan-info" element={<ScanInfoPage />} />
      <Route path="/repair-request" element={<RepairRequestPage />} />
      
      {/* Mobile Routes */}
      <Route path="/mobile/molds/:moldId" element={<MoldOverviewPage />} />
      <Route path="/mobile/molds/:moldId/check/:category" element={<ChecklistStartPage />} />
      <Route path="/mobile/molds/:moldId/repair/requests" element={<RepairRequestListPage />} />
      <Route path="/mobile/molds/:moldId/repair/progress" element={<RepairRequestListPage showStatusOnly />} />
      
      {/* QR Scan and Inspection Routes */}
      <Route path="/qr/scan" element={<ProtectedRoute allowedRoles={['plant', 'maker']}><QrScanPage /></ProtectedRoute>} />
      
      {/* Old routes with query params (backward compatibility) */}
      <Route path="/qr/daily-inspection/:sessionId" element={<ProtectedRoute allowedRoles={['plant']}><DailyInspectionPageQr /></ProtectedRoute>} />
      <Route path="/qr/periodic-inspection/:sessionId" element={<ProtectedRoute allowedRoles={['plant']}><PeriodicInspectionPageQr /></ProtectedRoute>} />
      
      {/* New routes with path params */}
      <Route path="/qr/daily-inspection/:sessionId/:moldId" element={<ProtectedRoute allowedRoles={['plant']}><DailyInspectionPage /></ProtectedRoute>} />
      <Route path="/qr/periodic-inspection/:sessionId/:moldId" element={<ProtectedRoute allowedRoles={['plant']}><PeriodicInspectionPage /></ProtectedRoute>} />
      
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard/admin" element={<SystemAdminDashboard />} />
        <Route path="dashboard/developer" element={<MoldDeveloperDashboard />} />
        <Route path="dashboard/maker" element={<MakerDashboard />} />
        <Route path="dashboard/plant" element={<PlantDashboard />} />
        <Route path="mobile/maker" element={<MakerMobileDashboard />} />
        <Route path="mobile/plant" element={<PlantMobileDashboard />} />
        <Route path="mobile/developer" element={<DeveloperMobileDashboard />} />
        <Route path="molds" element={<MoldList />} />
        <Route path="molds/new" element={<MoldNew />} />
        <Route path="molds/register" element={<MoldRegistration />} />
        <Route path="molds/bulk-upload" element={<MoldBulkUpload />} />
        <Route path="molds/master" element={<MoldMaster />} />
        <Route path="molds/lifecycle" element={<MoldLifecycle />} />
        <Route path="molds/specifications/:id" element={<MoldSpecificationDetail />} />
        <Route path="molds/:id" element={<MoldDetail />} />
        <Route path="checklist/daily" element={<DailyChecklist />} />
        <Route path="inspection/periodic" element={<PeriodicInspection />} />
        <Route path="transfers" element={<TransferManagement />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="checklist-master" element={<ChecklistMaster />} />
        <Route path="repairs" element={<RepairManagement />} />
        <Route path="molds/:id/documents" element={<MoldDocuments />} />
        <Route path="molds/:id/photos" element={<MoldPhotoGallery />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="user-requests" element={<UserRequests />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="hq/repair-requests" element={<HqRepairListPage />} />
        <Route path="maker/repair-requests" element={<MakerRepairListPage />} />
      </Route>
    </Routes>
  )
}

export default App
