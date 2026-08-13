'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Upload,
  FileText,
  Bookmark,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from './AuthProvider'

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Search Projects', icon: Search },
  { href: '/dashboard/upload', label: 'Upload Project', icon: Upload },
  { href: '/dashboard/history', label: 'My Uploads', icon: FileText },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'All Projects', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/statistics', label: 'Statistics', icon: Search },
  { href: '/dashboard/upload', label: 'Upload Project', icon: Upload },
]

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  if (!user) return null

  const links = user.role === 'admin' ? adminLinks : studentLinks
  const base = user.role === 'admin' ? '/admin' : '/dashboard'

  const isActive = (href: string) => {
    if (href === base) return pathname === href
    return pathname.startsWith(href)
  }

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  const navList = (onNavigate?: () => void) => (
    <ul className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(link.href)
        return (
          <li key={link.label}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.fullName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-900 dark:border-zinc-700 dark:text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-50 dark:bg-blue-900/30">
                  <Image src="/logo.png" alt="Students Academic Repository" width={32} height={32} className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Menu</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-auto p-4">{navList(() => setMobileOpen(false))}</nav>

            <div className="border-t border-slate-100 p-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setMobileOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 border-b border-slate-100 p-6 dark:border-zinc-800">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.fullName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-900 dark:border-zinc-700 dark:text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-auto p-4">{navList()}</nav>

        <div className="border-t border-slate-100 p-4 dark:border-zinc-800">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
