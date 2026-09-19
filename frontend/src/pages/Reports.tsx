import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, FileSpreadsheet } from 'lucide-react'
import Header from '../components/layout/Header'
import { eventsAPI, reportsAPI } from '../services/api'

export default function Reports() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    eventsAPI.list().then(res => setEvents(res.data)).finally(() => setLoading(false))
  }, [])

  const downloadFile = async (eventId: number, type: 'pdf' | 'excel', eventName: string) => {
    setDownloading(`${eventId}-${type}`)
    try {
      const res = type === 'pdf'
        ? await reportsAPI.pdf(eventId)
        : await reportsAPI.excel(eventId)
      const blob = new Blob([res.data], { type: String(res.headers['content-type'] ?? '') })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName.replace(/\s+/g, '_')}_plan.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Run optimization first to generate a report.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Download event plans as PDF or Excel" />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Event Reports</h2>
            <p className="text-sm text-slate-500 mt-0.5">Generate reports only after running optimization for an event.</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Event', 'Date', 'Status', 'PDF Report', 'Excel Export'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                    No events yet. <button onClick={() => navigate('/events/new')} className="text-blue-700 font-medium">Create one →</button>
                  </td>
                </tr>
              ) : events.map(event => {
                const hasOptimization = ['planned', 'confirmed', 'conflict'].includes(event.status)
                return (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{event.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{event.event_type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        event.status === 'planned' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : event.status === 'conflict' ? 'bg-red-50 text-red-700 border border-red-200'
                        : event.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>{event.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        id={`pdf-${event.id}`}
                        onClick={() => downloadFile(event.id, 'pdf', event.name)}
                        disabled={!hasOptimization || downloading === `${event.id}-pdf`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FileText size={13} className="text-red-500" />
                        {downloading === `${event.id}-pdf` ? 'Generating...' : 'Download PDF'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        id={`excel-${event.id}`}
                        onClick={() => downloadFile(event.id, 'excel', event.name)}
                        disabled={!hasOptimization || downloading === `${event.id}-excel`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FileSpreadsheet size={13} className="text-green-600" />
                        {downloading === `${event.id}-excel` ? 'Generating...' : 'Download Excel'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
