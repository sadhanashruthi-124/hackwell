import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, FileSpreadsheet, Plus } from 'lucide-react'
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

  const STATUS_STYLES: Record<string, string> = {
    planned:   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    draft:     'bg-white/5 text-white/50 border border-white/10',
    confirmed: 'bg-green-500/15 text-green-300 border border-green-500/25',
    conflict:  'bg-red-500/15 text-red-300 border border-red-500/25',
    completed: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Download official event logistics plans as PDF or Excel" />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Event Logistics Reports</h2>
            <p className="text-xs text-white/30 mt-0.5">Official reports are generated only from real, completed optimization runs.</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {['Event', 'Date', 'Status', 'PDF Logistics Report', 'Excel Spreadsheet'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-white/30">Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30">
                        <FileText size={22} />
                      </div>
                      <p className="text-base font-medium text-white">No optimized event plans yet</p>
                      <p className="text-xs text-white/30">
                        Create an event and run resource optimization to generate exportable PDF and Excel reports.
                      </p>
                      <button
                        onClick={() => navigate('/events/new')}
                        className="btn-dark-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Create Event
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map(event => {
                  const hasOptimization = ['planned', 'confirmed', 'conflict'].includes(event.status)
                  return (
                    <tr key={event.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{event.name}</p>
                        <p className="text-xs text-white/30 capitalize">{event.event_type}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">{event.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasOptimization ? (
                          <button
                            id={`pdf-${event.id}`}
                            onClick={() => downloadFile(event.id, 'pdf', event.name)}
                            disabled={downloading === `${event.id}-pdf`}
                            className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                          >
                            <FileText size={13} className="text-red-400" />
                            {downloading === `${event.id}-pdf` ? 'Generating...' : 'Download PDF'}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/optimization/${event.id}`)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                          >
                            Optimize First →
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {hasOptimization ? (
                          <button
                            id={`excel-${event.id}`}
                            onClick={() => downloadFile(event.id, 'excel', event.name)}
                            disabled={downloading === `${event.id}-excel`}
                            className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                          >
                            <FileSpreadsheet size={13} className="text-green-400" />
                            {downloading === `${event.id}-excel` ? 'Generating...' : 'Download Excel'}
                          </button>
                        ) : (
                          <span className="text-xs text-white/20">Not generated</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
