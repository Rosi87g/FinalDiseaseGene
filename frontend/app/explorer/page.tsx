'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { Search, Loader2, ArrowRight, Bookmark, BookmarkCheck, Quote, Clock, X } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface GeneRecord { id: string; symbol: string; name: string; chromosome: string; chrColor: string; function: string; protein: string; type: 'gene'; title: string; description: string }
interface DiseaseRecord { id: string; symbol: string; name: string; type: 'disease'; title: string; description: string }
interface VariantRecord { id: string; symbol: string; name: string; type: 'variant'; title: string; description: string }
type AnyRecord = GeneRecord | DiseaseRecord | VariantRecord
type CiteFmt = 'bibtex' | 'ris' | 'apa'

interface RecentSearch {
    term: string
    type?: string       // last category used
    timestamp: number   // ms epoch
}

// ─── Citation Engine ───────────────────────────────────────────────────────────
const SITE_URL = 'https://diseasegenemap.com'
const YEAR = new Date().getFullYear()

function buildCitation(row: Record<string, unknown>, tabKey: string, fmt: CiteFmt): string {
    const s = (k: string) => String(row[k] || '').trim()
    const clean = (v: string) => v.replace(/[{}\\]/g, '')
    if (fmt === 'bibtex') {
        const type = String(row.type || tabKey).toLowerCase()
        const id = s('id'); const title = s('title') || s('name')
        const key = (title.split(' ')[0] || type) + '_' + YEAR
        return `@misc{${clean(key)},\n  title        = {${clean(title)}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {${clean(s('description'))}},\n  url          = {${SITE_URL}/${type}s/${id}}\n}`
    }
    if (fmt === 'ris') {
        const type = String(row.type || '').toLowerCase()
        return `TY  - DATA\nTI  - ${s('title') || s('name')}\nAN  - ${s('id')}\nN1  - ${s('description')}\nUR  - ${SITE_URL}/${type}s/${s('id')}\nPY  - ${YEAR}\nDB  - DiseaseGeneMap\nER  -`
    }
    const type = String(row.type || '').toLowerCase()
    return `${s('title') || s('name')} (${YEAR}). [${type} record]. DiseaseGeneMap. ${SITE_URL}/${type}s/${s('id')}`
}

function downloadCitation(text: string, fmt: CiteFmt, name: string) {
    const ext = fmt === 'bibtex' ? 'bib' : fmt === 'ris' ? 'ris' : 'txt'
    const mime = fmt === 'bibtex' ? 'application/x-bibtex' : fmt === 'ris' ? 'application/x-research-info-systems' : 'text/plain'
    const blob = new Blob([text], { type: mime })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${name.replace(/\s+/g, '_')}.${ext}` })
    a.click(); URL.revokeObjectURL(a.href)
}

// ─── Cite Dropdown ─────────────────────────────────────────────────────────────
function CiteDropdown({ row, tabKey, label }: { row: Record<string, unknown>; tabKey: string; label: string }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState<CiteFmt | null>(null)
    const [pos, setPos] = useState({ top: 0, right: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleOpen = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPos({ top: rect.top + window.scrollY - 4, right: window.innerWidth - rect.right })
        }
        setOpen(o => !o)
    }

    const handleCite = (fmt: CiteFmt, download: boolean) => {
        const text = buildCitation(row, tabKey, fmt)
        if (download) downloadCitation(text, fmt, label)
        else navigator.clipboard.writeText(text).then(() => { setCopied(fmt); setTimeout(() => setCopied(null), 1800) })
        setOpen(false)
    }

    const fmts: { fmt: CiteFmt; label: string; color: string }[] = [
        { fmt: 'bibtex', label: 'BibTeX', color: '#a78bfa' },
        { fmt: 'ris', label: 'RIS', color: '#60a5fa' },
        { fmt: 'apa', label: 'APA', color: '#34d399' },
    ]

    const dropdown = open ? createPortal(
        <div ref={ref} style={{ position: 'absolute', top: pos.top, right: pos.right, transform: 'translateY(-100%)', marginBottom: '6px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px', padding: '6px', zIndex: 9999, minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px', padding: '2px 6px 6px', borderBottom: '1px solid #1f2937', marginBottom: '4px' }}>CITE AS</div>
            {fmts.map(({ fmt, label: fmtLabel, color }) => (
                <div key={fmt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '3px 2px' }}>
                    <span style={{ fontSize: '10px', color, fontFamily: 'monospace', minWidth: '50px' }}>{fmtLabel}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleCite(fmt, false)} style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '3px', border: '1px solid #1f2937', color: '#6b7280', background: 'transparent', cursor: 'pointer', fontFamily: 'monospace' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.color = color }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                        >{copied === fmt ? '✓ COPIED' : 'COPY'}</button>
                        <button onClick={() => handleCite(fmt, true)} style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '3px', border: `1px solid ${color}22`, color, background: `${color}11`, cursor: 'pointer', fontFamily: 'monospace' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22` }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}11` }}
                        >↓</button>
                    </div>
                </div>
            ))}
        </div>, document.body
    ) : null

    return (
        <div style={{ display: 'inline-block' }}>
            <button ref={btnRef} onClick={handleOpen} style={{ fontSize: '9px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${open ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.25)'}`, color: open ? '#a78bfa' : '#6b7280', background: open ? 'rgba(167,139,250,0.08)' : 'transparent', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa' }}
                onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' } }}
            >
                <Quote style={{ width: '9px', height: '9px', color: '#fff' }} />
                CITE {copied ? '✅' : '▾'}
            </button>
            {dropdown}
        </div>
    )
}

// ─── Result Card ───────────────────────────────────────────────────────────────
function ResultCard({ item, saved, canSave, onToggleSave, onDownload, onCite }: {
    item: AnyRecord; saved: boolean; canSave: boolean
    onToggleSave: (item: AnyRecord) => void
    onDownload: (item: AnyRecord, format: string) => void
    onCite: (item: AnyRecord, fmt: CiteFmt) => void
}) {
    const detailUrl = `/${item.type}s/${item.id}`
    const downloadColors: [string, string, string][] = [
        ['rgba(6,182,212,0.3)', '#06b6d4', 'rgba(6,182,212,0.1)'],
        ['rgba(99,102,241,0.3)', '#818cf8', 'rgba(99,102,241,0.1)'],
        ['rgba(52,211,153,0.3)', '#34d399', 'rgba(52,211,153,0.1)'],
    ]
    const citeColors: [CiteFmt, string, string, string][] = [
        ['bibtex', 'rgba(167,139,250,0.3)', '#a78bfa', 'rgba(167,139,250,0.1)'],
        ['ris', 'rgba(96,165,250,0.3)', '#60a5fa', 'rgba(96,165,250,0.1)'],
        ['apa', 'rgba(52,211,153,0.3)', '#34d399', 'rgba(52,211,153,0.1)'],
    ]
    return (
        <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0a1a2e 50%, #120a1f 100%)', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', transition: 'border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#181b24' }}
        >
            <Link href={detailUrl} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>{item.type}</span>
                        <h3 style={{ color: 'white', fontWeight: 600, marginTop: '8px', fontSize: '14px' }}>{item.title}</h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', lineHeight: '1.5' }}>{item.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {canSave && (
                            <button onClick={e => { e.preventDefault(); onToggleSave(item) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: saved ? '#06b6d4' : '#4b5563', transition: 'color 0.2s, transform 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                            >{saved ? <BookmarkCheck style={{ width: '16px', height: '16px' }} /> : <Bookmark style={{ width: '16px', height: '16px' }} />}</button>
                        )}
                        <ArrowRight style={{ width: '16px', height: '16px', color: '#06b6d4', marginTop: '4px' }} />
                    </div>
                </div>
            </Link>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #181b24', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid #0d1117' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#c1cedf', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Quote style={{ width: '9px', height: '9px' }} /> Cite:
                        </span>
                        {citeColors.map(([fmt, border, color, hover]) => (
                            <button key={fmt} onClick={() => onCite(item, fmt)} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${border}`, color, background: 'transparent', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hover }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >{fmt}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#c1cedf', letterSpacing: '1px' }}>Download:</span>
                        {(['csv', 'json', 'excel'] as const).map((fmt, fi) => {
                            const [border, color, hover] = downloadColors[fi]
                            return (
                                <button key={fmt} onClick={() => onDownload(item, fmt)} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${border}`, color, background: 'transparent', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hover }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                                >{fmt}</button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Type badge colors ─────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    gene:      { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4',  border: 'rgba(6,182,212,0.3)' },
    disease:   { bg: 'rgba(248,113,113,0.1)', color: '#f87171',  border: 'rgba(248,113,113,0.3)' },
    variant:   { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa',  border: 'rgba(167,139,250,0.3)' },
    pathway:   { bg: 'rgba(52,211,153,0.1)',  color: '#34d399',  border: 'rgba(52,211,153,0.3)' },
    drug:      { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24',  border: 'rgba(251,191,36,0.3)' },
    default:   { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af',  border: 'rgba(107,114,128,0.3)' },
}

// ─── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

// ─── Recent Search Card ────────────────────────────────────────────────────────
function RecentSearchCard({ item, onClick, onRemove }: { item: RecentSearch; onClick: () => void; onRemove: () => void }) {
    const tc = TYPE_COLORS[item.type?.replace('_target', '') || ''] || TYPE_COLORS.default
    return (
        <div onClick={onClick} style={{
            background: '#0d1117', border: '1px solid #1f2937', borderRadius: '8px',
            padding: '10px 12px', cursor: 'pointer', position: 'relative',
            transition: 'border-color 0.15s, background 0.15s', display: 'flex', flexDirection: 'column', gap: '6px',
        }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.35)'; (e.currentTarget as HTMLDivElement).style.background = '#0f1a25' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLDivElement).style.background = '#0d1117' }}
        >
            {/* Remove button */}
            <button onClick={e => { e.stopPropagation(); onRemove() }} style={{ position: 'absolute', top: '7px', right: '7px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
                aria-label={`Remove ${item.term}`}
            ><X style={{ width: '10px', height: '10px' }} /></button>

            {/* Search icon + term */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '18px' }}>
                <Search style={{ width: '11px', height: '11px', color: '#4b5563', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#d1d5db', fontFamily: 'monospace', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.term}</span>
            </div>

            {/* Type badge + time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {item.type && item.type !== 'all' ? (
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', letterSpacing: '1px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {item.type.replace('_', ' ').toUpperCase()}
                    </span>
                ) : (
                    <span style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px' }}>ALL TYPES</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151' }}>
                    <Clock style={{ width: '9px', height: '9px' }} />
                    <span style={{ fontSize: '9px', letterSpacing: '0.5px' }}>{timeAgo(item.timestamp)}</span>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExplorerPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('all')
    const [results, setResults] = useState<AnyRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [savedGenes, setSavedGenes] = useState<string[]>([])
    const [savedDiseases, setSavedDiseases] = useState<string[]>([])

    // ─── Recent Searches (max 5, stored as objects with timestamp) ─────────────
    const MAX_RECENTS = 5
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

    useEffect(() => {
        try {
            const raw = JSON.parse(localStorage.getItem('recent_searches_v2') || '[]')
            // migrate old string[] format if present
            if (Array.isArray(raw) && raw.length && typeof raw[0] === 'string') {
                setRecentSearches(raw.map((t: string) => ({ term: t, timestamp: Date.now() })))
            } else {
                setRecentSearches(raw)
            }
        } catch { }
    }, [])

    const addRecentSearch = (term: string, type: string) => {
        const entry: RecentSearch = { term, type, timestamp: Date.now() }
        const updated = [entry, ...recentSearches.filter(r => r.term.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENTS)
        setRecentSearches(updated)
        try { localStorage.setItem('recent_searches_v2', JSON.stringify(updated)) } catch { }
    }

    const removeRecentSearch = (term: string) => {
        const updated = recentSearches.filter(r => r.term !== term)
        setRecentSearches(updated)
        try { localStorage.setItem('recent_searches_v2', JSON.stringify(updated)) } catch { }
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        try { localStorage.removeItem('recent_searches_v2') } catch { }
    }

    // ─── Auth / Favorites ──────────────────────────────────────────────────────
    useEffect(() => {
        try {
            setSavedGenes(JSON.parse(localStorage.getItem('fav_genes') || '[]'))
            setSavedDiseases(JSON.parse(localStorage.getItem('fav_diseases') || '[]'))
        } catch { }
    }, [])

    // ─── Search ────────────────────────────────────────────────────────────────
    const handleSearch = async (overrideTerm?: string, overrideType?: string) => {
        const term = overrideTerm ?? searchTerm
        const type = overrideType ?? selectedType
        if (!term.trim()) return
        setLoading(true); setHasSearched(true)
        addRecentSearch(term.trim(), type)
        try {
            const url = `/api/v1/search?q=${encodeURIComponent(term)}${type !== 'all' ? `&type=${type}` : ''}`
            const res = await fetch(url)
            const data = await res.json()
            setResults(Array.isArray(data) ? data : [])
        } catch { setResults([]) }
        finally { setLoading(false) }
    }

    const isSaved = (item: AnyRecord) => {
        if (item.type === 'gene') return savedGenes.includes(item.id)
        if (item.type === 'disease') return savedDiseases.includes(item.id)
        return false
    }

    const toggleSave = (item: AnyRecord) => {
        if (item.type === 'gene') {
            const updated = savedGenes.includes(item.id) ? savedGenes.filter(id => id !== item.id) : [...savedGenes, item.id]
            setSavedGenes(updated); try { localStorage.setItem('fav_genes', JSON.stringify(updated)) } catch { }
        } else if (item.type === 'disease') {
            const updated = savedDiseases.includes(item.id) ? savedDiseases.filter(id => id !== item.id) : [...savedDiseases, item.id]
            setSavedDiseases(updated); try { localStorage.setItem('fav_diseases', JSON.stringify(updated)) } catch { }
        }
    }

    const downloadData = (item: AnyRecord, format: string) => {
        const filename = (item.title || 'data').replace(/\s+/g, '_')
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.json` })
            a.click(); URL.revokeObjectURL(a.href)
        } else if (format === 'csv') {
            const headers = Object.keys(item).join(',')
            const values = Object.values(item).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')
            const blob = new Blob([`${headers}\n${values}`], { type: 'text/csv' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.csv` })
            a.click(); URL.revokeObjectURL(a.href)
        } else if (format === 'excel') {
            const headers = Object.keys(item).join('\t'); const values = Object.values(item).join('\t')
            const blob = new Blob([`${headers}\n${values}`], { type: 'application/vnd.ms-excel' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.xls` })
            a.click(); URL.revokeObjectURL(a.href)
        }
    }

    const citeItem = (item: AnyRecord, fmt: CiteFmt) => {
        const text = buildCitation({ ...item } as Record<string, unknown>, 'CARD', fmt)
        downloadCitation(text, fmt, item.title || item.id)
    }

    const downloadAll = (format: string) => {
        if (!results.length) return
        const filename = `search_results_${(searchTerm || 'export').replace(/\s+/g, '_')}`
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.json` })
            a.click(); URL.revokeObjectURL(a.href)
        } else if (format === 'csv') {
            const headers = Object.keys(results[0]).join(',')
            const rows = results.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(','))
            const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.csv` })
            a.click(); URL.revokeObjectURL(a.href)
        } else if (format === 'excel') {
            const headers = Object.keys(results[0]).join('\t'); const rows = results.map(r => Object.values(r).join('\t'))
            const blob = new Blob([[headers, ...rows].join('\n')], { type: 'application/vnd.ms-excel' })
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${filename}.xls` })
            a.click(); URL.revokeObjectURL(a.href)
        }
    }

    const card: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', marginBottom: '12px' }
    const exportColors: [string, string][] = [['rgba(6,182,212,0.3)', '#06b6d4'], ['rgba(99,102,241,0.3)', '#818cf8'], ['rgba(52,211,153,0.3)', '#34d399']]

    return (
        <div style={{ padding: '20px', borderRadius: '8px', minHeight: '600px', fontFamily: 'monospace' }}>

            {/* ── Search ── */}
            <div style={card}>
                <div style={{ color: '#06b6d4', fontSize: '10px', letterSpacing: '2px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Search style={{ width: '14px', height: '14px' }} /> SEARCH QUERY
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input style={{ flex: '1 1 200px', background: '#0d1117', border: '1px solid #1f2937', color: '#d1d5db', fontSize: '12px', padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', outline: 'none' }}
                        placeholder="Search GEN1, Disease 1, Variant..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(6,182,212,0.5)' }}
                        onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#1f2937' }}
                    />
                    <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                        style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', fontSize: '11px', padding: '10px 12px', borderRadius: '6px', fontFamily: 'monospace', flex: '0 0 auto' }}
                    >
                        <option value="all">All Categories</option>
                        <option value="gene">Genes</option>
                        <option value="disease">Diseases</option>
                        <option value="pathway">Pathways</option>
                        <option value="variant">Variants</option>
                        <option value="association">Associations</option>
                        <option value="drug_target">Drug Targets</option>
                        <option value="publication">Publications</option>
                    </select>
                    <button onClick={() => handleSearch()} disabled={loading}
                        style={{ background: '#06b6d4', color: '#000', fontSize: '11px', fontWeight: 700, padding: '10px 16px', border: 'none', borderRadius: '6px', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap', flex: '0 0 auto' }}
                    >{loading ? 'SEARCHING...' : 'EXECUTE_SEARCH'}</button>
                </div>

                {/* ── Recent Searches as Cards (max 5) ── */}
                {recentSearches.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Clock style={{ width: '10px', height: '10px' }} /> RECENT SEARCHES
                            </span>
                            <button onClick={clearRecentSearches}
                                style={{ fontSize: '9px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'monospace' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
                            >CLEAR ALL</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                            {recentSearches.map(item => (
                                <RecentSearchCard
                                    key={item.term}
                                    item={item}
                                    onClick={() => { setSearchTerm(item.term); if (item.type) setSelectedType(item.type); handleSearch(item.term, item.type) }}
                                    onRemove={() => removeRecentSearch(item.term)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Search Results ── */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <h2 style={{ color: 'white', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '2px', margin: 0 }}>
                        {loading ? 'FETCHING_DATA...' : 'SEARCH RESULTS '}
                        <span style={{ color: '#4b5563' }}>({results.length})</span>
                    </h2>
                    {results.length > 0 && !loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#4b5563', letterSpacing: '1px' }}>Export All:</span>
                            {(['csv', 'json', 'excel'] as const).map((fmt, fi) => {
                                const [border, color] = exportColors[fi]
                                return (
                                    <button key={fmt} onClick={() => downloadAll(fmt)} style={{ fontSize: '9px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${border}`, color, background: 'transparent', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>{fmt}</button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#4b5563' }}>
                        <Loader2 style={{ width: '32px', height: '32px', color: '#06b6d4', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                        <span style={{ fontSize: '10px', letterSpacing: '3px' }}>QUERYING_NODE...</span>
                    </div>
                ) : results.length === 0 ? (
                    <div style={{ border: '1px dashed #1f2937', borderRadius: '6px', padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#374151', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '2px' }}>
                            {hasSearched ? 'NO_RESULTS_FOUND_FOR_QUERY' : 'ENTER_A_QUERY_TO_INITIALIZE_SEARCH'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {results.map((item, i) => (
                            <ResultCard key={i} item={item} saved={isSaved(item)}
                                canSave={item.type === 'gene' || item.type === 'disease'}
                                onToggleSave={toggleSave} onDownload={downloadData} onCite={citeItem}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}