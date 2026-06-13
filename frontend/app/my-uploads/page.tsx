'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface UploadRecord {
    upload_id: string
    dataset_name: string
    filename: string
    dataset_type: string
    row_count: number
    uploaded_at: string
}

const COLUMN_MAP: Record<string, { key: string; label: string; color?: string }[]> = {
    genes:        [{ key: 'gene_id', label: 'GENE_ID', color: '#06b6d4' }, { key: 'gene_symbol', label: 'SYMBOL' }, { key: 'gene_name', label: 'NAME' }, { key: 'chromosome', label: 'CHR' }, { key: 'function', label: 'FUNCTION' }, { key: 'protein', label: 'PROTEIN', color: '#34d399' }],
    diseases:     [{ key: 'disease_id', label: 'DISEASE_ID', color: '#06b6d4' }, { key: 'disease_name', label: 'NAME' }, { key: 'category', label: 'CATEGORY' }, { key: 'icd_code', label: 'ICD_CODE' }],
    variants:     [{ key: 'variant_id', label: 'VARIANT_ID', color: '#06b6d4' }, { key: 'gene_id', label: 'GENE_ID' }, { key: 'variant_name', label: 'VARIANT_NAME', color: '#34d399' }, { key: 'mutation_type', label: 'MUTATION_TYPE' }, { key: 'clinical_significance', label: 'CLINICAL_SIG' }],
    associations: [{ key: 'association_id', label: 'ASSOC_ID', color: '#06b6d4' }, { key: 'gene_id', label: 'GENE_ID' }, { key: 'disease_id', label: 'DISEASE_ID' }, { key: 'confidence_score', label: 'CONFIDENCE' }, { key: 'evidence_level', label: 'EVIDENCE' }],
    drugs:        [{ key: 'drug_target_id', label: 'DRUG_ID', color: '#06b6d4' }, { key: 'gene_id', label: 'GENE_ID' }, { key: 'drug_name', label: 'DRUG_NAME' }, { key: 'indication', label: 'INDICATION' }],
    publications: [{ key: 'publication_id', label: 'PUB_ID', color: '#06b6d4' }, { key: 'title', label: 'TITLE' }, { key: 'journal', label: 'JOURNAL' }, { key: 'year', label: 'YEAR' }],
    pathways:     [{ key: 'pathway_id', label: 'PATHWAY_ID', color: '#06b6d4' }, { key: 'pathway_name', label: 'NAME' }, { key: 'description', label: 'DESCRIPTION' }],
}

const ITEMS_PER_PAGE = 10
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    genes:        { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4' },
    diseases:     { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
    variants:     { bg: 'rgba(52,211,153,0.1)',  color: '#34d399' },
    associations: { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
    drugs:        { bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
    publications: { bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa' },
    pathways:     { bg: 'rgba(52,211,153,0.1)',  color: '#34d399' },
}

export default function MyUploadsPage() {
    const [uploads, setUploads] = useState<UploadRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([])
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewPage, setPreviewPage] = useState(1)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const card: React.CSSProperties = {
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '12px',
        fontFamily: 'monospace',
    }

    const fetchUploads = async () => {
        setLoading(true)
        try {
            const token = getToken()
            const res = await fetch('http://localhost:8000/api/v1/uploads/', {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) {
                const data = await res.json()
                setUploads(Array.isArray(data) ? data : [])
            }
        } catch { setUploads([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchUploads() }, [])

    const loadPreview = async (uploadId: string) => {
        if (expandedId === uploadId) {
            setExpandedId(null); setPreviewRows([]); return
        }
        setExpandedId(uploadId)
        setPreviewRows([])
        setPreviewPage(1)
        setPreviewLoading(true)
        try {
            const token = getToken()
            const res = await fetch(`/api/v1/uploads/${uploadId}/data`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) setPreviewRows(await res.json())
        } catch { setPreviewRows([]) }
        finally { setPreviewLoading(false) }
    }

    const handleDelete = async (uploadId: string) => {
        try {
            const token = getToken()
            await fetch(`/api/v1/uploads/${uploadId}`, {
                method: 'DELETE',
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            setUploads(prev => prev.filter(u => u.upload_id !== uploadId))
            if (expandedId === uploadId) { setExpandedId(null); setPreviewRows([]) }
            setDeleteConfirm(null)
        } catch { /* ignore */ }
    }

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
    }

    const th: React.CSSProperties = { fontSize: '10px', color: '#4b5563', letterSpacing: '1.5px', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #1f2937', fontWeight: 500 }
    const td: React.CSSProperties = { fontSize: '11px', color: '#9ca3af', padding: '8px 10px', borderBottom: '1px solid #111827', fontFamily: 'monospace' }

    const totalPages = Math.ceil(previewRows.length / ITEMS_PER_PAGE)
    const previewSlice = previewRows.slice((previewPage - 1) * ITEMS_PER_PAGE, previewPage * ITEMS_PER_PAGE)

    return (
        <div style={{ background: '#060810', padding: '20px', borderRadius: '8px', minHeight: '600px', fontFamily: 'monospace' }}>

            {/* Header */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <div style={{ background: 'linear-gradient(90deg, #06b6d4, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '13px', fontWeight: 500, letterSpacing: '2px', marginBottom: '4px' }}>
                            MY UPLOADS
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '11px', letterSpacing: '1px' }}>
                            Your uploaded datasets with timestamps and row previews.
                        </div>
                    </div>
                    <Link
                        href="/upload"
                        style={{ fontSize: '10px', padding: '6px 14px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', background: 'rgba(52,211,153,0.05)', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '1px', textDecoration: 'none', display: 'inline-block' }}
                    >
                        + NEW UPLOAD
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div style={card}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#4b5563', fontSize: '11px', letterSpacing: '2px' }}>
                        LOADING_UPLOADS...
                    </div>
                ) : uploads.length === 0 ? (
                    <div style={{ border: '1px dashed #1f2937', borderRadius: '6px', padding: '50px', textAlign: 'center' }}>
                        <FolderOpen style={{ width: '32px', height: '32px', color: '#1f2937', margin: '0 auto 12px' }} />
                        <p style={{ color: '#374151', fontSize: '11px', letterSpacing: '2px', marginBottom: '16px' }}>NO_UPLOADS_FOUND</p>
                        <Link href="/upload" style={{ fontSize: '10px', padding: '8px 16px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', background: 'transparent', fontFamily: 'monospace', letterSpacing: '1px', textDecoration: 'none' }}>
                            + UPLOAD YOUR FIRST DATASET
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {uploads.map(u => {
                            const tc = TYPE_COLORS[u.dataset_type] || TYPE_COLORS.genes
                            const isExpanded = expandedId === u.upload_id
                            const cols = COLUMN_MAP[u.dataset_type] || []

                            return (
                                <div key={u.upload_id} style={{ border: `1px solid ${isExpanded ? '#06b6d4' : '#1f2937'}`, borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                                    {/* Row header */}
                                    <div style={{ background: isExpanded ? '#0e2936' : '#0d1117', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>

                                        {/* Left info */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '3px', background: tc.bg, color: tc.color, letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
                                                {u.dataset_type}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: 600 }}>{u.dataset_name}</span>
                                            <span style={{ fontSize: '10px', color: '#4b5563' }}>{u.filename}</span>
                                        </div>

                                        {/* Right meta */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '10px', color: '#34d399' }}>{u.row_count.toLocaleString()} rows</span>

                                            {/* Timestamp badge */}
                                            <span style={{ fontSize: '10px', color: '#4b5563', background: '#060810', border: '1px solid #1f2937', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                                🕐 {formatDate(u.uploaded_at)}
                                            </span>

                                            {/* Preview toggle */}
                                            <button
                                                onClick={() => loadPreview(u.upload_id)}
                                                style={{ fontSize: '9px', padding: '4px 10px', borderRadius: '3px', border: `1px solid ${isExpanded ? '#06b6d4' : 'rgba(6,182,212,0.3)'}`, color: isExpanded ? '#06b6d4' : '#4b5563', background: 'transparent', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {isExpanded ? <ChevronUp style={{ width: '10px', height: '10px' }} /> : <ChevronDown style={{ width: '10px', height: '10px' }} />}
                                                {isExpanded ? 'HIDE' : 'PREVIEW'}
                                            </button>

                                            {/* Delete */}
                                            {deleteConfirm === u.upload_id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '9px', color: '#f87171' }}>Sure?</span>
                                                    <button onClick={() => handleDelete(u.upload_id)} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '3px', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', background: 'rgba(248,113,113,0.05)', cursor: 'pointer', fontFamily: 'monospace' }}>YES</button>
                                                    <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '3px', border: '1px solid #1f2937', color: '#4b5563', background: 'transparent', cursor: 'pointer', fontFamily: 'monospace' }}>NO</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(u.upload_id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#374151' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
                                                >
                                                    <Trash2 style={{ width: '13px', height: '13px' }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview rows */}
                                    {isExpanded && (
                                        <div style={{ borderTop: '1px solid #1f2937', background: '#060810', padding: '12px' }}>
                                            {previewLoading ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#4b5563', fontSize: '11px', letterSpacing: '1px' }}>LOADING_PREVIEW...</div>
                                            ) : previewRows.length === 0 ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#374151', fontSize: '11px' }}>NO_DATA_FOUND</div>
                                            ) : (
                                                <>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                                            <thead>
                                                                <tr>{cols.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr>
                                                            </thead>
                                                            <tbody>
                                                                {previewSlice.map((row, i) => (
                                                                    <tr key={i}
                                                                        onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '#0f1a25' })}
                                                                        onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '' })}
                                                                    >
                                                                        {cols.map(c => (
                                                                            <td key={c.key} style={{ ...td, ...(c.color ? { color: c.color } : {}) }}>
                                                                                {row[c.key] as string}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Preview pagination */}
                                                    {totalPages > 1 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                                            <span style={{ fontSize: '10px', color: '#4b5563' }}>
                                                                Showing <span style={{ color: '#06b6d4' }}>{(previewPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(previewPage * ITEMS_PER_PAGE, previewRows.length)}</span> of <span style={{ color: '#06b6d4' }}>{previewRows.length}</span> rows
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button disabled={previewPage === 1} onClick={() => setPreviewPage(p => p - 1)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1f2937', color: previewPage === 1 ? '#374151' : '#6b7280', background: '#0d1117', cursor: previewPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'monospace' }}>← PREV</button>
                                                                <span style={{ fontSize: '10px', color: '#4b5563', padding: '4px 8px', fontFamily: 'monospace' }}>{previewPage} / {totalPages}</span>
                                                                <button disabled={previewPage === totalPages} onClick={() => setPreviewPage(p => p + 1)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1f2937', color: previewPage === totalPages ? '#374151' : '#6b7280', background: '#0d1117', cursor: previewPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'monospace' }}>NEXT →</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}