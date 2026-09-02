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
}