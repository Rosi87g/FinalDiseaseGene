'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Terminal, ShieldAlert, LogIn, Dna } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      const data = await response.json()

      if (response.status === 403) {
        router.push(`/verify-email?email=${encodeURIComponent(username.includes('@') ? username : '')}`)
        return
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      localStorage.setItem('token', data.access_token)

      // After getting token, fetch user profile properly
      localStorage.setItem('token', data.access_token)

      // Fetch real user profile including email and actual role
      try {
        const meRes = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          localStorage.setItem('user', JSON.stringify({
            username: meData.username,
            email: meData.email,
            role: meData.role
          }))
        } else {
          // Fallback — at least store what we know
          localStorage.setItem('user', JSON.stringify({ username: username, email: '', role: 'Researcher' }))
        }
      } catch {
        localStorage.setItem('user', JSON.stringify({ username: username, email: '', role: 'Researcher' }))
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'SYSTEM_ERR: Gateway handshake timeout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center py-10 px-4 font-sans antialiased text-zinc-200 selection:bg-[#00f5d4]/20 selection:text-[#00f5d4]">
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="relative bg-[#050507] border border-[#1d222e] p-1.5 rounded text-[#00f5d4]">
            <Dna className="w-4 h-4 animate-[spin_8s_linear_infinite]" />
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00f5d4]"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-widest text-white font-mono uppercase">
            DiseaseGeneMap
          </span>
        </div>

        <div className="bg-[#0d0e12] border border-[#181b24] p-6 md:p-8 rounded relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

          <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-zinc-500 pointer-events-none select-none tracking-tighter">
            [SYS_AUTH_NODE]
          </div>

          <div className="mb-6 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050507] text-[#00f5d4] border border-[#181b24] text-[10px] font-mono uppercase tracking-wider font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              ESTABLISH_SESSION_CHANNEL
            </div>

            <h1 className="text-[17px] font-bold tracking-tight text-white font-mono uppercase pt-1">
              Authenticate Identity
            </h1>
            <p className="text-zinc-300 leading-relaxed font-normal text-[13px]">
              Provide valid administrative credentials to verify encryption clearance.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                // Identity Token Name
              </label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#050507] border border-[#181b24] rounded text-[13px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                  // Access Passphrase
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-mono text-zinc-500 hover:text-[#00f5d4] transition-colors"
                >
                  FORGOT_PASSWORD?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#050507] border border-[#181b24] rounded text-[13px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-[12px] font-mono leading-tight">
                  CRITICAL_ERR: {error}
                </p>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00f5d4] text-[#050507] font-mono font-bold text-[13px] rounded hover:bg-[#00d7ba] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors duration-150 shadow-[0_0_15px_rgba(0,245,212,0.3)] uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'VERIFYING_CLEARANCE...' : 'EXECUTE_AUTHENTICATION()'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-[#181b24] mt-4">
              <p className="text-[13px] text-zinc-400 font-mono">
                No active authorization key?{' '}
                <Link
                  href="/signup"
                  className="text-[#00f5d4] hover:text-[#00d7ba] underline underline-offset-4 font-semibold transition-colors"
                >
                  [ REGISTER_IDENTITY ]
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
