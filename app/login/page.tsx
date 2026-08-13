'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getCurrentUser, verifyAdminSecretCode } from '@/lib/actions/auth'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; registered?: string; confirmed?: string }>
}) {
  const params = use(searchParams)
  const returnUrl = params.returnUrl || '/dashboard'
  const justRegistered = params.registered === '1'
  const emailConfirmed = params.confirmed === '1'
  const router = useRouter()
  const { setUser } = useAuth()

  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminSecretCode, setAdminSecretCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'admin') {
        const validCode = await verifyAdminSecretCode(adminSecretCode)
        if (!validCode) throw new Error('Invalid admin secret code')
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error(signInError.message)

      const current = await getCurrentUser()
      if (!current.user) throw new Error('Unable to load user profile')

      setUser(current.user)
      if (current.user.role === 'admin') router.push('/admin')
      else router.push(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="px-8 pt-10 text-center">
          <div className="mx-flex mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-50 dark:bg-blue-900/30">
            <Image src="/logo.png" alt="Students Academic Repository" width={56} height={56} className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students Academic Repository</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your credentials to access the archive.
          </p>
        </div>

        <div className="mt-6 px-8">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                role === 'student'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                role === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Admin Login
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-6">
          {justRegistered && !error && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Account created successfully. Please log in to continue.
            </div>
          )}
          {emailConfirmed && !error && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Email confirmed! You can now sign in.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={role === 'student' ? 'student.name@university.edu' : 'admin@university.edu'}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {role === 'admin' && (
              <div>
                <label htmlFor="adminSecretCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Admin Secret Code
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="adminSecretCode"
                    type="password"
                    required={role === 'admin'}
                    placeholder="Enter admin secret code"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    value={adminSecretCode}
                    onChange={(e) => setAdminSecretCode(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400">
                Remember this device for 30 days
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : role === 'student' ? 'Sign In to Student Hub' : 'Sign In to Admin Portal'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Access your projects, submission history, and bookmarks.
          </div>
        </form>

        <div className="border-t border-slate-100 px-8 py-5 text-center dark:border-zinc-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Create a New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
