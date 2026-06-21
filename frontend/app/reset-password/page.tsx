'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Terminal, ShieldAlert, ShieldCheck, KeyRound, Check, X } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordFocused, setPasswordFocused] = useState(false)

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  }
  const isPasswordValid = passwordRules.minLength && passwordRules.hasUpper && passwordRules.hasNumber

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isPasswordValid) {
      setError('Password does not meet the minimum security requirements')
      return
    }

    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Reset failed')
      }

      setSuccess('PASSWORD_UPDATED: Redirecting to login...')

      setTimeout(() => {
        router.push('/signin')
      }, 1800)

    } catch (err: any) {
      setError(err.message || 'CRITICAL_ERR: Reset system timeout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-[#0d0e12] border border-[#181b24] p-6 md:p-8 rounded relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

      <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-zinc-500 pointer-events-none select-none tracking-tighter">
        [AUTH_STAGE_03]
      </div>

      <div className="mb-6 space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050507] text-[#00f5d4] border border-[#181b24] text-[10px] font-mono uppercase tracking-wider font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          CREDENTIAL_RESET_NODE
        </div>
        <h1 className="text-[17px] font-bold tracking-tight text-white font-mono uppercase pt-1">
          Reset Password
        </h1>
        <p className="text-zinc-300 text-[13px] font-mono">
          Code dispatched to:{' '}
          <span className="text-[#00f5d4] font-semibold font-sans">{email || 'UNKNOWN'}</span>
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">

        {/* OTP */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
            // RESET_CODE
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            disabled={loading || !!success}
            className="w-full rounded border border-[#181b24] bg-[#050507] p-3 text-center text-lg tracking-[0.4em] font-mono font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
          />
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
            // New Passphrase
          </label>
          <input
            type="password"
            placeholder="Min. 8 characters, 1 uppercase, 1 number"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
            disabled={loading || !!success}
            className="w-full px-3 py-2.5 bg-[#050507] border border-[#181b24] rounded text-[13px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
          />

          {(passwordFocused || newPassword.length > 0) && !success && (
            <div className="bg-[#050507] border border-[#181b24] rounded p-2.5 space-y-1.5 mt-1.5">
              <PasswordRule met={passwordRules.minLength} label="At least 8 characters" />
              <PasswordRule met={passwordRules.hasUpper} label="One uppercase letter" />
              <PasswordRule met={passwordRules.hasNumber} label="One number" />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
            // Confirm Passphrase
          </label>
          <input
            type="password"
            placeholder="Repeat passphrase"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || !!success}
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

        {success && (
          <div className="rounded border border-[#00f5d4]/20 bg-[#00f5d4]/5 p-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00f5d4] shrink-0 mt-0.5" />
            <p className="text-[#00f5d4] text-[12px] font-mono leading-tight">{success}</p>
          </div>
        )}

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading || !!success || !isPasswordValid}
            className="w-full py-3.5 bg-[#00f5d4] text-[#050507] font-mono font-bold text-[13px] rounded hover:bg-[#00d7ba] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors duration-150 shadow-[0_0_15px_rgba(0,245,212,0.3)] uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'UPDATING_CREDENTIALS...' : 'EXECUTE_RESET()'}
          </button>
        </div>

        <div className="text-center pt-4 border-t border-[#181b24] mt-4">
          <Link href="/signin" className="text-[13px] text-zinc-400 font-mono hover:text-[#00f5d4] transition-colors">
            ← RETURN_TO_AUTH()
          </Link>
        </div>

      </form>
    </div>
  )
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${met ? 'text-[#00f5d4]' : 'text-zinc-500'}`}>
      {met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full flex items-start justify-center pt-16 px-4 font-sans antialiased">
      <Suspense fallback={
        <div className="text-[13px] font-mono text-[#00f5d4] uppercase tracking-widest animate-pulse">
          Loading recovery context...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
