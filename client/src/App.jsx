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
import MoldList from './pages/MoldList'
import MoldDetail from './pages/MoldDetail'
import MoldRegistration from './pages/MoldRegistration'
import MoldBulkUpload from './pages/MoldBulkUpload'
import MoldMaster from './pages/MoldMaster'
import DailyChecklist from './pages/DailyChecklistNew'
import PeriodicInspection from './pages/PeriodicInspectionNew'
import TransferManagement from './pages/TransferManagement'
import Alerts from './pages/Alerts'
import ChecklistMaster from './pages/ChecklistMaster'
import RepairManagement from './pages/RepairManagement'
import MoldDocuments from './pages/MoldDocuments'
import MoldPhotoGallery from './pages/MoldPhotoGallery'

function App() {
  const { isAuthenticated, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/qr-login" element={<QRLogin />} />
      
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
        <Route path="molds" element={<MoldList />} />
        <Route path="molds/new" element={<MoldRegistration />} />
        <Route path="molds/bulk-upload" element={<MoldBulkUpload />} />
        <Route path="molds/master" element={<MoldMaster />} />
        <Route path="molds/:id" element={<MoldDetail />} />
        <Route path="checklist/daily" element={<DailyChecklist />} />
        <Route path="inspection/periodic" element={<PeriodicInspection />} />
        <Route path="transfers" element={<TransferManagement />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="checklist-master" element={<ChecklistMaster />} />
        <Route path="repairs" element={<RepairManagement />} />
        <Route path="molds/:id/documents" element={<MoldDocuments />} />
        <Route path="molds/:id/photos" element={<MoldPhotoGallery />} />
      </Route>
    </Routes>
  )
}

export default App
