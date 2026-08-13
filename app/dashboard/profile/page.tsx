'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building2, Hash, BookOpen, Calendar, Phone, Save, Camera } from 'lucide-react'
import { updateProfile, updateAvatar } from '@/lib/actions/auth'
import { useAuth } from '@/components/AuthProvider'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    department: user?.department || '',
    indexNumber: user?.indexNumber || '',
    programme: user?.programme || '',
    levelYear: user?.levelYear || '',
    contact: user?.contact || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const initials = (user?.fullName || '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError('')
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.set('avatar', file)
      const { avatarUrl } = await updateAvatar(formData)
      if (user) setUser({ ...user, avatarUrl })
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to update photo')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (form.contact && !/^\d{10}$/.test(form.contact)) {
      setError('Contact number must be exactly 10 digits')
      return
    }

    setLoading(true)

    try {
      await updateProfile(form)
      if (user) setUser({ ...user, ...form })
      setSaved(true)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account and academic credentials.</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.fullName} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-900 dark:border-zinc-700 dark:text-white">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {avatarUploading ? 'Uploading...' : 'Click the camera icon to change your photo'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPEG, PNG, or WEBP. Max 5MB.</p>
            {avatarError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{avatarError}</p>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Personal Information</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
          {saved && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">Profile saved.</p>}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="fullName" name="fullName" type="text" required value={form.fullName} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="email" name="email" type="email" disabled value={user?.email || ''} className={`${inputClass} bg-slate-50 text-slate-500 dark:bg-zinc-900`} />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="department" name="department" type="text" required value={form.department} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="contact" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="10-digit phone number"
                  value={form.contact}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">If provided, must be exactly 10 digits.</p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-zinc-800">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              <BookOpen className="h-4 w-4" /> Academic Credentials
            </h3>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="indexNumber" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Index Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="indexNumber" name="indexNumber" type="text" value={form.indexNumber} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="programme" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Programme</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select id="programme" name="programme" value={form.programme} onChange={handleChange} className={inputClass}>
                    <option value="">Select Programme</option>
                    {['BSc', 'MSc', 'PhD', 'BEng', 'BTech', 'MBA'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="levelYear" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Level/Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select id="levelYear" name="levelYear" value={form.levelYear} onChange={handleChange} className={inputClass}>
                    <option value="">Select Level</option>
                    {['100', '200', '300', '400', '500', '600'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
