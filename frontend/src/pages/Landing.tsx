import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Database, Cpu, BarChart3, FileText, Zap, Shield, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const step = Math.ceil(target / (1800 / 16))
          const timer = setInterval(() => {
            start += step
            if (start >= target) { setCount(target); clearInterval(timer) }
            else setCount(start)
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>
}

function FloatingOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  )
}

function PipelineCard({ step, icon: Icon, title, desc, color, delay }: {
  step: number; icon: React.ElementType; title: string; desc: string; color: string; delay: string
}) {
  return (
    <div className="pipeline-card" style={{ animationDelay: delay }}>
      <div className={`pipeline-icon ${color}`}><Icon size={20} /></div>
      <div className="pipeline-step-num">Step {step}</div>
      <h3 className="pipeline-title">{title}</h3>
      <p className="pipeline-desc">{desc}</p>
    </div>
  )
}

const STYLES = `
  body { margin: 0; }
  .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; animation: floatOrb 10s ease-in-out infinite; }
  .orb-1 { width: 520px; height: 520px; background: radial-gradient(circle, #6366f1, transparent); top: -120px; left: -100px; animation-duration: 12s; }
  .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6, transparent); top: 200px; right: -80px; animation-duration: 9s; animation-delay: -3s; }
  .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #06b6d4, transparent); bottom: 80px; left: 30%; animation-duration: 14s; animation-delay: -6s; }
  .orb-4 { width: 250px; height: 250px; background: radial-gradient(circle, #a78bfa, transparent); bottom: -60px; right: 20%; animation-duration: 10s; animation-delay: -2s; }
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0px) scale(1); }
    33% { transform: translateY(-40px) scale(1.05); }
    66% { transform: translateY(20px) scale(0.97); }
  }
  .hero-badge { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.1s; }
  .hero-h1    { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.25s; }
  .hero-sub   { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.4s; }
  .hero-ctas  { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.55s; }
  .hero-card  { animation: fadeSlideUp 0.8s ease both; animation-delay: 0.7s; }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pipeline-card {
    position: relative; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 28px 24px 32px; backdrop-filter: blur(12px);
    animation: revealCard 0.7s ease both; transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .pipeline-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(99,102,241,0.2); border-color: rgba(139,92,246,0.4); }
  @keyframes revealCard { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  .pipeline-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .pipeline-icon.indigo { background: rgba(99,102,241,0.2); color: #a5b4fc; }
  .pipeline-icon.violet { background: rgba(139,92,246,0.2); color: #c4b5fd; }
  .pipeline-icon.cyan   { background: rgba(6,182,212,0.2); color: #67e8f9; }
  .pipeline-icon.amber  { background: rgba(245,158,11,0.2); color: #fcd34d; }
  .pipeline-step-num { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #6366f1; text-transform: uppercase; margin-bottom: 8px; }
  .pipeline-title { font-size: 17px; font-weight: 700; color: #f1f5f9; margin: 0 0 10px; }
  .pipeline-desc { font-size: 13.5px; color: #94a3b8; line-height: 1.65; margin: 0; }
  .stat-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px 24px; text-align: center; transition: transform 0.3s, border-color 0.3s; }
  .stat-card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.35); }
  .feature-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .feature-item:last-child { border-bottom: none; }
  .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 700; font-size: 15px; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 8px 24px rgba(99,102,241,0.4); transition: transform 0.25s, box-shadow 0.25s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(99,102,241,0.55); }
  .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: rgba(255,255,255,0.06); color: #cbd5e1; font-weight: 600; font-size: 15px; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; cursor: pointer; transition: background 0.25s, border-color 0.25s; }
  .btn-secondary:hover { background: rgba(255,255,255,0.11); border-color: rgba(255,255,255,0.22); }
  .glow-text { background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .cursor-blink { animation: blink 1s step-start infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse-ring 2s ease infinite; }
  @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); } 70% { box-shadow: 0 0 0 8px rgba(74,222,128,0); } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } }
`

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const t = setTimeout(() => {}, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d28 40%, #0a1628 100%)', color: '#e2e8f0', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", overflowX: 'hidden' }}>

        {/* NAV */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,26,0.75)', backdropFilter: 'blur(20px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                <Zap size={18} color="white" />
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EventOptima</span>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user ? (
                <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', fontSize: 14 }}>
                  Go to Workspace <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => navigate('/login')} style={{ padding: '10px 20px', fontSize: 14 }}>Sign In</button>
                  <button className="btn-primary" onClick={() => navigate('/register')} style={{ padding: '10px 20px', fontSize: 14 }}>
                    Get Started <ArrowRight size={14} />
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section style={{ position: 'relative', paddingTop: 100, paddingBottom: 80, overflow: 'hidden' }}>
          <FloatingOrbs />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', marginBottom: 28 }}>
              <div className="pulse-dot" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', letterSpacing: '0.05em' }}>AI-Powered Event Planning Platform</span>
            </div>

            <h1 className="hero-h1" style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24, color: '#f1f5f9' }}>
              Plan institutional events{' '}
              <span className="glow-text">with intelligence</span>
              <br />and zero guesswork.
            </h1>

            <p className="hero-sub" style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 40px' }}>
              Predict turnout with ML, optimize campus resources in real-time, and generate conflict-free logistics plans from your actual institutional data.
            </p>

            <div className="hero-ctas" style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/register')}>Start Planning Free <ArrowRight size={16} /></button>
              <button className="btn-secondary" onClick={() => navigate('/login')}>Sign In to Workspace</button>
            </div>

            <div className="hero-card" style={{ marginTop: 60, display: 'inline-block', width: '100%', maxWidth: 680 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '24px 28px', backdropFilter: 'blur(20px)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
                  </div>
                  <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>eventoptima — prediction output</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, textAlign: 'left', lineHeight: 2 }}>
                  <div style={{ color: '#64748b' }}>$ predict_attendance --event "TechFest 2026"</div>
                  <div style={{ color: '#4ade80' }}>&#10003; Model trained on <span style={{ color: '#818cf8' }}>24 historical records</span></div>
                  <div style={{ color: '#e2e8f0' }}>&rarr; Predicted Attendance: <span style={{ color: '#fbbf24', fontWeight: 700 }}>1,247</span></div>
                  <div style={{ color: '#e2e8f0' }}>&rarr; Confidence Range: <span style={{ color: '#38bdf8' }}>1,180 – 1,310</span></div>
                  <div style={{ color: '#e2e8f0' }}>&rarr; Resource Plan: <span style={{ color: '#4ade80' }}>&#10003; Generated</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#64748b' }}>$</span>
                    <span className="cursor-blink" style={{ display: 'inline-block', width: 2, height: 14, background: '#818cf8', verticalAlign: 'middle' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            {[
              { value: 95, suffix: '%', label: 'Prediction Accuracy', color: '#818cf8' },
              { value: 3, suffix: 'x', label: 'Faster Planning', color: '#c084fc' },
              { value: 0, suffix: ' conflicts', label: 'Resource Conflicts', color: '#38bdf8' },
              { value: 100, suffix: '%', label: 'Data-Driven', color: '#4ade80' },
            ].map(({ value, suffix, label, color }) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: 42, fontWeight: 900, color, marginBottom: 6 }}>
                  <AnimatedNumber target={value} suffix={suffix} />
                </div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PIPELINE */}
        <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 12 }}>The Intelligence Pipeline</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, letterSpacing: '-0.02em' }}>From raw data to actionable plans</h2>
              <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>EventOptima transforms your institutional history into optimized, conflict-free event logistics.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <PipelineCard step={1} icon={Database} title="Historical Records" color="indigo" delay="0.1s" desc="Import past attendance, registrations, and duration data to build your institution's unique baseline." />
              <PipelineCard step={2} icon={Cpu} title="ML Prediction" color="violet" delay="0.2s" desc="Random Forest models predict turnout with confidence bounds based on real event patterns." />
              <PipelineCard step={3} icon={BarChart3} title="Resource Optimizer" color="cyan" delay="0.3s" desc="Constraint solvers match predicted demand against actual campus inventory — no shortages, no waste." />
              <PipelineCard step={4} icon={FileText} title="Export Reports" color="amber" delay="0.4s" desc="Generate complete logistics plans, bus routes, equipment schedules, and PDF/Excel reports." />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 12 }}>Why EventOptima</div>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9', marginBottom: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Built for institutional event organizers</h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>No more spreadsheets, no more guesswork. EventOptima gives you a complete data pipeline from historical import to final report export.</p>
              <div>
                {[
                  { icon: Shield, label: 'Zero fake data', desc: 'Every prediction is trained on your real institutional history.' },
                  { icon: TrendingUp, label: 'Dynamic ML model', desc: 'Model retrains on each prediction call with the latest records.' },
                  { icon: Users, label: 'Campus-aware optimization', desc: 'Inventory, bus logistics, and venue capacity fully integrated.' },
                  { icon: CheckCircle2, label: 'Minimum 3 records required', desc: 'We enforce data quality — no results without sufficient history.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="feature-item">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#818cf8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 600, marginBottom: 20 }}>Resource Allocation Preview</div>
              {[
                { name: 'Computers', used: 80, total: 100, color: '#818cf8' },
                { name: 'Projectors', used: 12, total: 15, color: '#c084fc' },
                { name: 'Chairs', used: 1200, total: 1500, color: '#38bdf8' },
                { name: 'Buses', used: 4, total: 6, color: '#4ade80' },
              ].map(({ name, used, total, color }) => {
                const pct = Math.round((used / total) * 100)
                return (
                  <div key={name} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>{name}</span>
                      <span style={{ color, fontWeight: 700 }}>{used} / {total}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 999 }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4ade80', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> All resources within safe limits
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.15), transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#f1f5f9', marginBottom: 16, letterSpacing: '-0.02em' }}>Ready to plan smarter?</h2>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.7 }}>Create your free organizer workspace in minutes and see your first ML prediction in action.</p>
            <button className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: 16, padding: '16px 36px' }}>
              Create Free Account <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: '#334155' }}>
          &copy; 2026 EventOptima Platform &mdash; Intelligent Event Planning &amp; Resource Optimization for Institutions.
        </footer>
      </div>
    </>
  )
}
