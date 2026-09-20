import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Package, Bus, Clock, TriangleAlert, CheckCircle2 } from 'lucide-react'
import Header from '../components/layout/Header'
import { optimizationAPI, eventsAPI } from '../services/api'

export default function Plans() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(eventId ? Number(eventId) : null)
  const [plan, setPlan] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col h-full">
      <Header title="Logistics Plan" subtitle={event ? `Full plan for ${event.name}` : 'Institutional logistics plan'} />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
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
                  navigate(`/plans/${id}`)
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
          <div className="text-sm text-white/30">Loading plan...</div>
        ) : !plan || !event ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Package size={24} className="text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/60 font-medium">Plan not yet generated for this event.</p>
            <p className="text-xs text-white/30 mt-1 mb-4">Run the optimization engine to calculate venue and resource allocations.</p>
            {selectedId && (
              <button
                onClick={() => navigate(`/optimization/${selectedId}`)}
                className="btn-dark-primary px-4 py-2 text-xs font-semibold"
              >
                Go to Optimizer
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Plan header */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{event.name}</h2>
                  <p className="text-sm text-white/40 mt-1">
                    {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{event.duration_hours} hours · {event.registrations.toLocaleString()} registrations
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Predicted Attendance</p>
                  <p className="text-3xl font-bold tabular-nums mt-1" style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {plan.predicted_attendance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Venue Allocation */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Venue Allocation</h3>
                </div>
                {plan.venues.length === 0 ? (
                  <p className="text-sm text-red-400">No venues allocated — capacity issue detected.</p>
                ) : (
                  <div className="space-y-2">
                    {plan.venues.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white/80">{v.name}</p>
                          <p className="text-xs text-white/30 capitalize mt-0.5">{v.venue_type}</p>
                        </div>
                        <span className="text-sm font-semibold text-white/60 tabular-nums">{v.capacity.toLocaleString()} seats</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resource Allocation */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Resource Allocation</h3>
                </div>
                <div className="space-y-2">
                  {plan.resource_allocation.map((r: any) => (
                    <div key={r.resource} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-sm font-medium text-white/70 capitalize">{r.resource}</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold tabular-nums ${r.shortage > 0 ? 'text-amber-400' : 'text-white/80'}`}>
                          {r.allocated.toLocaleString()}
                        </span>
                        <span className="text-xs text-white/30"> / {r.required.toLocaleString()} required</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Transport Schedule */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bus size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Transport Schedule</h3>
                </div>
                {plan.transport_schedule.length === 0 ? (
                  <p className="text-sm text-white/30">No transport allocated.</p>
                ) : (
                  <div className="space-y-2">
                    {plan.transport_schedule.map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs font-semibold text-white/30 w-16 shrink-0 mt-0.5">{t.time}</span>
                        <div>
                          <p className="text-sm font-medium text-white/80">{t.buses}</p>
                          <p className="text-xs text-white/30">{t.route}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Timeline */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Event Timeline</h3>
                </div>
                <div className="space-y-2">
                  {plan.timeline.map((t: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 py-2 border-b border-white/5 last:border-0">
                      <span className="text-xs font-semibold text-white/30 w-16 shrink-0 mt-0.5">{t.time}</span>
                      <p className="text-sm text-white/60">{t.activity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts & Recommendations */}
            {(plan.alerts.length > 0 || plan.recommendations.length > 0) && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Alerts & Recommendations</h3>
                <div className="space-y-3">
                  {plan.alerts.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {a.level === 'success'
                        ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 shrink-0" />
                        : <TriangleAlert size={15} className="text-amber-400 mt-0.5 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium text-white/80">{a.message}</p>
                        <p className="text-xs text-white/30">{a.detail}</p>
                      </div>
                    </div>
                  ))}
                  {plan.recommendations.map((r: string, i: number) => (
                    <p key={i} className="text-sm text-white/40 pl-5">→ {r}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
