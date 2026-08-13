'use client'

import { useEffect, useState } from 'react'
import { Search, UserX, Users, ShieldCheck, GraduationCap } from 'lucide-react'
import { listUsers, deactivateUser } from '@/lib/actions/auth'
import type { User } from '@/lib/types'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      listUsers({ search })
        .then(setUsers)
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleDeactivate = async (uid: string) => {
    if (!confirm('Deactivate this user? They will no longer be able to sign in.')) return
    await deactivateUser(uid)
    setUsers((prev) => prev.map((u) => (u.userId === uid ? { ...u, active: false } : u)))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage registered students and administrators.</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
        <Search className="ml-3 h-5 w-5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or department"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none dark:text-white"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
          <Users className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-slate-600 dark:text-slate-400">No users found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Email</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Department</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Role</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Joined</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {users.map((u) => (
                <tr key={u.userId}>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.fullName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.department}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.active === false ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                        Deactivated
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(u.dateCreated).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {u.active !== false && (
                      <button
                        onClick={() => handleDeactivate(u.userId)}
                        className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                        title="Deactivate"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
