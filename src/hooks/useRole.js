import { useUser } from '@clerk/clerk-react'

export function useRole() {
  const { user, isLoaded, isSignedIn } = useUser()
  const role = user?.publicMetadata?.role || 'community'
  const isAuthority = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'

  return { role, isAuthority, isSuperAdmin, isLoaded, isSignedIn, user }
}
