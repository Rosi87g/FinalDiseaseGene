'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Terminal, ShieldAlert, ShieldCheck, User } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/auth/forgot-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed')
      }

      setSuccess('If that email is registered, your username has been sent to your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SYSTEM_ERR: Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-start justify-center pt-16 px-4 font-sans antialiased text-zinc-200 selection:bg-[#00f5d4]/20 selection:text-[#00f5d4]">
      <div className="w-full max-w-md">

        <div className="bg-[#0d0e12] border border-[#181b24] p-6 md:p-8 rounded relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

          <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-zinc-500 pointer-events-none select-none tracking-tighter">
            [IDENTITY_RECOVERY]
          </div>

          <div className="mb-6 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050507] text-[#00f5d4] border border-[#181b24] text-[10px] font-mono uppercase tracking-wider font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              RECOVER_IDENTITY_TOKEN
            </div>

            <h1 className="text-[17px] font-bold tracking-tight text-white font-mono uppercase pt-1">
              Forgot Username
            </h1>
            <p className="text-zinc-300 leading-relaxed font-normal text-[13px]">
              Enter your registered email address and we&apos;ll send your username to your inbox.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                  // Registered Email Locus
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

              {error && (
                <div className="rounded border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-[12px] font-mono leading-tight">CRITICAL_ERR: {error}</p>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#00f5d4] text-[#050507] font-mono font-bold text-[13px] rounded hover:bg-[#00d7ba] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors duration-150 shadow-[0_0_15px_rgba(0,245,212,0.3)] uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  {loading ? 'SCANNING_DATABASE...' : 'RETRIEVE_USERNAME()'}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-[#181b24] mt-4">
                <p className="text-[13px] text-zinc-400 font-mono">
                  Remember your credentials?{' '}
                  <Link href="/signin" className="text-[#00f5d4] hover:text-[#00d7ba] underline underline-offset-4 font-semibold transition-colors">
                    [ SIGN_IN ]
                  </Link>
                </p>
              </div>

            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded border border-[#00f5d4]/20 bg-[#00f5d4]/5 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00f5d4] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#00f5d4] text-[13px] font-mono font-semibold">TRANSMISSION_SENT</p>
                  <p className="text-zinc-300 text-[12px] font-mono mt-1 leading-relaxed">{success}</p>
                </div>
              </div>
              <div className="text-center">
                <Link href="/signin" className="text-[11px] font-mono text-zinc-500 hover:text-[#00f5d4] transition-colors">
                  ← BACK_TO_SIGNIN
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


