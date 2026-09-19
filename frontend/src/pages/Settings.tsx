import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="System configuration and preferences" />

      <div className="flex-1 p-8 space-y-5 overflow-auto max-w-2xl">
        {/* Profile */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                <p className="text-sm text-slate-900 font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <p className="text-sm text-slate-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                <p className="text-sm text-slate-900 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Rules */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Resource Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Default allocation ratios used by the optimization engine</p>
          </div>
          <div className="px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rule</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  ['Computers', '1 per participant', '1:1'],
                  ['Chairs', '1.05 per participant (+5% buffer)', '1.05:1'],
                  ['Projectors', '1 per 50 participants', '1:50'],
                  ['Buses', '1 per 112 participants', '1:112'],
                ].map(([resource, rule, value]) => (
                  <tr key={resource}>
                    <td className="py-3 font-medium text-slate-900">{resource}</td>
                    <td className="py-3 text-slate-600">{rule}</td>
                    <td className="py-3 text-slate-700 font-mono text-xs">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">System Information</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            {[
              ['ML Model', 'Random Forest Regression (scikit-learn)'],
              ['Optimization', 'Constraint-based greedy allocation'],
              ['Database', 'PostgreSQL'],
              ['Backend', 'FastAPI (Python)'],
              ['Frontend', 'React + TypeScript + Tailwind CSS'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-900 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
