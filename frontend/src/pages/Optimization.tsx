import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Zap, TriangleAlert, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react'
import Header from '../components/layout/Header'
import { optimizationAPI, eventsAPI } from '../services/api'

export default function Optimization() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(eventId ? Number(eventId) : null)
  const [plan, setPlan] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)

  // Load events list for dropdown / default
  useEffect(() => {
    eventsAPI.list().then(res => {
      setEvents(res.data)
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id)
      }
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (eventId) {
      setSelectedId(Number(eventId))
    }
  }, [eventId])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    Promise.all([
      eventsAPI.get(selectedId),
      optimizationAPI.get(selectedId).catch(() => null),
    ]).then(([evRes, planRes]) => {
      setEvent(evRes.data)
      if (planRes) setPlan(planRes.data)
      else setPlan(null)
    }).catch(console.error).finally(() => setLoading(false))
  }, [selectedId])

  const runOptimization = async () => {
    if (!selectedId) return
    setRunning(true)
    try {
      const res = await optimizationAPI.run(selectedId)
      setPlan(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const alertIcon = (level: string) => {
    if (level === 'error') return <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
    if (level === 'warning') return <TriangleAlert size={15} className="text-amber-500 mt-0.5 shrink-0" />
    return <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Optimization" subtitle={event ? `Resource allocation for ${event.name}` : 'Constraint-based resource optimizer'} />

      <div className="flex-1 p-8 overflow-auto space-y-5">
        {/* Event selector bar */}
        {events.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Event:</span>
              <select
                value={selectedId ?? ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelectedId(id)
                  navigate(`/optimization/${id}`)
                }}
                className="text-sm font-medium text-slate-900 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-600"
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.event_type})</option>
                ))}
              </select>
            </div>
            {event && (
              <span className="text-xs text-slate-500">
                {event.date} · {event.registrations.toLocaleString()} registrations
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : !event ? (
          <div className="text-sm text-red-600">No events found. Create an event first.</div>
        ) : (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{event.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.duration_hours}h · {event.registrations.toLocaleString()} registrations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {plan && (
                  <button onClick={() => navigate(`/plans/${selectedId}`)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-sm font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors">
                    <FileText size={13} />
                    View Full Plan
                  </button>
                )}
                <button onClick={runOptimization} disabled={running} id="run-optimization-btn"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded transition-colors">
                  <Zap size={14} />
                  {running ? 'Optimizing...' : plan ? 'Re-optimize' : 'Run Optimization'}
                </button>
              </div>
            </div>

            {plan && (
              <div className="grid grid-cols-3 gap-5">
                {/* Left — Event Summary */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Event Plan</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Predicted Attendance</p>
                      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{plan.predicted_attendance.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">participants</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500 mb-2">Selected Venues</p>
                      {plan.venues.length === 0 ? (
                        <p className="text-sm text-red-600">No venues available</p>
                      ) : plan.venues.map((v: any, i: number) => (
                        <div key={i} className="text-sm text-slate-700 font-medium py-0.5">{v.name} <span className="text-xs font-normal text-slate-400">({v.capacity} cap)</span></div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500 mb-2">Overall Status</p>
                      <StatusBadge status={plan.status} />
                    </div>
                  </div>
                </div>

                {/* Center — Resource Allocation */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Resource Allocation</h3>
                  <div className="space-y-3">
                    {plan.resource_allocation.map((r: any) => (
                      <div key={r.resource} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-700 capitalize font-medium">{r.resource}</span>
                        <div className="text-right">
                          <span className={`text-sm font-semibold tabular-nums ${r.shortage > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {r.allocated.toLocaleString()} / {r.required.toLocaleString()}
                          </span>
                          {r.shortage > 0 && (
                            <p className="text-xs text-red-500">−{r.shortage} short</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — Alerts */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Alerts</h3>
                  <div className="space-y-3">
                    {plan.alerts.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {alertIcon(a.level)}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{a.message}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {plan.recommendations.length > 0 && (
                    <>
                      <div className="border-t border-slate-100 mt-4 pt-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {plan.recommendations.map((r: string, i: number) => (
                            <p key={i} className="text-xs text-slate-600">→ {r}</p>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!plan && !running && (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <Zap size={24} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No optimization plan yet. Click "Run Optimization" to generate a resource allocation plan.</p>
              </div>
            )}

            {plan && (
              <div className="flex justify-end">
                <button onClick={() => navigate(`/plans/${selectedId}`)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded transition-colors">
                  View Full Logistics Plan
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: 'bg-green-50 text-green-700 border border-green-200',
    shortage: 'bg-amber-50 text-amber-700 border border-amber-200',
    conflict: 'bg-red-50 text-red-700 border border-red-200',
  }
  const labels: Record<string, string> = { ok: 'All Good', shortage: 'Shortage Detected', conflict: 'Conflict Detected' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? map.ok}`}>
      {labels[status] ?? status}
    </span>
  )
}
