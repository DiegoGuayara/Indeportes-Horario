import type { Session } from '../types/auth'

export function readSession(): Session | null {
  try {
    const value = sessionStorage.getItem('indeportes-session')
    return value ? JSON.parse(value) as Session : null
  } catch {
    return null
  }
}
