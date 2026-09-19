import { useEffect, useState } from 'react'
import { resourcesAPI } from '../services/api'
import Header from '../components/layout/Header'

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

const BAR_COLORS: Record<string, string> = {
  computers: 'bg-blue-900',
  projectors: 'bg-indigo-600',
  chairs: 'bg-green-600',
  buses: 'bg-blue-500',
  screens: 'bg-purple-600',
  microphones: 'bg-teal-600',
}

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-green-50 text-green-700 border border-green-200',
  maintenance: 'bg-amber-50 text-amber-700 border border-amber-200',
  retired: 'bg-slate-100 text-slate-500 border border-slate-200',
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resourcesAPI.list()
      .then(res => setResources(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header title="Resources" subtitle="Campus resource inventory and utilization" />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
        {/* Utilization overview */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Utilization Overview</h2>
          {loading ? <p className="text-sm text-slate-400">Loading...</p> : (
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {resources.map(r => (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium capitalize">{r.resource_type} <span className="font-normal text-slate-400">({r.name})</span></span>
                    <span className="text-slate-500 tabular-nums">{r.utilization_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[r.resource_type] ?? 'bg-blue-600'}`}
                      style={{ width: `${r.utilization_pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{r.total_quantity - r.available_quantity} used</span>
                    <span>{r.available_quantity} available of {r.total_quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Full Inventory</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Resource', 'Type', 'Location', 'Total', 'Available', 'In Use', 'Utilization', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : resources.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 capitalize">{r.resource_type}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{r.location}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{r.total_quantity}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{r.available_quantity}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{r.total_quantity - r.available_quantity}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${BAR_COLORS[r.resource_type] ?? 'bg-blue-600'}`} style={{ width: `${r.utilization_pct}%` }} />
                      </div>
                      <span className="text-sm tabular-nums text-slate-600">{r.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? STATUS_BADGE.available}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
