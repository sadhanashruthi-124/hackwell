import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart2, ArrowRight, Zap, Users, Clock, Tag, AlertTriangle, Plus, Database } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import Header from '../components/layout/Header'
import { predictionsAPI, historyAPI, eventsAPI } from '../services/api'

export default function Predictions() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(eventId ? Number(eventId) : null)
  const [prediction, setPrediction] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [allHistoryCount, setAllHistoryCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
    setErrorMessage('')
    Promise.all([
      eventsAPI.get(selectedId),
      predictionsAPI.get(selectedId).catch(() => null),
      historyAPI.list(),
    ]).then(([evRes, predRes, histAllRes]) => {
      setEvent(evRes.data)
      setAllHistoryCount(histAllRes.data.length)
      if (predRes) setPrediction(predRes.data)
      else setPrediction(null)
      const matched = histAllRes.data.filter((h: any) => h.event_type === evRes.data.event_type)
      setHistory(matched.slice(0, 8))
    }).catch(console.error).finally(() => setLoading(false))
  }, [selectedId])

  const runPrediction = async () => {
    if (!selectedId) return
    setRunning(true)
    setErrorMessage('')
    try {
      const res = await predictionsAPI.run(selectedId)
      setPrediction(res.data)
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      setErrorMessage(typeof detail === 'string' ? detail : 'Unable to generate prediction.')
    } finally {
      setRunning(false)
    }
  }

  const chartData = [
    ...history.map(h => ({
      name: h.event_name || h.event_date,
      attendance: h.attendance,
      registrations: h.registrations,
      type: 'historical',
    })),
    prediction ? {
      name: event?.name || 'Predicted Event',
      attendance: prediction.predicted_attendance,
      registrations: event?.registrations ?? 0,
      type: 'predicted',
    } : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Attendance Prediction"
        subtitle={event ? `ML attendance forecast for ${event.name}` : 'ML-powered attendance forecast'}
      />

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
                  navigate(`/predictions/${id}`)
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
          <div className="text-sm text-white/30">Loading event data...</div>
        ) : events.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30">
                <BarChart2 size={22} />
              </div>
              <p className="text-base font-medium text-white">No events created yet</p>
              <p className="text-xs text-white/30">Create an event to generate a data-driven attendance prediction.</p>
              <button
                onClick={() => navigate('/events/new')}
                className="btn-dark-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
              >
                <Plus size={14} />
                Create Event
              </button>
            </div>
          </div>
        ) : !event ? (
          <div className="text-sm text-red-400">Event not found.</div>
        ) : (
          <>
            {/* Insufficient Historical Data Alert */}
            {allHistoryCount < 3 && (
              <div className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-300">Prediction unavailable — Insufficient Historical Data</h3>
                    <p className="text-xs text-amber-300/60 mt-0.5">
                      Found {allHistoryCount} historical record{allHistoryCount !== 1 ? 's' : ''}. Machine Learning Random Forest regression requires at least 3 historical records to calculate confidence intervals and predicted attendance.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="btn-dark-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                >
                  <Database size={13} />
                  Add Historical Data
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-xs text-red-300 rounded-2xl">
                {errorMessage}
              </div>
            )}

            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Prediction card */}
              <div className="col-span-2 glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Predicted Attendance</h2>
                    <p className="text-xs text-white/30 mt-0.5">
                      {allHistoryCount >= 3
                        ? `Random Forest Regression — based on ${allHistoryCount} stored historical events`
                        : 'Requires at least 3 historical event records'}
                    </p>
                  </div>
                  {allHistoryCount >= 3 && (
                    !prediction ? (
                      <button
                        onClick={runPrediction}
                        disabled={running}
                        id="run-prediction-btn"
                        className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      >
                        <BarChart2 size={14} />
                        {running ? 'Predicting...' : 'Run Prediction'}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/optimization/${selectedId}`)}
                        className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      >
                        <Zap size={14} />
                        Optimize Resources
                        <ArrowRight size={14} />
                      </button>
                    )
                  )}
                </div>

                {prediction ? (
                  <div className="flex items-end gap-8">
                    <div>
                      <p className="text-5xl font-bold tabular-nums" style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {prediction.predicted_attendance.toLocaleString()}
                      </p>
                      <p className="text-sm text-white/30 mt-1">expected participants</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Expected Range (Confidence Interval)</p>
                      <p className="text-xl font-semibold text-white/80 tabular-nums">
                        {prediction.confidence_low.toLocaleString()} – {prediction.confidence_high.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : allHistoryCount < 3 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-sm font-semibold text-white/60">Prediction unavailable</p>
                    <p className="text-xs text-white/30 mt-1">Add historical event data to generate a data-driven attendance prediction.</p>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-sm text-white/30 bg-white/5 rounded-xl border border-dashed border-white/10">
                    Click "Run Prediction" to train the model on your stored records and forecast turnout.
                  </div>
                )}
              </div>

              {/* Input factors */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Input Factors</h2>
                <div className="space-y-3">
                  <FactorRow icon={<Tag size={13} />} label="Event Type" value={event.event_type} />
                  <FactorRow icon={<Users size={13} />} label="Registrations" value={event.registrations.toLocaleString()} />
                  <FactorRow icon={<Users size={13} />} label="Teams" value={event.teams ? String(event.teams) : '—'} />
                  <FactorRow icon={<Clock size={13} />} label="Duration" value={`${event.duration_hours} hours`} />
                  <FactorRow icon={<Database size={13} />} label="Historical Records" value={`${allHistoryCount} records`} />
                  {prediction && (
                    <>
                      <div className="border-t border-white/10 my-2" />
                      <FactorRow icon={<BarChart2 size={13} />} label="Attendance Rate" value={`${Math.round((prediction.predicted_attendance / event.registrations) * 100)}%`} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Historical comparison chart */}
            {history.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-1">Historical Comparison</h2>
                <p className="text-xs text-white/30 mb-5">Past {event.event_type} events vs current prediction</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="registrations" name="Registrations" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" name="Attendance" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    {prediction && (
                      <ReferenceLine y={prediction.predicted_attendance} stroke="#c084fc" strokeDasharray="4 2" label={{ value: 'Predicted', fontSize: 10, fill: '#c084fc', position: 'right' }} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FactorRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/30">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium text-white/80 capitalize">{value}</span>
    </div>
  )
}
