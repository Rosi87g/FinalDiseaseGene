import {
  Smartphone,
  Download,
  Github,
  AlertTriangle,
  Dna,
  Database,
  PieChart,
  Bookmark,
  ShieldCheck,
  HardDrive,
  Calendar,
} from 'lucide-react'

const GITHUB_REPO_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/your-username/your-repo/releases'

const APK_VERSION = 'v1.0.0-pre'
const APK_SIZE = '4 MB'
const APK_UPDATED = 'June 2026'
const MIN_ANDROID = 'Android 9.0+'

export default function DownloadPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          // MOBILE_APP_DEPLOYMENT
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#050507] border border-[#1d222e] p-2 rounded text-[#00f5d4]">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white font-mono uppercase tracking-wide">
            DiseaseGeneMap Mobile
          </h1>
          <span className="text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-2 py-0.5 rounded font-mono font-bold leading-none">
            PRE-RELEASE 1.0
          </span>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl">
          The DiseaseGeneMap companion app puts gene and disease search, the
          association database, and your saved lists in your pocket. It mirrors
          the core of the web platform in a lightweight Android build, so you
          can look up a gene or disease association without opening a browser.
        </p>
      </div>

      {/* ── Download card ── */}
      <div className="bg-[#090a0d] border border-[#181b24] rounded-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Latest build</span>
            <span className="text-sm font-mono font-bold text-zinc-100">{APK_VERSION}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
              {APK_SIZE}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              {APK_UPDATED}
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
              {MIN_ANDROID}
            </div>
          </div>
        </div>

        <a
          href="/api/download-apk"
          className="flex items-center justify-center gap-2.5 px-4 py-3 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-[#00f5d4] text-sm font-mono font-bold uppercase tracking-wide hover:bg-[#00f5d4]/20 hover:border-[#00f5d4]/50 transition-all"
        >
          <Download className="w-4 h-4" />
          Download APK
        </a>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          View all releases on GitHub
        </a>
      </div>

      {/* ── Pre-release notice ── */}
      <div className="flex gap-3 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-lg p-4">
        <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold text-[#f59e0b] uppercase tracking-wide">
            This is a pre-release build
          </span>
          <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
            Version 1.0 is still in active development. Some features may be
            incomplete, and you may run into bugs. The APK is distributed
            directly from GitHub, not the Play Store, so Android will warn you
            before installing it from an unknown source — that's expected for
            now.
          </p>
        </div>
      </div>

      {/* ── What's inside ── */}
      <div className="flex flex-col gap-3">
        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          // WHAT'S INSIDE
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Dna, title: 'Search Explorer', desc: 'Look up genes and diseases on the go.' },
            { icon: Database, title: 'Database Explorer', desc: 'Browse the full association database.' },
            { icon: PieChart, title: 'Visualizations', desc: 'View graph analytics from your phone.' },
            { icon: Bookmark, title: 'Saved Lists', desc: 'Your favorites, synced with the web app.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 bg-[#090a0d] border border-[#181b24] rounded-lg p-3.5">
              <f.icon className="w-4 h-4 text-[#00f5d4] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-mono font-bold text-zinc-200">{f.title}</span>
                <span className="text-[11px] text-zinc-500 font-sans leading-relaxed">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Install steps ── */}
      <div className="flex flex-col gap-3">
        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          // INSTALLATION
        </span>
        <div className="flex flex-col gap-2">
          {[
            { n: '01', title: 'Download the APK', desc: 'Tap the download button above on your Android device.' },
            { n: '02', title: 'Allow unknown sources', desc: 'When prompted, allow your browser to install unknown apps — this is a one-time setting.' },
            { n: '03', title: 'Install & open', desc: 'Open the downloaded file and tap Install.' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3 bg-[#090a0d] border border-[#181b24] rounded-lg p-3.5">
              <span className="text-[11px] font-mono font-bold text-zinc-600 shrink-0">{s.n}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-mono font-bold text-zinc-200">{s.title}</span>
                <span className="text-[11px] text-zinc-500 font-sans leading-relaxed">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
