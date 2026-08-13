'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Eye, FileText, Users, Download, Shield, ArrowRight } from 'lucide-react'
import { getAllProjects, getProjectStats, approveOrRejectProject } from '@/lib/actions/projects'
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge'
import { ProjectArtifactBadges } from '@/components/ProjectArtifactBadges'
import type { Project } from '@/lib/types'

export default function AdminPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({ totalProjects: 0, totalUsers: 0, totalDownloads: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllProjects('Pending'), getProjectStats()])
      .then(([projs, s]) => {
        setProjects(projs)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    await approveOrRejectProject(id, status)
    setProjects((prev) => prev.filter((p) => p.projectId !== id))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage submissions, users, and platform analytics.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <Shield className="h-4 w-4" /> Administrator
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={FileText} label="Total Projects" value={stats.totalProjects} href="/admin/projects" />
          <StatCard icon={Users} label="Registered Users" value={stats.totalUsers} href="/admin/users" />
          <StatCard icon={Download} label="Total Downloads" value={stats.totalDownloads} />
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pending Review Queue</h2>
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-zinc-700">
            <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-slate-600 dark:text-slate-400">No pending projects.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.map((p) => (
              <div
                key={p.projectId}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 transition-shadow hover:shadow-sm dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    <Link href={`/projects/${p.projectId}`} className="hover:text-blue-600 hover:underline dark:hover:text-blue-400">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {p.authorName} · {p.department} · {p.academicYear}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-500">{p.abstract}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ProjectStatusBadge status={p.status} />
                    <ProjectArtifactBadges project={p} />
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                  <Link
                    href={`/projects/${p.projectId}`}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Link>
                  <button
                    onClick={() => handleAction(p.projectId, 'Approved')}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(p.projectId, 'Rejected')}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof FileText
  label: string
  value: number
  href?: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}
