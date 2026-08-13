'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Moon,
  Sun,
  PlusCircle,
  User,
  LogOut,
  Search,
  Menu,
  X,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'
import { NotificationBell } from './NotificationBell'
import { useEffect, useRef, useState } from 'react'

export function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    ...(user ? [
      { href: '/projects', label: 'Browse Projects' },
      { href: '/#departments', label: 'Departments' },
    ] : []),
    { href: '/#about', label: 'About' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400">
          <Image src="/logo.png" alt="Students Academic Repository" width={32} height={32} className="rounded-lg" />
          <span className="hidden text-slate-900 dark:text-white sm:inline">Students Academic Repository</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search repository..."
                className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value
                    if (value) window.location.href = `/projects?keyword=${encodeURIComponent(value)}`
                  }
                }}
              />
            </div>
            {user && <NotificationBell />}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/upload"
                className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:inline-flex"
              >
                <PlusCircle className="h-4 w-4" /> New Project
              </Link>

              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
                >
                  <User className="h-4 w-4" />
                  {user.fullName.split(' ')[0]}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex flex-col items-center text-center">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.fullName} className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 text-lg font-bold text-slate-900 dark:border-zinc-700 dark:text-white">
                          {user.fullName
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n.charAt(0).toUpperCase())
                            .join('')}
                        </div>
                      )}
                      <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>

                    <div className="mt-5 divide-y divide-slate-100 rounded-xl bg-slate-50 px-4 dark:divide-zinc-800 dark:bg-zinc-950">
                      {user.role === 'student' ? (
                        <>
                          <InfoRow label="Index Number" value={user.indexNumber || '—'} />
                          <InfoRow label="Programme" value={user.programme || '—'} />
                          <InfoRow label="Level / Year" value={user.levelYear ? `Level ${user.levelYear}` : '—'} />
                          <InfoRow label="Department" value={user.department || '—'} />
                        </>
                      ) : (
                        <>
                          <InfoRow label="Role" value="Administrator" />
                          <InfoRow label="Department" value={user.department || '—'} />
                        </>
                      )}
                    </div>

                    <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 dark:border-zinc-800">
                      <Link
                        href={user.role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-zinc-800"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4" /> Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          logout()
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className="rounded-full p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 md:hidden"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <nav className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-zinc-800"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-zinc-800"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}
