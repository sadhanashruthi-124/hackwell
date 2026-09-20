import { useAuth } from '../context/useAuth'
import Header from '../components/layout/Header'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="System configuration and preferences" />

      <div className="flex-1 p-8 space-y-5 overflow-auto max-w-2xl">
        {/* Profile */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Profile</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Name</label>
                <p className="text-sm text-white font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Email</label>
                <p className="text-sm text-white/70">{user?.email}</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Role</label>
                <p className="text-sm text-white/70 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Rules */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Resource Rules</h2>
            <p className="text-xs text-white/30 mt-0.5">Default allocation ratios used by the optimization engine</p>
          </div>
          <div className="px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Resource</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Rule</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Computers', '1 per participant', '1:1'],
                  ['Chairs', '1.05 per participant (+5% buffer)', '1.05:1'],
                  ['Projectors', '1 per 50 participants', '1:50'],
                  ['Buses', '1 per 112 participants', '1:112'],
                ].map(([resource, rule, value]) => (
                  <tr key={resource}>
                    <td className="py-3 font-medium text-white/80">{resource}</td>
                    <td className="py-3 text-white/50">{rule}</td>
                    <td className="py-3 text-indigo-300 font-mono text-xs">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Info */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">System Information</h2>
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
                <span className="text-white/30">{k}</span>
                <span className="text-white/70 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
