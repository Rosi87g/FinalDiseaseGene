// This file defines the About page for the DiseaseGeneMap application. It provides an overview of the system's mission, capabilities, and technical infrastructure in a visually appealing format using Tailwind CSS for styling and Lucide icons for visual elements.
'use client'

import { ShieldCheck, Database, Zap, Globe, Cpu } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-1 px-6 space-y-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d0e12] to-[#151921] border border-white/5 rounded p-4">
        <h1 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Disease<span className="text-[#00f5d4]">GeneMap</span>
        </h1>
        <p className="text-[9px] text-zinc-500 font-mono mt-1">// System Overview / Bio-Informatics Infrastructure</p>
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-b from-[#0d0e12] to-[#050507] border border-white/5 rounded p-4">
        <h2 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">// Core Mission</h2>
        <p className="text-[10px] leading-relaxed text-zinc-400 font-mono">
          DiseaseGeneMap aggregates fragmented biological datasets—including NCBI, Ensembl, and ClinVar—into a singular, high-performance topology. We enable researchers to traverse complex gene-disease associations with precision and speed, moving from hypothesis to verified data in a unified environment.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { title: "Disease-Gene Mapping", icon: <Globe />, desc: "Interactome association tracking." },
          { title: "Variant Analysis", icon: <ShieldCheck />, desc: "Pathogenic vs. benign interpretation." },
          { title: "Pathway Analytics", icon: <Database />, desc: "Molecular network inspection." },
          { title: "Precision Framework", icon: <Zap />, desc: "Engineered for personalized medicine." },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 p-3 border border-white/5 rounded bg-[#0d0e12]">
            <div className="text-[#00f5d4] mt-0.5">{item.icon}</div>
            <div>
              <h3 className="text-[10px] font-bold text-white font-mono uppercase">{item.title}</h3>
              <p className="text-[9px] text-zinc-500 font-mono">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture */}
      <div className="bg-gradient-to-b from-[#0d0e12] to-[#050507] border border-white/5 rounded p-4">
        <h3 className="text-[9px] font-bold text-white flex items-center gap-2 mb-2 uppercase font-mono">
          <Cpu className="text-[#6366f1] w-3 h-3" /> Technical Infrastructure
        </h3>
        <p className="text-[10px] leading-relaxed text-zinc-500 font-mono">
          Our platform utilizes a hybrid database architecture. PostgreSQL manages structured clinical metadata, while Neo4j facilitates high-speed graph traversals for 10,000+ biological associations, ensuring sub-millisecond query performance. The integrated machine learning module performs predictive inference, identifying latent gene-disease relationships.
        </p>
      </div>

      {/* Footer Status */}
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="text-[8px] text-zinc-600 font-mono uppercase">
          Last Updated: June 2026 | System Status: Active
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 border border-[#00f5d4]/20 bg-[#00f5d4]/5 rounded text-[8px] font-mono text-[#00f5d4]">SECURE_SSL</span>
          <span className="px-2 py-0.5 border border-[#6366f1]/20 bg-[#6366f1]/5 rounded text-[8px] font-mono text-[#6366f1]">V1.0.0</span>
        </div>
      </div>
    </div>
  )
}

