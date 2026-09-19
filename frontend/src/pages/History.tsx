import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Header from '../components/layout/Header'
import { historyAPI } from '../services/api'

const EVENT_TYPES = ['', 'hackathon', 'symposium', 'cultural', 'sports', 'workshop', 'seminar', 'conference']

export default function History() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    historyAPI.list(filter || undefined)
      .then(res => setHistory(res.data))
      .finally(() => setLoading(false))
  }, [filter])

  const chartData = history.slice(0, 12).map(h => ({
    date: h.event_date,
    registrations: h.registrations,
    attendance: h.attendance,
    rate: Math.round(h.attendance_rate * 100),
  }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Event History" subtitle="Historical data used for attendance prediction" />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        {/* Filter */}
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Filter by type:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 text-slate-700">
            {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All Types'}</option>)}
          </select>
          <span className="text-sm text-slate-500 ml-auto">{history.length} records</span>
        </div>

        {/* Chart */}
        {history.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Attendance vs Registrations</h2>
            <p className="text-sm text-slate-500 mb-5">Last {Math.min(12, chartData.length)} historical events</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="registrations" name="Registrations" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Date', 'Type', 'Registrations', 'Teams', 'Duration', 'Attendance', 'Rate', 'Venue Type'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No historical records found.</td></tr>
              ) : history.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-700 tabular-nums">{h.event_date}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 capitalize">{h.event_type}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 tabular-nums">{h.registrations.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 tabular-nums">{h.teams ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-700">{h.duration_hours}h</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-900 tabular-nums">{h.attendance.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold tabular-nums ${h.attendance_rate >= 0.85 ? 'text-green-700' : h.attendance_rate >= 0.70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Math.round(h.attendance_rate * 100)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 capitalize">{h.venue_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
