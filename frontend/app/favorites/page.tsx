'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Dna, Activity, Loader2, Trash2 } from 'lucide-react'

export default function FavoritesPage() {
  const [favGenes, setFavGenes] = useState<string[]>([])
  const [favDiseases, setFavDiseases] = useState<string[]>([])
  const [geneDetails, setGeneDetails] = useState<Record<string, any>>({})
  const [diseaseDetails, setDiseaseDetails] = useState<Record<string, any>>({})
  const [loadingGenes, setLoadingGenes] = useState(false)
  const [loadingDiseases, setLoadingDiseases] = useState(false)

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

  useEffect(() => {
    const genes = JSON.parse(localStorage.getItem('fav_genes') || '[]')
    const diseases = JSON.parse(localStorage.getItem('fav_diseases') || '[]')
    setFavGenes(genes)
    setFavDiseases(diseases)

    if (genes.length > 0) fetchGeneDetails(genes)
    if (diseases.length > 0) fetchDiseaseDetails(diseases)
  }, [])

  const fetchGeneDetails = async (ids: string[]) => {
    setLoadingGenes(true)
    const details: Record<string, any> = {}
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`${apiUrl}/genes/${id}`)
          if (res.ok) details[id] = await res.json()
        } catch {}
      })
    )
    setGeneDetails(details)
    setLoadingGenes(false)
  }

  const fetchDiseaseDetails = async (ids: string[]) => {
    setLoadingDiseases(true)
    const details: Record<string, any> = {}
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`${apiUrl}/diseases/${id}`)
          if (res.ok) details[id] = await res.json()
        } catch {}
      })
    )
    setDiseaseDetails(details)
    setLoadingDiseases(false)
  }

  const removeGene = (id: string) => {
    const updated = favGenes.filter(g => g !== id)
    setFavGenes(updated)
    localStorage.setItem('fav_genes', JSON.stringify(updated))
    const updated_details = { ...geneDetails }
    delete updated_details[id]
    setGeneDetails(updated_details)
  }

  const removeDisease = (id: string) => {
    const updated = favDiseases.filter(d => d !== id)
    setFavDiseases(updated)
    localStorage.setItem('fav_diseases', JSON.stringify(updated))
    const updated_details = { ...diseaseDetails }
    delete updated_details[id]
    setDiseaseDetails(updated_details)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
        <h1 className="text-base font-bold text-white font-mono uppercase tracking-wider">My Saved Lists</h1>
        <p className="text-zinc-500 font-mono text-[11px] mt-1">
          Access your bookmarked clinical genes and diseases.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Bookmarked Genes */}
        <section className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-[#181b24] pb-3">
            <Dna className="w-4 h-4 text-indigo-400" />
            <h2 className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
              Bookmarked Genes ({favGenes.length})
            </h2>
          </div>

          {loadingGenes ? (
            <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-mono">LOADING...</span>
            </div>
          ) : favGenes.length > 0 ? (
            <div className="space-y-2">
              {favGenes.map((id) => {
                const gene = geneDetails[id]
                return (
                  <div
                    key={id}
                    className="bg-[#050507] border border-[#181b24] rounded p-3 flex justify-between items-start hover:border-indigo-500/30 transition-colors group"
                  >
                    <div className="space-y-1">
                      <Link href={`/genes/${id}`}>
                        <span className="text-indigo-400 font-mono font-bold text-xs hover:underline">
                          {gene?.gene_symbol || id}
                        </span>
                      </Link>
                      {gene && (
                        <>
                          <p className="text-zinc-400 text-[10px] font-mono">{gene.gene_name}</p>
                          <div className="flex gap-2 flex-wrap">
                            {gene.chromosome && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono">
                                Chr {gene.chromosome}
                              </span>
                            )}
                            {gene.function && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-zinc-400 font-mono">
                                {gene.function}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => removeGene(id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[#181b24] rounded p-10 text-center">
              <p className="text-zinc-600 font-mono text-[11px]">NO_BOOKMARKED_GENES_YET</p>
              <p className="text-zinc-700 font-mono text-[10px] mt-1">
                Browse genes and click the bookmark icon to save them here.
              </p>
            </div>
          )}
        </section>

        {/* Bookmarked Diseases */}
        <section className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-[#181b24] pb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
              Bookmarked Diseases ({favDiseases.length})
            </h2>
          </div>

          {loadingDiseases ? (
            <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-mono">LOADING...</span>
            </div>
          ) : favDiseases.length > 0 ? (
            <div className="space-y-2">
              {favDiseases.map((id) => {
                const disease = diseaseDetails[id]
                return (
                  <div
                    key={id}
                    className="bg-[#050507] border border-[#181b24] rounded p-3 flex justify-between items-start hover:border-cyan-500/30 transition-colors group"
                  >
                    <div className="space-y-1">
                      <Link href={`/diseases/${id}`}>
                        <span className="text-cyan-400 font-mono font-bold text-xs hover:underline">
                          {disease?.disease_name || id}
                        </span>
                      </Link>
                      {disease && (
                        <>
                          <div className="flex gap-2 flex-wrap">
                            {disease.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                                {disease.category}
                              </span>
                            )}
                            {disease.icd_code && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-zinc-400 font-mono">
                                ICD: {disease.icd_code}
                              </span>
                            )}
                          </div>
                          {disease.description && (
                            <p className="text-zinc-500 text-[10px] font-mono leading-relaxed line-clamp-2">
                              {disease.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => removeDisease(id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[#181b24] rounded p-10 text-center">
              <p className="text-zinc-600 font-mono text-[11px]">NO_BOOKMARKED_DISEASES_YET</p>
              <p className="text-zinc-700 font-mono text-[10px] mt-1">
                Browse diseases and click the bookmark icon to save them here.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}