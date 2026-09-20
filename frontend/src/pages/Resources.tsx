import { useEffect, useState } from 'react'
import { resourcesAPI } from '../services/api'
import Header from '../components/layout/Header'
import { Plus, Pencil, Trash2, Package, Check, X } from 'lucide-react'

interface Resource {
  id: number
  resource_type: string
  name: string
  total_quantity: number
  available_quantity: number
  utilization_pct: number
  location: string
  status: string
}

const CATEGORIES = [
  'computers',
  'projectors',
  'chairs',
  'buses',
  'screens',
  'microphones',
  'venue',
  'furniture',
  'other',
]

const BAR_COLORS: Record<string, string> = {
  computers:   'from-indigo-500 to-indigo-400',
  projectors:  'from-violet-500 to-violet-400',
  chairs:      'from-green-500 to-green-400',
  buses:       'from-blue-500 to-blue-400',
  screens:     'from-purple-500 to-purple-400',
  microphones: 'from-teal-500 to-teal-400',
  venue:       'from-amber-500 to-amber-400',
  furniture:   'from-emerald-500 to-emerald-400',
  other:       'from-slate-500 to-slate-400',
}

const STATUS_BADGE: Record<string, string> = {
  available:   'bg-green-500/15 text-green-300 border border-green-500/25',
  maintenance: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  retired:     'bg-white/5 text-white/40 border border-white/10',
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [resourceType, setResourceType] = useState('computers')
  const [totalQuantity, setTotalQuantity] = useState(100)
  const [availableQuantity, setAvailableQuantity] = useState(100)
  const [location, setLocation] = useState('Central Campus')
  const [status, setStatus] = useState('available')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await resourcesAPI.list()
      setResources(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const handleOpenAdd = () => {
    setEditId(null)
    setName('')
    setResourceType('computers')
    setTotalQuantity(50)
    setAvailableQuantity(50)
    setLocation('Central Campus')
    setStatus('available')
    setError('')
    setModalOpen(true)
  }

  const handleOpenEdit = (r: Resource) => {
    setEditId(r.id)
    setName(r.name)
    setResourceType(r.resource_type)
    setTotalQuantity(r.total_quantity)
    setAvailableQuantity(r.available_quantity)
    setLocation(r.location)
    setStatus(r.status)
    setError('')
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    try {
      await resourcesAPI.delete(id)
      fetchResources()
    } catch {
      alert('Failed to delete resource.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Resource Name is required'); return }
    if (availableQuantity > totalQuantity) { setError('Available quantity cannot exceed total quantity'); return }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name,
        resource_type: resourceType,
        total_quantity: Number(totalQuantity),
        available_quantity: Number(availableQuantity),
        location,
        status,
      }
      if (editId) {
        await resourcesAPI.update(editId, payload)
      } else {
        await resourcesAPI.create(payload)
      }
      setModalOpen(false)
      fetchResources()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save resource')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Resource Inventory" subtitle="Add and manage available resources across your campus" />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
        {/* Top actions bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            {resources.length} resource item{resources.length !== 1 ? 's' : ''} declared
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          >
            <Plus size={14} />
            Add Resource
          </button>
        </div>

        {/* Utilization overview */}
        {resources.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Utilization Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {resources.map((r) => (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/70 font-medium capitalize">
                      {r.resource_type} <span className="font-normal text-white/30">({r.name})</span>
                    </span>
                    <span className="text-white/40 tabular-nums">{r.utilization_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[r.resource_type] ?? 'from-indigo-500 to-indigo-400'}`}
                      style={{ width: `${r.utilization_pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>{r.total_quantity - r.available_quantity} allocated</span>
                    <span>{r.available_quantity} available of {r.total_quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Inventory Items</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {['Resource', 'Category', 'Location', 'Total', 'Available', 'In Use', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-white/30">Loading inventory...</td></tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30">
                        <Package size={22} />
                      </div>
                      <p className="text-base font-medium text-white">No resources added yet</p>
                      <p className="text-xs text-white/30">
                        Add computers, projectors, seating, and vehicles to allow the optimization engine to plan event logistics.
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="btn-dark-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Add First Resource
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-white">{r.name}</td>
                    <td className="px-5 py-3.5 text-sm text-white/50 capitalize">{r.resource_type}</td>
                    <td className="px-5 py-3.5 text-sm text-white/50">{r.location}</td>
                    <td className="px-5 py-3.5 text-sm text-white/60 tabular-nums">{r.total_quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-white/80 tabular-nums font-semibold">{r.available_quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-white/60 tabular-nums">{r.total_quantity - r.available_quantity}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? STATUS_BADGE.available}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-white/30 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
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

      {/* Modal — Add / Edit Resource */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">
                {editId ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                  Resource Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Desktop Workstations"
                  className="input-dark w-full h-9 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="input-dark w-full h-9 px-3 text-sm capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Total Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalQuantity}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setTotalQuantity(val)
                      if (!editId) setAvailableQuantity(val)
                    }}
                    className="input-dark w-full h-9 px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Available Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(Number(e.target.value))}
                    className="input-dark w-full h-9 px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Location / Room</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Science Block Lab A"
                    className="input-dark w-full h-9 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-dark w-full h-9 px-3 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-dark-ghost px-4 py-2 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                >
                  <Check size={14} />
                  {submitting ? 'Saving...' : editId ? 'Update Resource' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
