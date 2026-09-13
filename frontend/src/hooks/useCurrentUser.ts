import type { UserRole } from '#api/auth'
import { useAuth } from '#hooks/useAuth'
import { toInitials } from '#utils/initials'

export interface CurrentUser {
  displayName: string
  initials: string
  role: UserRole
  avatarUrl: string | null
}

export function useCurrentUser(): CurrentUser | null {
  const { user } = useAuth()
  if (!user) {
    return null
  }
  return {
    displayName: user.displayName,
    initials: toInitials(user.displayName),
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}
