
export type UserRole = 'ADMIN' | 'CONTRACTOR' | 'GUARD'
export type User = { id: string; email: string; role: UserRole; contractorId: string | null }
export type Session = { accessToken: string; user: User }
