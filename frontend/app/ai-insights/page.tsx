'use client'

import { useState, useRef } from 'react'
import { Sparkles, Dna, Activity, Search, Copy, Check, RefreshCw, ChevronRight, Cpu, BookOpen, AlertCircle, Zap, GitMerge, FlaskConical, FileText } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightMode = 'gene' | 'disease' | 'variant' | 'association' | 'pathway' | 'drug' | 'publication'

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#07080f',
  card: '#0e1018',
  border: '#1e2130',
  borderHover: '#2a2e42',
  teal: '#00f5d4',
  purple: '#a855f7',
  textPri: '#f0f0f8',
  textSec: '#b8bcd4',
  textMut: '#7a7f99',
  textDim: '#4a4f66',
}

const EXAMPLE_QUERIES: Record<InsightMode, string[]> = {
  gene: [
    'Explain BRCA1 and its role in breast cancer',
    'What diseases are linked to TP53 mutations?',
    'Describe the function of APOE in Alzheimer\'s disease',
    'What is CFTR and why does it cause cystic fibrosis?',
  ],
  disease: [
    'What genes are most associated with Type 2 Diabetes?',
    'Explain the genetic basis of Huntington\'s disease',
    'Which genes are involved in colorectal cancer?',
    'What are the key genetic variants in Parkinson\'s disease?',
  ],
  variant: [
    'What is the clinical significance of BRCA1 c.5266dupC?',
    'Explain the rs334 variant and sickle cell disease',
    'What are pathogenic variants in the CFTR gene?',
    'Describe the EGFR T790M resistance mutation',
  ],
  association: [
    'How does EGFR relate to lung cancer treatment resistance?',
    'Explain the BRCA1/BRCA2 and ovarian cancer association',
    'What is the evidence linking HBB to sickle cell disease?',
    'Describe the HER2 gene amplification in breast cancer',
  ],
  pathway: [
    'Explain the PI3K/AKT/mTOR signaling pathway in cancer',
    'What is the p53 tumor suppressor pathway?',
    'Describe the MAPK/ERK pathway and its role in disease',
    'How does the Wnt signaling pathway relate to colorectal cancer?',
  ],
  drug: [
    'How does Imatinib target BCR-ABL in leukemia?',
    'Explain the mechanism of PARP inhibitors in BRCA-mutated cancers',
    'What is the genomic basis for Herceptin (trastuzumab) targeting?',
    'How do EGFR inhibitors work in lung cancer therapy?',
  ],
  publication: [
    'Summarize key findings in BRCA1/2 breast cancer research',
    'What are landmark GWAS studies for Type 2 Diabetes?',
    'Key publications on TP53 and tumor suppression',
    'Summarize major findings in Alzheimer\'s genetics research',
  ],
}

const SYSTEM_PROMPTS: Record<InsightMode, string> = {
  gene: `You are an expert bioinformatician and geneticist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about genes, provide structured insights covering:
- Gene overview (symbol, full name, chromosomal location if known)
- Primary biological function
- Key associated diseases and clinical significance
- Notable variants or mutations
- Relevant biological pathways
- Research significance

Keep responses scientific but accessible. Use precise genomics terminology. Be concise but comprehensive — aim for 200-300 words. End with 1-2 follow-up research directions.`,

  disease: `You are an expert clinical geneticist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about diseases, provide structured insights covering:
- Disease overview and classification
- Primary causal genes and their roles
- Inheritance patterns (autosomal dominant/recessive, X-linked, etc.)
- Key pathogenic variants
- Molecular pathways involved
- Current research focus and therapeutic targets

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 emerging research directions.`,

  variant: `You are an expert clinical genomics specialist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about genetic variants, provide structured insights covering:
- Variant type and nomenclature (HGVS notation if applicable)
- Affected gene and protein
- Clinical significance (pathogenic/benign/VUS)
- Disease associations
- Population frequency
- Functional impact on protein
- Diagnostic relevance

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 clinical implications.`,

  association: `You are an expert molecular biologist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about specific gene-disease associations, provide structured insights covering:
- Nature and strength of the association (causal, risk factor, modifier)
- Molecular mechanism linking the gene to the disease
- Evidence base (GWAS studies, clinical trials, functional studies)
- Variant types involved (SNPs, CNVs, indels, etc.)
- Clinical implications (diagnostics, therapeutics, prognosis)
- Confidence score context (high/medium/low evidence)

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 clinical or research implications.`,

  pathway: `You are an expert systems biologist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about biological pathways, provide structured insights covering:
- Pathway overview and biological role
- Key genes and proteins involved
- Upstream regulators and downstream effectors
- Disease relevance (which conditions arise from pathway dysregulation)
- Known therapeutic targets within the pathway
- Crosstalk with other pathways

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 research or therapeutic directions.`,

  drug: `You are an expert pharmacogenomics specialist embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about drugs or therapeutics, provide structured insights covering:
- Drug class and mechanism of action
- Genomic/molecular target
- Relevant biomarkers or companion diagnostics
- Diseases treated
- Key resistance mechanisms
- Pharmacogenomic considerations (gene variants affecting drug response)
- Clinical trial evidence

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 future directions in precision medicine.`,

  publication: `You are an expert biomedical literature analyst embedded in DiseaseGeneMap, a disease-gene association research platform. When asked about research publications or topics, provide structured insights covering:
- Key research milestones in the area
- Landmark studies (GWAS, clinical trials, mechanistic studies)
- Major findings and their impact
- Ongoing controversies or open questions
- Leading research groups
- How this body of evidence informs clinical practice

Keep responses scientific but accessible. Be concise but comprehensive — aim for 200-300 words. End with 1-2 gaps in current knowledge.`,
}

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODE_CONFIG: { mode: InsightMode; label: string; icon: any; color: string; colorAlpha: string }[] = [
  { mode: 'gene', label: 'Gene', icon: Dna, color: '#00f5d4', colorAlpha: 'rgba(0,245,212,' },
  { mode: 'disease', label: 'Disease', icon: Activity, color: '#a855f7', colorAlpha: 'rgba(168,85,247,' },
  { mode: 'variant', label: 'Variant', icon: Zap, color: '#f59e0b', colorAlpha: 'rgba(245,158,11,' },
  { mode: 'association', label: 'Assoc', icon: GitMerge, color: '#6366f1', colorAlpha: 'rgba(99,102,241,' },
  { mode: 'pathway', label: 'Pathway', icon: Search, color: '#ec4899', colorAlpha: 'rgba(236,72,153,' },
  { mode: 'drug', label: 'Drug', icon: FlaskConical, color: '#10b981', colorAlpha: 'rgba(16,185,129,' },
  { mode: 'publication', label: 'Publication', icon: FileText, color: '#60a5fa', colorAlpha: 'rgba(96,165,250,' },
]

const modeLabel: Record<InsightMode, string> = {
  gene: 'Gene Insights',
  disease: 'Disease Insights',
  variant: 'Variant Analysis',
  association: 'Association Analysis',
  pathway: 'Pathway Insights',
  drug: 'Drug & Therapeutic Insights',
  publication: 'Publication Summary',
}

const modePlaceholder: Record<InsightMode, string> = {
  gene: 'Ask about a gene (e.g. BRCA1, TP53, APOE)...',
  disease: 'Ask about a disease (e.g. Breast Cancer, Parkinson\'s)...',
  variant: 'Ask about a variant (e.g. BRCA1 c.5266dupC, rs334)...',
  association: 'Ask about a gene-disease association...',
  pathway: 'Ask about a pathway (e.g. PI3K/AKT, MAPK/ERK)...',
  drug: 'Ask about a drug or therapeutic (e.g. Imatinib)...',
  publication: 'Ask about a research topic or publication...',
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ModeTab({ mode, active, onClick, icon: Icon, label, color }: {
  mode: InsightMode; active: boolean; onClick: () => void; icon: any; label: string; color: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '8px',
        fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold',
        cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
        background: active ? `${color}14` : 'transparent',
        borderColor: active ? `${color}50` : C.border,
        color: active ? color : C.textMut,
      }}
    >
      <Icon size={12} />
      {label.toUpperCase()}
    </button>
  )
}

function ExampleChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontFamily: 'monospace', textAlign: 'left',
        background: '#07080f', border: `1px solid ${C.border}`,
        color: C.textMut, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textSec }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMut }}
    >
      <ChevronRight size={9} style={{ color: C.textDim, flexShrink: 0 }} />
      {text}
    </button>
  )
}

function InsightCard({ content, onCopy, copied }: { content: string; onCopy: () => void; copied: boolean }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean)
  return (
    <div style={{ background: '#0a0b12', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(74,222,128,0.1)', background: 'rgba(74,222,128,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={11} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: C.textDim, letterSpacing: '1.5px' }}>AI INSIGHT · BETA</span>
        </div>
        <button
          onClick={onCopy}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontFamily: 'monospace', background: 'transparent', border: `1px solid ${C.border}`, color: copied ? C.teal : C.textDim, transition: 'all 0.15s' }}
        >
          {copied ? <Check size={9} /> : <Copy size={9} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: '12px', lineHeight: '1.85', fontFamily: 'monospace', color: C.textSec, marginBottom: i < paragraphs.length - 1 ? '12px' : 0 }}>
            {para}
          </p>
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: '7px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <BookOpen size={9} style={{ color: C.textDim }} />
        <span style={{ fontSize: '9px', fontFamily: 'monospace', color: C.textDim }}>For research reference only · Verify with primary literature</span>
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '14px 16px' }}>
      <Cpu size={12} style={{ color: '#4ade80' }} />
      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: C.textDim }}>Generating insight</span>
      <div style={{ display: 'flex', gap: '3px', marginLeft: '2px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4ade80', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIInsightsPage() {
  const [mode, setMode] = useState<InsightMode>('gene')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<{ query: string; result: string; mode: InsightMode }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const cardBase: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px' }

  const activeConfig = MODE_CONFIG.find(m => m.mode === mode)!

  const switchMode = (m: InsightMode) => { setMode(m); setResult(''); setError('') }

  const handleQuery = async (q?: string) => {
    const searchQuery = q || query
    if (!searchQuery.trim() || loading) return
    setLoading(true); setError(''); setResult('')
    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ''

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPTS[mode],
              },
              {
                role: 'user',
                content: searchQuery,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error?.message || 'AI request failed'
        )
      }

      const text =
        data?.choices?.[0]?.message?.content || ''
      if (!text) throw new Error(data?.error?.message || 'No response from AI model')
      setResult(text)
      setHistory(prev => [{ query: searchQuery, result: text, mode }, ...prev.slice(0, 9)])
      if (q) setQuery(q)
    } catch (err: any) {
      setError(`Unable to generate insight: ${err?.message || 'Check your API key in .env.local'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const badgeColor = (m: InsightMode) => MODE_CONFIG.find(c => c.mode === m)?.color ?? C.teal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(74,222,128,0.3)' }}>
          <Sparkles size={10} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', color: '#4ade80', letterSpacing: '1.5px' }}>
            AI·POWERED · BETA
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: C.textPri, fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          AI Insights
        </h1>
        <p style={{ fontSize: '12px', color: C.textMut, fontFamily: 'monospace', maxWidth: '480px' }}>
          Deep AI-generated analysis of genes, diseases, variants, pathways, drugs, and publications
        </p>
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {MODE_CONFIG.map(({ mode: m, label, icon, color }) => (
          <ModeTab key={m} mode={m} active={mode === m} onClick={() => switchMode(m)} icon={icon} label={label} color={color} />
        ))}
      </div>

      {/* ── Search input ── */}
      <div style={{ ...cardBase, padding: '14px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'monospace', color: C.textDim, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
          // {modeLabel[mode].toUpperCase()} QUERY
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textDim, pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder={modePlaceholder[mode]}
              style={{ width: '100%', padding: '9px 12px 9px 30px', background: '#07080f', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.textSec, fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = `${activeConfig.color}50` }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', background: loading || !query.trim() ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.12)', border: '1px solid', borderColor: loading || !query.trim() ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.3)', color: loading || !query.trim() ? C.textDim : '#4ade80', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          >
            {loading
              ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> ANALYZING</>
              : <><Sparkles size={12} /> GENERATE</>
            }
          </button>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

        {/* Example queries */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'monospace', color: C.textDim, letterSpacing: '1px', marginBottom: '6px' }}>EXAMPLES:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EXAMPLE_QUERIES[mode].map((ex, i) => (
              <ExampleChip key={i} text={ex} onClick={() => { setQuery(ex); handleQuery(ex) }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Result area ── */}
      {(loading || result || error) && (
        <div>
          {loading && <div style={{ ...cardBase }}><LoadingDots /></div>}

          {error && !loading && (
            <div style={{ ...cardBase, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
              <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {result && !loading && <InsightCard content={result} onCopy={handleCopy} copied={copied} />}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !result && !error && (
        <div style={{ ...cardBase, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', marginBottom: '12px', background: 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(74,222,128,0.2)' }}>
            <Sparkles size={20} style={{ color: '#4ade80' }} />
          </div>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: C.textMut, marginBottom: '4px' }}>Select a mode and enter your query</p>
          <p style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textDim }}>AI-powered insights across genes, diseases, variants, pathways, drugs, and publications</p>
        </div>
      )}

      {/* ── Recent history ── */}
      {history.length > 0 && (
        <div style={{ ...cardBase, overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, fontSize: '9px', fontFamily: 'monospace', color: C.textDim, letterSpacing: '1.5px' }}>
            // RECENT QUERIES ({history.length})
          </div>
          <div style={{ padding: '8px' }}>
            {history.map((h, i) => {
              const color = badgeColor(h.mode)
              return (
                <button
                  key={i}
                  onClick={() => { setMode(h.mode); setQuery(h.query); setResult(h.result); setError('') }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 8px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#07080f' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textMut, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.query}
                  </span>
                  <span style={{ fontSize: '8px', fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', flexShrink: 0, background: `${color}14`, color, border: `1px solid ${color}33` }}>
                    {h.mode.toUpperCase()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}