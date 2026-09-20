import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Eye, EyeOff, Grid2X2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.12) 0%, #000 60%)' }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
          >
            <Grid2X2 size={18} className="text-white" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            HackWell
          </span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Sign in to your account</h2>
            <p className="text-sm text-white/40 mt-1">Event Planning & Resource Optimization</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark w-full h-10 px-3 text-sm"
                placeholder="you@institution.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-dark w-full h-10 px-3 pr-9 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-dark-primary w-full h-10 text-sm font-semibold justify-center"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/30">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
