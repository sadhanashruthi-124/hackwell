import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Eye, EyeOff, Grid2X2 } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register({
        name,
        email,
        password,
        institution_name: institutionName,
      })
      navigate('/onboarding')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create account. Email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 40% 0%, rgba(139,92,246,0.12) 0%, #000 60%)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
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
            <h2 className="text-lg font-semibold text-white">Create your Organizer Account</h2>
            <p className="text-sm text-white/40 mt-1">Set up your institution's planning workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-dark w-full h-10 px-3 text-sm"
                placeholder="Dr. Rajesh Kumar"
              />
            </div>

            <div>
              <label htmlFor="institution" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                Institution / Organization <span className="text-red-400">*</span>
              </label>
              <input
                id="institution"
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
                className="input-dark w-full h-10 px-3 text-sm"
                placeholder="National Institute of Engineering"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark w-full h-10 px-3 text-sm"
                placeholder="organizer@institution.edu"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-dark w-full h-10 px-3 pr-9 text-sm"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-dark w-full h-10 px-3 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="btn-dark-primary w-full h-10 text-sm font-semibold justify-center"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/30">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
