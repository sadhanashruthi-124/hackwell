import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import Header from '../components/layout/Header'
import { eventsAPI } from '../services/api'

const STEPS = ['Basic Info', 'Participation', 'Resources', 'Venue', 'Review']

const EVENT_TYPES = ['hackathon', 'symposium', 'cultural', 'sports', 'workshop', 'seminar', 'conference', 'other']

interface FormData {
  name: string
  event_type: string
  date: string
  start_time: string
  end_time: string
  duration_hours: number
  registrations: number
  teams: number
  expected_participants: number
  req_computers: number
  req_projectors: number
  req_chairs: number
  req_buses: number
  req_other: string
  venue_type: string
  venue_preference: string
  alternative_venue: string
  notes: string
}

const EMPTY_FORM: FormData = {
  name: '',
  event_type: 'hackathon',
  date: '',
  start_time: '09:00',
  end_time: '17:00',
  duration_hours: 8,
  registrations: 0,
  teams: 0,
  expected_participants: 0,
  req_computers: 0,
  req_projectors: 0,
  req_chairs: 0,
  req_buses: 0,
  req_other: '',
  venue_type: 'indoor',
  venue_preference: '',
  alternative_venue: '',
  notes: '',
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              i <= current
                ? 'text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-white/30 border border-white/10'
            }`}
            style={i <= current ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
              i === current ? 'text-indigo-300' : i < current ? 'text-white/60' : 'text-white/30'
            }`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-16 mx-1 mt-[-14px] ${i < current ? 'bg-indigo-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5"> *</span>}
      </label>
      {children}
    </div>
  )
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof FormData, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const calcDuration = (start: string, end: string): number => {
    if (!start || !end) return 8
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? Math.round(diff / 60) : 24
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (!form.name.trim()) throw new Error('Event Name is required')
      if (!form.date) throw new Error('Event Date is required')
      if (form.registrations <= 0) throw new Error('Expected Registrations must be greater than 0')
      const payload = {
        ...form,
        teams: form.teams || null,
        expected_participants: form.expected_participants || null,
      }
      const res = await eventsAPI.create(payload)
      navigate(`/predictions/${res.data.id}`)
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', '))
      } else if (detail && typeof detail === 'object') {
        setError(JSON.stringify(detail))
      } else {
        setError(e?.message || 'Failed to create event')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = "input-dark w-full h-9 px-3 text-sm"
  const numCls = "input-dark w-full h-9 px-3 text-sm tabular-nums"

  const steps = [
    // Step 1 — Basic Info
    <div key="1" className="grid grid-cols-2 gap-5">
      <div className="col-span-2">
        <Field label="Event Name" required>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. National Hackathon 2026" className={inputCls} />
        </Field>
      </div>
      <Field label="Event Type" required>
        <select value={form.event_type} onChange={e => set('event_type', e.target.value)} className={inputCls}>
          {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Date" required>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Start Time">
        <input type="time" value={form.start_time} onChange={e => { set('start_time', e.target.value); set('duration_hours', calcDuration(e.target.value, form.end_time)) }} className={inputCls} />
      </Field>
      <Field label="End Time">
        <input type="time" value={form.end_time} onChange={e => { set('end_time', e.target.value); set('duration_hours', calcDuration(form.start_time, e.target.value)) }} className={inputCls} />
      </Field>
      <div className="col-span-2">
        <Field label="Duration (hours)" required>
          <input type="number" min="1" max="168" value={form.duration_hours} onChange={e => set('duration_hours', Number(e.target.value))} className={numCls} />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Description / Additional Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="input-dark w-full px-3 py-2 text-sm resize-none" placeholder="Any special requirements or notes..." />
        </Field>
      </div>
    </div>,

    // Step 2 — Participation
    <div key="2" className="grid grid-cols-2 gap-5">
      <div className="col-span-2 p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-sm text-indigo-300">
        These registration details are evaluated against stored historical events to predict turnout accurately.
      </div>
      <Field label="Expected Registrations" required>
        <input type="number" min="1" value={form.registrations || ''} onChange={e => set('registrations', Number(e.target.value))} className={numCls} placeholder="e.g. 500" />
      </Field>
      <Field label="Number of Teams (if applicable)">
        <input type="number" min="0" value={form.teams || ''} onChange={e => set('teams', Number(e.target.value))} className={numCls} placeholder="e.g. 125" />
      </Field>
      <div className="col-span-2">
        <Field label="Manual Expected Participants (Optional)">
          <input type="number" min="0" value={form.expected_participants || ''} onChange={e => set('expected_participants', Number(e.target.value))} className={numCls} placeholder="Leave blank to let ML model predict turnout" />
          <p className="text-xs text-white/30 mt-1">Leave blank to use the ML Random Forest attendance forecast.</p>
        </Field>
      </div>
    </div>,

    // Step 3 — Requirements
    <div key="3" className="grid grid-cols-2 gap-5">
      <div className="col-span-2 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50">
        Specify any minimum required quantities. The system will optimize against available inventory.
      </div>
      <Field label="Computers Required">
        <input type="number" min="0" value={form.req_computers || ''} onChange={e => set('req_computers', Number(e.target.value))} className={numCls} placeholder="e.g. 100" />
      </Field>
      <Field label="Projectors Required">
        <input type="number" min="0" value={form.req_projectors || ''} onChange={e => set('req_projectors', Number(e.target.value))} className={numCls} placeholder="e.g. 4" />
      </Field>
      <Field label="Chairs Required">
        <input type="number" min="0" value={form.req_chairs || ''} onChange={e => set('req_chairs', Number(e.target.value))} className={numCls} placeholder="e.g. 500" />
      </Field>
      <Field label="Buses Required">
        <input type="number" min="0" value={form.req_buses || ''} onChange={e => set('req_buses', Number(e.target.value))} className={numCls} placeholder="e.g. 4" />
      </Field>
      <div className="col-span-2">
        <Field label="Other Special Requirements">
          <input value={form.req_other} onChange={e => set('req_other', e.target.value)} className={inputCls} placeholder="e.g. Audio setup, Wireless microphones" />
        </Field>
      </div>
    </div>,

    // Step 4 — Venue
    <div key="4" className="grid grid-cols-2 gap-5">
      <div className="col-span-2">
        <Field label="Venue Type" required>
          <div className="flex gap-4">
            {['indoor', 'outdoor', 'hybrid'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="venue_type" value={t} checked={form.venue_type === t} onChange={() => set('venue_type', t)} className="accent-indigo-500" />
                <span className="text-sm text-white/70 capitalize">{t}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Preferred Venue Name">
        <input value={form.venue_preference} onChange={e => set('venue_preference', e.target.value)} className={inputCls} placeholder="e.g. Main Auditorium" />
      </Field>
      <Field label="Alternative Venue">
        <input value={form.alternative_venue} onChange={e => set('alternative_venue', e.target.value)} className={inputCls} placeholder="e.g. Seminar Hall 1" />
      </Field>
    </div>,

    // Step 5 — Review
    <div key="5" className="space-y-5">
      <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Event Summary</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Event Name" value={form.name || '—'} />
          <ReviewRow label="Type" value={form.event_type} />
          <ReviewRow label="Date" value={form.date || '—'} />
          <ReviewRow label="Duration" value={`${form.duration_hours} hours`} />
          <ReviewRow label="Time" value={form.start_time && form.end_time ? `${form.start_time} – ${form.end_time}` : '—'} />
          <ReviewRow label="Venue Type" value={form.venue_type} />
        </dl>
      </div>
      <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Participation</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Registrations" value={form.registrations ? form.registrations.toLocaleString() : '0'} />
          <ReviewRow label="Teams" value={form.teams ? String(form.teams) : '—'} />
          <ReviewRow label="Expected Participants" value={form.expected_participants ? form.expected_participants.toLocaleString() : 'Will be forecasted by ML'} />
        </dl>
      </div>
      <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Resource Requirements</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Computers" value={String(form.req_computers || 'Auto-estimated')} />
          <ReviewRow label="Projectors" value={String(form.req_projectors || 'Auto-estimated')} />
          <ReviewRow label="Chairs" value={String(form.req_chairs || 'Auto-estimated')} />
          <ReviewRow label="Buses" value={String(form.req_buses || 'Auto-estimated')} />
        </dl>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
    </div>,
  ]

  const canNext = () => {
    if (step === 0) return form.name && form.date && form.event_type
    if (step === 1) return form.registrations > 0
    return true
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Create Event" subtitle="Fill in the details to plan a new event" />

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <StepIndicator current={step} />

          {/* Form card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{STEPS[step]}</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {['Enter the fundamental details of your event.', 'Provide registration and participation numbers.', 'Specify the resources you need for the event.', 'Choose venue type and preferences.', 'Review your event details before creating.'][step]}
              </p>
            </div>
            <div className="px-8 py-6">{steps[step]}</div>
            <div className="px-8 py-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => step === 0 ? navigate('/events') : setStep(s => s - 1)}
                className="btn-dark-ghost flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
              >
                <ChevronLeft size={14} />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
                >
                  Next: {STEPS[step + 1]}
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="submit-event-btn"
                  className="btn-dark-primary flex items-center gap-1.5 px-5 py-2 text-sm font-medium"
                >
                  <Check size={14} />
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-white/30">{label}</dt>
      <dd className="font-medium text-white/70 capitalize">{value}</dd>
    </>
  )
}
