import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Building2, Package, Database, Check, ArrowRight, Grid2X2 } from 'lucide-react'

const ONBOARDING_STEPS = [
  { id: 'institution', title: 'Institution Setup', icon: Building2, desc: 'Configure campus & institution details' },
  { id: 'resources', title: 'Resource Inventory', icon: Package, desc: 'Declare available hardware and facilities' },
  { id: 'history', title: 'Historical Data', icon: Database, desc: 'Provide event history for ML models' },
]

export default function Onboarding() {
  const { user, setupInstitution } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(0)
  const [institutionName, setInstitutionName] = useState(user?.institution_name || '')
  const [campusName, setCampusName] = useState(user?.campus_name || '')
  const [location, setLocation] = useState(user?.location || '')
  const [studentPopulation, setStudentPopulation] = useState(user?.student_population || 5000)
  const [saving, setSaving] = useState(false)

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setupInstitution({
        institution_name: institutionName,
        campus_name: campusName,
        location,
        student_population: Number(studentPopulation),
      })
      setStep(1)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between py-12 px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, #000 60%)' }}
    >
      <div className="max-w-3xl mx-auto w-full">
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
            EventOptima Workspace Setup
          </span>
        </div>

        {/* Stepper Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((s, i) => {
              const Icon = s.icon
              const isDone = i < step
              const isCurrent = i === step
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isDone
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : isCurrent
                      ? 'text-white border border-indigo-500/30'
                      : 'bg-white/5 text-white/30 border border-white/10'
                  }`}
                  style={isCurrent ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
                  >
                    {isDone ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-indigo-300' : isDone ? 'text-white/70' : 'text-white/30'}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-white/30 hidden sm:block">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Institution Setup */}
        {step === 0 && (
          <div className="glass-card rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Step 1 — Configure Your Institution</h2>
              <p className="text-sm text-white/40 mt-1">
                Tell us about your campus. This information anchors your institutional planning baseline.
              </p>
            </div>

            <form onSubmit={handleSaveInstitution} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                    Institution Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                    className="input-dark w-full h-10 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                    Campus / Block Name
                  </label>
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="e.g. North Campus"
                    className="input-dark w-full h-10 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, Karnataka"
                    className="input-dark w-full h-10 px-3 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                    Approximate Student Population
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={studentPopulation}
                    onChange={(e) => setStudentPopulation(Number(e.target.value))}
                    className="input-dark w-full h-10 px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !institutionName.trim()}
                  className="btn-dark-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                >
                  {saving ? 'Saving...' : 'Continue to Resources'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Resources Intro */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Step 2 — Resource Inventory</h2>
              <p className="text-sm text-white/40 mt-1">
                Your workspace currently starts in a clean empty state with 0 resources.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 space-y-2">
              <p className="font-semibold text-white">How would you like to proceed?</p>
              <p className="text-xs text-white/40">
                You can manually add your hardware, seating, and audio-visual items in the Resources dashboard, or load the sample demonstration dataset.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="btn-dark-ghost px-4 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-dark-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
              >
                Continue to Historical Data
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Historical Data & Workspace Ready */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Step 3 — Historical Data & ML Readiness</h2>
              <p className="text-sm text-white/40 mt-1">
                Data-driven attendance predictions require at least 3 historical event records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 border border-white/10 rounded-xl bg-white/5 space-y-2">
                <h3 className="font-semibold text-sm text-white">Option A: Start Clean (Manual / CSV)</h3>
                <p className="text-xs text-white/40">
                  Enter past events individually or upload your institution's CSV file directly.
                </p>
              </div>

              <div className="p-5 border border-indigo-500/30 rounded-xl bg-indigo-500/10 space-y-2">
                <h3 className="font-semibold text-sm text-indigo-300">Option B: Demo with Sample Data</h3>
                <p className="text-xs text-indigo-300/60">
                  Use the explicit "Load Sample Dataset" feature anytime from Historical Data or Dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-dark-ghost px-4 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-dark-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
              >
                Enter Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-white/20 mt-8">
        EventOptima Platform — Strict Data-Driven Architecture
      </p>
    </div>
  )
}
