'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

const UPLOAD_SCHEMAS: Record<string, { hint: string; columns: string[] }> = {
    genes:        { hint: 'gene_id, gene_symbol, gene_name, chromosome, function, protein',         columns: ['gene_id', 'gene_symbol', 'gene_name', 'chromosome', 'function', 'protein'] },
    diseases:     { hint: 'disease_id, disease_name, category, icd_code',                           columns: ['disease_id', 'disease_name', 'category', 'icd_code'] },
    variants:     { hint: 'variant_id, gene_id, variant_name, mutation_type, clinical_significance', columns: ['variant_id', 'gene_id', 'variant_name', 'mutation_type', 'clinical_significance'] },
    associations: { hint: 'association_id, gene_id, disease_id, confidence_score, evidence_level',  columns: ['association_id', 'gene_id', 'disease_id', 'confidence_score', 'evidence_level'] },
    drugs:        { hint: 'drug_target_id, gene_id, drug_name, indication',                         columns: ['drug_target_id', 'gene_id', 'drug_name', 'indication'] },
    publications: { hint: 'publication_id, title, journal, year, gene_id',                          columns: ['publication_id', 'title', 'journal', 'year', 'gene_id'] },
    pathways:     { hint: 'pathway_id, pathway_name, description',                                  columns: ['pathway_id', 'pathway_name', 'description'] },
}

// ID field per type — must match backend ID_FIELDS
const ID_FIELDS: Record<string, string> = {
    genes:        'gene_id',
    diseases:     'disease_id',
    variants:     'variant_id',
    associations: 'association_id',
    drugs:        'drug_target_id',
    publications: 'publication_id',
    pathways:     'pathway_id',
}

interface ConflictRow {
    id_field: string
    id_value: string
    uploaded: Record<string, string>
    existing: Record<string, string>
}

type ResolutionMode = 'skip' | 'overwrite' | 'merge'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

export default function UploadPage() {
    const router = useRouter()
    const [datasetName, setDatasetName]   = useState('')
    const [datasetType, setDatasetType]   = useState('genes')
    const [file, setFile]                 = useState<File | null>(null)
    const [error, setError]               = useState('')
    const [loading, setLoading]           = useState(false)
    const [success, setSuccess]           = useState(false)

    // Conflict state
    const [parsedRows, setParsedRows]           = useState<Record<string, string>[]>([])
    const [conflicts, setConflicts]             = useState<ConflictRow[]>([])
    const [conflictLoading, setConflictLoading] = useState(false)
    const [resolution, setResolution]           = useState<ResolutionMode>('skip')
    const [conflictChecked, setConflictChecked] = useState(false)

    // ─── Parse CSV to rows ────────────────────────────────────────────────────

    const parseCSV = (text: string): Record<string, string>[] => {
        const lines = text.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) return []
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: Record<string, string> = {}
            headers.forEach((h, i) => { row[h] = vals[i] || '' })
            return row
        })
    }

    const resetFileState = () => {
        setFile(null)
        setConflicts([])
        setConflictChecked(false)
        setParsedRows([])
    }

    // ─── File change → parse + conflict check ────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null
        // Allow re-selecting the same file later (Android WebView needs this)
        e.target.value = ''
        setFile(f)
        setError('')
        setSuccess(false)
        setConflicts([])
        setConflictChecked(false)
        setParsedRows([])

        if (!f) return

        if (!f.name.toLowerCase().endsWith('.csv')) {
            setError('Only CSV files are supported.')
            return
        }

        let text = ''
        try {
            text = await f.text()
        } catch {
            setError('Failed to read file.')
            return
        }

        const firstLine = text.split(/\r?\n/)[0]
        const headers = firstLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
        const required = UPLOAD_SCHEMAS[datasetType].columns
        const missing = required.filter(r => !headers.includes(r))
        if (missing.length > 0) {
            setError(`Missing required columns: ${missing.join(', ')}`)
            return
        }

        const rows = parseCSV(text)
        setParsedRows(rows)

        setConflictLoading(true)
        try {
            const token = getToken()
            const res = await fetch(`${API}/api/v1/uploads/check-conflicts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ dataset_type: datasetType, rows }),
            })
            if (res.ok) {
                const data = await res.json()
                setConflicts(data.conflicts || [])
            }
        } catch {
            // Conflict check failed silently — still allow upload
            setConflicts([])
        } finally {
            setConflictLoading(false)
            setConflictChecked(true)
        }
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!datasetName.trim()) { setError('Please enter a dataset name.'); return }
        if (!file) { setError('Please select a CSV file.'); return }
        if (error) return

        setLoading(true)
        setError('')

        try {
            const token = getToken()
            const form = new FormData()
            form.append('file', file)
            form.append('dataset_name', datasetName)
            form.append('dataset_type', datasetType)
            form.append('conflict_resolution', resolution)
            form.append('conflict_ids', conflicts.map(c => c.id_value).join(','))

            const res = await fetch(`${API}/api/v1/uploads/`, {
                method: 'POST',
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: form,
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || `Upload failed (${res.status})`)
            }

            setSuccess(true)
            setDatasetName('')
            resetFileState()
            setDatasetType('genes')

            setTimeout(() => router.push('/my-uploads'), 1500)
        } catch (err: any) {
            const msg = err?.message || ''
            setError(
                msg === 'Failed to fetch'
                    ? 'Cannot reach the server. If it was idle, wait about a minute and try again.'
                    : msg || 'Upload failed. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    // ─── Diff cell renderer ───────────────────────────────────────────────────

    const renderDiffCell = (uploadedVal: string, existingVal: string) => {
        const differs = (uploadedVal || '').trim() !== (existingVal || '').trim()
        return (
            <div className="flex flex-col gap-0.5 break-words">
                <div className={`text-[11px] ${differs ? 'text-amber-400' : 'text-gray-400'}`}>
                    {uploadedVal || '—'}
                    {differs && <span className="text-[9px] text-amber-400 ml-1">↑ NEW</span>}
                </div>
                {differs && (
                    <div className="text-[10px] text-gray-600 line-through">{existingVal || '—'}</div>
                )}
            </div>
        )
    }

    const columns = UPLOAD_SCHEMAS[datasetType].columns
    const hasConflicts = conflicts.length > 0
    const cleanRows = parsedRows.length - conflicts.length
    const blocked = loading || success || !!error || conflictLoading

    const resolutionStyles: Record<ResolutionMode, { on: string }> = {
        skip:      { on: 'border-gray-500 text-gray-300 bg-gray-500/20' },
        overwrite: { on: 'border-red-400 text-red-400 bg-red-400/10' },
        merge:     { on: 'border-emerald-400 text-emerald-400 bg-emerald-400/10' },
    }

    const card = 'bg-[#111827] border border-[#1f2937] rounded-lg p-4 sm:p-5 mb-3 font-mono'
    const label = 'block text-[10px] text-gray-500 tracking-[1.5px] uppercase mb-1.5'
    const field = 'w-full min-h-[44px] bg-[#0d1117] border border-[#1f2937] text-gray-300 text-[16px] sm:text-[12px] px-3.5 py-2.5 rounded-md font-mono outline-none focus:border-cyan-500/50 transition-colors'

    return (
        <div
            className="bg-[#060810] p-3 sm:p-5 rounded-lg min-h-[600px] font-mono"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
            {/* Header */}
            <div className={card}>
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 bg-clip-text text-transparent text-[13px] font-medium tracking-[2px] mb-1">
                    UPLOAD DATASET
                </div>
                <div className="text-gray-500 text-[11px] tracking-wide leading-relaxed">
                    Upload a CSV file to add your own dataset. Must match the required column format.
                </div>
            </div>

            {/* Form */}
            <div className={card}>

                {/* Dataset Name */}
                <div className="mb-4">
                    <label className={label} htmlFor="dataset-name">Dataset Name</label>
                    <input
                        id="dataset-name"
                        className={field}
                        placeholder="e.g. My Custom Gene Set"
                        value={datasetName}
                        onChange={e => { setDatasetName(e.target.value); setError('') }}
                    />
                </div>

                {/* Category */}
                <div className="mb-4">
                    <label className={label} htmlFor="dataset-type">Category</label>
                    <select
                        id="dataset-type"
                        value={datasetType}
                        onChange={e => {
                            setDatasetType(e.target.value)
                            setError('')
                            resetFileState()
                        }}
                        className={`${field} !bg-[#1f2937] !border-[#374151] !text-gray-400`}
                    >
                        {Object.keys(UPLOAD_SCHEMAS).map(k => (
                            <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Required columns hint */}
                <div className="mb-4 bg-[#0d1117] border border-[#1f2937] rounded-md p-3">
                    <div className="text-[10px] text-gray-500 tracking-[1.5px] mb-2 uppercase">
                        Required CSV Columns
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {columns.map(col => (
                            <span key={col} className="text-[11px] text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded px-1.5 py-0.5 break-all">
                                {col}
                            </span>
                        ))}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-400 leading-snug">
                        Your CSV header row must contain these column names.
                    </div>
                </div>

                {/* File picker — <label> works reliably in Android WebView */}
                <div className="mb-4">
                    <span className={label}>CSV File</span>
                    <label
                        htmlFor="csv-input"
                        className={`block cursor-pointer rounded-lg border-2 border-dashed bg-[#0d1117] px-4 py-7 sm:py-8 text-center transition-colors active:bg-[#111827] hover:border-cyan-500/40 ${file ? 'border-emerald-400/40' : 'border-[#1f2937]'}`}
                    >
                        {conflictLoading ? (
                            <div>
                                <div className="text-[12px] text-cyan-400 mb-1">CHECKING CONFLICTS...</div>
                                <div className="text-[10px] text-gray-500">Comparing against existing database records</div>
                            </div>
                        ) : file ? (
                            <div>
                                <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                <div className="text-[12px] text-emerald-400 break-all">{file.name}</div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {(file.size / 1024).toFixed(1)} KB · {parsedRows.length} rows
                                </div>
                                <div className="text-[10px] text-gray-600 mt-0.5">Tap to change</div>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                <div className="text-[12px] text-gray-500">Tap to select CSV file</div>
                                <div className="text-[10px] text-gray-600 mt-1">Only .csv files supported</div>
                            </div>
                        )}
                    </label>
                    <input
                        id="csv-input"
                        type="file"
                        accept=".csv,text/csv,text/comma-separated-values,application/vnd.ms-excel"
                        className="sr-only"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Summary */}
                {conflictChecked && !conflictLoading && file && !error && (
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 px-3.5 py-2.5 bg-emerald-400/5 border border-emerald-400/20 rounded-md flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[11px] text-emerald-400">
                                <strong>{cleanRows}</strong> clean rows — ready to import
                            </span>
                        </div>
                        {hasConflicts && (
                            <div className="flex-1 px-3.5 py-2.5 bg-amber-400/5 border border-amber-400/25 rounded-md flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-[11px] text-amber-400">
                                    <strong>{conflicts.length}</strong> conflicts detected — review below
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-4 px-3.5 py-2.5 bg-red-400/5 border border-red-400/20 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" />
                        <span className="text-[11px] text-red-400 break-words min-w-0">{error}</span>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mb-4 px-3.5 py-2.5 bg-emerald-400/5 border border-emerald-400/20 rounded-md flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-emerald-400">Upload successful! Redirecting to My Uploads...</span>
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={blocked}
                    className={`w-full min-h-[48px] rounded-md text-[11px] font-bold tracking-[2px] font-mono transition-colors ${
                        success
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                            : loading
                              ? 'bg-[#1f2937] text-gray-500'
                              : 'bg-cyan-500 text-black active:bg-cyan-400'
                    } ${blocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${(!!error || conflictLoading) ? 'opacity-50' : ''}`}
                >
                    {success ? '✓ UPLOAD_COMPLETE' : loading ? 'UPLOADING...' : 'EXECUTE_UPLOAD'}
                </button>
            </div>

            {/* ─── Conflict Panel ──────────────────────────────────────────── */}
            {hasConflicts && !conflictLoading && (
                <div className="bg-[#111827] border border-amber-400/30 rounded-lg p-4 sm:p-5 mb-3 font-mono">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-amber-400 text-[10px] tracking-[1.5px] leading-snug">
                                CONFLICT REVIEW — {conflicts.length} record{conflicts.length !== 1 ? 's' : ''} already exist in database
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                            {(['skip', 'overwrite', 'merge'] as ResolutionMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setResolution(mode)}
                                    className={`min-h-[40px] text-[10px] px-3 rounded border tracking-wider font-mono transition-colors ${
                                        resolution === mode ? resolutionStyles[mode].on : 'border-[#1f2937] text-gray-500'
                                    }`}
                                >
                                    {mode.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4 px-3 py-2 bg-[#0d1117] rounded text-[10px] text-gray-500 tracking-wide leading-relaxed">
                        {resolution === 'skip'      && '⊘  SKIP — conflicting rows will NOT be imported. Existing database records stay unchanged.'}
                        {resolution === 'overwrite' && '↺  OVERWRITE — uploaded values will REPLACE the existing database records entirely.'}
                        {resolution === 'merge'     && '⊕  MERGE — only empty fields in the database will be filled from the uploaded data.'}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className="text-[9px] text-amber-400 tracking-[1.5px] text-left px-2.5 py-1.5 border-b border-[#1f2937] font-medium">CONFLICT</th>
                                    {columns.map(col => (
                                        <th key={col} className="text-[9px] text-gray-500 tracking-[1.5px] text-left px-2.5 py-1.5 border-b border-[#1f2937] font-medium">
                                            {col.toUpperCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.map((conflict, i) => (
                                    <tr key={i}>
                                        <td className="px-2.5 py-2 border-b border-[#111827] align-top whitespace-nowrap">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 tracking-wider">⚠ EXISTS</span>
                                                <span className="text-[9px] text-gray-500">{conflict.id_value}</span>
                                            </div>
                                        </td>
                                        {columns.map(col => (
                                            <td key={col} className="px-2.5 py-2 border-b border-[#111827] align-top">
                                                {renderDiffCell(conflict.uploaded[col] || '', conflict.existing[col] || '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile: one card per conflict */}
                    <div className="md:hidden space-y-3">
                        {conflicts.map((conflict, i) => (
                            <div key={i} className="bg-[#0d1117] border border-[#1f2937] rounded-md p-3">
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#1f2937]">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 tracking-wider shrink-0">⚠ EXISTS</span>
                                    <span className="text-[11px] text-cyan-400 break-all text-right">{conflict.id_value}</span>
                                </div>
                                <div className="space-y-2">
                                    {columns.map(col => (
                                        <div key={col} className="grid grid-cols-[88px_1fr] gap-2">
                                            <span className="text-[9px] text-gray-500 tracking-wider uppercase pt-0.5 break-words">{col}</span>
                                            {renderDiffCell(conflict.uploaded[col] || '', conflict.existing[col] || '')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-amber-400">value ↑ NEW</span>
                            <span className="text-[10px] text-gray-500">= uploaded (differs)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-500 line-through">value</span>
                            <span className="text-[10px] text-gray-500">= existing (replaced on overwrite)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-400">value</span>
                            <span className="text-[10px] text-gray-500">= same in both</span>
                        </div>
                    </div>
                </div>
            )}

            {/* No conflicts confirmed */}
            {conflictChecked && !hasConflicts && !conflictLoading && file && !error && (
                <div className="bg-[#111827] border border-emerald-400/20 rounded-lg p-4 mb-3 flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                        <div className="text-[10px] text-emerald-400 tracking-[1.5px] mb-0.5">NO CONFLICTS DETECTED</div>
                        <div className="text-[11px] text-gray-500">All {parsedRows.length} rows are new records — safe to upload.</div>
                    </div>
                </div>
            )}
        </div>
    )
}