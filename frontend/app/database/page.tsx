'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Database, Quote } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface GeneRecord {
    id: string
    symbol: string
    name: string
    chromosome: string
    chrColor: string
    function: string
    protein: string
    type: 'gene'
    title: string
    description: string
}

interface Column {
    key: string
    label: string
    color?: string
}

type CiteFmt = 'bibtex' | 'ris' | 'apa'

// ─── Citation Engine (same as explorer) ───────────────────────────────────────
const SITE_URL = 'https://diseasegenemap.com'
const YEAR = new Date().getFullYear()

function buildCitation(row: Record<string, unknown>, tabKey: string, fmt: CiteFmt): string {
    const s = (k: string) => String(row[k] || '').trim()
    const clean = (v: string) => v.replace(/[{}\\]/g, '')

    if (fmt === 'bibtex') {
        switch (tabKey) {
            case 'GENES': {
                const key = (s('gene_symbol') || s('symbol') || 'gene') + '_' + YEAR
                const sym = s('gene_symbol') || s('symbol')
                const name = s('gene_name') || s('name')
                const chr = s('chromosome')
                const fn = s('function')
                const id = s('gene_id') || s('id')
                return `@misc{${clean(key)},\n  title        = {${clean(sym)} — ${clean(name)}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {Chromosome: ${chr}. Function: ${clean(fn)}},\n  url          = {${SITE_URL}/genes/${id}}\n}`
            }
            case 'DISEASES': {
                const key = (s('disease_name') || 'disease').replace(/\s+/g, '_') + '_' + YEAR
                return `@misc{${clean(key)},\n  title        = {${clean(s('disease_name'))}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {Category: ${s('category')}. ICD: ${s('icd_code')}},\n  url          = {${SITE_URL}/diseases/${s('disease_id')}}\n}`
            }
            case 'VARIANTS': {
                const key = (s('variant_name') || 'variant').replace(/\s+/g, '_') + '_' + YEAR
                return `@misc{${clean(key)},\n  title        = {${clean(s('variant_name'))}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {Gene: ${s('gene_id')}. Mutation: ${s('mutation_type')}. Clinical sig: ${s('clinical_significance')}},\n  url          = {${SITE_URL}/variants/${s('variant_id')}}\n}`
            }
            case 'PATHWAYS': {
                const key = (s('pathway_name') || 'pathway').replace(/\s+/g, '_') + '_' + YEAR
                return `@misc{${clean(key)},\n  title        = {${clean(s('pathway_name'))}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {${clean(s('description'))}. Genes: ${s('gene_count')}},\n  url          = {${SITE_URL}/pathways/${s('pathway_id')}}\n}`
            }
            case 'DRUGS': {
                const key = (s('drug_name') || 'drug').replace(/\s+/g, '_') + '_' + YEAR
                return `@misc{${clean(key)},\n  title        = {${clean(s('drug_name'))}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {Target gene: ${s('target_gene')}. Indication: ${clean(s('indication'))}},\n  url          = {${SITE_URL}/drugs/${s('drug_id') || s('drug_target_id')}}\n}`
            }
            case 'ASSOC': {
                const key = `assoc_${s('gene_id')}_${s('disease_id')}_${YEAR}`
                return `@misc{${clean(key)},\n  title        = {Association: ${s('gene_id')} — ${s('disease_id')}},\n  howpublished = {DiseaseGeneMap Database},\n  year         = {${YEAR}},\n  note         = {Confidence: ${s('confidence')}. Evidence: ${s('evidence_level')}},\n  url          = {${SITE_URL}/associations/${s('association_id')}}\n}`
            }
            default:
                return `@misc{record_${YEAR},\n  title = {${clean(s('title') || s('name'))}},\n  year  = {${YEAR}}\n}`
        }
    }

    if (fmt === 'ris') {
        switch (tabKey) {
            case 'GENES':
                return `TY  - DATA\nTI  - ${s('gene_symbol') || s('symbol')} - ${s('gene_name') || s('name')}\nAN  - ${s('gene_id') || s('id')}\nN1  - Chromosome: ${s('chromosome')}. Function: ${s('function')}\nUR  - ${SITE_URL}/genes/${s('gene_id') || s('id')}\nPY  - ${YEAR}\nDB  - DiseaseGeneMap\nER  -`
            case 'DISEASES':
                return `TY  - DATA\nTI  - ${s('disease_name')}\nAN  - ${s('disease_id')}\nM1  - ICD: ${s('icd_code')}\nN1  - Category: ${s('category')}\nUR  - ${SITE_URL}/diseases/${s('disease_id')}\nPY  - ${YEAR}\nDB  - DiseaseGeneMap\nER  -`
            case 'VARIANTS':
                return `TY  - DATA\nTI  - ${s('variant_name')}\nAN  - ${s('variant_id')}\nN1  - Gene: ${s('gene_id')}. Mutation: ${s('mutation_type')}. Clinical significance: ${s('clinical_significance')}\nUR  - ${SITE_URL}/variants/${s('variant_id')}\nPY  - ${YEAR}\nDB  - DiseaseGeneMap\nER  -`
            default:
                return `TY  - DATA\nTI  - ${s('title') || s('name')}\nAN  - ${s('id')}\nPY  - ${YEAR}\nDB  - DiseaseGeneMap\nER  -`
        }
    }

    // APA
    switch (tabKey) {
        case 'GENES':
            return `${s('gene_symbol') || s('symbol')} (${YEAR}). ${s('gene_name') || s('name')} [Gene record]. DiseaseGeneMap. ${SITE_URL}/genes/${s('gene_id') || s('id')}`
        case 'DISEASES':
            return `${s('disease_name')} (${YEAR}). [Disease record, ICD: ${s('icd_code')}]. DiseaseGeneMap. ${SITE_URL}/diseases/${s('disease_id')}`
        case 'VARIANTS':
            return `${s('variant_name')} (${YEAR}). [Variant record — ${s('mutation_type')}]. DiseaseGeneMap. ${SITE_URL}/variants/${s('variant_id')}`
        default:
            return `${s('title') || s('name')} (${YEAR}). DiseaseGeneMap. ${SITE_URL}`
    }
}

function downloadCitation(text: string, fmt: CiteFmt, name: string) {
    const ext = fmt === 'bibtex' ? 'bib' : fmt === 'ris' ? 'ris' : 'txt'
    const mime = fmt === 'bibtex' ? 'application/x-bibtex' : fmt === 'ris' ? 'application/x-research-info-systems' : 'text/plain'
    const blob = new Blob([text], { type: mime })
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `${name.replace(/\s+/g, '_')}.${ext}`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
}

// ─── Cite Dropdown (same as explorer) ─────────────────────────────────────────
function CiteDropdown({ row, tabKey, label }: { row: Record<string, unknown>; tabKey: string; label: string }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState<CiteFmt | null>(null)
    const [pos, setPos] = useState({ top: 0, right: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                ref.current && !ref.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) setOpen(false)
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
        if (download) {
            downloadCitation(text, fmt, label)
        } else {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(fmt)
                setTimeout(() => setCopied(null), 1800)
            })
        }
        setOpen(false)
    }

    const fmts: { fmt: CiteFmt; label: string; color: string }[] = [
        { fmt: 'bibtex', label: 'BibTeX', color: '#a78bfa' },
        { fmt: 'ris', label: 'RIS', color: '#60a5fa' },
        { fmt: 'apa', label: 'APA', color: '#34d399' },
    ]

    const dropdown = open ? createPortal(
        <div ref={ref} style={{
            position: 'absolute', top: pos.top, right: pos.right,
            transform: 'translateY(-100%)', marginBottom: '6px',
            background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px',
            padding: '6px', zIndex: 9999, minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
            <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px', padding: '2px 6px 6px', borderBottom: '1px solid #1f2937', marginBottom: '4px' }}>CITE AS</div>
            {fmts.map(({ fmt, label: fmtLabel, color }) => (
                <div key={fmt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '3px 2px' }}>
                    <span style={{ fontSize: '10px', color, fontFamily: 'monospace', minWidth: '50px' }}>{fmtLabel}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleCite(fmt, false)}
                            style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '3px', border: '1px solid #1f2937', color: '#6b7280', background: 'transparent', cursor: 'pointer', fontFamily: 'monospace' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.color = color }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                        >{copied === fmt ? '✓ COPIED' : 'COPY'}</button>
                        <button onClick={() => handleCite(fmt, true)}
                            style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '3px', border: `1px solid ${color}22`, color, background: `${color}11`, cursor: 'pointer', fontFamily: 'monospace' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22` }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}11` }}
                        >↓</button>
                    </div>
                </div>
            ))}
        </div>,
        document.body
    ) : null

    return (
        <div style={{ display: 'inline-block' }}>
            <button ref={btnRef} onClick={handleOpen} style={{
                fontSize: '9px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px',
                border: `1px solid ${open ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.25)'}`,
                color: open ? '#a78bfa' : '#6b7280', background: open ? 'rgba(167,139,250,0.08)' : 'transparent',
                cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px',
            }}
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

// ─── Mock data (same as explorer) ─────────────────────────────────────────────
const MOCK_GENES = Array.from({ length: 1500 }, (_, i) => {
    const genes = ['BRCA1', 'TP53', 'EGFR', 'KRAS', 'PTEN', 'VEGFA', 'MYC', 'RB1', 'APC', 'CFTR', 'BRAF', 'CDKN2A', 'PIK3CA', 'NRAS', 'HRAS', 'ALK', 'RET', 'MET', 'FGFR1', 'ERBB2']
    const funcs = ['Tumor suppressor', 'Transcription factor', 'Receptor kinase', 'GTPase signaling', 'Phosphatase', 'Angiogenesis', 'DNA repair', 'Cell cycle', 'Ion channel', 'Serine kinase']
    const chrs = ['CHR01', 'CHR02', 'CHR03', 'CHR04', 'CHR05', 'CHR06', 'CHR07', 'CHR08', 'CHR09', 'CHR10', 'CHR11', 'CHR12', 'CHR13', 'CHR14', 'CHR15', 'CHR16', 'CHR17', 'CHR18', 'CHR19', 'CHR21']
    const chrColors: Record<string, string> = { CHR01: 'blue', CHR02: 'purple', CHR03: 'green', CHR04: 'blue', CHR05: 'green', CHR06: 'red', CHR07: 'purple', CHR08: 'blue', CHR09: 'green', CHR10: 'amber', CHR11: 'blue', CHR12: 'green', CHR13: 'purple', CHR14: 'blue', CHR15: 'purple', CHR16: 'green', CHR17: 'blue', CHR18: 'purple', CHR19: 'green', CHR21: 'amber' }
    const n = i + 1
    const sym = genes[i % genes.length] + (i >= genes.length ? `_${Math.floor(i / genes.length)}` : '')
    const chr = chrs[i % chrs.length]
    return {
        id: `GEN${String(n).padStart(3, '0')}`, symbol: sym, name: `${sym} protein gene`,
        chromosome: chr, chrColor: chrColors[chr] || 'blue', function: funcs[i % funcs.length],
        protein: `${sym}_HUMAN`, type: 'gene' as const, title: sym, description: `${funcs[i % funcs.length]} located on ${chr}.`,
    }
})

const MOCK_DISEASES = Array.from({ length: 500 }, (_, i) => ({
    id: `DIS${String(i + 1).padStart(3, '0')}`, symbol: `D${String(i + 1).padStart(4, '0')}`,
    name: `Disease ${i + 1}`, type: 'disease' as const,
}))

const MOCK_VARIANTS = Array.from({ length: 2000 }, (_, i) => ({
    id: `VAR${String(i + 1).padStart(4, '0')}`,
    symbol: `rs${Math.floor(Math.random() * 9000000 + 1000000)}`,
    name: `Variant ${i + 1}`, type: 'variant' as const,
}))

// ─── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 50   // ← 50 rows per page

const CHR_TAG_COLORS: Record<string, { bg: string; color: string }> = {
    blue: { bg: '#0c2a4a', color: '#60a5fa' },
    purple: { bg: '#2e1a4a', color: '#a78bfa' },
    green: { bg: '#0a2e1a', color: '#34d399' },
    amber: { bg: '#2e200a', color: '#fbbf24' },
    red: { bg: '#2e0a0a', color: '#f87171' },
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: {
    currentPage: number; totalPages: number; onPageChange: (p: number) => void; totalItems: number; itemsPerPage: number
}) {
    if (totalPages <= 1) return null
    const start = (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, totalItems)

    const buildPages = (): (number | string)[] => {
        const pages: (number | string)[] = []
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
        pages.push(1)
        if (currentPage > 4) pages.push('...')
        const lo = Math.max(2, currentPage - 2)
        const hi = Math.min(totalPages - 1, currentPage + 2)
        for (let i = lo; i <= hi; i++) pages.push(i)
        if (currentPage < totalPages - 3) pages.push('...')
        pages.push(totalPages)
        return pages
    }

    const btnBase: React.CSSProperties = {
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)', border: '1px solid #1f2937',
        boxShadow: '0 1px 0 0 rgba(6,182,212,0.15), inset 0 1px 0 0 rgba(6,182,212,0.05)',
        color: '#6b7280', fontSize: '10px', padding: '5px 10px', borderRadius: '4px',
        fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ color: '#4b5563', fontSize: '10px', letterSpacing: '1px', fontFamily: 'monospace' }}>
                Showing <span style={{ color: '#06b6d4' }}>{start}–{end}</span> of <span style={{ color: '#06b6d4' }}>{totalItems.toLocaleString()}</span> records
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button style={{ ...btnBase, opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} disabled={currentPage === 1}
                    onMouseEnter={e => { if (currentPage > 1) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#06b6d4'; (e.currentTarget as HTMLButtonElement).style.color = '#06b6d4' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                >← PREV</button>
                {buildPages().map((p, idx) =>
                    typeof p === 'string'
                        ? <span key={`dots-${idx}`} style={{ color: '#374151', fontSize: '11px', padding: '0 2px', fontFamily: 'monospace' }}>...</span>
                        : <button key={p} style={{ ...btnBase, ...(p === currentPage ? { background: '#0e2936', borderColor: '#06b6d4', color: '#06b6d4' } : {}) }}
                            onClick={() => onPageChange(p as number)}
                            onMouseEnter={e => { if (p !== currentPage) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#06b6d4'; (e.currentTarget as HTMLButtonElement).style.color = '#06b6d4' } }}
                            onMouseLeave={e => { if (p !== currentPage) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' } }}
                        >{p}</button>
                )}
                <button style={{ ...btnBase, opacity: currentPage === totalPages ? 0.3 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    onMouseEnter={e => { if (currentPage < totalPages) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#06b6d4'; (e.currentTarget as HTMLButtonElement).style.color = '#06b6d4' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                >NEXT →</button>
            </div>
        </div>
    )
}

// ─── Genes Table ───────────────────────────────────────────────────────────────
function GenesTable({ data, page, onPageChange }: { data: GeneRecord[]; page: number; onPageChange: (p: number) => void }) {
    const total = data.length
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    const slice = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    const th: React.CSSProperties = { fontSize: '10px', color: '#4b5563', letterSpacing: '1.5px', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #1f2937', fontWeight: 500 }
    const td: React.CSSProperties = { fontSize: '11px', color: '#9ca3af', padding: '8px 10px', borderBottom: '1px solid #111827', fontFamily: 'monospace' }

    return (
        <>
            <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
                    <thead>
                        <tr>{['GENE_ID', 'SYMBOL', 'NAME', 'CHROMOSOME', 'FUNCTION', 'PROTEIN', 'CITE'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {slice.map(g => {
                            const cc = CHR_TAG_COLORS[g.chrColor] || CHR_TAG_COLORS.blue
                            const row: Record<string, unknown> = { gene_id: g.id, gene_symbol: g.symbol, gene_name: g.name, chromosome: g.chromosome, function: g.function, protein: g.protein }
                            return (
                                <tr key={g.id}
                                    onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '#0f1a25' })}
                                    onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '' })}
                                >
                                    <td style={{ ...td, color: '#06b6d4' }}>{g.id}</td>
                                    <td style={{ ...td, color: '#d1d5db' }}>{g.symbol}</td>
                                    <td style={td}>{g.name}</td>
                                    <td style={td}>
                                        <span style={{ display: 'inline-block', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', letterSpacing: '1px', background: cc.bg, color: cc.color }}>{g.chromosome}</span>
                                    </td>
                                    <td style={td}>{g.function}</td>
                                    <td style={{ ...td, color: '#6ee7b7' }}>{g.protein}</td>
                                    <td style={{ ...td, overflow: 'visible', position: 'relative' }}>
                                        <CiteDropdown row={row} tabKey="GENES" label={g.symbol} />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} />
        </>
    )
}

// ─── Generic Table ─────────────────────────────────────────────────────────────
function GenericTable({ data, page, onPageChange, columns, tabKey }: {
    data: Record<string, unknown>[]; page: number; onPageChange: (p: number) => void; columns: Column[]; tabKey: string
}) {
    if (!data?.length) return <div style={{ padding: '20px', color: '#4b5563', textAlign: 'center', fontFamily: 'monospace' }}>NO_DATA_AVAILABLE</div>
    const total = data.length
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    const slice = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    const th: React.CSSProperties = { fontSize: '10px', color: '#4b5563', letterSpacing: '1.5px', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #1f2937', fontWeight: 500 }
    const td: React.CSSProperties = { fontSize: '11px', color: '#9ca3af', padding: '8px 10px', borderBottom: '1px solid #111827', fontFamily: 'monospace' }
    const labelKey: Record<string, string> = { DISEASES: 'disease_name', VARIANTS: 'variant_name', ASSOC: 'association_id', PATHWAYS: 'pathway_name', DRUGS: 'drug_name', PUBS: 'title' }

    return (
        <>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                    <thead>
                        <tr>
                            {columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}
                            <th style={th}>CITE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slice.map((row, i) => (
                            <tr key={(row.id as string) || i}
                                onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '#0f1a25' })}
                                onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '' })}
                            >
                                {columns.map(c => <td key={c.key} style={{ ...td, ...(c.color ? { color: c.color } : {}) }}>{row[c.key] as string}</td>)}
                                <td style={td}>
                                    <CiteDropdown row={row} tabKey={tabKey} label={String(row[labelKey[tabKey] || columns[0]?.key] || 'record')} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} />
        </>
    )
}

// ─── Tab definitions ───────────────────────────────────────────────────────────
const TABS = ['GENES', 'DISEASES', 'VARIANTS', 'ASSOC', 'PATHWAYS', 'DRUGS', 'PUBS']

const TAB_COLUMNS: Record<string, Column[]> = {
    DISEASES: [{ key: 'disease_id', label: 'DISEASE_ID', color: '#06b6d4' }, { key: 'disease_name', label: 'NAME' }, { key: 'category', label: 'CATEGORY' }, { key: 'icd_code', label: 'ICD_CODE' }],
    VARIANTS: [{ key: 'variant_id', label: 'VARIANT_ID', color: '#06b6d4' }, { key: 'gene_id', label: 'GENE_ID' }, { key: 'variant_name', label: 'VARIANT_NAME', color: '#34d399' }, { key: 'mutation_type', label: 'MUTATION_TYPE' }, { key: 'clinical_significance', label: 'CLINICAL_SIG' }],
    ASSOC: [{ key: 'association_id', label: 'ASSOC_ID', color: '#06b6d4' }, { key: 'gene_id', label: 'GENE_ID' }, { key: 'disease_id', label: 'DISEASE_ID' }, { key: 'confidence', label: 'CONFIDENCE' }, { key: 'evidence_level', label: 'EVIDENCE' }],
    PATHWAYS: [{ key: 'pathway_id', label: 'PATHWAY_ID', color: '#06b6d4' }, { key: 'pathway_name', label: 'NAME' }, { key: 'description', label: 'DESCRIPTION' }, { key: 'gene_count', label: 'GENE_COUNT' }],
    DRUGS: [{ key: 'drug_id', label: 'DRUG_ID', color: '#06b6d4' }, { key: 'drug_name', label: 'DRUG_NAME' }, { key: 'target_gene', label: 'TARGET_GENE' }, { key: 'indication', label: 'INDICATION' }],
    PUBS: [{ key: 'publication_id', label: 'PUB_ID', color: '#06b6d4' }, { key: 'title', label: 'TITLE' }, { key: 'journal', label: 'JOURNAL' }, { key: 'year', label: 'YEAR' }],
}

const TAB_ENDPOINTS: Record<string, string> = {
    GENES: '/api/v1/genes?limit=5000', VARIANTS: '/api/v1/variants?limit=500',
    DISEASES: '/api/v1/diseases?limit=500', ASSOC: '/api/v1/associations?limit=500',
    PATHWAYS: '/api/v1/pathways?limit=500', DRUGS: '/api/v1/drugs?limit=500',
    PUBS: '/api/v1/publications?limit=500',
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DatabasePage() {
    const [activeTab, setActiveTab] = useState('GENES')
    const [tabPages, setTabPages] = useState<Record<string, number>>(
        Object.fromEntries(TABS.map(t => [t, 1]))
    )
    const [tabData, setTabData] = useState<Record<string, Record<string, unknown>[]>>(
        Object.fromEntries(TABS.map(t => [t, []]))
    )
    const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({})

    const setTabPage = (tab: string, page: number) => setTabPages(prev => ({ ...prev, [tab]: page }))

    useEffect(() => {
        const url = TAB_ENDPOINTS[activeTab]
        if (!url || tabData[activeTab]?.length) return
        setTabLoading(prev => ({ ...prev, [activeTab]: true }))
        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (activeTab === 'GENES') {
                    const mapped = (Array.isArray(data) ? data : []).map((g: any) => ({
                        id: g.gene_id, symbol: g.gene_symbol, name: g.gene_name,
                        chromosome: g.chromosome, chrColor: 'blue', function: g.function,
                        protein: g.protein, type: 'gene', title: g.gene_symbol, description: g.function,
                    }))
                    setTabData(prev => ({ ...prev, GENES: mapped }))
                } else {
                    setTabData(prev => ({ ...prev, [activeTab]: Array.isArray(data) ? data : [] }))
                }
            })
            .catch(() => setTabData(prev => ({ ...prev, [activeTab]: [] })))
            .finally(() => setTabLoading(prev => ({ ...prev, [activeTab]: false })))
    }, [activeTab])

    const card: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', marginBottom: '12px' }

    // Fallback to mock data when API is empty (development)
    const getGeneData = (): GeneRecord[] => {
        const d = tabData.GENES as unknown as GeneRecord[]
        return d.length > 0 ? d : MOCK_GENES
    }
    const getTabData = (tab: string): Record<string, unknown>[] => {
        const d = tabData[tab]
        if (d.length > 0) return d
        if (tab === 'DISEASES') return MOCK_DISEASES as unknown as Record<string, unknown>[]
        if (tab === 'VARIANTS') return MOCK_VARIANTS as unknown as Record<string, unknown>[]
        return []
    }

    return (
        <div style={{ padding: '0', fontFamily: 'monospace' }}>

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Database style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
                    <h1 style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 700, letterSpacing: '3px', margin: 0 }}>
                        DATABASE EXPLORER
                    </h1>
                    <span style={{ fontSize: '9px', background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>
                        FULL DATASET
                    </span>
                </div>
                <p style={{ color: '#4b5563', fontSize: '11px', letterSpacing: '1px', margin: 0 }}>
                    Browse all records — 50 per page — across genes, diseases, variants, associations, pathways, drugs, and publications.
                </p>
            </div>

            {/* Main card */}
            <div style={card}>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            fontSize: '10px', padding: '5px 14px', borderRadius: '4px', border: '1px solid',
                            fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer',
                            background: tab === activeTab ? '#0e2936' : 'transparent',
                            borderColor: tab === activeTab ? '#06b6d4' : '#1f2937',
                            color: tab === activeTab ? '#06b6d4' : '#6b7280',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { if (tab !== activeTab) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' } }}
                            onMouseLeave={e => { if (tab !== activeTab) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' } }}
                        >{tab}</button>
                    ))}
                </div>

                {/* Table content */}
                {tabLoading[activeTab] ? (
                    <div style={{ color: '#4b5563', fontSize: '11px', padding: '40px', textAlign: 'center', letterSpacing: '2px' }}>LOADING...</div>
                ) : activeTab === 'GENES' ? (
                    <GenesTable data={getGeneData()} page={tabPages.GENES} onPageChange={p => setTabPage('GENES', p)} />
                ) : TAB_COLUMNS[activeTab] ? (
                    <GenericTable
                        data={getTabData(activeTab)}
                        page={tabPages[activeTab]}
                        onPageChange={p => setTabPage(activeTab, p)}
                        columns={TAB_COLUMNS[activeTab]}
                        tabKey={activeTab}
                    />
                ) : (
                    <div style={{ color: '#4b5563', fontSize: '11px', padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}>NO_DATA_AVAILABLE</div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}