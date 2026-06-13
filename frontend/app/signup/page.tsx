// This is the sign-in page for the application. It provides a form for users to enter their username and password, and handles the authentication process by communicating with the backend API. If the authentication is successful, it stores the token and user information in localStorage and redirects the user to the home page. If there are any errors during the process, it displays an appropriate error message to the user.
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Terminal, ShieldAlert, UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role: 'Researcher',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed')
      }

      router.push('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SYSTEM_ERR: Ingestion sequence failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-start justify-center pt-1 px-4 font-sans antialiased text-zinc-200 selection:bg-[#00f5d4]/20 selection:text-[#00f5d4]">
      <div className="w-full max-w-md">
        
        <div className="bg-[#0d0e12] border border-[#181b24] p-6 md:p-8 rounded relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

          <div className="mb-6 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050507] text-[#00f5d4] border border-[#181b24] text-[10px] font-mono uppercase tracking-wider font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              INITIALIZE_REGISTRATION
            </div>
            
            <h1 className="text-[17px] font-bold tracking-tight text-white font-mono uppercase pt-1">
              Create Researcher Identity
            </h1>
            <p className="text-zinc-300 leading-relaxed font-normal text-[13px]">
              Register a unique authorization identity to parse confidentially mapped genetic associations.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                // System Identity Name
              </label>
              <input
                type="text"
                placeholder="e.g., bio_explorer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#050507] border border-[#181b24] rounded text-[13px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                // Target Email Locus
              </label>
              <input
                type="email"
                placeholder="name@institution.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#050507] border border-[#181b24] rounded text-[13px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                // Cryptographic Codephrase
              </label>
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
                <UserPlus className="w-4 h-4" />
                {loading ? 'RUNNING_ALLOCATION...' : 'EXECUTE_REGISTRATION()'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-[#181b24] mt-4">
              <p className="text-[13px] text-zinc-400 font-mono">
                Existing security token?{' '}
                <Link 
                  href="/signin" 
                  className="text-[#00f5d4] hover:text-[#00d7ba] underline underline-offset-4 font-semibold transition-colors"
                >
                  [ SIGN_IN ]
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}