import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import MoldDetailNew from './pages/MoldDetailNew'
import DailyChecklist from './pages/DailyChecklistNew'
import PeriodicInspection from './pages/PeriodicInspectionNew'
import TransferManagement from './pages/TransferManagement'
import TransferRequest from './pages/TransferRequest'
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
import MoldDevelopmentPlan from './pages/MoldDevelopmentPlan'
import MoldChecklist from './pages/MoldChecklist'
import HardnessMeasurement from './pages/HardnessMeasurement'
import MoldSpecification from './pages/MoldSpecification'
import InjectionHistory from './pages/InjectionHistory'
import InjectionStats from './pages/InjectionStats'
import InjectionCondition from './pages/InjectionCondition'
import MoldOverviewPage from './pages/mobile/MoldOverviewPage'
import ChecklistStartPage from './pages/mobile/ChecklistStartPage'
import RepairRequestListPage from './pages/mobile/RepairRequestListPage'
import MobileQRLogin from './pages/mobile/MobileQRLogin'
import MobileMoldDetail from './pages/mobile/MobileMoldDetailNew'
import MobileQRScan from './pages/mobile/MobileQRScan'
import MobileDevelopmentPlan from './pages/mobile/MobileDevelopmentPlan'
import MobileMoldChecklist from './pages/mobile/MobileMoldChecklist'
import MobileMoldNurturing from './pages/mobile/MobileMoldNurturing'
import MobileHardnessMeasurement from './pages/mobile/MobileHardnessMeasurement'
import MobileMoldSpecification from './pages/mobile/MobileMoldSpecification'
import MobileInjectionCondition from './pages/mobile/MobileInjectionCondition'
import MobileInjectionHistory from './pages/mobile/MobileInjectionHistory'
import MobileInjectionStats from './pages/mobile/MobileInjectionStats'
import MobileTransferRequest from './pages/mobile/MobileTransferRequest'
import MobileTransferList from './pages/mobile/MobileTransferList'
import MobileTryoutIssue from './pages/mobile/MobileTryoutIssue'
import MobileInspectionApproval from './pages/mobile/MobileInspectionApproval'
import MobileRepairRequestForm from './pages/mobile/MobileRepairRequestForm'
import MobileMaintenancePage from './pages/mobile/MobileMaintenancePage'
import MobilePreProductionChecklist from './pages/mobile/MobilePreProductionChecklist'
import MobileScrappingPage from './pages/mobile/MobileScrappingPage'
import MobileHomePage from './pages/mobile/MobileHomePage'
import MobileAlerts from './pages/mobile/MobileAlerts'
import MobileReports from './pages/mobile/MobileReports'
import MobileMoldList from './pages/mobile/MobileMoldList'
import MobileMoldHistory from './pages/mobile/MobileMoldHistory'
import MobileQRSessions from './pages/mobile/MobileQRSessions'
import MobileLocationMap from './pages/mobile/MobileLocationMap'
import MobileProfile from './pages/mobile/MobileProfile'
import InspectionApproval from './pages/InspectionApproval'
import RepairRequestForm from './pages/RepairRequestForm'
import StandardDocumentMaster from './pages/StandardDocumentMaster'
import ScrappingManagement from './pages/ScrappingManagement'
import MaintenanceManagement from './pages/MaintenanceManagement'
import NotificationSettings from './pages/NotificationSettings'
import Reports from './pages/Reports'
import MoldHistory from './pages/MoldHistory'
import QRSessionsPage from './pages/QRSessionsPage'
import MoldLocationMapPage from './pages/MoldLocationMapPage'
import ProductionTransferChecklistMaster from './pages/ProductionTransferChecklistMaster'
import InternalUsers from './pages/InternalUsers'
import PartnerUsers from './pages/PartnerUsers'
import QrScanPage from './pages/qr/QrScanPage'
import DailyInspectionPageQr from './pages/qr/DailyInspectionPage'
import PeriodicInspectionPageQr from './pages/qr/PeriodicInspectionPage'
import DailyInspectionPage from './pages/inspections/DailyInspectionPage'
import PeriodicInspectionPage from './pages/inspections/PeriodicInspectionPage'
import ProtectedRoute from './components/ProtectedRoute'

function PeriodicAlias() {
  const location = useLocation()
  return <Navigate to={`/inspection/periodic${location.search || ''}`} replace />
}

function DailyAlias() {
  const location = useLocation()
  return <Navigate to={`/checklist/daily${location.search || ''}`} replace />
}

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
      <Route path="/periodic-inspection" element={<PeriodicAlias />} />
      <Route path="/daily-checklist" element={<DailyAlias />} />
      
      {/* Mobile Routes - 외부 QR 스캔 앱 (네이버 등) 지원 */}
      <Route path="/m/qr/:qrCode" element={<MobileQRScan />} />
      <Route path="/m/qr" element={<MobileQRScan />} />
      <Route path="/qr/:qrCode" element={<MobileQRScan />} />
      
      {/* Mobile Routes - 새로운 QR 로그인 플로우 */}
      <Route path="/mobile/qr-login" element={<MobileQRLogin />} />
      <Route path="/mobile/mold/:moldId" element={<MobileMoldDetail />} />
      <Route path="/mobile/mold/:moldId/daily-check" element={<ChecklistStartPage />} />
      <Route path="/mobile/mold/:moldId/periodic-check" element={<ChecklistStartPage />} />
      <Route path="/mobile/mold/:moldId/repair-request" element={<MobileRepairRequestForm />} />
      <Route path="/mobile/mold/:moldId/repair-list" element={<RepairRequestListPage />} />
      <Route path="/mobile/mold/:moldId/development-plan" element={<MobileDevelopmentPlan />} />
      <Route path="/mobile/mold/:moldId/mold-checklist" element={<MobileMoldChecklist />} />
      <Route path="/mobile/mold/:moldId/nurturing" element={<MobileMoldNurturing />} />
      <Route path="/mobile/mold/:moldId/hardness" element={<MobileHardnessMeasurement />} />
      <Route path="/mobile/mold/:moldId/specification" element={<MobileMoldSpecification />} />
      <Route path="/mobile/mold/:moldId/injection-condition" element={<MobileInjectionCondition />} />
      <Route path="/mobile/mold/:moldId/injection-history" element={<MobileInjectionHistory />} />
      <Route path="/mobile/mold/:moldId/injection-stats" element={<MobileInjectionStats />} />
      <Route path="/mobile/mold/:moldId/transfer" element={<MobileTransferList />} />
      <Route path="/mobile/mold/:moldId/transfer/new" element={<MobileTransferRequest />} />
      <Route path="/mobile/mold/:moldId/transfer/list" element={<MobileTransferList />} />
      <Route path="/mobile/mold/:moldId/tryout-issues" element={<MobileTryoutIssue />} />
      <Route path="/mobile/transfer/:id" element={<MobileTransferList />} />
      <Route path="/mobile/mold/:moldId/inspection-approval" element={<MobileInspectionApproval />} />
      <Route path="/mobile/inspection-approval" element={<MobileInspectionApproval />} />
      
      {/* Mobile - 유지보전 */}
      <Route path="/mobile/maintenance" element={<MobileMaintenancePage />} />
      <Route path="/mobile/mold/:moldId/maintenance" element={<MobileMaintenancePage />} />
      
      {/* Mobile - 제작전 체크리스트 */}
      <Route path="/mobile/pre-production-checklist" element={<MobilePreProductionChecklist />} />
      <Route path="/mobile/pre-production-checklist/:id" element={<MobilePreProductionChecklist />} />
      
      {/* Mobile - 금형 폐기 */}
      <Route path="/mobile/scrapping" element={<MobileScrappingPage />} />
      <Route path="/mobile/scrapping/new" element={<MobileScrappingPage />} />
      <Route path="/mobile/scrapping/:id" element={<MobileScrappingPage />} />
      
      {/* Mobile - 홈 */}
      <Route path="/mobile/home" element={<MobileHomePage />} />
      <Route path="/mobile" element={<MobileHomePage />} />
      
      {/* Mobile - 알림 */}
      <Route path="/mobile/alerts" element={<MobileAlerts />} />
      <Route path="/mobile/notifications" element={<MobileAlerts />} />
      
      {/* Mobile - 통계/리포트 */}
      <Route path="/mobile/reports" element={<MobileReports />} />
      <Route path="/mobile/statistics" element={<MobileReports />} />
      
      {/* Mobile - 금형 목록 */}
      <Route path="/mobile/molds" element={<MobileMoldList />} />
      <Route path="/mobile/mold-list" element={<MobileMoldList />} />
      
      {/* Mobile - 금형 이력 */}
      <Route path="/mobile/mold/:moldId/history" element={<MobileMoldHistory />} />
      <Route path="/mobile/mold-history/:moldId" element={<MobileMoldHistory />} />
      
      {/* Mobile - QR 세션 */}
      <Route path="/mobile/qr-sessions" element={<MobileQRSessions />} />
      
      {/* Mobile - 금형 위치 지도 */}
      <Route path="/mobile/location-map" element={<MobileLocationMap />} />
      <Route path="/mobile/mold-location" element={<MobileLocationMap />} />
      
      {/* Mobile - 프로필 */}
      <Route path="/mobile/profile" element={<MobileProfile />} />
      <Route path="/mobile/my" element={<MobileProfile />} />
      
      {/* Mobile Routes - 기존 호환 */}
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
        <Route path="molds/specifications/:id" element={<MoldDetailNew />} />
        <Route path="molds/detail/:id" element={<MoldDetailNew />} />
        <Route path="molds/:id" element={<MoldDetail />} />
        <Route path="checklist/daily" element={<DailyChecklist />} />
        <Route path="inspection/periodic" element={<PeriodicInspection />} />
        <Route path="transfers" element={<TransferManagement />} />
        <Route path="transfers/new" element={<TransferRequest />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="checklist-master" element={<ChecklistMaster />} />
        <Route path="repairs" element={<RepairManagement />} />
        <Route path="molds/:id/documents" element={<MoldDocuments />} />
        <Route path="molds/:id/photos" element={<MoldPhotoGallery />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="user-requests" element={<UserRequests />} />
        <Route path="master-data" element={<ProtectedRoute allowedRoles={['system_admin']}><MasterData /></ProtectedRoute>} />
        <Route path="hq/repair-requests" element={<HqRepairListPage />} />
        <Route path="maker/repair-requests" element={<MakerRepairListPage />} />
        <Route path="mold-development/plan" element={<MoldDevelopmentPlan />} />
        <Route path="mold-development/nurturing" element={<MoldDevelopmentPlan />} />
        <Route path="mold-development/hardness" element={<HardnessMeasurement />} />
        <Route path="checklist/master" element={<MoldChecklist />} />
        <Route path="mold-checklist" element={<MoldChecklist />} />
        <Route path="mold-specification" element={<MoldSpecification />} />
        <Route path="mold-specification/:id" element={<MoldSpecification />} />
        <Route path="injection-history" element={<InjectionHistory />} />
        <Route path="injection-stats" element={<InjectionStats />} />
        <Route path="injection-condition" element={<InjectionCondition />} />
        <Route path="inspection-approval" element={<InspectionApproval />} />
        <Route path="repair-request-form" element={<RepairRequestForm />} />
        
        {/* 표준문서 마스터 관리 */}
        <Route path="pre-production-checklist" element={<StandardDocumentMaster />} />
        <Route path="pre-production-checklist/:id" element={<StandardDocumentMaster />} />
        
        {/* 금형 폐기 관리 */}
        <Route path="scrapping" element={<ScrappingManagement />} />
        <Route path="scrapping/:id" element={<ScrappingManagement />} />
        
        {/* 유지보전 관리 */}
        <Route path="maintenance" element={<MaintenanceManagement />} />
        <Route path="maintenance/:id" element={<MaintenanceManagement />} />
        
        {/* 알림 설정 */}
        <Route path="notifications" element={<Alerts />} />
        <Route path="notification-settings" element={<NotificationSettings />} />
        
        {/* 통계 리포트 */}
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:tab" element={<Reports />} />
        
        {/* 금형 이력 */}
        <Route path="mold-history" element={<MoldHistory />} />
        <Route path="mold-history/:id" element={<MoldHistory />} />
        
        {/* QR 세션 */}
        <Route path="qr-sessions" element={<QRSessionsPage />} />
        
        {/* 금형 위치 지도 (전체화면) */}
        <Route path="mold-location-map" element={<MoldLocationMapPage />} />
        
        {/* 양산이관 체크리스트 마스터 관리 */}
        <Route path="production-transfer/checklist-master" element={<ProtectedRoute allowedRoles={['system_admin', 'mold_developer']}><ProductionTransferChecklistMaster /></ProtectedRoute>} />
        
        {/* 사용자 관리 */}
        <Route path="users/internal" element={<ProtectedRoute allowedRoles={['system_admin', 'mold_developer']}><InternalUsers /></ProtectedRoute>} />
        <Route path="users/partner" element={<ProtectedRoute allowedRoles={['system_admin', 'mold_developer']}><PartnerUsers /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
