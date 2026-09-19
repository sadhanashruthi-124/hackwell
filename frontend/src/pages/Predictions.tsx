import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart2, ArrowRight, Zap, Users, Clock, Tag } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)

  // Load events list if no eventId specified or to populate dropdown
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
      predictionsAPI.get(selectedId).catch(() => null),
    ]).then(([evRes, predRes]) => {
      setEvent(evRes.data)
      if (predRes) setPrediction(predRes.data)
      else setPrediction(null)
      return historyAPI.list(evRes.data.event_type)
    }).then(histRes => {
      setHistory(histRes.data.slice(0, 8))
    }).catch(console.error).finally(() => setLoading(false))
  }, [selectedId])

  const runPrediction = async () => {
    if (!selectedId) return
    setRunning(true)
    try {
      const res = await predictionsAPI.run(selectedId)
      setPrediction(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const chartData = [
    ...history.map(h => ({
      name: h.event_date,
      attendance: h.attendance,
      registrations: h.registrations,
      type: 'historical',
    })),
    prediction ? {
      name: event?.date ?? 'Predicted',
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
          <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Event:</span>
              <select
                value={selectedId ?? ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelectedId(id)
                  navigate(`/predictions/${id}`)
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
          <div className="text-sm text-slate-400">Loading event data...</div>
        ) : !event ? (
          <div className="text-sm text-red-600">No events found. Create an event first.</div>
        ) : (
          <>
            {/* Top row */}
            <div className="grid grid-cols-3 gap-5">
              {/* Prediction card */}
              <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Predicted Attendance</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Random Forest Regression — based on {history.length} historical events</p>
                  </div>
                  {!prediction ? (
                    <button
                      onClick={runPrediction}
                      disabled={running}
                      id="run-prediction-btn"
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded transition-colors"
                    >
                      <BarChart2 size={14} />
                      {running ? 'Predicting...' : 'Run Prediction'}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/optimization/${selectedId}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded transition-colors"
                    >
                      <Zap size={14} />
                      Optimize Resources
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {prediction ? (
                  <div className="flex items-end gap-8">
                    <div>
                      <p className="text-5xl font-bold text-slate-900 tabular-nums">{prediction.predicted_attendance.toLocaleString()}</p>
                      <p className="text-sm text-slate-500 mt-1">participants expected</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Expected Range (Confidence Interval)</p>
                      <p className="text-xl font-semibold text-slate-700 tabular-nums">
                        {prediction.confidence_low.toLocaleString()} – {prediction.confidence_high.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-sm text-slate-400">
                    Click "Run Prediction" to generate an attendance forecast using the ML model.
                  </div>
                )}
              </div>

              {/* Input factors */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Input Factors</h2>
                <div className="space-y-3">
                  <FactorRow icon={<Tag size={13} />} label="Event Type" value={event.event_type} />
                  <FactorRow icon={<Users size={13} />} label="Registrations" value={event.registrations.toLocaleString()} />
                  <FactorRow icon={<Users size={13} />} label="Teams" value={event.teams ? String(event.teams) : '—'} />
                  <FactorRow icon={<Clock size={13} />} label="Duration" value={`${event.duration_hours} hours`} />
                  {prediction && (
                    <>
                      <div className="border-t border-slate-100 my-2" />
                      <FactorRow icon={<BarChart2 size={13} />} label="Attendance Rate" value={`${Math.round((prediction.predicted_attendance / event.registrations) * 100)}%`} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Historical comparison chart */}
            {history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Historical Comparison</h2>
                <p className="text-sm text-slate-500 mb-5">Past {event.event_type} events vs current prediction</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="registrations" name="Registrations" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="attendance" name="Attendance" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
                    {prediction && (
                      <ReferenceLine y={prediction.predicted_attendance} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: 'Predicted', fontSize: 10, fill: '#3b82f6', position: 'right' }} />
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
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900 capitalize">{value}</span>
    </div>
  )
}
