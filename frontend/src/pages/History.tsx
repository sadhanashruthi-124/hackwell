import { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Header from '../components/layout/Header'
import { historyAPI, sampleDataAPI } from '../services/api'
import { Plus, Upload, Download, Sparkles, Trash2, Pencil, X, Check, Database, AlertCircle } from 'lucide-react'

const EVENT_TYPES = ['hackathon', 'symposium', 'cultural', 'sports', 'workshop', 'seminar', 'conference', 'other']

interface HistoricalRecord {
  id: number
  event_name?: string
  event_type: string
  registrations: number
  teams?: number
  duration_hours: number
  attendance: number
  venue_type: string
  event_date: string
  day_of_week: number
  month: number
  attendance_rate: number
}

export default function History() {
  const [history, setHistory] = useState<HistoricalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [sampleModalOpen, setSampleModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Form inputs
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('hackathon')
  const [eventDate, setEventDate] = useState('2025-10-12')
  const [registrations, setRegistrations] = useState(800)
  const [teams, setTeams] = useState(200)
  const [durationHours, setDurationHours] = useState(24)
  const [attendance, setAttendance] = useState(672)
  const [venueType, setVenueType] = useState('indoor')
  const [reqComputers, setReqComputers] = useState(0)
  const [reqProjectors, setReqProjectors] = useState(0)
  const [reqChairs, setReqChairs] = useState(0)
  const [reqBuses, setReqBuses] = useState(0)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // CSV file ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await historyAPI.list(filter || undefined)
      setHistory(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const handleOpenAdd = () => {
    setEditId(null)
    setEventName('')
    setEventType('hackathon')
    setEventDate(new Date().toISOString().split('T')[0])
    setRegistrations(500)
    setTeams(100)
    setDurationHours(8)
    setAttendance(420)
    setVenueType('indoor')
    setReqComputers(10)
    setReqProjectors(2)
    setReqChairs(500)
    setReqBuses(1)
    setFormError('')
    setAddModalOpen(true)
  }

  const handleOpenEdit = (rec: HistoricalRecord) => {
    setEditId(rec.id)
    setEventName(rec.event_name || '')
    setEventType(rec.event_type)
    setEventDate(rec.event_date)
    setRegistrations(rec.registrations)
    setTeams(rec.teams || 0)
    setDurationHours(rec.duration_hours)
    setAttendance(rec.attendance)
    setVenueType(rec.venue_type)
    setReqComputers(rec.req_computers ?? 0)
    setReqProjectors(rec.req_projectors ?? 0)
    setReqChairs(rec.req_chairs ?? 0)
    setReqBuses(rec.req_buses ?? 0)
    setFormError('')
    setAddModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this historical record?')) return
    try {
      await historyAPI.delete(id)
      fetchHistory()
    } catch {
      alert('Failed to delete record')
    }
  }

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventDate) { setFormError('Date is required'); return }
    if (registrations <= 0) { setFormError('Registrations must be greater than 0'); return }
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        event_name: eventName || undefined,
        event_type: eventType,
        event_date: eventDate,
        registrations: Number(registrations),
        teams: Number(teams) || null,
        duration_hours: Number(durationHours),
        attendance: Number(attendance),
        venue_type: venueType,
        req_computers: Number(reqComputers),
        req_projectors: Number(reqProjectors),
        req_chairs: Number(reqChairs),
        req_buses: Number(reqBuses),
      }
      if (editId) {
        await historyAPI.update(editId, payload)
      } else {
        await historyAPI.create(payload)
      }
      setAddModalOpen(false)
      fetchHistory()
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to save historical record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLoadSampleData = async () => {
    setSubmitting(true)
    try {
      await sampleDataAPI.load()
      setSampleModalOpen(false)
      fetchHistory()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to load sample dataset')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) { setImportError('Please select a CSV file to upload'); return }
    setImporting(true)
    setImportError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      await historyAPI.importCsv(formData)
      setImportModalOpen(false)
      setUploadFile(null)
      fetchHistory()
    } catch (err: any) {
      setImportError(err?.response?.data?.detail || 'Failed to import CSV file. Please verify columns.')
    } finally {
      setImporting(false)
    }
  }

  const chartData = history.slice(0, 12).map((h) => ({
    name: h.event_name || h.event_date,
    registrations: h.registrations,
    attendance: h.attendance,
    rate: Math.round(h.attendance_rate * 100),
  }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Historical Data" subtitle="Past event records used to train data-driven attendance prediction models" />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
        {/* Action Toolbar */}
        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Filter by type:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-dark h-8 px-3 text-xs font-medium capitalize"
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
            <span className="text-xs text-white/30 ml-2 font-medium">
              {history.length} record{history.length !== 1 ? 's' : ''} stored
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="btn-dark-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <Plus size={13} />
              Add Historical Event
            </button>
            <button
              onClick={() => { setUploadFile(null); setImportError(''); setImportModalOpen(true) }}
              className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
            >
              <Upload size={13} />
              Import CSV
            </button>
            <a
              href={historyAPI.templateCsvUrl}
              download="hackwell_historical_template.csv"
              className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
            >
              <Download size={13} />
              Download CSV Template
            </a>
            <button
              onClick={() => setSampleModalOpen(true)}
              className="btn-dark-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            >
              <Sparkles size={13} />
              Load Sample Dataset
            </button>
          </div>
        </div>

        {/* Attendance Chart */}
        {history.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-1">Attendance vs Registrations</h2>
            <p className="text-xs text-white/30 mb-5">Showing recent {Math.min(12, chartData.length)} historical records</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="registrations" name="Registrations" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Actual Attendance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {['Event Name', 'Date', 'Type', 'Registrations', 'Teams', 'Duration', 'Attendance', 'Turnout Rate', 'Venue Type', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-white/30">Loading historical records...</td></tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30">
                        <Database size={22} />
                      </div>
                      <p className="text-base font-medium text-white">No historical event data yet</p>
                      <p className="text-xs text-white/30">
                        Add past event records or import a CSV to enable data-driven Random Forest attendance predictions.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button onClick={handleOpenAdd} className="btn-dark-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                          <Plus size={14} />
                          Add Historical Event
                        </button>
                        <button onClick={() => setSampleModalOpen(true)} className="btn-dark-ghost inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                          <Sparkles size={14} />
                          Load Sample Dataset
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-white">
                      {h.event_name || `${h.event_type.toUpperCase()} Event`}
                    </td>
                    <td className="px-5 py-3 text-sm text-white/60 tabular-nums whitespace-nowrap">{h.event_date}</td>
                    <td className="px-5 py-3 text-sm text-white/50 capitalize">{h.event_type}</td>
                    <td className="px-5 py-3 text-sm text-white/60 tabular-nums">{h.registrations.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-white/60 tabular-nums">{h.teams ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-white/60">{h.duration_hours}h</td>
                    <td className="px-5 py-3 text-sm font-semibold text-white/80 tabular-nums">{h.attendance.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold tabular-nums ${
                        h.attendance_rate >= 0.85 ? 'text-green-400' :
                        h.attendance_rate >= 0.70 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {Math.round(h.attendance_rate * 100)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white/50 capitalize">{h.venue_type}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEdit(h)} className="p-1.5 text-white/30 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — Add / Edit Historical Record */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">
                {editId ? 'Edit Historical Record' : 'Add Historical Event Record'}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-white/30 hover:text-white/70 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Event Name</label>
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Annual Hackathon 2025" className="input-dark w-full h-9 px-3 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Event Type <span className="text-red-400">*</span></label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="input-dark w-full h-9 px-3 text-sm capitalize">
                    {EVENT_TYPES.map((t) => (<option key={t} value={t} className="capitalize">{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Date <span className="text-red-400">*</span></label>
                  <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-dark w-full h-9 px-3 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Registrations <span className="text-red-400">*</span></label>
                  <input type="number" min="1" required value={registrations} onChange={(e) => setRegistrations(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Actual Attendance <span className="text-red-400">*</span></label>
                  <input type="number" min="0" required value={attendance} onChange={(e) => setAttendance(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Teams</label>
                  <input type="number" min="0" value={teams} onChange={(e) => setTeams(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Duration (hrs)</label>
                  <input type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Venue Type</label>
                  <select value={venueType} onChange={(e) => setVenueType(e.target.value)} className="input-dark w-full h-9 px-3 text-sm capitalize">
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Resource Usage (For ML Prediction)</h4>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Computers</label>
                  <input type="number" min="0" value={reqComputers} onChange={(e) => setReqComputers(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Projectors</label>
                  <input type="number" min="0" value={reqProjectors} onChange={(e) => setReqProjectors(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Chairs</label>
                  <input type="number" min="0" value={reqChairs} onChange={(e) => setReqChairs(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Buses</label>
                  <input type="number" min="0" value={reqBuses} onChange={(e) => setReqBuses(Number(e.target.value))} className="input-dark w-full h-9 px-3 text-sm tabular-nums" />
                </div>
              </div>

              {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn-dark-ghost px-4 py-2 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                  <Check size={14} />
                  {submitting ? 'Saving...' : editId ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Load Sample Dataset */}
      {sampleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle size={22} />
              <h3 className="text-base font-bold text-white">Load Sample Dataset?</h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              This will add sample institutional events (24 historical records), venues, and resources to your workspace for demonstration purposes.
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              Sample data is loaded on-demand and allows testing ML predictions and constraint optimization immediately.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => setSampleModalOpen(false)} className="btn-dark-ghost px-4 py-2 text-xs font-medium">Cancel</button>
              <button type="button" onClick={handleLoadSampleData} disabled={submitting} className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                <Sparkles size={14} />
                {submitting ? 'Loading...' : 'Load Sample Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — CSV Import */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">Import Historical Events CSV</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-white/30 hover:text-white/70 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <p className="text-xs text-white/40">
                Upload a CSV file containing historical institutional event records. Required columns: <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono">event_name, event_type, date, registrations, teams, duration, attendance, venue_type, req_computers, req_projectors, req_chairs, req_buses</code>.
              </p>

              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center space-y-2 hover:border-indigo-500/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="text-white/30 mx-auto" />
                <p className="text-sm font-medium text-white/60">{uploadFile ? uploadFile.name : 'Click to choose CSV file'}</p>
                <p className="text-xs text-white/30">Standard UTF-8 CSV</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0])
                    }
                  }}
                />
              </div>

              {importError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{importError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setImportModalOpen(false)} className="btn-dark-ghost px-4 py-2 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={importing || !uploadFile} className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                  <Upload size={14} />
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
