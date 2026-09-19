import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import CreateEvent from './pages/CreateEvent'
import Resources from './pages/Resources'
import Predictions from './pages/Predictions'
import Optimization from './pages/Optimization'
import Plans from './pages/Plans'
import Reports from './pages/Reports'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/new" element={<CreateEvent />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/predictions/:eventId" element={<Predictions />} />
              <Route path="/optimization" element={<Optimization />} />
              <Route path="/optimization/:eventId" element={<Optimization />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/plans/:eventId" element={<Plans />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
