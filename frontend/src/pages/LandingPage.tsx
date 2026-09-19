import { useNavigate } from 'react-router-dom'
import { Grid2X2, BarChart2, Package, TrendingUp, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
            <Grid2X2 size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-blue-900 tracking-tight">HackWell</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Event Planning Platform
          </div>

          <h1 className="text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            HackWell
          </h1>

          <p className="text-xl font-medium text-slate-600 mb-4">
            Intelligent Event Planning & Resource Optimization
          </p>

          <p className="text-base text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Plan institutional events, predict attendance, detect resource constraints,
            and generate optimized resource plans using your historical data.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              id="get-started-btn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get Started
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
          <FeatureCard
            icon={<TrendingUp size={20} className="text-blue-700" />}
            bg="bg-blue-50"
            title="Attendance Prediction"
            description="ML-powered forecasts based on your institution's actual historical event data."
          />
          <FeatureCard
            icon={<Package size={20} className="text-green-700" />}
            bg="bg-green-50"
            title="Resource Optimization"
            description="Automatically detect shortages and generate optimized allocation plans."
          />
          <FeatureCard
            icon={<BarChart2 size={20} className="text-indigo-700" />}
            bg="bg-indigo-50"
            title="Reports & Export"
            description="Generate PDF and Excel reports from your finalized event plans."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 px-8 text-center text-xs text-slate-400">
        HackWell — Institutional Event Planning & Resource Optimization
      </footer>
    </div>
  )
}

function FeatureCard({ icon, bg, title, description }: {
  icon: React.ReactNode
  bg: string
  title: string
  description: string
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 text-left">
      <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}>{icon}</div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}
