<<<<<<< HEAD
// This file defines the Admin Control Console for the DiseaseGeneMap application.
// It provides a secure interface for administrators to view database metrics,
// manage operator identity and avatar, and permanently delete accounts.
'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Database,
  LogOut,
  Edit3,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import UserAvatar from '../../components/UserAvatar'
import AvatarPicker from '../../components/AvatarPicker'

export default function AdminPage() {
  const router = useRouter()
  const [overview, setOverview] = useState<Record<string, any>>({ genes: 0, diseases: 0, variants: 0, pathways: 0, associations: 0 })
  const [user, setUser] = useState<{ username: string; email: string; role: string; avatar_url?: string }>({ username: '', email: '', role: '', avatar_url: '' })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Delete Account state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  const fetchOverview = async () => {
    setIsRefreshing(true)
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
      const token = getToken()

      let response = await fetch(`${apiUrl}/admin/overview`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (!response.ok) {
        response = await fetch(`${apiUrl}/stats`)
      }

      if (response.ok) {
        const data = await response.json()
        setOverview(data)
      }
    } catch (err) {
      console.error('Failed to fetch overview:', err)
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = getToken()
    const storedUser = localStorage.getItem('user')

    if (!token) {
      router.push('/signin')
      return
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
      } catch {
        // ignore
      }
    } else {
      const fetchMe = async () => {
        try {
          const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const meData = await res.json()
            localStorage.setItem('user', JSON.stringify(meData))
            setUser(meData)
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
        }
      }
      fetchMe()
    }

    fetchOverview()
  }, [router])

  const saveProfile = async () => {
    if (!user.username.trim() || user.username.trim().length < 3) {
      setProfileStatus({ type: 'error', msg: 'Username must be at least 3 characters long.' })
      return
    }

    setProfileSaving(true)
    setProfileStatus(null)
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
      const token = getToken()
      const response = await fetch(`${apiUrl}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          username: user.username.trim(),
          avatar_url: editAvatarUrl || user.avatar_url
        })
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token)
        }
        const updated = {
          ...user,
          username: data.username,
          role: data.role || user.role,
          avatar_url: editAvatarUrl || data.avatar_url || user.avatar_url
        }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
        setProfileStatus({ type: 'success', msg: 'Profile picture & username updated successfully!' })
        window.dispatchEvent(new Event('auth-changed'))
        setTimeout(() => {
          setEditing(false)
          setProfileStatus(null)
        }, 1200)
      } else {
        throw new Error(data.detail || data.message || 'Failed to update profile')
      }
    } catch (error: any) {
      setProfileStatus({ type: 'error', msg: error.message || 'Failed to save profile changes' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteError('')
    try {
      const token = getToken()
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

      const res = await fetch(`${apiUrl}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to permanently delete account')
      }

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setShowDeleteModal(false)
      window.dispatchEvent(new Event('auth-changed'))
      window.location.href = '/signin'
    } catch (err: any) {
      setDeleteError(err.message || 'Error occurred while purging account')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auth-changed'))
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#00f5d4] animate-spin" />
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Loading Control Console...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-5xl w-full mx-auto pb-10">

      {/* Header Bar */}
      <div className="bg-[#0d0e12] border border-[#181b24] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <UserAvatar username={user.username} role={user.role} avatarUrl={user.avatar_url} size={42} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Admin Control Console
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-[#00f5d4] text-[9px] font-mono font-bold uppercase">
                {user.role || 'Admin'} Node
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Operator: <span className="text-white font-semibold">@{user.username || 'Admin'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/20 text-[11px] font-mono uppercase transition-colors"
            title="Permanently Delete Current Account"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b24] hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono uppercase transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">

        {/* Database Overview */}
        <div className="bg-[#0d0e12] border border-[#181b24] rounded-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00f5d4]" />
                <h2 className="text-xs uppercase font-mono text-zinc-300 tracking-wider font-semibold">Database Metrics</h2>
              </div>
              <button onClick={fetchOverview} className="text-zinc-500 hover:text-[#00f5d4] transition-colors p-1" title="Refresh metrics">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(overview)
                .filter(([key, value]) => typeof value === 'number' && !key.toLowerCase().includes('data'))
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs font-mono border-b border-[#181b24] pb-2.5">
                    <span className="text-zinc-400 capitalize flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400/70" />
                      {key}
                    </span>
                    <span className="text-white font-bold tracking-wider text-sm">{(value as number).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-[#181b24] text-[10px] font-mono text-zinc-500 flex justify-between">
            <span>Cluster Status: <span className="text-emerald-400 font-semibold">CONNECTED</span></span>
            <span>Database Node: <span className="text-[#00f5d4]">Primary Active</span></span>
          </div>
        </div>

        {/* Operator Info with Profile Picture */}
        <div className="bg-[#0d0e12] border border-[#181b24] rounded-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs uppercase font-mono text-zinc-300 tracking-wider font-semibold">Operator Info & Avatar</h2>
            </div>
            <button
              onClick={() => { setEditing(!editing); setEditAvatarUrl(user.avatar_url || ''); setProfileStatus(null); }}
              className="text-zinc-400 hover:text-white transition-colors p-1"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-[#050507] border border-[#181b24] mb-4">
            <UserAvatar username={user.username} role={user.role} avatarUrl={editAvatarUrl || user.avatar_url} size={58} />
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white truncate font-sans">{user.username || 'Operator'}</div>
              <div className="text-[11px] text-zinc-400 truncate font-mono">{user.email || 'operator@diseasegenemap'}</div>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/20 text-[#00f5d4] text-[9px] font-bold font-mono uppercase">
                {user.role || 'Admin'} Clearance
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {editing ? (
              <div className="space-y-3.5">
                {/* Profile Picture Selector */}
                <AvatarPicker
                  currentUrl={editAvatarUrl || user.avatar_url}
                  seed={user.username || 'Admin'}
                  onChange={(url) => setEditAvatarUrl(url)}
                />

                <div>
                  <label className="text-zinc-400 uppercase text-[9px] font-semibold block mb-1">Username</label>
                  <input
                    value={user.username}
                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                    className="w-full bg-[#050507] border border-[#181b24] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00f5d4]/50 transition-colors"
                    placeholder="Enter new username"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-500 uppercase text-[9px] font-semibold">Email Address</label>
                    <span className="text-[9px] font-mono text-zinc-600 bg-[#12151e] px-1.5 py-0.5 rounded">LOCKED</span>
                  </div>
                  <div className="w-full bg-[#050507] border border-[#181b24] rounded px-3 py-2 text-zinc-400 text-xs font-mono select-all">
                    {user.email || 'operator@diseasegenemap'}
                  </div>
                </div>

                {profileStatus && (
                  <div className={`p-2 rounded text-[11px] font-mono ${
                    profileStatus.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border border-red-500/30 text-red-400'
                  }`}>
                    {profileStatus.msg}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setProfileStatus(null); }}
                    className="w-1/3 bg-[#181b24] text-zinc-400 py-2 rounded text-[10px] font-bold uppercase hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="flex-1 bg-[#00f5d4] text-[#050507] py-2 rounded text-[10px] font-bold uppercase hover:bg-[#00d7ba] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Profile Changes'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-[11px]">
                <div className="flex justify-between border-b border-[#181b24] pb-2">
                  <span className="text-zinc-500">Avatar Engine</span>
                  <span className="text-[#00f5d4]">Deterministic Vector Identity</span>
                </div>
                <div className="flex justify-between border-b border-[#181b24] pb-2">
                  <span className="text-zinc-500">Session Status</span>
                  <span className="text-emerald-400">Authenticated & Active</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full py-2 px-3 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[10px] font-mono uppercase transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanent Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Permanent Delete Modal in Admin Panel ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0a0d14] border border-red-500/40 rounded-xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Permanently Delete Account</h3>
                <p className="text-xs text-red-400 font-mono">IRREVERSIBLE ACTION</p>
              </div>
            </div>

            <div className="bg-[#050507] border border-[#1f2430] p-3.5 rounded-lg space-y-2 text-xs font-mono text-zinc-300">
              <p>
                Are you certain you want to purge operator identity <span className="text-white font-bold underline">@{user.username}</span>?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                <li>All user records and session tokens will be permanently removed.</li>
                <li>All saved lists and uploads under this operator account will be purged.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-[#181b24] text-zinc-300 hover:text-white font-mono text-xs uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                {deletingAccount ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Purging Identity...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge Account Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
=======
// This file defines the Admin page for the DiseaseGeneMap application. It provides a secure interface for administrators to monitor system health, view database metrics, manage their profile, and export logs. The page is styled using Tailwind CSS and incorporates Lucide icons for visual elements. It also includes client-side authentication checks and graceful handling of access control scenarios.
'use client'

import { useState, useEffect } from 'react'
import { Terminal, CheckCircle, User, Database, Server, LogOut, Edit3, Download, RefreshCw, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
    const router = useRouter()
    const [overview, setOverview] = useState({ genes: 0, diseases: 0, variants: 0, pathways: 0, associations: 0 })
    const [user, setUser] = useState({ username: '', email: '', role: '' })
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [editing, setEditing] = useState(false)
    const [currentTime, setCurrentTime] = useState('')
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token')
        }
        return null
    }

    const fetchOverview = async () => {
        setIsRefreshing(true)
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
            const token = getToken()
            
            // Try admin endpoint first, fall back to public stats
            let response = await fetch(`${apiUrl}/admin/overview`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })

            // If admin endpoint fails, fall back to public /stats
            if (!response.ok) {
                response = await fetch(`${apiUrl}/stats`)
            }

            if (response.ok) {
                const data = await response.json()
                setOverview(data)
            }
        } catch (err) {
            console.error('Failed to fetch overview:', err)
        } finally {
            setIsRefreshing(false)
            setLoading(false)
        }
    }

    useEffect(() => {
        setCurrentTime(new Date().toLocaleTimeString())

        const token = getToken()
        const storedUser = localStorage.getItem('user')

        // No token at all → redirect to signin
        if (!token) {
            router.push('/signin')
            return
        }

        // Has token but no user stored → still allow, fetch from API
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser)
                setUser(parsedUser)                            
            } catch {
                // Malformed user JSON — just continue
            }
        } else {
            // No stored user — try to fetch from API
            const fetchMe = async () => {
                try {
                    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
                    const res = await fetch(`${apiUrl}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const meData = await res.json()
                        localStorage.setItem('user', JSON.stringify(meData))
                        setUser(meData)
                    }
                } catch (err) {
                    console.error('Failed to fetch user profile:', err)
                }
            }
            fetchMe()
        }

        fetchOverview()
    }, [router])

    const saveProfile = async () => {
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
            const token = getToken()
            const response = await fetch(`${apiUrl}/admin/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ username: user.username, email: user.email })
            })
            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(user))
                setEditing(false)
            } else {
                throw new Error('Failed to update profile')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const exportLogs = () => {
        const logContent = JSON.stringify({ overview, user: { username: user.username, role: user.role }, timestamp: new Date().toISOString() }, null, 2)
        const blob = new Blob([logContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system_log_${new Date().toISOString()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/signin')
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center text-zinc-500 font-mono text-xs animate-pulse">
                INITIALIZING_SECURE_SESSION...
            </div>
        )
    }

    // Access denied state — show message instead of redirecting
    if (accessDenied) {
        return (
            <div className="max-w-md mx-auto mt-20">
                <div className="bg-[#0d0e12] border border-red-500/20 rounded p-6 text-center space-y-4">
                    <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
                    <div>
                        <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Access Denied</h2>
                        <p className="text-zinc-500 font-mono text-[11px] mt-1">Admin privileges required for this panel.</p>
                        <p className="text-zinc-600 font-mono text-[10px] mt-1">
                            Current role: <span className="text-amber-400">{user.role || 'user'}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 bg-[#181b24] hover:bg-[#202430] text-white font-mono text-[11px] uppercase rounded transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 max-w-6xl mx-auto">

            {/* Header */}
            <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-base font-bold text-white font-mono uppercase tracking-wider">Admin Control Console</h1>
                    <p className="text-[10px] text-zinc-500 font-mono">System Health & Operator Interface</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[10px] uppercase font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-3 h-3" /> Logout
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-3">

                {/* Database Overview */}
                <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#00f5d4]" />
                            <h2 className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Database Metrics</h2>
                        </div>
                        <button onClick={fetchOverview} className="text-zinc-600 hover:text-[#00f5d4] transition-colors">
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(overview).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-xs font-mono border-b border-[#181b24] pb-2">
                                <span className="text-zinc-400 capitalize">{key}</span>
                                <span className="text-white font-bold">{(value as number).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operator Info */}
                <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-cyan-400" />
                            <h2 className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Operator Info</h2>
                        </div>
                        <button onClick={() => setEditing(!editing)} className="text-zinc-600 hover:text-white transition-colors">
                            <Edit3 className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-4 font-mono text-xs">
                        <div>
                            <p className="text-zinc-600 uppercase text-[9px]">Username</p>
                            {editing ? (
                                <input
                                    value={user.username}
                                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                                    className="w-full bg-[#050507] border border-[#181b24] rounded px-2 py-2 text-white focus:outline-none focus:border-[#00f5d4]/50 transition-colors mt-1"
                                />
                            ) : (
                                <p className="text-white mt-0.5">{user.username || '—'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-zinc-600 uppercase text-[9px]">Email</p>
                            <p className="text-white mt-0.5">{user.email || '—'}</p>
                        </div>
                        <div>
                            <p className="text-zinc-600 uppercase text-[9px]">Role</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/20 text-[#00f5d4] text-[10px] font-bold uppercase">
                                {user.role || 'user'}
                            </span>
                        </div>
                        {editing && (
                            <button
                                onClick={saveProfile}
                                className="w-full mt-2 bg-[#00f5d4] text-black py-2 rounded text-[10px] font-bold uppercase hover:bg-[#00d7ba] transition-colors"
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>

                {/* Status & Export */}
                <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="w-4 h-4 text-amber-400" />
                        <h2 className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">System Status</h2>
                    </div>
                    <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#00f5d4]">
                            <CheckCircle className="w-3 h-3" /> BACKEND_API_ONLINE
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#00f5d4]">
                            <CheckCircle className="w-3 h-3" /> DATABASE_CONNECTED
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400">
                            <CheckCircle className="w-3 h-3" /> OPERATOR: {user.username || 'UNKNOWN'}
                        </div>
                    </div>
                    <button
                        onClick={exportLogs}
                        className="w-full flex items-center justify-center gap-2 bg-[#181b24] hover:bg-[#202430] text-white py-2 rounded text-[10px] font-mono uppercase transition-colors"
                    >
                        <Download className="w-3 h-3" /> Export System Logs
                    </button>
                </div>
            </div>

            {/* Diagnostic Terminal */}
            <div className="bg-[#0d0e12] border border-[#181b24] rounded p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Diagnostic Stream</h2>
                </div>
                <div className="bg-[#050507] border border-[#181b24] rounded p-4 font-mono text-[11px] text-zinc-400 h-40 overflow-y-auto space-y-1">
                    <p><span className="text-zinc-600">&gt;</span> {currentTime} :: INITIALIZING_ADMIN_INTERFACE...</p>
                    <p><span className="text-zinc-600">&gt;</span> {currentTime} :: CONNECTING_TO_DATABASE_NODE...</p>
                    <p><span className="text-zinc-600">&gt;</span> {currentTime} :: LOADING_OPERATOR_PROFILE... <span className="text-amber-400">{user.username || 'UNKNOWN'}</span></p>
                    <p><span className="text-zinc-600">&gt;</span> {currentTime} :: FETCHING_SYSTEM_METRICS...</p>
                    <p className="text-[#00f5d4]"><span className="text-zinc-600">&gt;</span> {currentTime} :: SYSTEM_STABLE_OPERATIONAL_MODE</p>
                </div>
            </div>
        </div>
    )
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
}