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

const INITIAL: FormData = {
  name: 'AI & Robotics Hackathon 2026',
  event_type: 'hackathon',
  date: '2026-11-15',
  start_time: '09:00',
  end_time: '09:00',
  duration_hours: 24,
  registrations: 800,
  teams: 200,
  expected_participants: 672,
  req_computers: 650,
  req_projectors: 12,
  req_chairs: 700,
  req_buses: 6,
  req_other: '',
  venue_type: 'indoor',
  venue_preference: 'Main Auditorium',
  alternative_venue: 'Lab A',
  notes: 'High performance GPU requirements for robotics teams',
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < current ? 'bg-blue-900 text-white' : i === current ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${i === current ? 'text-blue-900' : i < current ? 'text-slate-600' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-16 mx-1 mt-[-14px] ${i < current ? 'bg-blue-900' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
const numCls = "w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition tabular-nums"

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
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

  const steps = [
    // Step 1 — Basic Info
    <div key="1" className="grid grid-cols-2 gap-5">
      <div className="col-span-2">
        <Field label="Event Name" required>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Annual Hackathon 2026" className={inputCls} />
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
        <input type="time" value={form.start_time} onChange={e => {
          set('start_time', e.target.value)
          set('duration_hours', calcDuration(e.target.value, form.end_time))
        }} className={inputCls} />
      </Field>
      <Field label="End Time">
        <input type="time" value={form.end_time} onChange={e => {
          set('end_time', e.target.value)
          set('duration_hours', calcDuration(form.start_time, e.target.value))
        }} className={inputCls} />
      </Field>
      <div className="col-span-2">
        <Field label="Duration (hours)" required>
          <input type="number" min="1" max="168" value={form.duration_hours} onChange={e => set('duration_hours', Number(e.target.value))} className={numCls} />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Additional Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none" placeholder="Any special requirements or notes..." />
        </Field>
      </div>
    </div>,

    // Step 2 — Participation
    <div key="2" className="grid grid-cols-2 gap-5">
      <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        These details are used by the ML model to predict attendance based on historical patterns.
      </div>
      <Field label="Expected Registrations" required>
        <input type="number" min="0" value={form.registrations} onChange={e => set('registrations', Number(e.target.value))} className={numCls} placeholder="800" />
      </Field>
      <Field label="Number of Teams">
        <input type="number" min="0" value={form.teams} onChange={e => set('teams', Number(e.target.value))} className={numCls} placeholder="200 (for hackathons)" />
      </Field>
      <div className="col-span-2">
        <Field label="Expected Participants (estimate)">
          <input type="number" min="0" value={form.expected_participants} onChange={e => set('expected_participants', Number(e.target.value))} className={numCls} placeholder="Leave 0 to use ML prediction" />
          <p className="text-xs text-slate-400 mt-1">Leave at 0 to let the system predict attendance automatically.</p>
        </Field>
      </div>
    </div>,

    // Step 3 — Resources
    <div key="3" className="grid grid-cols-2 gap-5">
      <div className="col-span-2 p-4 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600">
        Enter your resource requirements. The system will check availability and optimize allocation.
      </div>
      <Field label="Computers">
        <input type="number" min="0" value={form.req_computers} onChange={e => set('req_computers', Number(e.target.value))} className={numCls} placeholder="e.g. 650" />
      </Field>
      <Field label="Projectors">
        <input type="number" min="0" value={form.req_projectors} onChange={e => set('req_projectors', Number(e.target.value))} className={numCls} placeholder="e.g. 10" />
      </Field>
      <Field label="Chairs">
        <input type="number" min="0" value={form.req_chairs} onChange={e => set('req_chairs', Number(e.target.value))} className={numCls} placeholder="e.g. 700" />
      </Field>
      <Field label="Buses">
        <input type="number" min="0" value={form.req_buses} onChange={e => set('req_buses', Number(e.target.value))} className={numCls} placeholder="e.g. 6" />
      </Field>
      <div className="col-span-2">
        <Field label="Other Requirements">
          <input value={form.req_other} onChange={e => set('req_other', e.target.value)} className={inputCls} placeholder="e.g. Stage lighting, Sound system, Live streaming setup" />
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
                <input type="radio" name="venue_type" value={t} checked={form.venue_type === t} onChange={() => set('venue_type', t)} className="accent-blue-800" />
                <span className="text-sm text-slate-700 capitalize">{t}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Preferred Venue">
        <input value={form.venue_preference} onChange={e => set('venue_preference', e.target.value)} className={inputCls} placeholder="e.g. Main Auditorium" />
      </Field>
      <Field label="Alternative Venue">
        <input value={form.alternative_venue} onChange={e => set('alternative_venue', e.target.value)} className={inputCls} placeholder="e.g. Lab A + Lab B" />
      </Field>
    </div>,

    // Step 5 — Review
    <div key="5" className="space-y-5">
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Event Summary</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Event Name" value={form.name || '—'} />
          <ReviewRow label="Type" value={form.event_type} />
          <ReviewRow label="Date" value={form.date || '—'} />
          <ReviewRow label="Duration" value={`${form.duration_hours} hours`} />
          <ReviewRow label="Time" value={form.start_time && form.end_time ? `${form.start_time} – ${form.end_time}` : '—'} />
          <ReviewRow label="Venue Type" value={form.venue_type} />
        </dl>
      </div>
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Participation</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Registrations" value={form.registrations.toLocaleString()} />
          <ReviewRow label="Teams" value={form.teams ? String(form.teams) : '—'} />
          <ReviewRow label="Expected Participants" value={form.expected_participants ? form.expected_participants.toLocaleString() : 'ML will predict'} />
        </dl>
      </div>
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Resource Requirements</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <ReviewRow label="Computers" value={String(form.req_computers || '—')} />
          <ReviewRow label="Projectors" value={String(form.req_projectors || '—')} />
          <ReviewRow label="Chairs" value={String(form.req_chairs || '—')} />
          <ReviewRow label="Buses" value={String(form.req_buses || '—')} />
        </dl>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">{error}</p>}
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
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-8 py-6 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">{STEPS[step]}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {['Enter the fundamental details of your event.', 'Provide registration and participation numbers.', 'Specify the resources you need for the event.', 'Choose venue type and preferences.', 'Review your event details before creating.'][step]}
              </p>
            </div>
            <div className="px-8 py-6">{steps[step]}</div>
            <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => step === 0 ? navigate('/events') : setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-sm font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={14} />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
                >
                  Next: {STEPS[step + 1]}
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="submit-event-btn"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
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
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 capitalize">{value}</dd>
    </>
  )
}
