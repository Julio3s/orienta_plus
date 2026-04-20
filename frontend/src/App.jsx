import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import AssistantPage from './pages/AssistantPage'
import EspaceEtudiant from './pages/EspaceEtudiant'
import UniversitesPage from './pages/UniversitesPage'
import FilieresPage from './pages/FilieresPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'

function RequireAuth({ children }) {
  const token = localStorage.getItem('orienta_access_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/orientation" element={<EspaceEtudiant />} />
        <Route path="/universites" element={<UniversitesPage />} />
        <Route path="/filieres" element={<FilieresPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
