'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  User,
  Mail,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react'
import { createUserProfile, verifyAdminSecretCode, deleteUnconfirmedAuthUser, checkEmailExists } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase-client'
import { ALL_DEPARTMENTS, PROGRAMMES, LEVELS } from '@/lib/constants'
import { Noto_Sans_Indic_Siyaq_Numbers } from 'next/font/google'

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>
}) {
  const params = use(searchParams)
  const returnUrl = params.returnUrl || '/dashboard'

  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    indexNumber: '',
    department: '',
    programme: '',
    levelYear: '',
    contact: '',
    password: '',
    confirmPassword: '',
    adminSecretCode: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Real-time validation for specific fields
    if (name === 'fullName') {
      // Only allow letters, spaces, hyphens, and apostrophes
      const isValid = /^[a-zA-Z\s\-']+$/.test(value)
      if (value && !isValid) {
        setFieldErrors(prev => ({ ...prev, fullName: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }))
      } else {
        setFieldErrors(prev => ({ ...prev, fullName: '' }))
      }
    }
    
    if (name === 'indexNumber') {
      // Validate 7-8 digits only
      const isValid = /^\d{7,8}$/.test(value)
      if (value && !isValid) {
        setFieldErrors(prev => ({ ...prev, indexNumber: 'Index number must be 7-8 digits only' }))
      } else {
        setFieldErrors(prev => ({ ...prev, indexNumber: '' }))
      }
    }
    
    if (name === 'email') {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value && !emailRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }))
      }
    }
    
    if (name === 'contact') {
      // Validate 10-digit phone number
      const isValid = /^\d{10}$/.test(value)
      if (value && !isValid) {
        setFieldErrors(prev => ({ ...prev, contact: 'Contact number must be exactly 10 digits' }))
      } else {
        setFieldErrors(prev => ({ ...prev, contact: '' }))
      }
    }
    
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!form.fullName || !form.email || !form.password || !form.department) {
      setError('Please fill in all required fields')
      return
    }
    if (form.contact && !/^\d{10}$/.test(form.contact)) {
      setError('Contact number must be exactly 10 digits')
      return
    }
    
    // Validate full name - only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s\-']+$/.test(form.fullName)) {
      setFieldErrors({ fullName: 'Full name can only contain letters, spaces, hyphens, and apostrophes' })
      return
    }
    
    // Validate index number for students
    if (role === 'student' && form.indexNumber && !/^\d{7,8}$/.test(form.indexNumber)) {
      setFieldErrors({ indexNumber: 'Index number must be 7-8 digits only' })
      return
    }

    setLoading(true)
    try {
      if (role === 'admin') {
        const validCode = await verifyAdminSecretCode(form.adminSecretCode)
        if (!validCode) throw new Error('Invalid admin secret code')
      }

      const alreadyRegistered = await checkEmailExists(form.email)
      if (alreadyRegistered) throw new Error('This email is already registered. Please log in instead.')

      const supabase = createClient()
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      })
      if (signUpError) throw new Error(signUpError.message)
      if (!signUpData.user) throw new Error('Failed to create account')

      // Supabase returns an empty `identities` array (with no error) when the
      // email already belongs to an existing account, instead of creating a
      // new one. Treat that the same as "already registered" and, crucially,
      // never attempt to delete that user's auth account below.
      const isNewIdentity = (signUpData.user.identities?.length ?? 0) > 0
      if (!isNewIdentity) throw new Error('This email is already registered. Please log in instead.')

      try {
        await createUserProfile(signUpData.user.id, {
          email: form.email,
          fullName: form.fullName,
          department: form.department,
          role,
          indexNumber: role === 'student' ? form.indexNumber : undefined,
          programme: role === 'student' ? form.programme : undefined,
          levelYear: role === 'student' ? form.levelYear : undefined,
          contact: form.contact,
          adminSecretCode: role === 'admin' ? form.adminSecretCode : undefined,
        })
      } catch (profileErr) {
        await deleteUnconfirmedAuthUser(signUpData.user.id)
        throw profileErr
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white'
  const selectClass =
    'w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-zinc-950">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white lg:flex">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Empowering the Next Generation of Research</h2>
          <p className="mt-4 max-w-md text-blue-100">
            Securely upload, manage, and showcase your academic achievements within our centralized institutional repository.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Cloud-Enabled Security</p>
                <p className="text-sm text-blue-100">AES-256 encryption for all project source files and documents.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Efficient Retrieval</p>
                <p className="text-sm text-blue-100">Advanced metadata tagging ensures your research is discoverable by peers.</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-blue-200">© 2026 Students Academic Repository. All rights reserved.</p>
      </div>

      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                We&apos;ve sent a confirmation link to <span className="font-medium text-slate-700 dark:text-slate-300">{form.email}</span>.
                Click the link to verify your account, then sign in.
              </p>
              <Link
                href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Back to Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
          <>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create an Account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Join Students Academic Repository to start managing your academic portfolio.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                role === 'student'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <GraduationCap className="h-4 w-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                role === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Administrator
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Enter your full legal name"
                    pattern="[a-zA-Z\s\-']+"
                    title="Full name can only contain letters, spaces, hyphens, and apostrophes"
                    className={`${inputClass} ${fieldErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@university.edu"
                    className={`${inputClass} ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                <BookOpen className="h-3.5 w-3.5" /> Academic Credentials
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {role === 'student' && (
                  <div>
                    <label htmlFor="indexNumber" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Student Index Number
                    </label>
                    <input
                      id="indexNumber"
                      name="indexNumber"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1234567 or 12345678"
                      pattern="^\d{7,8}$"
                      title="Index number must be 7-8 digits only"
                      maxLength={8}
                      className={`${inputClass.replace('pl-10', 'pl-3')} ${fieldErrors.indexNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      value={form.indexNumber}
                      onChange={handleChange}
                    />
                    {fieldErrors.indexNumber && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.indexNumber}</p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      name="department"
                      required
                      className={selectClass}
                      value={form.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {ALL_DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {role === 'student' && (
                  <>
                    <div className="relative">
                      <label htmlFor="programme" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Programme
                      </label>
                      <div className="relative">
                        <select
                          id="programme"
                          name="programme"
                          className={selectClass}
                          value={form.programme}
                          onChange={handleChange}
                        >
                          <option value="">Select Programme</option>
                          {PROGRAMMES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="relative">
                      <label htmlFor="levelYear" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Level/Year
                      </label>
                      <div className="relative">
                        <select
                          id="levelYear"
                          name="levelYear"
                          className={selectClass}
                          value={form.levelYear}
                          onChange={handleChange}
                        >
                          <option value="">Select Level</option>
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="contact" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact (optional)
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                placeholder="10-digit phone number"
                className={`${inputClass.replace('pl-10', 'pl-3')} ${fieldErrors.contact ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                value={form.contact}
                onChange={handleChange}
              />
              {fieldErrors.contact ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.contact}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">If provided, must be exactly 10 digits.</p>
              )}
            </div>

            {role === 'admin' && (
              <div>
                <label htmlFor="adminSecretCode" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Admin Secret Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="adminSecretCode"
                    name="adminSecretCode"
                    type="password"
                    required={role === 'admin'}
                    placeholder="Enter admin secret code"
                    className={inputClass}
                    value={form.adminSecretCode}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Required to register as an administrator.</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={inputClass}
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 6 characters.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={inputClass}
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Register Account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 p-3 text-center dark:border-zinc-700">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300">
              Back to Login
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in here
            </Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
