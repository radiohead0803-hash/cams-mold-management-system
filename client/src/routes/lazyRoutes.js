/**
 * React.lazy를 사용한 코드 스플리팅
 * 페이지 컴포넌트를 동적으로 로드하여 초기 번들 크기 감소
 */
import { lazy } from 'react';

// PC 대시보드
export const SystemAdminDashboard = lazy(() => import('../pages/dashboards/SystemAdminDashboard'));

// 관리자 전용 페이지
export const ApprovalInbox = lazy(() => import('../pages/admin/ApprovalInbox'));
export const SystemRulesPage = lazy(() => import('../pages/admin/SystemRulesPage'));
export const NotificationCenter = lazy(() => import('../pages/admin/NotificationCenter'));
export const RiskMonitorDashboard = lazy(() => import('../pages/admin/RiskMonitorDashboard'));
export const AuditLogPage = lazy(() => import('../pages/admin/AuditLogPage'));
export const MoldDeveloperDashboard = lazy(() => import('../pages/dashboards/MoldDeveloperDashboard'));
export const MakerDashboard = lazy(() => import('../pages/dashboards/MakerDashboard'));
export const PlantDashboard = lazy(() => import('../pages/dashboards/PlantDashboard'));

// 모바일 대시보드
export const MakerMobileDashboard = lazy(() => import('../pages/dashboards/MakerMobileDashboard'));
export const PlantMobileDashboard = lazy(() => import('../pages/dashboards/PlantMobileDashboard'));
export const DeveloperMobileDashboard = lazy(() => import('../pages/dashboards/DeveloperMobileDashboard'));

// 금형 관리
export const MoldList = lazy(() => import('../pages/MoldList'));
export const MoldDetail = lazy(() => import('../pages/MoldDetail'));
export const MoldRegistration = lazy(() => import('../pages/MoldRegistration'));
export const MoldNew = lazy(() => import('../pages/MoldNew'));
export const MoldBulkUpload = lazy(() => import('../pages/MoldBulkUpload'));
export const MoldMaster = lazy(() => import('../pages/MoldMaster'));
export const MoldLifecycle = lazy(() => import('../pages/MoldLifecycle'));
export const MoldDetailNew = lazy(() => import('../pages/MoldDetailNew'));
export const MoldDocuments = lazy(() => import('../pages/MoldDocuments'));
export const MoldPhotoGallery = lazy(() => import('../pages/MoldPhotoGallery'));
export const MoldHistory = lazy(() => import('../pages/MoldHistory'));

// 점검 관리
export const DailyChecklist = lazy(() => import('../pages/DailyChecklistNew'));
export const PeriodicInspection = lazy(() => import('../pages/PeriodicInspectionNew'));
export const InspectionApproval = lazy(() => import('../pages/InspectionApproval'));
export const ChecklistMaster = lazy(() => import('../pages/ChecklistMaster'));
export const MoldChecklist = lazy(() => import('../pages/MoldChecklist'));

// 이관 관리
export const TransferManagement = lazy(() => import('../pages/TransferManagement'));
export const TransferRequest = lazy(() => import('../pages/TransferRequest'));

// 수리 관리
export const RepairManagement = lazy(() => import('../pages/RepairManagement'));
export const RepairRequestForm = lazy(() => import('../pages/RepairRequestForm'));
export const HqRepairListPage = lazy(() => import('../pages/HqRepairListPage'));
export const MakerRepairListPage = lazy(() => import('../pages/MakerRepairListPage'));

// 금형 개발
export const MoldDevelopmentPlan = lazy(() => import('../pages/MoldDevelopmentPlan'));
export const HardnessMeasurement = lazy(() => import('../pages/HardnessMeasurement'));
export const MoldSpecification = lazy(() => import('../pages/MoldSpecification'));

// 사출 관리
export const InjectionHistory = lazy(() => import('../pages/InjectionHistory'));
export const InjectionStats = lazy(() => import('../pages/InjectionStats'));
export const InjectionCondition = lazy(() => import('../pages/InjectionCondition'));

// 회사/사용자 관리
export const CompanyManagement = lazy(() => import('../pages/CompanyManagement'));
export const CompanyDetail = lazy(() => import('../pages/CompanyDetail'));
export const UserRequests = lazy(() => import('../pages/UserRequests'));
export const InternalUsers = lazy(() => import('../pages/InternalUsers'));
export const PartnerUsers = lazy(() => import('../pages/PartnerUsers'));
export const MasterData = lazy(() => import('../pages/MasterData'));

// 기타 관리
export const Alerts = lazy(() => import('../pages/Alerts'));
export const StandardDocumentMaster = lazy(() => import('../pages/StandardDocumentMaster'));
export const ScrappingManagement = lazy(() => import('../pages/ScrappingManagement'));
export const MaintenanceManagement = lazy(() => import('../pages/MaintenanceManagement'));
export const NotificationSettings = lazy(() => import('../pages/NotificationSettings'));
export const Reports = lazy(() => import('../pages/Reports'));
export const QRSessionsPage = lazy(() => import('../pages/QRSessionsPage'));
export const MoldLocationMapPage = lazy(() => import('../pages/MoldLocationMapPage'));
export const ProductionTransferChecklistMaster = lazy(() => import('../pages/ProductionTransferChecklistMaster'));

// 모바일 페이지
export const MobileQRLogin = lazy(() => import('../pages/mobile/MobileQRLogin'));
export const MobileMoldDetail = lazy(() => import('../pages/mobile/MobileMoldDetailNew'));
export const MobileQRScan = lazy(() => import('../pages/mobile/MobileQRScan'));
export const MobileDevelopmentPlan = lazy(() => import('../pages/mobile/MobileDevelopmentPlan'));
export const MobileMoldChecklist = lazy(() => import('../pages/mobile/MobileMoldChecklist'));
export const MobileMoldNurturing = lazy(() => import('../pages/mobile/MobileMoldNurturing'));
export const MobileHardnessMeasurement = lazy(() => import('../pages/mobile/MobileHardnessMeasurement'));
export const MobileMoldSpecification = lazy(() => import('../pages/mobile/MobileMoldSpecification'));
export const MobileInjectionCondition = lazy(() => import('../pages/mobile/MobileInjectionCondition'));
export const MobileInjectionHistory = lazy(() => import('../pages/mobile/MobileInjectionHistory'));
export const MobileInjectionStats = lazy(() => import('../pages/mobile/MobileInjectionStats'));
export const MobileTransferRequest = lazy(() => import('../pages/mobile/MobileTransferRequest'));
export const MobileTransferList = lazy(() => import('../pages/mobile/MobileTransferList'));
export const MobileTryoutIssue = lazy(() => import('../pages/mobile/MobileTryoutIssue'));
export const MobileInspectionApproval = lazy(() => import('../pages/mobile/MobileInspectionApproval'));
export const MobileRepairRequestForm = lazy(() => import('../pages/mobile/MobileRepairRequestForm'));
export const MobileMaintenancePage = lazy(() => import('../pages/mobile/MobileMaintenancePage'));
export const MobilePreProductionChecklist = lazy(() => import('../pages/mobile/MobilePreProductionChecklist'));
export const MobileScrappingPage = lazy(() => import('../pages/mobile/MobileScrappingPage'));
export const MobileHomePage = lazy(() => import('../pages/mobile/MobileHomePage'));
export const MobileAlerts = lazy(() => import('../pages/mobile/MobileAlerts'));
export const MobileReports = lazy(() => import('../pages/mobile/MobileReports'));
export const MobileMoldList = lazy(() => import('../pages/mobile/MobileMoldList'));
export const MobileMoldHistory = lazy(() => import('../pages/mobile/MobileMoldHistory'));
export const MobileQRSessions = lazy(() => import('../pages/mobile/MobileQRSessions'));
export const MobileLocationMap = lazy(() => import('../pages/mobile/MobileLocationMap'));
export const MobileProfile = lazy(() => import('../pages/mobile/MobileProfile'));
export const MobileNotificationSettings = lazy(() => import('../pages/mobile/MobileNotificationSettings'));
export const MobileHelp = lazy(() => import('../pages/mobile/MobileHelp'));
export const ChecklistSelectPage = lazy(() => import('../pages/mobile/ChecklistSelectPage'));
export const ChecklistFormPage = lazy(() => import('../pages/mobile/ChecklistFormPage'));
export const ChecklistCompletePage = lazy(() => import('../pages/mobile/ChecklistCompletePage'));
export const QrScanPageMobile = lazy(() => import('../pages/mobile/QrScanPage'));
export const MobileDashboard = lazy(() => import('../pages/mobile/MobileDashboard'));
export const MobileSearch = lazy(() => import('../pages/mobile/MobileSearch'));
export const MoldOverviewPage = lazy(() => import('../pages/mobile/MoldOverviewPage'));
export const ChecklistStartPage = lazy(() => import('../pages/mobile/ChecklistStartPage'));
export const RepairRequestListPage = lazy(() => import('../pages/mobile/RepairRequestListPage'));

// QR 스캔 페이지
export const QrScanPage = lazy(() => import('../pages/qr/QrScanPage'));
export const DailyInspectionPageQr = lazy(() => import('../pages/qr/DailyInspectionPage'));
export const PeriodicInspectionPageQr = lazy(() => import('../pages/qr/PeriodicInspectionPage'));
export const DailyInspectionPage = lazy(() => import('../pages/inspections/DailyInspectionPage'));
export const PeriodicInspectionPage = lazy(() => import('../pages/inspections/PeriodicInspectionPage'));
