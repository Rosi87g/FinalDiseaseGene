'use client'

export interface TelemetryEvent {
  id: string
  timestamp: string
  time_str: string
  event_type: 'CLICK' | 'SEARCH' | 'NAVIGATE' | 'AUTH' | 'INTERACT' | 'EXPORT' | 'DELETE' | 'SYSTEM' | 'GATEWAY'
  target: string
  route: string
  username: string
  role: string
  details?: string
}

const STORAGE_KEY = 'sys_diagnostic_stream'
const MAX_LOCAL_EVENTS = 200

let broadcastChannel: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('matrix_telemetry_stream')
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}

/**
 * Logs a real-time interaction (button click, search, gateway call, navigation)
 * and broadcasts it to the Admin Matrix Diagnostic Stream.
 */
export function logUserInteraction(
  eventType: TelemetryEvent['event_type'],
  target: string,
  details: string = '',
  routeOverride?: string,
  skipBackendPost: boolean = false
) {
  if (typeof window === 'undefined') return

  const now = new Date()
  const time_str = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')
  const timestamp = now.toISOString()

  let user: { username?: string; role?: string } = {}
  try {
    const rawUser = localStorage.getItem('user')
    if (rawUser) user = JSON.parse(rawUser)
  } catch {
    // ignore
  }

  const username = user.username || 'Anonymous'
  const role = user.role || 'Guest'
  const route = routeOverride || (typeof window !== 'undefined' ? window.location.pathname : '/')

  const event: TelemetryEvent = {
    id: Math.random().toString(36).substring(2, 10),
    timestamp,
    time_str,
    event_type: eventType,
    target: target.substring(0, 100),
    route,
    username,
    role,
    details: details ? details.substring(0, 200) : '',
  }

  // 1. Broadcast to other tabs (Admin Matrix panel in another tab receives it instantly)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event)
    } catch {
      // ignore
    }
  }

  // 2. Dispatch custom in-window event (Admin panel in same tab receives it instantly)
  try {
    window.dispatchEvent(new CustomEvent('matrix-telemetry-event', { detail: event }))
  } catch {
    // ignore
  }

  // 3. Save to localStorage buffer
  try {
    const existing: TelemetryEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    existing.push(event)
    if (existing.length > MAX_LOCAL_EVENTS) {
      existing.splice(0, existing.length - MAX_LOCAL_EVENTS)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch {
    // ignore
  }

  // 4. Send non-blocking telemetry event to backend API (skip if backend already recorded it via gateway middleware)
  if (!skipBackendPost && eventType !== 'GATEWAY') {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
      fetch(`${apiUrl}/admin/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: event.event_type,
          target: event.target,
          route: event.route,
          username: event.username,
          role: event.role,
          details: event.details,
        }),
        keepalive: true,
      }).catch(() => {
        // Non-blocking background log
      })
    } catch {
      // ignore
    }
  }
}

/**
 * Initializes automatic API Gateway interception.
 * Intercepts window.fetch calls to backend API routes and logs gateway traffic.
 */
export function initApiGatewayInterceptor() {
  if (typeof window === 'undefined') return
  if ((window as any).__gatewayInterceptorActive) return
  ;(window as any).__gatewayInterceptorActive = true

  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const input = args[0]
    const init = args[1]
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input))
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()

    // Do NOT intercept telemetry endpoint itself to prevent infinite loops
    if (url.includes('/admin/telemetry') || url.includes('/telemetry')) {
      return originalFetch.apply(this, args)
    }

    const isApiRequest = url.includes('/api/v1') || url.includes(':8000') || url.startsWith('/api')
    if (!isApiRequest) {
      return originalFetch.apply(this, args)
    }

    const startTime = performance.now()
    try {
      const response = await originalFetch.apply(this, args)
      const duration = Math.round(performance.now() - startTime)

      let cleanPath = url
      try {
        const u = new URL(url, window.location.origin)
        cleanPath = u.pathname + (u.search || '')
      } catch {
        // fallback
      }

      const statusBadge = `${response.status} ${response.statusText || (response.ok ? 'OK' : 'ERR')}`
      // Log to live stream (skipBackendPost=true because backend HTTP middleware also records it)
      logUserInteraction(
        'GATEWAY',
        `${method} ${cleanPath}`,
        `Status: ${statusBadge} • Latency: ${duration}ms`,
        window.location.pathname,
        true
      )

      return response
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime)
      logUserInteraction(
        'GATEWAY',
        `${method} ${url}`,
        `Network Failure • Latency: ${duration}ms`,
        window.location.pathname,
        true
      )
      throw err
    }
  }
}

/**
 * Returns locally stored interaction events.
 */
export function getLocalTelemetryEvents(): TelemetryEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Clears locally stored telemetry events.
 */
export function clearLocalTelemetryEvents() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
