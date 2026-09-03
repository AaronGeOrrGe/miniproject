'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { getMyNotifications, markAllNotificationsRead } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const latest = await getMyNotifications()
      setNotifications(latest)
      return latest
    } catch {
      return []
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(loadNotifications, 0)
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications()
    }, 10000)
    const refreshOnFocus = () => loadNotifications()
    window.addEventListener('focus', refreshOnFocus)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [loadNotifications])

  const unread = notifications.filter((n) => n.status === 'unread').length

  const handleOpen = async () => {
    setOpen(true)
    const latest = await loadNotifications(true)
    if (latest.some((notification) => notification.status === 'unread')) {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, status: 'read' as const })))
    }
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-lg border border-foreground/10 bg-white p-3 shadow-lg dark:bg-zinc-900">
          <h4 className="mb-2 text-sm font-semibold">Notifications</h4>
          {loading ? (
            <p className="py-4 text-center text-sm text-foreground/60">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground/60">No notifications</p>
          ) : (
            <ul className="max-h-64 divide-y divide-foreground/10 overflow-auto">
              {notifications.map((n) => (
                <li key={n.notificationId} className="py-2 text-sm">
                  <p className={n.status === 'unread' ? 'font-medium' : 'text-foreground/80'}>{n.message}</p>
                  <p className="mt-1 text-xs text-foreground/50">{new Date(n.dateCreated).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
