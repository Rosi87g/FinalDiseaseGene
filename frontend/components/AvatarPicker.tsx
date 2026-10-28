'use client'

import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'

export interface AvatarStyle {
  id: string
  name: string
  collection: string
}

export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'identicon', name: 'Identicon', collection: 'identicon' },
  { id: 'bottts', name: 'Cyber Bot', collection: 'bottts' },
  { id: 'shapes', name: 'Shapes', collection: 'shapes' },
  { id: 'adventurer', name: 'Explorer', collection: 'adventurer' },
  { id: 'micah', name: 'Minimal', collection: 'micah' },
  { id: 'thumbs', name: 'Biotech', collection: 'thumbs' },
]

export function buildDicebearUrl(collection: string, seed: string): string {
  return `https://api.dicebear.com/7.x/${collection}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0e1018`
}

interface AvatarPickerProps {
  currentUrl?: string
  seed: string
  onChange: (url: string) => void
}

export default function AvatarPicker({ currentUrl, seed, onChange }: AvatarPickerProps) {
  const [customSeed, setCustomSeed] = useState(seed || 'Operator')

  const handleShuffle = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const newSeed = `${seed || 'Operator'}_${randomSuffix}`
    setCustomSeed(newSeed)
    // Extract current collection or default to identicon
    let currentCollection = 'identicon'
    if (currentUrl) {
      const match = currentUrl.match(/dicebear\.com\/7\.x\/([a-z0-9-]+)\//i)
      if (match && match[1]) currentCollection = match[1]
    }
    onChange(buildDicebearUrl(currentCollection, newSeed))
  }

  const handleSelectStyle = (collection: string) => {
    const url = buildDicebearUrl(collection, customSeed)
    onChange(url)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-zinc-400 uppercase text-[9px] font-semibold tracking-wider font-mono">
          Choose Profile Picture Style
        </label>
        <button
          type="button"
          onClick={handleShuffle}
          className="flex items-center gap-1 text-[10px] text-[#00f5d4] hover:text-[#00d7ba] font-mono transition-colors"
          title="Generate a new randomized avatar pattern"
        >
          <Sparkles className="w-3 h-3" />
          <span>Shuffle Pattern</span>
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2 p-2 bg-[#050507] border border-[#181b24] rounded-lg">
        {AVATAR_STYLES.map((style) => {
          const styleUrl = buildDicebearUrl(style.collection, customSeed)
          const isSelected = currentUrl?.includes(`/${style.collection}/`) || (!currentUrl && style.collection === 'identicon')

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => handleSelectStyle(style.collection)}
              className={`relative rounded-lg p-1 aspect-square border transition-all flex flex-col items-center justify-center group ${
                isSelected
                  ? 'border-[#00f5d4] bg-[#00f5d4]/10 shadow-[0_0_10px_rgba(0,245,212,0.25)]'
                  : 'border-[#181b24] hover:border-zinc-600 bg-[#0a0d14]'
              }`}
              title={style.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={styleUrl}
                alt={style.name}
                width={36}
                height={36}
                className="w-full h-full object-contain rounded"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute top-0.5 right-0.5 bg-[#00f5d4] rounded-full p-0.5 shadow">
                  <Check className="w-2.5 h-2.5 text-[#050507] stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
