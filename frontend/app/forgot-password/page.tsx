'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Terminal, ShieldAlert, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed')
      }

      setSent(true)

      // Redirect to reset page with email prefilled
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'SYSTEM_ERR: Request timeout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-start justify-center pt-16 px-4 font-sans antialiased text-zinc-200 selection:bg-[#00f5d4]/20 selection:text-[#00f5d4]">
      <div className="w-full max-w-md">
        <div className="bg-[#0d0e12] border border-[#181b24] p-6 md:p-8 rounded relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

          <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-zinc-500 pointer-events-none select-none tracking-tighter">
            [AUTH_RECOVERY_NODE]
          </div>

          <div className="mb-6 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050507] text-[#00f5d4] border border-[#181b24] text-[10px] font-mono uppercase tracking-wider font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              INITIATE_RECOVERY_SEQUENCE
            </div>
            <h1 className="text-[17px] font-bold tracking-tight text-white font-mono uppercase pt-1">
              Forgot Password
            </h1>
            <p className="text-zinc-300 leading-relaxed font-normal text-[13px]">
              Enter your registered email. A 6-digit reset code will be dispatched.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                  // Registered Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  <Mail className="w-4 h-4" />
                  {loading ? 'DISPATCHING_CODE...' : 'SEND_RESET_CODE()'}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-[#181b24] mt-4">
                <Link href="/signin" className="text-[13px] text-zinc-400 font-mono hover:text-[#00f5d4] transition-colors">
                  ← RETURN_TO_AUTH()
                </Link>
              </div>
            </form>
          ) : (
            <div className="rounded border border-[#00f5d4]/20 bg-[#00f5d4]/5 p-4 text-center space-y-2">
              <p className="text-[#00f5d4] text-[13px] font-mono font-bold">
                TRANSMISSION_COMPLETE
              </p>
              <p className="text-zinc-400 text-[12px] font-mono">
                Reset code dispatched. Redirecting...
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}