export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]
