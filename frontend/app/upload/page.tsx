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

    // ─── Styles ───────────────────────────────────────────────────────────────

    const card: React.CSSProperties = {
        background: '#111827', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '20px', marginBottom: '12px', fontFamily: 'monospace',
    }
    const labelStyle: React.CSSProperties = {
        fontSize: '9px', color: '#4b5563', letterSpacing: '1.5px',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase',
    }
    const inputStyle: React.CSSProperties = {
        width: '100%', background: '#0d1117', border: '1px solid #1f2937',
        color: '#d1d5db', fontSize: '12px', padding: '10px 14px',
        borderRadius: '6px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
    }
    const th: React.CSSProperties = {
        fontSize: '9px', color: '#4b5563', letterSpacing: '1.5px',
        textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #1f2937', fontWeight: 500,
    }
    const td: React.CSSProperties = {
        fontSize: '11px', color: '#9ca3af', padding: '7px 10px',
        borderBottom: '1px solid #111827', fontFamily: 'monospace', verticalAlign: 'top',
    }

    // ─── Parse CSV to rows ────────────────────────────────────────────────────

    const parseCSV = (text: string): Record<string, string>[] => {
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) return []
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: Record<string, string> = {}
            headers.forEach((h, i) => { row[h] = vals[i] || '' })
            return row
        })
    }

    // ─── File change → parse + conflict check ────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null
        setFile(f)
        setError('')
        setSuccess(false)
        setConflicts([])
        setConflictChecked(false)
        setParsedRows([])

        if (!f) return

        // Validate extension
        if (!f.name.endsWith('.csv')) {
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

        // Validate headers
        const firstLine = text.split('\n')[0]
        const headers = firstLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
        const required = UPLOAD_SCHEMAS[datasetType].columns
        const missing = required.filter(r => !headers.includes(r))
        if (missing.length > 0) {
            setError(`Missing required columns: ${missing.join(', ')}`)
            return
        }

        const rows = parseCSV(text)
        setParsedRows(rows)

        // Run conflict check against backend
        setConflictLoading(true)
        try {
            const token = getToken()
            const res = await fetch('http://localhost:8000/api/v1/uploads/check-conflicts', {
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
            // Send conflict IDs so backend knows which rows need resolution
            const conflictIds = conflicts.map(c => c.id_value).join(',')
            form.append('conflict_ids', conflictIds)

            const res = await fetch('http://localhost:8000/api/v1/uploads/', {
                method: 'POST',
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: form,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.detail || 'Upload failed')
            }

            setSuccess(true)
            setDatasetName('')
            setFile(null)
            setDatasetType('genes')
            setConflicts([])
            setConflictChecked(false)
            setParsedRows([])

            setTimeout(() => router.push('/my-uploads'), 1500)

        } catch (err: any) {
            setError(err.message || 'Upload failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // ─── Diff cell renderer ───────────────────────────────────────────────────

    const renderDiffCell = (uploadedVal: string, existingVal: string) => {
        const differs = uploadedVal?.trim() !== existingVal?.trim()
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ color: differs ? '#fbbf24' : '#9ca3af', fontSize: '11px' }}>
                    {uploadedVal || '—'}
                    {differs && <span style={{ fontSize: '9px', color: '#fbbf24', marginLeft: '4px' }}>↑ NEW</span>}
                </div>
                {differs && (
                    <div style={{ color: '#4b5563', fontSize: '10px', textDecoration: 'line-through' }}>
                        {existingVal || '—'}
                    </div>
                )}
            </div>
        )
    }

    const columns = UPLOAD_SCHEMAS[datasetType].columns
    const hasConflicts = conflicts.length > 0
    const cleanRows = parsedRows.length - conflicts.length

    return (
        <div style={{ background: '#060810', padding: '20px', borderRadius: '8px', minHeight: '600px', fontFamily: 'monospace' }}>

            {/* Header */}
            <div style={card}>
                <div style={{ background: 'linear-gradient(90deg, #06b6d4, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '13px', fontWeight: 500, letterSpacing: '2px', marginBottom: '4px' }}>
                    UPLOAD DATASET
                </div>
                <div style={{ color: '#4b5563', fontSize: '11px', letterSpacing: '1px' }}>
                    Upload a CSV file to add your own dataset. Must match the required column format.
                </div>
            </div>

            {/* Form */}
            <div style={card}>

                {/* Dataset Name */}
                <div style={{ marginBottom: '18px' }}>
                    <label style={labelStyle}>Dataset Name</label>
                    <input
                        style={inputStyle}
                        placeholder="e.g. My Custom Gene Set"
                        value={datasetName}
                        onChange={e => { setDatasetName(e.target.value); setError('') }}
                        onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(6,182,212,0.5)' }}
                        onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#1f2937' }}
                    />
                </div>

                {/* Category */}
                <div style={{ marginBottom: '18px' }}>
                    <label style={labelStyle}>Category</label>
                    <select
                        value={datasetType}
                        onChange={e => {
                            setDatasetType(e.target.value)
                            setError('')
                            setFile(null)
                            setConflicts([])
                            setConflictChecked(false)
                            setParsedRows([])
                        }}
                        style={{ ...inputStyle, background: '#1f2937', border: '1px solid #374151', color: '#9ca3af' }}
                    >
                        {Object.keys(UPLOAD_SCHEMAS).map(k => (
                            <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Required columns hint */}
                <div style={{ marginBottom: '18px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '1.5px', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Required CSV Columns
                    </div>
                    <div style={{ fontSize: '11px', color: '#06b6d4', lineHeight: '1.8', letterSpacing: '0.5px' }}>
                        {UPLOAD_SCHEMAS[datasetType].columns.map((col, i) => (
                            <span key={col}>
                                <span style={{ color: '#34d399' }}>{col}</span>
                                {i < UPLOAD_SCHEMAS[datasetType].columns.length - 1 && <span style={{ color: '#374151' }}>,  </span>}
                            </span>
                        ))}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#97a1b1' }}>
                        ↑ Your CSV header row must contain exactly these column names.
                    </div>
                </div>

                {/* File picker */}
                <div style={{ marginBottom: '18px' }}>
                    <label style={labelStyle}>CSV File</label>
                    <div
                        style={{ border: '2px dashed #1f2937', borderRadius: '8px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: '#0d1117' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.4)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = file ? 'rgba(52,211,153,0.4)' : '#1f2937' }}
                        onClick={() => document.getElementById('csv-input')?.click()}
                    >
                        {conflictLoading ? (
                            <div>
                                <div style={{ fontSize: '12px', color: '#06b6d4', marginBottom: '4px' }}>CHECKING CONFLICTS...</div>
                                <div style={{ fontSize: '10px', color: '#4b5563' }}>Comparing against existing database records</div>
                            </div>
                        ) : file ? (
                            <div>
                                <FileText style={{ width: '24px', height: '24px', color: '#34d399', margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '12px', color: '#34d399' }}>{file.name}</div>
                                <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '4px' }}>
                                    {(file.size / 1024).toFixed(1)} KB · {parsedRows.length} rows — Click to change
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Upload style={{ width: '24px', height: '24px', color: '#374151', margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '12px', color: '#4b5563' }}>Click to select CSV file</div>
                                <div style={{ fontSize: '10px', color: '#374151', marginTop: '4px' }}>Only .csv files supported</div>
                            </div>
                        )}
                    </div>
                    <input
                        id="csv-input"
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                {/* Conflict-free summary */}
                {conflictChecked && !conflictLoading && file && !error && (
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle style={{ width: '13px', height: '13px', color: '#34d399', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#34d399' }}>
                                <strong>{cleanRows}</strong> clean rows — ready to import
                            </span>
                        </div>
                        {hasConflicts && (
                            <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle style={{ width: '13px', height: '13px', color: '#fbbf24', flexShrink: 0 }} />
                                <span style={{ fontSize: '11px', color: '#fbbf24' }}>
                                    <strong>{conflicts.length}</strong> conflicts detected — review below
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertCircle style={{ width: '14px', height: '14px', color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '11px', color: '#f87171' }}>{error}</span>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle style={{ width: '14px', height: '14px', color: '#34d399' }} />
                        <span style={{ fontSize: '11px', color: '#34d399' }}>Upload successful! Redirecting to My Uploads...</span>
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || success || !!error || conflictLoading}
                    style={{
                        width: '100%', padding: '12px',
                        background: success ? 'rgba(52,211,153,0.1)' : loading ? '#1f2937' : '#06b6d4',
                        color: success ? '#34d399' : loading ? '#4b5563' : '#000',
                        fontSize: '11px', fontWeight: 700,
                        border: success ? '1px solid rgba(52,211,153,0.3)' : 'none',
                        borderRadius: '6px',
                        cursor: (loading || success || !!error || conflictLoading) ? 'not-allowed' : 'pointer',
                        letterSpacing: '2px', fontFamily: 'monospace', transition: 'background 0.2s',
                        opacity: (!!error || conflictLoading) ? 0.5 : 1,
                    }}
                >
                    {success ? '✓ UPLOAD_COMPLETE' : loading ? 'UPLOADING...' : 'EXECUTE_UPLOAD'}
                </button>
            </div>

            {/* ─── Conflict Panel ─────────────────────────────────────────────────── */}
            {hasConflicts && !conflictLoading && (
                <div style={{ background: '#111827', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '20px', marginBottom: '12px', fontFamily: 'monospace' }}>

                    {/* Panel header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
                            <span style={{ color: '#fbbf24', fontSize: '10px', letterSpacing: '2px' }}>
                                CONFLICT REVIEW — {conflicts.length} record{conflicts.length !== 1 ? 's' : ''} already exist in database
                            </span>
                        </div>

                        {/* Resolution selector */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {(['skip', 'overwrite', 'merge'] as ResolutionMode[]).map(mode => {
                                const active = resolution === mode
                                const colors: Record<ResolutionMode, string> = {
                                    skip:      '#4b5563',
                                    overwrite: '#f87171',
                                    merge:     '#34d399',
                                }
                                const activeBg: Record<ResolutionMode, string> = {
                                    skip:      'rgba(75,85,99,0.2)',
                                    overwrite: 'rgba(248,113,113,0.1)',
                                    merge:     'rgba(52,211,153,0.1)',
                                }
                                return (
                                    <button
                                        key={mode}
                                        onClick={() => setResolution(mode)}
                                        style={{
                                            fontSize: '9px', padding: '5px 12px', borderRadius: '4px',
                                            border: `1px solid ${active ? colors[mode] : '#1f2937'}`,
                                            color: active ? colors[mode] : '#4b5563',
                                            background: active ? activeBg[mode] : 'transparent',
                                            cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '1px',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {mode.toUpperCase()}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Resolution explanation */}
                    <div style={{ marginBottom: '14px', padding: '8px 12px', background: '#0d1117', borderRadius: '4px', fontSize: '10px', color: '#6b7280', letterSpacing: '0.5px' }}>
                        {resolution === 'skip'      && '⊘  SKIP — conflicting rows will NOT be imported. Existing database records stay unchanged.'}
                        {resolution === 'overwrite' && '↺  OVERWRITE — uploaded values will REPLACE the existing database records entirely.'}
                        {resolution === 'merge'     && '⊕  MERGE — only empty fields in the database will be filled from the uploaded data.'}
                    </div>

                    {/* Diff table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...th, color: '#fbbf24' }}>CONFLICT</th>
                                    {columns.map(col => (
                                        <th key={col} style={th}>{col.toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.map((conflict, i) => (
                                    <tr key={i}>
                                        {/* Status badge */}
                                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', letterSpacing: '1px' }}>
                                                    ⚠ EXISTS
                                                </span>
                                                <span style={{ fontSize: '9px', color: '#4b5563' }}>{conflict.id_value}</span>
                                            </div>
                                        </td>

                                        {/* Per-column diff */}
                                        {columns.map(col => (
                                            <td key={col} style={td}>
                                                {renderDiffCell(
                                                    conflict.uploaded[col] || '',
                                                    conflict.existing[col] || ''
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#fbbf24' }}>value ↑ NEW</span>
                            <span style={{ fontSize: '10px', color: '#4b5563' }}>= uploaded (differs)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#4b5563', textDecoration: 'line-through' }}>value</span>
                            <span style={{ fontSize: '10px', color: '#4b5563' }}>= existing (will be replaced on overwrite)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>value</span>
                            <span style={{ fontSize: '10px', color: '#4b5563' }}>= same in both</span>
                        </div>
                    </div>
                </div>
            )}

            {/* No conflicts confirmed */}
            {conflictChecked && !hasConflicts && !conflictLoading && file && !error && (
                <div style={{ background: '#111827', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: '10px', color: '#34d399', letterSpacing: '1.5px', marginBottom: '2px' }}>NO CONFLICTS DETECTED</div>
                        <div style={{ fontSize: '11px', color: '#4b5563' }}>All {parsedRows.length} rows are new records — safe to upload.</div>
                    </div>
                </div>
            )}
        </div>
    )
}