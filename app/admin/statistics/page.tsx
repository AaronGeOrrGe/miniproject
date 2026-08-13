'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getProjectStats } from '@/lib/actions/projects'
import { FileText, Users, Download, TrendingUp } from 'lucide-react'

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<{ totalProjects: number; totalUsers: number; totalDownloads: number; topDepartments: { name: string; count: number }[]; uploadsByMonth: { month: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjectStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Platform usage and project analytics.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Platform usage and project analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Projects" value={stats.totalProjects} />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={Download} label="Total Downloads" value={stats.totalDownloads} />
        <StatCard icon={TrendingUp} label="Avg Downloads" value={stats.totalProjects ? Math.round(stats.totalDownloads / stats.totalProjects) : 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Uploads per Month</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.uploadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Departments</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topDepartments} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
