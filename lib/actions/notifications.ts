'use server'

import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import type { Notification } from '@/lib/types'

export async function createNotification(userId: string, message: string) {
  const notification: Notification = {
    notificationId: crypto.randomUUID(),
    userId,
    message,
    status: 'unread',
    dateCreated: new Date().toISOString(),
  }
  const { error } = await supabaseAdmin.from('notifications').insert(notification)
  if (error) throw new Error(error.message)
}

export async function getMyNotifications(): Promise<Notification[]> {
  const user = await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('userId', user.userId)
    .order('dateCreated', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data || []) as Notification[]
}

export async function markAllNotificationsRead() {
  const user = await requireAuth()
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ status: 'read' })
    .eq('userId', user.userId)
    .eq('status', 'unread')

  if (error) throw new Error(error.message)
}
