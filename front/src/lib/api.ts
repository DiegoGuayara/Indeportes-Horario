const API_BASE = import.meta.env.VITE_API_URL ?? ''
export type ApiError = Error & { status?: number }

export async function apiRequest<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const error = new Error(typeof payload.message === 'string' ? payload.message : 'No se pudo completar la solicitud.') as ApiError
    error.status = response.status
    throw error
  }
  return payload as T
}
