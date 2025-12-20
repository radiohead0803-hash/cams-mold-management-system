import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, Suspense } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import QRLogin from './pages/QRLogin'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'
import ScanInfoPage from './pages/ScanInfoPage'
import RepairRequestPage from './pages/RepairRequestPage'

// Lazy loaded components
import {
  SystemAdminDashboard,
  ApprovalInbox,
  SystemRulesPage,
  NotificationCenter,
  RiskMonitorDashboard,
  AuditLogPage,
  MoldDeveloperDashboard,
  MakerDashboard,
  PlantDashboard,
  MakerMobileDashboard,
  PlantMobileDashboard,
  DeveloperMobileDashboard,
  MoldList,
  MoldDetail,
  MoldRegistration,
  MoldNew,
  MoldBulkUpload,
  MoldMaster,
  MoldLifecycle,
  MoldDetailNew,
  MoldDocuments,
  MoldPhotoGallery,
  MoldHistory,
  DailyChecklist,
  PeriodicInspection,
  InspectionApproval,
  ChecklistMaster,
  MoldChecklist,
  TransferManagement,
  TransferRequest,
  RepairManagement,
  RepairRequestForm,
  MoldWorkflowManagement,
  HqRepairListPage,
  MakerRepairListPage,
  MakerMoldDetail,
  MoldDevelopmentPlan,
  MoldNurturingPage,
  HardnessMeasurement,
  MoldSpecification,
  InjectionHistory,
  InjectionStats,
  InjectionCondition,
  CompanyManagement,
  CompanyDetail,
  UserRequests,
  InternalUsers,
  PartnerUsers,
  MasterData,
  Alerts,
  StandardDocumentMaster,
  ScrappingManagement,
  MaintenanceManagement,
  NotificationSettings,
  Reports,
  QRSessionsPage,
  MoldLocationMapPage,
  ProductionTransferChecklistMaster,
  ChecklistMasterConsole,
  ChecklistMasterDetail,
  MobileInspectionNew,
  MobileQRLogin,
  MobileMoldDetail,
  MobileQRScan,
  MobileDevelopmentPlan,
  MobileMoldChecklist,
  MobileMoldNurturing,
  MobileHardnessMeasurement,
  MobileMoldSpecification,
  MobileInjectionCondition,
  MobileInjectionHistory,
  MobileInjectionStats,
  MobileTransferRequest,
  MobileTransferList,
  MobileTryoutIssue,
  MobileInspectionApproval,
  MobileRepairRequestForm,
  MobileMaintenancePage,
  MobilePreProductionChecklist,
  MobileScrappingPage,
  MobileHomePage,
  MobileAlerts,
  MobileReports,
  MobileMoldList,
  MobileMoldHistory,
  MobileQRSessions,
  MobileLocationMap,
  MobileProfile,
  MobileNotificationSettings,
  MobileHelp,
  ChecklistSelectPage,
  ChecklistFormPage,
  ChecklistCompletePage,
  QrScanPageMobile,
  MobileDashboard,
  MobileSearch,
  MoldOverviewPage,
  ChecklistStartPage,
  RepairRequestListPage,
  MobileDailyChecklist,
  MobilePeriodicInspection,
  MobileRepairShipmentChecklist,
  MobileProductionTransferChecklist,
  RepairShipmentChecklist,
  QrScanPage,
  DailyInspectionPageQr,
  PeriodicInspectionPageQr,
  DailyInspectionPage,
  PeriodicInspectionPage
} from './routes/lazyRoutes'

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
    <Suspense fallback={<PageLoader />}>
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
      <Route path="/mobile/mold/:moldId/daily-check" element={<MobileDailyChecklist />} />
      <Route path="/mobile/mold/:moldId/periodic-check" element={<MobilePeriodicInspection />} />
      <Route path="/mobile/mold/:moldId/repair-request" element={<MobileRepairRequestForm />} />
      <Route path="/mobile/mold/:moldId/repair-list" element={<RepairRequestListPage />} />
      <Route path="/mobile/mold/:moldId/repair-shipment-checklist" element={<MobileRepairShipmentChecklist />} />
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
      
      {/* 웹버전 이관관리 (모바일 경로에서도 접근 가능) */}
      <Route path="/mobile/mold/:moldId/transfer-web" element={<TransferManagement />} />
      <Route path="/mobile/mold/:moldId/transfer-web/new" element={<TransferRequest />} />
      <Route path="/mobile/mold/:moldId/inspection-approval" element={<MobileInspectionApproval />} />
      <Route path="/mobile/inspection-approval" element={<MobileInspectionApproval />} />
      
      {/* Mobile - 유지보전 */}
      <Route path="/mobile/maintenance" element={<MobileMaintenancePage />} />
      <Route path="/mobile/mold/:moldId/maintenance" element={<MobileMaintenancePage />} />
      
      {/* Mobile - 제작전 체크리스트 */}
      <Route path="/mobile/pre-production-checklist" element={<MobilePreProductionChecklist />} />
      <Route path="/mobile/pre-production-checklist/:id" element={<MobilePreProductionChecklist />} />
      
      {/* Mobile - 통합 점검 시스템 */}
      <Route path="/mobile/inspection-new" element={<MobileInspectionNew />} />
      <Route path="/mobile/inspection-new/:id" element={<MobileInspectionNew />} />
      
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
      
      {/* Mobile - 양산이관 체크리스트 */}
      <Route path="/mobile/production-transfer-checklist" element={<MobileProductionTransferChecklist />} />
      <Route path="/mobile/mold/:moldId/production-transfer-checklist" element={<MobileProductionTransferChecklist />} />
      
      {/* Mobile - QR 세션 */}
      <Route path="/mobile/qr-sessions" element={<MobileQRSessions />} />
      
      {/* Mobile - 금형 위치 지도 */}
      <Route path="/mobile/location-map" element={<MobileLocationMap />} />
      <Route path="/mobile/mold-location" element={<MobileLocationMap />} />
      
      {/* Mobile - 프로필 */}
      <Route path="/mobile/profile" element={<MobileProfile />} />
      <Route path="/mobile/my" element={<MobileProfile />} />
      
      {/* Mobile - 알림 설정 */}
      <Route path="/mobile/settings/notifications" element={<MobileNotificationSettings />} />
      <Route path="/mobile/notification-settings" element={<MobileNotificationSettings />} />
      
      {/* Mobile - 도움말 */}
      <Route path="/mobile/help" element={<MobileHelp />} />
      <Route path="/mobile/about" element={<MobileHelp />} />
      
      {/* Mobile - 점검 플로우 */}
      <Route path="/mobile/qr-scan" element={<QrScanPageMobile />} />
      <Route path="/mobile/checklist-select" element={<ChecklistSelectPage />} />
      <Route path="/mobile/checklist-form" element={<ChecklistFormPage />} />
      <Route path="/mobile/checklist-complete" element={<ChecklistCompletePage />} />
      
      {/* Mobile - 대시보드 & 검색 */}
      <Route path="/mobile/dashboard" element={<MobileDashboard />} />
      <Route path="/mobile/search" element={<MobileSearch />} />
      
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
        {/* 문서 기준 대시보드 경로 통일 */}
        <Route path="dashboard/system-admin" element={<SystemAdminDashboard />} />
        <Route path="dashboard/mold-developer" element={<MoldDeveloperDashboard />} />
        <Route path="dashboard/maker" element={<MakerDashboard />} />
        <Route path="dashboard/plant" element={<PlantDashboard />} />
        {/* 관리자 전용 페이지 */}
        <Route path="dashboard/system-admin/approvals" element={<ProtectedRoute allowedRoles={['system_admin']}><ApprovalInbox /></ProtectedRoute>} />
        <Route path="dashboard/system-admin/rules" element={<ProtectedRoute allowedRoles={['system_admin']}><SystemRulesPage /></ProtectedRoute>} />
        <Route path="dashboard/system-admin/notifications" element={<ProtectedRoute allowedRoles={['system_admin']}><NotificationCenter /></ProtectedRoute>} />
        <Route path="dashboard/system-admin/risk-monitor" element={<ProtectedRoute allowedRoles={['system_admin']}><RiskMonitorDashboard /></ProtectedRoute>} />
        <Route path="dashboard/system-admin/audit-logs" element={<ProtectedRoute allowedRoles={['system_admin']}><AuditLogPage /></ProtectedRoute>} />
        {/* 기존 경로 호환성 유지 */}
        <Route path="dashboard/admin" element={<SystemAdminDashboard />} />
        <Route path="dashboard/developer" element={<MoldDeveloperDashboard />} />
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
        <Route path="repairs/new" element={<RepairRequestForm />} />
        <Route path="repairs/shipment-checklist" element={<RepairShipmentChecklist />} />
        <Route path="molds/:id/documents" element={<MoldDocuments />} />
        <Route path="molds/:id/photos" element={<MoldPhotoGallery />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="user-requests" element={<UserRequests />} />
        <Route path="master-data" element={<ProtectedRoute allowedRoles={['system_admin']}><MasterData /></ProtectedRoute>} />
        <Route path="hq/repair-requests" element={<HqRepairListPage />} />
        <Route path="maker/repair-requests" element={<MakerRepairListPage />} />
        <Route path="maker/mold/:id" element={<MakerMoldDetail />} />
        <Route path="mold-development/plan" element={<MoldDevelopmentPlan />} />
        <Route path="mold-development/nurturing" element={<MoldNurturingPage />} />
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
        
        {/* 체크리스트 마스터 관리 콘솔 */}
        <Route path="pre-production-checklist" element={<ChecklistMasterConsole />} />
        <Route path="checklist-master/:id" element={<ChecklistMasterDetail />} />
        <Route path="checklist-master/:id/edit" element={<ChecklistMasterConsole />} />
        
        {/* 통합관리 (수리/이관/폐기) */}
        <Route path="workflow" element={<MoldWorkflowManagement />} />
        
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
    </Suspense>
  )
}

export default App
