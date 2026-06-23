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
  Smartphone,
  Wifi,
  WifiOff,
  ServerCrash,
} from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'

// ─── Server-connection status types ──────────────────────────────────────────
type ServerStatus = 'checking' | 'online' | 'offline'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
// Use /api/v1/stats instead of /health — this hits the real DB so it only
// resolves when the server is truly ready (not just the process started).
const HEALTH_URL = `${API_BASE}/api/v1/stats`
// Minimum time (ms) the spinner is shown — prevents a blink if server responds instantly
const MIN_SPINNER_MS = 1200

// ─── DNA Logo SVG (matches Android ic_launcher foreground design) ─────────────
function DnaLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="54" cy="54" r="54" fill="#050507" />
      {/* Android robot / DNA icon path from ic_launcher_foreground */}
      <path
        fillRule="nonzero"
        d="M66.94,46.02L66.94,46.02C72.44,50.07 76,56.61 76,64L32,64C32,56.61 35.56,50.11 40.98,46.06L36.18,41.19C35.45,40.45 35.45,39.3 36.18,38.56C36.91,37.81 38.05,37.81 38.78,38.56L44.25,44.05C47.18,42.57 50.48,41.71 54,41.71C57.48,41.71 60.78,42.57 63.68,44.05L69.11,38.56C69.84,37.81 70.98,37.81 71.71,38.56C72.44,39.3 72.44,40.45 71.71,41.19L66.94,46.02ZM62.94,56.92C64.08,56.92 65,56.01 65,54.88C65,53.76 64.08,52.85 62.94,52.85C61.8,52.85 60.88,53.76 60.88,54.88C60.88,56.01 61.8,56.92 62.94,56.92ZM45.06,56.92C46.2,56.92 47.13,56.01 47.13,54.88C47.13,53.76 46.2,52.85 45.06,52.85C43.92,52.85 43,53.76 43,54.88C43,56.01 43.92,56.92 45.06,56.92Z"
        fill="#00f5d4"
      />
      {/* Subtle glow ring */}
      <circle cx="54" cy="54" r="52" stroke="#00f5d4" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  )
}

// ─── Full-screen server loading overlay ──────────────────────────────────────
function ServerLoadingOverlay({
  status,
  onRetry,
  isApp,
}: {
  status: ServerStatus
  onRetry: () => void
  isApp: boolean
}) {
  const [dots, setDots] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'checking') return
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400)
    const e = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => { clearInterval(d); clearInterval(e) }
  }, [status])

  useEffect(() => { if (status === 'checking') setElapsed(0) }, [status])

  if (status === 'online') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0b1a 0%, #050507 100%)',
      }}
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#00f5d4 1px, transparent 1px), linear-gradient(90deg, #00f5d4 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content card */}
      <div className="relative flex flex-col items-center gap-6 px-8 py-10 max-w-sm w-full mx-4">

        {/* Logo */}
        <div className="relative">
          <div
            className="rounded-2xl p-3 border border-[#1d222e]"
            style={{ background: '#0a0b12', boxShadow: status === 'checking' ? '0 0 32px rgba(0,245,212,0.12)' : '0 0 24px rgba(239,68,68,0.12)' }}
          >
            {isApp ? (
              <DnaLogoMark size={52} />
            ) : (
              <Dna
                className="w-12 h-12 text-[#00f5d4]"
                style={{ animation: status === 'checking' ? 'spin 6s linear infinite' : 'none' }}
              />
            )}
          </div>
          {/* Ping dot */}
          {status === 'checking' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f5d4]" />
            </span>
          )}
          {status === 'offline' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
        </div>

        {/* App name */}
        <div className="text-center">
          <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-1">
            {isApp ? 'DiseaseGeneMap App' : 'DiseaseGeneMap'}
          </div>
          <div className="text-lg font-mono font-bold tracking-widest text-white uppercase">
            {status === 'checking' ? 'Connecting to Server' : 'Server Unreachable'}
          </div>
        </div>

        {/* Status area */}
        {status === 'checking' && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* Spinner bar */}
            <div className="w-full h-0.5 bg-[#1a1d2b] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, #00f5d4, transparent)',
                  animation: 'slideProgress 1.8s ease-in-out infinite',
                  width: '40%',
                }}
              />
            </div>

            {/* Status text */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <Radio className="w-3 h-3 text-[#00f5d4] animate-pulse shrink-0" />
              <span>ESTABLISHING_CONNECTION{dots}</span>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-700">
              <span>ELAPSED: {elapsed}s</span>
              <span>·</span>
              <span>NODE: EDGE-GLOBAL</span>
            </div>
          </div>
        )}

        {status === 'offline' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/5 border border-red-500/20 text-[11px] font-mono text-red-400 w-full justify-center">
              <ServerCrash className="w-3.5 h-3.5 shrink-0" />
              <span>SERVER_HEALTH_CHECK_FAILED</span>
            </div>

            <p className="text-[11px] text-zinc-600 font-mono text-center leading-relaxed">
              The backend server is not responding.<br />
              Check your connection or try again.
            </p>

            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-[11px] font-mono font-bold text-[#00f5d4] hover:bg-[#00f5d4]/20 transition-all"
            >
              <Wifi className="w-3.5 h-3.5" />
              RETRY_CONNECTION
            </button>
          </div>
        )}

        {/* Bottom labels */}
        <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
          <span>v1.0.0</span>
          <span>·</span>
          <span>SSL Protected</span>
          <span>·</span>
          <span>{isApp ? 'Mobile App' : 'Web'}</span>
        </div>
      </div>

      {/* Slide progress keyframe injected inline */}
      <style>{`
        @keyframes slideProgress {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
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
  const [isApp, setIsApp] = useState(false)

  // ── Server status state ──
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Check server health ──
  const checkServer = useCallback(async () => {
    setServerStatus('checking')
    const start = Date.now()
    try {
      const res = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(12000),  // Render free tier can be slow
        cache: 'no-store',
      })
      // Enforce minimum spinner time so it never just blinks
      const elapsed = Date.now() - start
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise(r => setTimeout(r, MIN_SPINNER_MS - elapsed))
      }
      if (res.ok) {
        setServerStatus('online')
      } else {
        setServerStatus('offline')
      }
    } catch {
      setServerStatus('offline')
    }
  }, [])

  // Run health check on mount; auto-retry every 15s when offline
  useEffect(() => {
    checkServer()
  }, [checkServer])

  useEffect(() => {
    if (serverStatus === 'offline') {
      retryTimerRef.current = setTimeout(checkServer, 15000)
    }
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [serverStatus, checkServer])

  // ── Clock ──
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

  // ── Ping ──
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(20 + Math.random() * 8))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // ── Auth ──
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

  // ── Detect app (Capacitor / PWA) ──
  useEffect(() => {
    const inCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
    const params = new URLSearchParams(window.location.search)
    const fromAppParam = params.get('source') === 'app'
    setIsApp(inCapacitor || fromAppParam)
  }, [])

  // ── Hide native splash screen ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
        if (!isNative) return
        const { SplashScreen } = await import('@capacitor/splash-screen')
        if (cancelled) return
        await SplashScreen.hide({ fadeOutDuration: 350 })
      } catch {
        // Splash plugin not available (e.g. web build) — ignore.
      }
    })()
    return () => { cancelled = true }
  }, [])

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

  const isAuthPage = pathname === '/signin' || pathname === '/signup'

  if (isAuthPage) {
    return (
      <html lang="en" className="dark">
        <body className="bg-[#050507] text-zinc-200 h-screen w-screen font-sans antialiased selection:bg-[#00f5d4]/20 selection:text-[#00f5d4] overflow-y-auto">
          <ServerLoadingOverlay status={serverStatus} onRetry={checkServer} isApp={isApp} />
          <div className="min-h-screen w-full bg-gradient-to-br from-[#0d0b1a] via-[#110d1f] to-[#1a0b14] flex items-center justify-center">
            {children}
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050507] text-zinc-200 h-screen w-screen flex flex-col font-sans antialiased selection:bg-[#00f5d4]/20 selection:text-[#00f5d4] overflow-hidden">

        {/* ── Server loading overlay (shows until backend is reachable) ── */}
        <ServerLoadingOverlay status={serverStatus} onRetry={checkServer} isApp={isApp} />

        {/* ── Header ── */}
        <header className="h-14 w-full flex items-center justify-between bg-[#090a0d] border-b border-[#181b24] px-4 md:px-6 z-50 shrink-0">

          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#181b24] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ── Logo: App mode shows the icon-based logo, web shows the DNA spinner ── */}
            <div className="flex items-center gap-2.5">
              {isApp ? (
                // App-mode: rounded logo mark matching the APK icon
                <div
                  className="relative rounded-xl overflow-hidden border border-[#00f5d4]/20"
                  style={{ background: '#050507', boxShadow: '0 0 14px rgba(0,245,212,0.15)' }}
                >
                  <DnaLogoMark size={32} />
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00f5d4]"></span>
                  </span>
                </div>
              ) : (
                // Web mode: original animated DNA icon
                <div className="relative bg-[#050507] border border-[#1d222e] p-1.5 rounded text-[#00f5d4]">
                  <Dna className="w-3.5 h-3.5 animate-[spin_8s_linear_infinite]" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00f5d4]"></span>
                  </span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold tracking-widest text-white font-mono uppercase">
                  DiseaseGeneMap
                </span>
                {isApp && (
                  <span className="text-[8px] font-mono text-[#00f5d4]/60 tracking-widest uppercase">
                    Mobile App
                  </span>
                )}
              </div>
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
              {/* Server status dot in header */}
              <span
                className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${serverStatus === 'online' ? 'bg-[#00f5d4]' : serverStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}`}
                title={`Server: ${serverStatus}`}
              />
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
                {!isApp && (
                  <Link href="/download" className={getLinkClass('/download')}>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="flex-1">Download APK</span>
                    {!isActive('/download') && (
                      <span className="text-[8px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-1.5 py-0.5 rounded font-mono leading-none">
                        v1.0
                      </span>
                    )}
                  </Link>
                )}
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
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'online' ? 'bg-[#00f5d4]/40' : serverStatus === 'checking' ? 'bg-yellow-400/40 animate-pulse' : 'bg-red-500/40'}`}
                  />
                  <span>v1.0.0 Stable</span>
                </div>
                <div>SSL Protected</div>
                <div className="hidden sm:block">Deployment Node: Edge-Global</div>
                {/* Server status in footer */}
                <div className="flex items-center gap-1">
                  {serverStatus === 'online' && <><Wifi className="w-2.5 h-2.5 text-[#00f5d4]/60" /><span className="text-[#00f5d4]/60">Online</span></>}
                  {serverStatus === 'checking' && <><Radio className="w-2.5 h-2.5 text-yellow-400/60 animate-pulse" /><span className="text-yellow-400/60">Connecting</span></>}
                  {serverStatus === 'offline' && <><WifiOff className="w-2.5 h-2.5 text-red-500/60" /><span className="text-red-500/60">Offline</span></>}
                </div>
              </div>
            </footer>
          </div>
        </div>

      </body>
    </html>
  )
}
