import { createAuthClient, supabaseAdmin } from '@/lib/supabase-server'
import type { User } from '@/lib/types'

export async function getCurrentUser(): Promise<{ user: User | null }> {
  let supabase
  try {
    supabase = await createAuthClient()
  } catch (err) {
    // Stale/missing refresh token or corrupt session cookie — treat as not signed in.
    return { user: null }
  }

  let user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    // Supabase threw while validating/refreshing the session — treat as not signed in.
    return { user: null }
  }

  if (!user) return { user: null }

  let { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('userId', user.id)
    .single()

  if (error || !data) {
    // Note: role is intentionally NOT read from user_metadata here — that field
    // is client-settable via the public Supabase client, so trusting it would
    // let anyone grant themselves 'admin'. Admin role can only be assigned via
    // createUserProfile(), which validates the admin secret code server-side.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        userId: user.id,
        fullName: (user.user_metadata?.fullName as string) || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        role: 'student',
        department: (user.user_metadata?.department as string) || 'Unknown',
        indexNumber: (user.user_metadata?.indexNumber as string) || '',
        programme: (user.user_metadata?.programme as string) || '',
        levelYear: (user.user_metadata?.levelYear as string) || '',
        contact: (user.user_metadata?.contact as string) || '',
        active: true,
        dateCreated: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating fallback profile:', insertError)
      return { user: null }
    }

    data = inserted
  }

  return { user: { userId: user.id, ...data } as User }
}

export async function requireAuth(): Promise<User> {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function requireUploaderOrAdmin(uploaderId: string): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin' && user.userId !== uploaderId) throw new Error('Forbidden')
  return user
}
