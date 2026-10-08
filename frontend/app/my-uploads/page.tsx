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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
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
    const [loadError, setLoadError] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([])
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewPage, setPreviewPage] = useState(1)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const authHeaders = (): Record<string, string> => {
        const token = getToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    const fetchUploads = async () => {
        setLoading(true)
        setLoadError('')
        try {
            const res = await fetch(`${API}/api/v1/uploads/`, { headers: authHeaders() })
            if (res.ok) {
                const data = await res.json()
                setUploads(Array.isArray(data) ? data : [])
            } else if (res.status === 401) {
                setUploads([])
                setLoadError('Please sign in to see your uploads.')
            } else {
                setUploads([])
                setLoadError(`Could not load uploads (${res.status}).`)
            }
        } catch {
            setUploads([])
            setLoadError('Cannot reach the server. If it was idle, wait about a minute and refresh.')
        } finally {
            setLoading(false)
        }
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
            const res = await fetch(`${API}/api/v1/uploads/${uploadId}/data`, { headers: authHeaders() })
            if (res.ok) setPreviewRows(await res.json())
        } catch { setPreviewRows([]) }
        finally { setPreviewLoading(false) }
    }

    const handleDelete = async (uploadId: string) => {
        try {
            await fetch(`${API}/api/v1/uploads/${uploadId}`, { method: 'DELETE', headers: authHeaders() })
            setUploads(prev => prev.filter(u => u.upload_id !== uploadId))
            if (expandedId === uploadId) { setExpandedId(null); setPreviewRows([]) }
            setDeleteConfirm(null)
        } catch { /* ignore */ }
    }

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    const totalPages = Math.ceil(previewRows.length / ITEMS_PER_PAGE)
    const previewSlice = previewRows.slice((previewPage - 1) * ITEMS_PER_PAGE, previewPage * ITEMS_PER_PAGE)

    const card = 'bg-[#111827] border border-[#1f2937] rounded-lg p-3 sm:p-5 mb-3 font-mono'
    const navBtn = 'min-h-[40px] text-[10px] px-3.5 rounded border border-[#1f2937] bg-[#0d1117] font-mono'

    return (
        <div
            className="bg-[#060810] p-3 sm:p-5 rounded-lg min-h-[600px] font-mono"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
            {/* Header */}
            <div className={card}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 bg-clip-text text-transparent text-[13px] font-medium tracking-[2px] mb-1">
                            MY UPLOADS
                        </div>
                        <div className="text-gray-500 text-[11px] tracking-wide leading-relaxed">
                            Your uploaded datasets with timestamps and row previews.
                        </div>
                    </div>
                    <Link
                        href="/upload"
                        className="inline-flex items-center justify-center min-h-[44px] sm:min-h-[36px] text-[11px] sm:text-[10px] px-4 rounded border border-emerald-400/40 text-emerald-400 bg-emerald-400/5 tracking-wider no-underline active:bg-emerald-400/15 shrink-0"
                    >
                        + NEW UPLOAD
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className={card}>
                {loading ? (
                    <div className="py-10 text-center text-gray-500 text-[11px] tracking-[2px]">LOADING_UPLOADS...</div>
                ) : loadError ? (
                    <div className="border border-red-400/20 bg-red-400/5 rounded-md p-4 text-center">
                        <p className="text-red-400 text-[11px] leading-relaxed mb-3 break-words">{loadError}</p>
                        <button
                            onClick={fetchUploads}
                            className="min-h-[40px] px-4 text-[10px] rounded border border-red-400/40 text-red-400 tracking-wider font-mono"
                        >
                            RETRY
                        </button>
                    </div>
                ) : uploads.length === 0 ? (
                    <div className="border border-dashed border-[#1f2937] rounded-md px-4 py-10 sm:py-12 text-center">
                        <FolderOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-600 text-[11px] tracking-[2px] mb-4">NO_UPLOADS_FOUND</p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center justify-center min-h-[44px] text-[10px] px-4 rounded border border-emerald-400/40 text-emerald-400 tracking-wider no-underline"
                        >
                            + UPLOAD YOUR FIRST DATASET
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {uploads.map(u => {
                            const tc = TYPE_COLORS[u.dataset_type] || TYPE_COLORS.genes
                            const isExpanded = expandedId === u.upload_id
                            const cols = COLUMN_MAP[u.dataset_type] || []

                            return (
                                <div
                                    key={u.upload_id}
                                    className={`border rounded-md overflow-hidden transition-colors ${isExpanded ? 'border-cyan-500' : 'border-[#1f2937]'}`}
                                >
                                    {/* Row header */}
                                    <div className={`${isExpanded ? 'bg-[#0e2936]' : 'bg-[#0d1117]'} p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-1.5 lg:justify-start lg:gap-3 lg:mb-0 lg:flex-wrap">
                                                <span
                                                    className="text-[9px] px-2 py-0.5 rounded tracking-wider uppercase shrink-0"
                                                    style={{ background: tc.bg, color: tc.color }}
                                                >
                                                    {u.dataset_type}
                                                </span>
                                                <span className="text-[11px] text-emerald-400 lg:order-last">
                                                    {u.row_count.toLocaleString()} rows
                                                </span>
                                                <span className="hidden lg:inline text-[12px] text-gray-200 font-semibold break-words">{u.dataset_name}</span>
                                                <span className="hidden lg:inline text-[10px] text-gray-500 break-all">{u.filename}</span>
                                            </div>
                                            <div className="lg:hidden">
                                                <div className="text-[13px] text-gray-200 font-semibold break-words leading-snug">{u.dataset_name}</div>
                                                <div className="text-[10px] text-gray-500 break-all mt-0.5">{u.filename}</div>
                                            </div>
                                        </div>

                                        {/* Meta + actions */}
                                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center lg:gap-3 shrink-0">
                                            <span className="text-[10px] text-gray-500 bg-[#060810] border border-[#1f2937] px-2 py-1 rounded tracking-wide self-start sm:self-auto whitespace-nowrap">
                                                🕐 {formatDate(u.uploaded_at)}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => loadPreview(u.upload_id)}
                                                    className={`flex-1 sm:flex-none min-h-[40px] lg:min-h-[32px] px-3.5 text-[10px] rounded border flex items-center justify-center gap-1 tracking-wider font-mono ${
                                                        isExpanded ? 'border-cyan-500 text-cyan-400' : 'border-cyan-500/30 text-gray-400'
                                                    }`}
                                                >
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    {isExpanded ? 'HIDE' : 'PREVIEW'}
                                                </button>

                                                {deleteConfirm === u.upload_id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-red-400">Sure?</span>
                                                        <button
                                                            onClick={() => handleDelete(u.upload_id)}
                                                            className="min-h-[40px] lg:min-h-[32px] px-3 text-[10px] rounded border border-red-400/50 text-red-400 bg-red-400/5 font-mono"
                                                        >
                                                            YES
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="min-h-[40px] lg:min-h-[32px] px-3 text-[10px] rounded border border-[#1f2937] text-gray-500 font-mono"
                                                        >
                                                            NO
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(u.upload_id)}
                                                        aria-label="Delete upload"
                                                        className="min-w-[44px] min-h-[40px] lg:min-w-[32px] lg:min-h-[32px] flex items-center justify-center rounded border border-[#1f2937] sm:border-transparent text-gray-600 hover:text-red-400 active:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    {isExpanded && (
                                        <div className="border-t border-[#1f2937] bg-[#060810] p-2.5 sm:p-3">
                                            {previewLoading ? (
                                                <div className="py-5 text-center text-gray-500 text-[11px] tracking-wider">LOADING_PREVIEW...</div>
                                            ) : previewRows.length === 0 ? (
                                                <div className="py-5 text-center text-gray-600 text-[11px]">NO_DATA_FOUND</div>
                                            ) : (
                                                <>
                                                    {/* Desktop / tablet: table */}
                                                    <div className="hidden md:block overflow-x-auto">
                                                        <table className="w-full border-collapse min-w-[400px]">
                                                            <thead>
                                                                <tr>
                                                                    {cols.map(c => (
                                                                        <th key={c.key} className="text-[10px] text-gray-600 tracking-[1.5px] text-left px-2.5 py-1.5 border-b border-[#1f2937] font-medium">
                                                                            {c.label}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {previewSlice.map((row, i) => (
                                                                    <tr key={i} className="hover:bg-[#0f1a25]">
                                                                        {cols.map(c => (
                                                                            <td
                                                                                key={c.key}
                                                                                className="text-[11px] text-gray-400 px-2.5 py-2 border-b border-[#111827] font-mono"
                                                                                style={c.color ? { color: c.color } : undefined}
                                                                            >
                                                                                {row[c.key] as string}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Mobile: one card per row */}
                                                    <div className="md:hidden space-y-2">
                                                        {previewSlice.map((row, i) => (
                                                            <div key={i} className="bg-[#0d1117] border border-[#1f2937] rounded-md p-2.5 space-y-1.5">
                                                                {cols.map(c => (
                                                                    <div key={c.key} className="grid grid-cols-[84px_1fr] gap-2">
                                                                        <span className="text-[9px] text-gray-600 tracking-wider uppercase pt-0.5 break-words">{c.label}</span>
                                                                        <span
                                                                            className="text-[11px] text-gray-400 break-words min-w-0"
                                                                            style={c.color ? { color: c.color } : undefined}
                                                                        >
                                                                            {(row[c.key] as string) || '—'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Pagination */}
                                                    {totalPages > 1 && (
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mt-3">
                                                            <span className="text-[10px] text-gray-500 text-center sm:text-left">
                                                                Showing <span className="text-cyan-400">{(previewPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(previewPage * ITEMS_PER_PAGE, previewRows.length)}</span> of <span className="text-cyan-400">{previewRows.length}</span> rows
                                                            </span>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    disabled={previewPage === 1}
                                                                    onClick={() => setPreviewPage(p => p - 1)}
                                                                    className={`${navBtn} ${previewPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400'}`}
                                                                >
                                                                    ← PREV
                                                                </button>
                                                                <span className="text-[10px] text-gray-500 px-1">{previewPage} / {totalPages}</span>
                                                                <button
                                                                    disabled={previewPage === totalPages}
                                                                    onClick={() => setPreviewPage(p => p + 1)}
                                                                    className={`${navBtn} ${previewPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400'}`}
                                                                >
                                                                    NEXT →
                                                                </button>
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