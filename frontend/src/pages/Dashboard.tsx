import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Database, Package, Bell, CheckCircle2,
  Sparkles, PlusCircle
} from 'lucide-react'
import Header from '../components/layout/Header'
import { eventsAPI, resourcesAPI, historyAPI, sampleDataAPI } from '../services/api'
import { useAuth } from '../context/useAuth'

interface Event {
  id: number
  name: string
  event_type: string
  date: string
  duration_hours: number
  registrations: number
  expected_participants?: number
  status: string
}

interface Resource {
  id: number
  resource_type: string
  name: string
  total_quantity: number
  available_quantity: number
  utilization_pct: number
}

const STATUS_STYLES: Record<string, string> = {
  planned:   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  draft:     'bg-white/5 text-white/50 border border-white/10',
  confirmed: 'bg-green-500/15 text-green-300 border border-green-500/25',
  conflict:  'bg-red-500/15 text-red-300 border border-red-500/25',
  completed: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  cancelled: 'bg-white/5 text-white/30 border border-white/10',
}

const UTIL_BAR_COLORS: Record<string, string> = {
  computers:   'from-indigo-500 to-indigo-400',
  projectors:  'from-violet-500 to-violet-400',
  chairs:      'from-green-500 to-green-400',
  buses:       'from-blue-500 to-blue-400',
  screens:     'from-purple-500 to-purple-400',
  microphones: 'from-teal-500 to-teal-400',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [historicalCount, setHistoricalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sampleModalOpen, setSampleModalOpen] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      eventsAPI.list(),
      resourcesAPI.list(),
      historyAPI.list(),
    ])
      .then(([evRes, rRes, histRes]) => {
        setEvents(evRes.data)
        setResources(rRes.data)
        setHistoricalCount(histRes.data.length)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLoadSample = async () => {
    setLoadingSample(true)
    try {
      await sampleDataAPI.load()
      setSampleModalOpen(false)
      loadData()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to load sample dataset')
    } finally {
      setLoadingSample(false)
    }
  }

  const conflicts = events.filter(e => e.status === 'conflict').length

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" showCreateEvent />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
        {/* Welcome banner */}
        <div className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-white">
              Welcome to EventOptima{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              {user?.institution_name ? `${user.institution_name} · ` : ''}Your event planning & resource optimization workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/events/new')}
              className="btn-dark-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <PlusCircle size={13} />
              Create Event
            </button>
            <button
              onClick={() => setSampleModalOpen(true)}
              className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <Sparkles size={13} className="text-indigo-400" />
              Load Sample Dataset
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            icon={<CalendarDays size={18} className="text-indigo-400" />}
            iconBg="bg-indigo-500/15"
            label="Events"
            value={loading ? '—' : String(events.length)}
            accent="#818cf8"
          />
          <KpiCard
            icon={<Database size={18} className="text-violet-400" />}
            iconBg="bg-violet-500/15"
            label="Historical Records"
            value={loading ? '—' : String(historicalCount)}
            accent="#c084fc"
          />
          <KpiCard
            icon={<Package size={18} className="text-cyan-400" />}
            iconBg="bg-cyan-500/15"
            label="Resources Declared"
            value={loading ? '—' : String(resources.length)}
            accent="#38bdf8"
          />
          <KpiCard
            icon={<Bell size={18} className="text-amber-400" />}
            iconBg="bg-amber-500/15"
            label="Active Conflicts"
            value={loading ? '—' : String(conflicts)}
            accent="#fbbf24"
          />
        </div>

        {/* Getting Started Checklist */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Getting Started Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <ChecklistItem
              title="1. Add Resources"
              desc="Declare available campus inventory"
              done={resources.length > 0}
              onClick={() => navigate('/resources')}
            />
            <ChecklistItem
              title="2. Import History"
              desc="Provide ≥ 3 records for ML model"
              done={historicalCount >= 3}
              onClick={() => navigate('/history')}
            />
            <ChecklistItem
              title="3. Create Event"
              desc="Specify requirements and date"
              done={events.length > 0}
              onClick={() => navigate('/events/new')}
            />
            <ChecklistItem
              title="4. Predict Turnout"
              desc="Generate data-driven attendance"
              done={events.some(e => e.status !== 'draft')}
              onClick={() => navigate('/predictions')}
            />
            <ChecklistItem
              title="5. Optimize Plan"
              desc="Allocate inventory & generate PDF"
              done={events.some(e => ['planned', 'confirmed', 'conflict'].includes(e.status))}
              onClick={() => navigate('/optimization')}
            />
          </div>
        </div>

        {/* Events Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Events</h2>
            {events.length > 0 && (
              <button onClick={() => navigate('/events')} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                View all →
              </button>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {['Event', 'Date', 'Duration', 'Registrations', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-white/30">Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-white/30">
                    No events created yet.{' '}
                    <button onClick={() => navigate('/events/new')} className="text-indigo-400 font-semibold hover:underline">
                      Create your first event →
                    </button>
                  </td>
                </tr>
              ) : events.slice(0, 5).map(event => (
                <tr key={event.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">{event.name}</p>
                    <p className="text-xs text-white/30 capitalize">{event.event_type}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-white/60">{event.date}</td>
                  <td className="px-6 py-3.5 text-sm text-white/60">{event.duration_hours} hrs</td>
                  <td className="px-6 py-3.5 text-sm text-white/80 font-medium tabular-nums">{event.registrations.toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => navigate(`/predictions/${event.id}`)} className="text-xs text-white/40 hover:text-white/80 font-medium transition-colors">Predict</button>
                      <button onClick={() => navigate(`/optimization/${event.id}`)} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Optimize</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resource Utilization */}
        {resources.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Resource Inventory & Utilization</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                Manage inventory →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {resources.slice(0, 4).map(r => (
                <div key={r.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="capitalize text-white/80">{r.name}</span>
                    <span className="text-white/40 tabular-nums">{r.utilization_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${UTIL_BAR_COLORS[r.resource_type] ?? 'from-indigo-500 to-indigo-400'}`}
                      style={{ width: `${r.utilization_pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    {r.available_quantity} available / {r.total_quantity} total
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Load Sample Dataset Modal */}
      {sampleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-base">
              <Sparkles size={20} />
              Load Sample Dataset?
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              This will add sample institutional events (24 historical records), venues, and resources to your workspace for demonstration purposes.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setSampleModalOpen(false)}
                className="btn-dark-ghost px-4 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadSample}
                disabled={loadingSample}
                className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
              >
                <Sparkles size={14} />
                {loadingSample ? 'Loading...' : 'Load Sample Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon, iconBg, label, value, accent }: { icon: React.ReactNode; iconBg: string; label: string; value: string; accent: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`inline-flex p-2 rounded-xl ${iconBg} mb-3`}>{icon}</div>
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{value}</p>
    </div>
  )
}

function ChecklistItem({ title, desc, done, onClick }: { title: string; desc: string; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3.5 rounded-xl border transition-all ${
        done
          ? 'bg-green-500/10 border-green-500/25 text-green-300'
          : 'bg-white/[0.03] border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-white/60'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold">{title}</span>
        {done ? (
          <CheckCircle2 size={14} className="text-green-400" />
        ) : (
          <div className="w-3 h-3 rounded-full border border-white/20" />
        )}
      </div>
      <p className="text-[11px] leading-tight opacity-70">{desc}</p>
    </button>
  )
}
