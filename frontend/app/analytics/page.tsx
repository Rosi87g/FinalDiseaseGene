// Analytics page — DiseaseGeneMap
'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import dynamic from 'next/dynamic'
import { Info, HelpCircle, X, RotateCcw } from 'lucide-react'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: string
  group?: string
  chromosome?: string
  gene_name?: string
  function?: string
  category?: string
  x?: number
  y?: number
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode
  target: string | NetworkNode
  score: number
  evidence: string
}

const C = {
  bg: '#07080f',
  card: '#0e1018',
  elevated: '#13151f',
  border: '#1e2130',
  borderBt: '#2a2e42',
  teal: '#00f5d4',
  purple: '#a855f7',
  indigo: '#6366f1',
  pink: '#ec4899',
  textPri: '#f0f0f8',
  textSec: '#b8bcd4',
  textMut: '#7a7f99',
  textDim: '#4a4f66',
}

export default function AnalyticsPage() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const linksRef = useRef<{ source: string; target: string; score: number; evidence: string }[]>([])
  const [networkData, setNetworkData] = useState<{ nodes: NetworkNode[]; links: NetworkLink[] } | null>(null)
  const [stats, setStats] = useState<any>({
    genes: 0, associations: 0,
    chromosome_data: { labels: [], values: [] },
    pathogenicity_data: { labels: [], values: [] }
  })
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const chartData = (() => {
    if (!networkData || linksRef.current.length === 0) return null
    let relevantLinks = linksRef.current
    if (selectedNode) {
      relevantLinks = linksRef.current.filter(l =>
        l.source === selectedNode.id || l.target === selectedNode.id ||
        l.source === selectedNode.label || l.target === selectedNode.label
      )
    } else if (searchTerm) {
      const matchingIds = new Set(networkData.nodes.filter(n => n.label.toLowerCase().includes(searchTerm)).map(n => n.id))
      relevantLinks = linksRef.current.filter(l => matchingIds.has(l.source) || matchingIds.has(l.target))
    }
    const relevantNodeIds = new Set<string>()
    relevantLinks.forEach(l => { relevantNodeIds.add(l.source); relevantNodeIds.add(l.target) })
    const relevantNodes = networkData.nodes.filter(n => relevantNodeIds.has(n.id))
    const chrMap: Record<string, number> = {}
    relevantNodes.forEach(n => {
      if (n.type === 'gene' && n.chromosome) { const k = `Chr ${n.chromosome}`; chrMap[k] = (chrMap[k] || 0) + 1 }
    })
    const evMap: Record<string, number> = {}
    relevantLinks.forEach(l => { const ev = l.evidence || 'Unknown'; evMap[ev] = (evMap[ev] || 0) + 1 })
    return {
      chromosome_data: { labels: Object.keys(chrMap), values: Object.values(chrMap) },
      pathogenicity_data: { labels: Object.keys(evMap), values: Object.values(evMap) },
    }
  })()

  const activeChartData = (() => {
    if (!selectedNode && !searchTerm) return { chromosome_data: stats.chromosome_data, pathogenicity_data: stats.pathogenicity_data }
    if (chartData) {
      return {
        chromosome_data: chartData.chromosome_data.labels.length > 0 ? chartData.chromosome_data : stats.chromosome_data,
        pathogenicity_data: chartData.pathogenicity_data.labels.length > 0 ? chartData.pathogenicity_data : stats.pathogenicity_data,
      }
    }
    return { chromosome_data: stats.chromosome_data, pathogenicity_data: stats.pathogenicity_data }
  })()

  useEffect(() => {
    const fetchData = async () => {
      const api = '/api/v1'
      try {
        const [sRes, nRes] = await Promise.all([
          fetch(`${api}/stats`),
          fetch(`${api}/associations/network?min_confidence=0.5&limit=120`)
        ])
        const sVal = await sRes.json()
        const nVal = await nRes.json()
        setStats(sVal)
        linksRef.current = nVal.links.map((l: any) => ({
          source: l.source, target: l.target, score: l.score, evidence: l.evidence
        }))
        setNetworkData(nVal)
      } catch (err) { console.error(err) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!networkData || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const width = svgRef.current.clientWidth || 800
    const height = 460
    const nodes: NetworkNode[] = networkData.nodes.map(d => ({ ...d }))
    const links: NetworkLink[] = networkData.links.map(d => ({ ...d }))
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
    const g = svg.append('g')
    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => d.score * 3.5)
      .attr('stroke', d => d.evidence === 'High' ? C.indigo : d.evidence === 'Medium' ? C.teal : C.pink)
    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .call(drag(simulation) as any)
      .on('click', (_, d) => { setSelectedNode(prev => prev?.id === d.id ? null : d); setSearchTerm(''); setSearchInput('') })
    node.append('circle')
      .attr('r', d => d.type === 'gene' ? 7 : 11)
      .attr('fill', d => d.type === 'gene' ? C.indigo : C.teal)
      .attr('stroke', C.bg).attr('stroke-width', 2)
    node.append('text')
      .text(d => d.label)
      .attr('x', d => d.type === 'gene' ? 11 : 15).attr('y', 4)
      .style('font-size', '10px').style('font-family', 'JetBrains Mono, monospace')
      .style('fill', C.textSec).style('pointer-events', 'none')
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x!)
        .attr('y1', d => (d.source as NetworkNode).y!)
        .attr('x2', d => (d.target as NetworkNode).x!)
        .attr('y2', d => (d.target as NetworkNode).y!)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 3]).on('zoom', e => g.attr('transform', e.transform)) as any)
    function drag(sim: d3.Simulation<NetworkNode, undefined>) {
      return d3.drag<SVGGElement, NetworkNode>()
        .on('start', (e) => { if (!e.active) sim.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y })
        .on('drag', (e) => { e.subject.fx = e.x; e.subject.fy = e.y })
        .on('end', (e) => { if (!e.active) sim.alphaTarget(0); e.subject.fx = null; e.subject.fy = null })
    }
  }, [networkData])

  useEffect(() => {
    if (!svgRef.current || !networkData) return
    d3.select(svgRef.current).selectAll<SVGGElement, NetworkNode>('g g g').each(function (d) {
      if (!d?.id) return
      const isMatch = selectedNode ? d.id === selectedNode.id : searchTerm ? d.label?.toLowerCase().includes(searchTerm) : false
      const isActive = !!(selectedNode || searchTerm)
      d3.select(this).select('circle')
        .attr('stroke', isMatch ? C.teal : C.bg)
        .attr('stroke-width', isMatch ? 3.5 : 2)
        .attr('opacity', isActive ? (isMatch ? 1 : 0.25) : 1)
      if (selectedNode && d.id === selectedNode.id) d3.select(this).raise()
    })
  }, [searchTerm, selectedNode, networkData])

  const isFiltered = !!selectedNode || !!searchTerm
  const chartSubtitle = selectedNode
    ? `Connections for: ${selectedNode.label}`
    : searchTerm ? `Search: "${searchTerm}"` : 'Global distribution from datasets'

  const chrKey = (selectedNode?.id || searchTerm || 'g') + '-c-' + (activeChartData?.chromosome_data?.labels?.join(',') || '')
  const evKey = (selectedNode?.id || searchTerm || 'g') + '-e-' + (activeChartData?.pathogenicity_data?.labels?.join(',') || '')

  const plotLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: C.textSec, family: 'JetBrains Mono, Inter, sans-serif', size: 11 },
    xaxis: { gridcolor: C.border, color: C.textMut },
    yaxis: { gridcolor: C.border, color: C.textMut },
    margin: { t: 16, b: 44, l: 36, r: 10 },
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <div className="text-[9px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: C.textDim }}>
          // GRAPH_ANALYTICS_UTILITIES
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight" style={{ color: C.textPri }}>
          Visual{' '}
          <span style={{
            background: `linear-gradient(135deg, ${C.teal} 0%, ${C.purple} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>Analytics</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textMut }}>
          Interactive biological networks and data distribution metrics.
        </p>
      </div>

      {/* ── Network graph ── */}
      <section className="rounded-xl border p-5 space-y-4" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-mono" style={{ color: C.textPri }}>
              GENE-DISEASE ASSOCIATION NETWORK
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: C.textMut }}>
              Drag nodes · Scroll to zoom · Click to filter charts
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold"
            style={{ background: `rgba(99,102,241,0.1)`, border: `1px solid rgba(99,102,241,0.25)`, color: C.indigo }}>
            <Info className="w-3 h-3" />
            High-confidence connections only
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* SVG canvas */}
          <div className="lg:col-span-3 rounded-xl overflow-hidden relative"
            style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <svg ref={svgRef} className="w-full cursor-grab active:cursor-grabbing" style={{ height: 460 }} />
            <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[9px] font-mono"
              style={{ color: C.textMut }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: C.indigo }}></span>Gene</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: C.teal }}></span>Disease</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: C.indigo }}></span>High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: C.teal }}></span>Med</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: C.pink }}></span>Low</span>
            </div>
          </div>

          {/* Side panel */}
          <div className="rounded-xl p-4 flex flex-col gap-4" style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
            <input
              type="text"
              value={searchInput}
              placeholder="Search nodes..."
              className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textPri }}
              onFocus={e => (e.target.style.borderColor = C.teal)}
              onBlur={e => (e.target.style.borderColor = C.border)}
              onChange={(e) => {
                const val = e.target.value
                setSearchInput(val)
                setSearchTerm(val.toLowerCase())
                if (networkData && val.length > 0) {
                  const matches = networkData.nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase()))
                  if (matches.length === 1) { setSelectedNode(matches[0]); setSearchTerm(''); setSearchInput('') }
                }
              }}
            />

            <div className="flex-1">
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest pb-2 mb-3"
                style={{ color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                Node Details
              </div>

              {selectedNode ? (
                <div className="space-y-3">
                  {[
                    { label: 'Type', value: selectedNode.type, mono: false },
                    { label: 'ID', value: selectedNode.id, mono: true, accent: C.indigo },
                    { label: 'Name', value: selectedNode.label, mono: false, bold: true },
                    selectedNode.chromosome && { label: 'Chromosome', value: selectedNode.chromosome, mono: true },
                    selectedNode.gene_name && { label: 'Gene Name', value: selectedNode.gene_name, mono: false },
                    selectedNode.function && { label: 'Function', value: selectedNode.function, mono: false },
                    selectedNode.category && { label: 'Category', value: selectedNode.category, mono: false },
                  ].filter(Boolean).map((f: any, i) => (
                    <div key={i}>
                      <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>{f.label}</div>
                      <div className={`text-xs ${f.mono ? 'font-mono' : ''} ${f.bold ? 'font-bold' : ''}`}
                        style={{ color: f.accent || C.textSec }}>{f.value}</div>
                    </div>
                  ))}
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>Connections</div>
                    <div className="text-xs font-mono font-bold" style={{ color: C.teal }}>
                      {linksRef.current.filter(l =>
                        l.source === selectedNode.id || l.target === selectedNode.id ||
                        l.source === selectedNode.label || l.target === selectedNode.label
                      ).length} links
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)}
                    className="flex items-center gap-1 text-[10px] font-mono transition-colors mt-1"
                    style={{ color: C.textDim }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.textSec)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}>
                    <X className="w-3 h-3" /> Clear selection
                  </button>
                </div>
              ) : searchTerm && networkData ? (
                (() => {
                  const matches = networkData.nodes.filter(n => n.label.toLowerCase().includes(searchTerm))
                  return matches.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: C.textDim }}>
                        {matches.length} match{matches.length > 1 ? 'es' : ''}
                      </p>
                      {matches.slice(0, 8).map(n => (
                        <button key={n.id}
                          onClick={() => { setSelectedNode(n); setSearchTerm(''); setSearchInput('') }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors"
                          style={{ background: C.bg, border: `1px solid ${C.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderBt)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                          <span className="text-[9px] font-mono font-bold mr-2"
                            style={{ color: n.type === 'gene' ? C.indigo : C.teal }}>
                            {n.type.toUpperCase()}
                          </span>
                          <span style={{ color: C.textSec }}>{n.label}</span>
                        </button>
                      ))}
                      {matches.length > 8 && (
                        <p className="text-[9px] font-mono pt-1" style={{ color: C.textDim }}>+{matches.length - 8} more</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs" style={{ color: C.textDim }}>
                      No nodes match "{searchTerm}"
                    </div>
                  )
                })()
              ) : (
                <div className="flex flex-col items-center gap-2 py-10" style={{ color: C.textDim }}>
                  <HelpCircle className="w-7 h-7" />
                  <span className="text-[10px] font-mono text-center">Click any node<br />to filter charts</span>
                </div>
              )}
            </div>

            <div className="text-[9px] font-mono leading-relaxed pt-3" style={{ color: C.textDim, borderTop: `1px solid ${C.border}` }}>
              Line thickness = confidence score
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter status bar ── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-3 py-1 rounded-full"
          style={{
            color: isFiltered ? '#fbbf24' : C.textMut,
            background: isFiltered ? 'rgba(251,191,36,0.08)' : C.card,
            border: `1px solid ${isFiltered ? 'rgba(251,191,36,0.2)' : C.border}`,
          }}>
          {chartSubtitle}
        </span>
        {isFiltered && (
          <button
            onClick={() => { setSelectedNode(null); setSearchTerm(''); setSearchInput('') }}
            className="flex items-center gap-1 text-[10px] font-mono transition-colors"
            style={{ color: C.textMut }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textSec)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMut)}>
            <RotateCcw className="w-3 h-3" /> Reset to global view
          </button>
        )}
      </div>

      {/* ── Charts ── */}
      {/* ── Charts ── */}
      <section className="grid md:grid-cols-2 gap-4">

        {/* Chromosome distribution — BAR chart */}
        <div className="rounded-xl border p-5 space-y-3" style={{ background: C.card, borderColor: C.border }}>
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest mb-1" style={{ color: C.textDim }}>
              // CHROMOSOME DENSITY
            </div>
            <h3 className="text-sm font-bold font-mono" style={{ color: C.textPri }}>
              Chromosome Distribution
            </h3>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            {activeChartData?.chromosome_data?.labels?.length > 0 ? (
              <Plot
                key={chrKey}
                data={[{
                  x: activeChartData.chromosome_data.labels,
                  y: activeChartData.chromosome_data.values,
                  type: 'bar',
                  marker: {
                    color: activeChartData.chromosome_data.values,
                    colorscale: [
                      [0, C.textDim],
                      [0.5, C.indigo],
                      [1, C.teal],
                    ],
                    showscale: false,
                  },
                  text: activeChartData.chromosome_data.values.map(String),
                  textposition: 'outside' as const,
                  textfont: { color: C.textSec, family: 'JetBrains Mono', size: 9 },
                }]}
                layout={{
                  ...plotLayout,
                  width: undefined, height: 280, autosize: true,
                  margin: { t: 28, b: 60, l: 40, r: 10 },
                  xaxis: {
                    ...plotLayout.xaxis,
                    tickangle: -45,
                    tickfont: { size: 9, family: 'JetBrains Mono', color: C.textMut },
                  },
                  yaxis: {
                    ...plotLayout.yaxis,
                    title: { text: 'Gene count', font: { color: C.textMut, size: 10 } },
                  },
                  bargap: 0.3,
                } as any}
                style={{ width: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
                revision={activeChartData.chromosome_data.values.length}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-xs font-mono" style={{ color: C.textDim }}>
                Loading data...
              </div>
            )}
          </div>
        </div>

        {/* Evidence type — DONUT chart */}
        <div className="rounded-xl border p-5 space-y-3" style={{ background: C.card, borderColor: C.border }}>
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest mb-1" style={{ color: C.textDim }}>
              // VARIANT SIGNIFICANCE
            </div>
            <h3 className="text-sm font-bold font-mono" style={{ color: C.textPri }}>
              Clinical Significance Metrics
            </h3>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            {activeChartData?.pathogenicity_data?.labels?.length > 0 ? (
              <Plot
                key={evKey}
                data={[{
                  values: activeChartData.pathogenicity_data.values,
                  labels: activeChartData.pathogenicity_data.labels,
                  type: 'pie',
                  hole: 0.45,
                  marker: { colors: [C.indigo, C.teal, '#f59e0b', C.pink, C.textDim] },
                  textfont: { color: C.textSec, family: 'JetBrains Mono' },
                }]}
                layout={{
                  ...plotLayout,
                  width: undefined, height: 280, autosize: true,
                  margin: { t: 16, b: 32, l: 10, r: 10 },
                  showlegend: true,
                  legend: { orientation: 'h', y: -0.12, font: { color: C.textMut, size: 10 } },
                } as any}
                style={{ width: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
                revision={activeChartData.pathogenicity_data.values.length}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-xs font-mono" style={{ color: C.textDim }}>
                Loading data...
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  )
}