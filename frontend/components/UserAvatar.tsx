'use client'

import { useState, useEffect } from 'react'

interface UserAvatarProps {
  username?: string
  role?: string
  size?: number
  className?: string
  showStatus?: boolean
  avatarUrl?: string
  onClick?: () => void
}

// Generate consistent high-contrast colors from username
function hashStringToColor(str: string): { bg: string; border: string; text: string; gradient: string } {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palettes = [
    { bg: '#081c15', border: '#00f5d4', text: '#00f5d4', gradient: 'from-[#00f5d4] to-[#06b6d4]' },
    { bg: '#130d24', border: '#a855f7', text: '#c084fc', gradient: 'from-[#a855f7] to-[#ec4899]' },
    { bg: '#0b162c', border: '#38bdf8', text: '#38bdf8', gradient: 'from-[#38bdf8] to-[#6366f1]' },
    { bg: '#1f1300', border: '#f59e0b', text: '#fbbf24', gradient: 'from-[#f59e0b] to-[#ef4444]' },
    { bg: '#03201a', border: '#10b981', text: '#34d399', gradient: 'from-[#10b981] to-[#00f5d4]' },
    { bg: '#210b1a', border: '#ec4899', text: '#f472b6', gradient: 'from-[#ec4899] to-[#a855f7]' },
  ]
  const idx = Math.abs(hash) % palettes.length
  return palettes[idx]
}

export default function UserAvatar({
  username = 'Operator',
  role = 'Researcher',
  size = 32,
  className = '',
  showStatus = true,
  avatarUrl,
  onClick,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const safeName = (username || 'Operator').trim()
  const initial = (safeName[0] || 'O').toUpperCase()
  const color = hashStringToColor(safeName)

  // DiceBear Identicon generates high-tech vector avatar seeded by username
  const defaultDicebearUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(safeName)}&backgroundColor=0e1018`
  const effectiveAvatarUrl = avatarUrl || defaultDicebearUrl

  useEffect(() => {
    setImgError(false)
  }, [effectiveAvatarUrl])

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full select-none shrink-0 transition-transform ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`${safeName} (${role})`}
    >
      {/* Outer subtle glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          boxShadow: `0 0 ${Math.max(6, size / 4)}px ${color.border}44`,
        }}
      />

      {/* Avatar Content */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border relative"
        style={{
          backgroundColor: '#0a0d14',
          borderColor: `${color.border}66`,
        }}
      >
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveAvatarUrl}
            alt={safeName}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          // Crisp high-tech SVG fallback with user initial & DNA icon
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color.gradient} text-[#050507] font-bold`}
            style={{ fontSize: Math.max(10, Math.floor(size * 0.42)) }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Online indicator dot */}
      {showStatus && size >= 24 && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[#050507] bg-emerald-400"
          style={{
            width: Math.max(7, Math.floor(size * 0.26)),
            height: Math.max(7, Math.floor(size * 0.26)),
          }}
        />
      )}
    </div>
  )
}
