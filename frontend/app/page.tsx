'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Dna, Activity, Layers, GitMerge, ShieldCheck,
  ArrowRight, Bookmark, History, Compass, TrendingUp
} from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ genes: 0, diseases: 0, variants: 0, pathways: 0, associations: 0 })

  useEffect(() => {
    const s = localStorage.getItem('user')
    if (s) setUser(JSON.parse(s))
  }, [])

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`/api/v1/stats`)
        setStats(await r.json())
      } catch { }
    }
    fetch_()
  }, [])

  /* shared card style */
  const card = 'rounded-xl border transition-all duration-200'
  const cardBase = `${card} bg-[#0e1018] border-[#1e2130] hover:border-[#2a2e42]`

  return (
    <div className="space-y-6">

      {/* ── Hero banner ── */}
      <section className={`relative overflow-hidden ${cardBase} p-6 md:p-8`}>
        {/* ambient glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/3 w-96 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,245,212,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl space-y-5">
          {/* status pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold"
            style={{ background: 'rgba(0,245,212,0.06)', border: '1px solid rgba(0,245,212,0.2)', color: '#00f5d4' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] animate-pulse"></span>
            SYSTEM ACTIVE · LIVE DATABASE
          </div>

          {/* headline */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold font-mono uppercase tracking-tight"
              style={{ color: '#f0f0f8' }}>
              Map &amp; Correlate{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00f5d4 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Complex Disease Genomics
              </span>
            </h1>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: '#b8bcd4' }}>
              Explore pipeline interactions across indexed human gene loci, pathologically flagged variants,
              and molecular sequence matrices — all in one AI-powered platform.
            </p>
          </div>

          {/* 3 pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
            style={{ borderTop: '1px solid #1e2130' }}>
            {[
              { emoji: '🧬', title: 'Map & Link', color: '#f0f0f8', desc: 'Discover how human genes connect directly to specific clinical diseases.' },
              { emoji: '📊', title: 'Analyze Trends', color: '#00f5d4', desc: 'View complete statistical matrices and structural data pools instantly.' },
              { emoji: '🔒', title: 'Secure Reference', color: '#a855f7', desc: 'Cross-reference fully verified, secure, and peer-reviewed genomic records.' },
            ].map((p) => (
              <div key={p.title}>
                <h4 className="text-xs font-bold font-mono mb-1.5" style={{ color: p.color }}>
                  {p.emoji} {p.title.toUpperCase()}
                </h4>
                <p className="text-[11px] leading-relaxed" style={{ color: '#7a7f99' }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Platform mission mini */}
          <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #1e2130' }}>
            <div className="text-[9px] font-mono font-bold tracking-widest uppercase" style={{ color: '#4a4f66' }}>
              // PLATFORM MISSION
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#7a7f99' }}>
              AI-powered bioinformatics platform for exploring{' '}
              <span style={{ color: '#00f5d4' }}>disease-gene</span> relationships,
              accelerating genomic research &amp; precision medicine.
            </p>

            <div className="text-[9px] font-mono" style={{ color: '#4a4f66', fontSize: '8px' }}>
              DATA SOURCES: NCBI · DisGeNET · ClinVar · OMIM · UniProt · Ensembl
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats grid ── */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: '#5a5f78' }}>
            // METRIC MATRICES INDEXED (LIVE)
          </h2>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ background: '#0e1018', border: '1px solid #1e2130', color: '#7a7f99' }}>
            LAST UPDATE: JUNE 2026
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Genes Indexed', value: stats.genes, icon: Dna, desc: 'Primary human loci' },
            { label: 'Diseases Listed', value: stats.diseases, icon: Activity, desc: 'ICD-10 clinical records' },
            { label: 'Associations', value: stats.associations, icon: GitMerge, desc: 'Confidence-bound nodes' },
            { label: 'Variants Mapped', value: stats.variants, icon: ShieldCheck, desc: 'Pathogenicity arrays' },
            { label: 'Pathways Defined', value: stats.pathways, icon: Layers, desc: 'Independent clusters' },
          ].map((s, i) => (
            <div key={i} className={`${cardBase} p-4 group hover:border-[#00f5d4]/20`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: '#7a7f99' }}>
                  {s.label}
                </span>
                <s.icon className="w-4 h-4 transition-colors" style={{ color: 'rgba(0,245,212,0.3)' }} />
              </div>
              <div className="font-mono font-bold text-xl tracking-tight" style={{ color: '#f0f0f8' }}>
                {(s.value ?? 0).toLocaleString()}
              </div>
              <p className="text-[9px] font-mono mt-1" style={{ color: '#5a5f78' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Disease categories */}
          <section className="space-y-2">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: '#5a5f78' }}>
              // EXPLORE BY DISEASE CATEGORY
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {['Cancer', 'Neurological', 'Cardiovascular', 'Metabolic', 'Rare Diseases'].map((cat) => (
                <Link key={cat}
                  href={`/explorer?category=${encodeURIComponent(cat)}`}
                  className={`${cardBase} p-3 flex flex-col justify-between h-20 group hover:border-[#00f5d4]/30`}>
                  <span className="text-xs font-mono font-semibold transition-colors"
                    style={{ color: '#c8cbd8' }}>{cat}</span>
                  <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: '#5a5f78' }}>
                    <span className="group-hover:text-[#00f5d4] transition-colors">EXPLORE</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:text-[#00f5d4] transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Two cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Latest associations */}
            <div className={`${cardBase} p-4 space-y-3`}>
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 pb-2"
                style={{ color: '#f0f0f8', borderBottom: '1px solid #1e2130' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4]"></span>
                LATEST ASSOCIATIONS
              </h3>
              <div className="space-y-2">
                {[
                  { gene: 'BRCA1', disease: 'Breast Cancer' },
                  { gene: 'TP53', disease: 'Lung Cancer' },
                  { gene: 'APOE', disease: "Alzheimer's" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
                    style={{ background: '#07080f', border: '1px solid #1e2130' }}>
                    <span className="font-bold" style={{ color: '#00f5d4' }}>{item.gene}</span>
                    <span style={{ color: '#2a2e42' }}>→</span>
                    <span style={{ color: '#c8cbd8' }}>{item.disease}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top genes */}
            <div className={`${cardBase} p-4 space-y-3`}>
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 pb-2"
                style={{ color: '#f0f0f8', borderBottom: '1px solid #1e2130' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }}></span>
                TOP RESEARCHED GENES
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {['BRCA1', 'TP53', 'EGFR', 'APOE', 'CFTR', 'HBB'].map((gene) => (
                  <Link key={gene} href={`/explorer?search=${gene}`}
                    className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all"
                    style={{
                      background: '#07080f',
                      border: '1px solid #1e2130',
                      color: '#b8bcd4',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2a2e42'
                      e.currentTarget.style.color = '#f0f0f8'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#1e2130'
                      e.currentTarget.style.color = '#b8bcd4'
                    }}>
                    {gene}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Network preview */}
          <section className={`${cardBase} p-4 space-y-3`}>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ color: '#7a7f99' }}>
              # GRAPH TOPOLOGY NETWORK PREVIEW
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {[
                { gene: 'BRCA1', diseases: ['Breast Cancer', 'Ovarian Cancer'] },
                { gene: 'TP53', diseases: ['Lung Cancer', 'Colon Cancer'] },
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2"
                  style={{ background: '#07080f', border: '1px solid #1e2130' }}>
                  <div className="font-bold text-[13px]" style={{ color: '#00f5d4' }}>{n.gene}</div>
                  <div className="pl-3 space-y-1" style={{ borderLeft: '2px solid #1e2130' }}>
                    {n.diseases.map((d, j) => (
                      <div key={j} style={{ color: '#b8bcd4' }}>↳ {d}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-4">

          {/* Quick actions */}
          <section className={`${cardBase} p-4 space-y-3`}>
            <div className="text-[9px] font-mono font-bold tracking-widest uppercase" style={{ color: '#5a5f78' }}>
              // QUICK UTILITIES
            </div>
            <div className="space-y-2">
              {[
                { href: '/explorer', icon: Compass, label: 'Full Explorer', sub: 'Browse all indexed data' },
                { href: '/analytics', icon: TrendingUp, label: 'Analytics Dashboard', sub: 'View trends & reports' },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all group"
                  style={{ background: '#07080f', border: '1px solid #1e2130' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2e42')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2130')}>
                  <a.icon className="w-4 h-4 group-hover:text-[#00f5d4] transition-colors" style={{ color: '#7a7f99' }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#c8cbd8' }}>{a.label}</div>
                    <div className="text-[10px]" style={{ color: '#5a5f78' }}>{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Research workspace */}
          <section className={`${cardBase} p-4 space-y-3`}>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2"
              style={{ color: '#f0f0f8' }}>
              <Bookmark className="w-3.5 h-3.5" style={{ color: '#7a7f99' }} />
              RESEARCH WORKSPACE
            </h3>

            {user ? (
              <div className="space-y-3 text-[11px]">
                <div style={{ color: '#b8bcd4' }}>
                  Welcome back,{' '}
                  <span className="font-bold" style={{ color: '#00f5d4' }}>{user.username}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-mono mb-1" style={{ color: '#5a5f78' }}>
                    <History className="w-3 h-3" /> RECENT SEARCHES
                  </div>
                  <div className="space-y-1 pl-1" style={{ color: '#7a7f99' }}>
                    <div className="text-[10px]">• BRCA1 / Breast Cancer</div>
                    <div className="text-[10px]">• TP53 pathway analysis</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-[11px]" style={{ color: '#7a7f99' }}>
                  Sign in to save your research progress
                </p>
                <Link href="/signin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,245,212,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(0,245,212,0.3)',
                    color: '#00f5d4',
                  }}>
                  CONNECT ACCOUNT →
                </Link>
              </div>
            )}
          </section>

          {/* Data sources */}
          <section className={`${cardBase} p-4 space-y-2`}>
            <div className="text-[9px] font-mono font-bold tracking-widest uppercase" style={{ color: '#5a5f78' }}>
              // DATA SOURCES
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['NCBI', 'DisGeNET', 'ClinVar', 'OMIM', 'UniProt', 'Ensembl', 'Gene Ontology'].map((src) => (
                <span key={src} className="px-2 py-1 rounded text-[9px] font-mono font-semibold"
                  style={{
                    background: '#07080f',
                    border: '1px solid #1e2130',
                    color: '#7a7f99',
                  }}>
                  {src}
                </span>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}