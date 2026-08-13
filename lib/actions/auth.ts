'use server'

import { createAuthClient, supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth, requireAdmin, getCurrentUser as _getCurrentUser } from '@/lib/auth'
import type { User, UserRole } from '@/lib/types'

const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || '0000'

export async function verifyAdminSecretCode(code: string): Promise<boolean> {
  return code === ADMIN_SECRET_CODE
}

function assertValidContact(contact?: string) {
  if (contact && !/^\d{10}$/.test(contact)) {
    throw new Error('Contact number must be exactly 10 digits')
  }
}

export async function createUserProfile(
  uid: string,
  data: {
    fullName: string
    email: string
    department: string
    role?: UserRole
    indexNumber?: string
    programme?: string
    levelYear?: string
    contact?: string
    adminSecretCode?: string
  }
) {
  if (data.role === 'admin') {
    if (data.adminSecretCode !== ADMIN_SECRET_CODE) {
      throw new Error('Invalid admin secret code')
    }
  }
  assertValidContact(data.contact)

  const user: User = {
    userId: uid,
    fullName: data.fullName,
    email: data.email,
    role: data.role || 'student',
    department: data.department,
    indexNumber: data.indexNumber || '',
    programme: data.programme || '',
    levelYear: data.levelYear || '',
    contact: data.contact || '',
    active: true,
    dateCreated: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from('users').insert(user)
  if (error) throw new Error(error.message)
  return user
}

// If profile creation fails right after auth signup, remove the orphaned,
// unconfirmed auth user so they aren't left in a broken half-registered state.
export async function deleteUnconfirmedAuthUser(uid: string) {
  await supabaseAdmin.auth.admin.deleteUser(uid).catch((err) => {
    console.error('Failed to clean up orphaned auth user:', err)
  })
}

export async function getCurrentUser(): Promise<{ user: User | null }> {
  return _getCurrentUser()
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('userId', uid).single()
  if (error || !data) return null
  return { userId: uid, ...data } as User
}

export async function checkEmailExists(email: string) {
  const { data } = await supabaseAdmin.from('users').select('userId').eq('email', email).maybeSingle()
  return !!data
}

export async function updateProfile(data: {
  fullName: string
  department: string
  indexNumber?: string
  programme?: string
  levelYear?: string
  contact?: string
}) {
  const user = await requireAuth()
  assertValidContact(data.contact)
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      fullName: data.fullName,
      department: data.department,
      indexNumber: data.indexNumber || '',
      programme: data.programme || '',
      levelYear: data.levelYear || '',
      contact: data.contact || '',
    })
    .eq('userId', user.userId)
  if (error) throw new Error(error.message)
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function updateAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
  const user = await requireAuth()

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) throw new Error('Please choose an image')
  if (file.size > MAX_AVATAR_SIZE) throw new Error('Image must be under 5MB')
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) throw new Error('Image must be JPEG, PNG, or WEBP')

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.userId}/avatar.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ avatarUrl })
    .eq('userId', user.userId)
  if (updateError) throw new Error(updateError.message)

  return { avatarUrl }
}

export async function listUsers(options: { search?: string; limit?: number; cursor?: string } = {}) {
  await requireAdmin()
  const { search, limit = 50, cursor } = options

  let query = supabaseAdmin.from('users').select('*').order('dateCreated', { ascending: false }).limit(limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let users = (data || []) as User[]

  if (search?.trim()) {
    const term = search.trim().toLowerCase()
    users = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term)
    )
  }

  return users
}

export async function deactivateUser(uid: string) {
  const current = await requireAuth()
  if (current.role !== 'admin') throw new Error('Forbidden')
  await supabaseAdmin.from('users').update({ active: false }).eq('userId', uid)
}
