import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Grid2X2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('organizer@hackwell.edu')
  const [password, setPassword] = useState('organizer123')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center">
            <Grid2X2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-blue-900">HackWell</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Event Planning & Resource Optimization</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                placeholder="you@institution.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-9 px-3 pr-9 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <p className="font-medium mb-1.5 text-slate-700">Quick fill demo credentials:</p>
            <div className="flex gap-2">
              <button
                type="button"
                id="fill-organizer-btn"
                onClick={() => {
                  setEmail('organizer@hackwell.edu')
                  setPassword('organizer123')
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
              >
                Organizer
              </button>
              <button
                type="button"
                id="fill-admin-btn"
                onClick={() => {
                  setEmail('admin@hackwell.edu')
                  setPassword('admin123')
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
              >
                Admin
              </button>
            </div>
            <p className="mt-2 text-slate-500">organizer@hackwell.edu / organizer123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
