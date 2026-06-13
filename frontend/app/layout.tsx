'use client'

// @ts-ignore
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Dna,
  Activity,
  Layers,
  PieChart,
  ShieldAlert,
  Grid3X3,
  Bookmark,
  LogOut,
  Clock,
  Radio,
  Menu,
  X,
  Upload,
  FolderOpen,
  Database,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [realTime, setRealTime] = useState('')
  const [ping, setPing] = useState(24)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setRealTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(20 + Math.random() * 8))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadUser = useCallback(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (!token) { setUser(null); return }
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  useEffect(() => { loadUser() }, [pathname, loadUser])

  useEffect(() => {
    loadUser()
    window.addEventListener('storage', loadUser)
    window.addEventListener('auth-changed', loadUser)
    return () => {
      window.removeEventListener('storage', loadUser)
      window.removeEventListener('auth-changed', loadUser)
    }
  }, [loadUser])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(path + '/')
  }

  const getLinkClass = (path: string) => {
    if (isActive(path)) {
      return 'flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono font-medium transition-all duration-150 border-l-2 text-[#00f5d4] bg-[#00f5d4]/5 border-[#00f5d4]'
    }
    return 'flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono font-medium transition-all duration-150 border-l-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#111726] border-transparent'
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050507] text-zinc-200 h-screen w-screen flex flex-col font-sans antialiased selection:bg-[#00f5d4]/20 selection:text-[#00f5d4] overflow-hidden">

        {/* ── Header ── */}
        <header className="h-14 w-full flex items-center justify-between bg-[#090a0d] border-b border-[#181b24] px-4 md:px-6 z-50 shrink-0">

          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#181b24] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative bg-[#050507] border border-[#1d222e] p-1.5 rounded text-[#00f5d4]">
                <Dna className="w-3.5 h-3.5 animate-[spin_8s_linear_infinite]" />
                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00f5d4]"></span>
                </span>
              </div>
              <span className="text-xs font-bold tracking-widest text-white font-mono uppercase">
                DiseaseGeneMap
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-0.5 text-[10px] font-mono border-r border-[#181b24] pr-5 mr-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>SYS_TIME:</span>
              <span className="text-zinc-100 font-bold tabular-nums tracking-wider bg-[#050507] border border-[#181b24] px-2 py-0.5 rounded uppercase text-[11px]">
                {realTime || '00:00:00 AM'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Radio className="w-3 h-3 text-[#00f5d4] animate-pulse" />
              <span>PING:</span>
              <span className="text-[#00f5d4] font-bold tabular-nums">{ping}ms</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 px-2.5 py-1 rounded bg-[#050507] border border-[#181b24]">
                <div className="text-[11px] font-mono text-[#00f5d4] flex items-center gap-1.5">
                  <span className="hidden sm:inline text-[9px] text-zinc-600 uppercase">OPERATOR:</span>
                  {user.username}
                </div>
                <button onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  setUser(null)
                  window.location.href = '/'
                }} title="Terminate Session"
                  className="p-1 rounded text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                >
                  <LogOut className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/signin" className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">
                  [ AUTH_SIGNIN ]
                </Link>
                <Link href="/signup" className="px-2.5 py-1 bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-[10px] font-mono font-bold text-[#00f5d4] rounded hover:bg-[#00f5d4]/20 transition-all">
                  INIT_ACCOUNT_
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden w-full">

          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* ── Sidebar ── */}
          <aside className={`
            fixed top-0 left-0 h-full w-56 bg-[#090a0d] border-r border-[#181b24]
            flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:static lg:translate-x-0 lg:shrink-0
          `}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#181b24] lg:hidden">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Navigation</span>
              <button onClick={() => setSidebarOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#181b24]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* Core */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-200 uppercase px-3 mb-2 block">// CORE PLATFORM SYSTEM</span>
                <Link href="/" className={getLinkClass('/')}><Grid3X3 className="w-3.5 h-3.5" /> Dashboard Matrix</Link>
              </div>

              {/* AI */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-200 uppercase px-3 mb-2 block">// AI INTELLIGENCE</span>
                <Link href="/ai-insights" className={getLinkClass('/ai-insights')}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="flex-1">AI Insights</span>
                  {!isActive('/ai-insights') && (
                    <span className="text-[8px] bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 px-1.5 py-0.5 rounded font-mono leading-none">
                      BETA
                    </span>
                  )}
                </Link>
              </div>

              {/* Biological Dictionary */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-200 uppercase px-3 mb-2 block">// BIOLOGICAL DICTIONARY</span>
                <Link href="/explorer" className={getLinkClass('/explorer')}>
                  <Dna className="w-3.5 h-3.5" /> Search Explorer
                </Link>
                {/* ← NEW: Database Explorer link */}
                <Link href="/database" className={getLinkClass('/database')}>
                  <Database className="w-3.5 h-3.5" />
                  <span className="flex-1">Database Explorer</span>
                  {!isActive('/database') && (
                    <span className="text-[8px] bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/20 px-1.5 py-0.5 rounded font-mono leading-none">
                      50/pg
                    </span>
                  )}
                </Link>
              </div>

              {/* Dataset Uploads */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-200 uppercase px-3 mb-2 block">// DATASET_MANAGEMENT</span>
                <Link href="/upload" className={getLinkClass('/upload')}><Upload className="w-3.5 h-3.5" /> Upload Dataset</Link>
                <Link href="/my-uploads" className={getLinkClass('/my-uploads')}><FolderOpen className="w-3.5 h-3.5" /> My Uploads</Link>
              </div>

              {/* Analytics */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-200 uppercase px-3 mb-2 block">// GRAPH_ANALYTICS</span>
                <Link href="/analytics" className={getLinkClass('/analytics')}><PieChart className="w-3.5 h-3.5" /> Visualizations</Link>
                <Link href="/favorites" className={getLinkClass('/favorites')}><Bookmark className="w-3.5 h-3.5" /> My Saved Lists</Link>
                <Link href="/about" className={getLinkClass('/about')}><Activity className="w-3.5 h-3.5" /> About</Link>
                <Link href="/admin" className={getLinkClass('/admin')}><ShieldAlert className="w-3.5 h-3.5" /> Admin Matrix Panel</Link>
              </div>

              {/* Mobile-only: sys stats */}
              <div className="md:hidden border-t border-[#181b24] pt-4 flex flex-col gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>SYS_TIME:</span>
                  <span className="text-zinc-100 font-bold tabular-nums bg-[#050507] border border-[#181b24] px-2 py-0.5 rounded uppercase text-[11px]">
                    {realTime || '00:00:00 AM'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Radio className="w-3 h-3 text-[#00f5d4] shrink-0 animate-pulse" />
                  <span>PING:</span>
                  <span className="text-[#00f5d4] font-bold tabular-nums">{ping}ms</span>
                </div>
                <div className="border-t border-[#181b24] pt-3 space-y-2">
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">// PLATFORM MISSION</div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                    AI-powered bioinformatics platform for exploring{' '}
                    <span className="text-[#00f5d4]">disease-gene</span> relationships,
                    accelerating genomic research & precision medicine.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { label: 'Genes', value: '1,500+' }, { label: 'Associations', value: '10K+' },
                      { label: 'Diseases', value: '500+' }, { label: 'Pathways', value: '300+' },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#050507] border border-[#181b24] rounded px-2 py-1.5">
                        <div className="text-[#00f5d4] font-mono font-bold text-[11px]">{s.value}</div>
                        <div className="text-zinc-600 text-[9px] uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-700 pt-1">
                    DATA: NCBI · DisGeNET · ClinVar · OMIM
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-[#0d0b1a] via-[#110d1f] to-[#1a0b14]">
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
              {children}
            </main>

            <footer className="w-full bg-[#090a0d] border-t border-[#181b24] px-4 md:px-6 py-3 text-[11px] text-zinc-500 font-sans tracking-wide shrink-0 select-none flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-400">DiseaseGeneMap Project</span>
                <span className="text-zinc-700">|</span>
                <span>© {new Date().getFullYear()} All Rights Reserved</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4]/40"></span>
                  <span>v1.0.0 Stable</span>
                </div>
                <div>SSL Protected</div>
                <div className="hidden sm:block">Deployment Node: Edge-Global</div>
              </div>
            </footer>
          </div>
        </div>

      </body>
    </html>
  )
}