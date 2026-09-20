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
    if (level === 'error') return <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
    if (level === 'warning') return <TriangleAlert size={15} className="text-amber-400 mt-0.5 shrink-0" />
    return <CheckCircle2 size={15} className="text-green-400 mt-0.5 shrink-0" />
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Optimization" subtitle={event ? `Resource allocation for ${event.name}` : 'Constraint-based resource optimizer'} />

      <div className="flex-1 p-8 overflow-auto space-y-5">
        {/* Event selector bar */}
        {events.length > 0 && (
          <div className="glass-card rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase text-white/30 tracking-widest">Select Event:</span>
              <select
                value={selectedId ?? ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelectedId(id)
                  navigate(`/optimization/${id}`)
                }}
                className="input-dark text-sm font-medium px-3 py-1.5"
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.event_type})</option>
                ))}
              </select>
            </div>
            {event && (
              <span className="text-xs text-white/30">
                {event.date} · {event.registrations.toLocaleString()} registrations
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-white/30">Loading...</div>
        ) : !event ? (
          <div className="text-sm text-red-400">No events found. Create an event first.</div>
        ) : (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">{event.name}</h2>
                <p className="text-xs text-white/30 mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.duration_hours}h · {event.registrations.toLocaleString()} registrations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {plan && (
                  <button
                    onClick={() => navigate(`/plans/${selectedId}`)}
                    className="btn-dark-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-medium"
                  >
                    <FileText size={13} />
                    View Full Plan
                  </button>
                )}
                <button
                  onClick={runOptimization}
                  disabled={running}
                  id="run-optimization-btn"
                  className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
                >
                  <Zap size={14} />
                  {running ? 'Optimizing...' : plan ? 'Re-optimize' : 'Run Optimization'}
                </button>
              </div>
            </div>

            {plan && (
              <div className="grid grid-cols-3 gap-5">
                {/* Left — Event Summary */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Event Plan</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Predicted Attendance</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {plan.predicted_attendance.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/30">participants</p>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Selected Venues</p>
                      {plan.venues.length === 0 ? (
                        <p className="text-sm text-red-400">No venues available</p>
                      ) : plan.venues.map((v: any, i: number) => (
                        <div key={i} className="text-sm text-white/70 font-medium py-0.5">{v.name} <span className="text-xs font-normal text-white/30">({v.capacity} cap)</span></div>
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Overall Status</p>
                      <StatusBadge status={plan.status} />
                    </div>
                  </div>
                </div>

                {/* Center — Resource Allocation */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Resource Allocation</h3>
                  <div className="space-y-3">
                    {plan.resource_allocation.map((r: any) => (
                      <div key={r.resource} className="flex flex-col py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white/70 capitalize font-medium">{r.resource}</span>
                          <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${r.shortage > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                            {r.shortage > 0 ? `−${r.shortage.toLocaleString()} Short` : 'Fully Allocated'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/40">
                          <span>Req: <span className="text-white/70">{r.required.toLocaleString()}</span></span>
                          <span>Avail: <span className="text-white/70">{r.available.toLocaleString()}</span></span>
                          <span>Alloc: <span className="text-white/90 font-medium">{r.allocated.toLocaleString()}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — Alerts */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Alerts</h3>
                  <div className="space-y-3">
                    {plan.alerts.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {alertIcon(a.level)}
                        <div>
                          <p className="text-sm font-medium text-white/80">{a.message}</p>
                          <p className="text-xs text-white/30 mt-0.5">{a.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {plan.recommendations.length > 0 && (
                    <>
                      <div className="border-t border-white/10 mt-4 pt-4">
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {plan.recommendations.map((r: string, i: number) => (
                            <p key={i} className="text-xs text-white/50">→ {r}</p>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!plan && !running && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Zap size={24} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/30">No optimization plan yet. Click "Run Optimization" to generate a resource allocation plan.</p>
              </div>
            )}

            {plan && (
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/plans/${selectedId}`)}
                  className="btn-dark-primary flex items-center gap-1.5 px-5 py-2 text-sm font-medium"
                >
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
    ok:       'bg-green-500/15 text-green-300 border border-green-500/25',
    shortage: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    conflict: 'bg-red-500/15 text-red-300 border border-red-500/25',
  }
  const labels: Record<string, string> = { ok: 'All Good', shortage: 'Shortage Detected', conflict: 'Conflict Detected' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? map.ok}`}>
      {labels[status] ?? status}
    </span>
  )
}
