import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { institutionAPI } from '../services/api'
import { Grid2X2, CheckCircle2 } from 'lucide-react'

const STEPS = ['Institution', 'Resources', 'Historical Data', 'First Event', 'Done']

export default function InstitutionSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    institution_name: '',
    campus_name: '',
    location: '',
    student_population: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.institution_name.trim()) {
      setError('Institution name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await institutionAPI.save({
        institution_name: form.institution_name.trim(),
        campus_name: form.campus_name.trim() || null,
        location: form.location.trim() || null,
        student_population: form.student_population ? parseInt(form.student_population) : null,
      })
      navigate('/onboarding/resources')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to save institution. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={0}>
      <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-lg w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Institution Setup</h2>
          <p className="text-sm text-slate-500 mt-1">Tell us about your institution to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <input
              name="institution_name"
              type="text"
              value={form.institution_name}
              onChange={handleChange}
              required
              autoFocus
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="e.g. National Institute of Technology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Campus Name</label>
            <input
              name="campus_name"
              type="text"
              value={form.campus_name}
              onChange={handleChange}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="e.g. Main Campus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="e.g. Chennai, Tamil Nadu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Approximate Student Population
            </label>
            <input
              name="student_population"
              type="number"
              value={form.student_population}
              onChange={handleChange}
              min={0}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="e.g. 5000"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Step 1 of 5</span>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded transition-colors"
            >
              {loading ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingShell>
  )
}

export function OnboardingShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center gap-3">
        <div className="w-7 h-7 bg-blue-900 rounded flex items-center justify-center">
          <Grid2X2 size={14} className="text-white" />
        </div>
        <span className="text-[15px] font-semibold text-blue-900">HackWell</span>
        <span className="text-slate-300 mx-1">·</span>
        <span className="text-sm text-slate-500">Getting Started</span>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${i === step ? 'text-blue-700' : i < step ? 'text-green-600' : 'text-slate-400'}`}>
                {i < step ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${
                    i === step ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-slate-300 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                )}
                <span className={`text-xs font-medium ${i === step ? 'text-blue-700' : i < step ? 'text-green-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 flex items-start justify-center">
        {children}
      </div>
    </div>
  )
}
