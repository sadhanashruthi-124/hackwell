import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
