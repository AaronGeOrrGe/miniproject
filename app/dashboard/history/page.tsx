'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, FileText, Download, Eye, Upload } from 'lucide-react'
import { getMyProjects } from '@/lib/actions/projects'
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge'
import { StudentDeleteProjectButton } from '@/components/StudentDeleteProjectButton'
import type { Project, ProjectStatus } from '@/lib/types'

export default function UploadHistoryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')

  useEffect(() => {
    getMyProjects()
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (status && p.status !== status) return false
      if (term && !p.title.toLowerCase().includes(term)) return false
      return true
    })
  }, [projects, search, status])

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload History</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every project you have submitted, and its review status.</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" /> Submit New Project
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
          <Search className="ml-1 h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
            className="flex-1 bg-transparent px-2 py-1 text-sm outline-none dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
            className="bg-transparent text-sm outline-none dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {projects.length === 0 ? 'You have not uploaded any projects yet.' : 'No uploads match your filters.'}
          </p>
          {projects.length === 0 && (
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Upload your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Title</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Department</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Year</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Uploaded</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Downloads</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Views</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p.projectId}>
                  <td className="px-6 py-4">
                    <Link href={`/projects/${p.projectId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.department}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.academicYear}</td>
                  <td className="px-6 py-4"><ProjectStatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(p.uploadDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400"><span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{p.downloadCount || 0}</span></td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.viewCount || 0}</span></td>
                  <td className="px-6 py-4">
                    {(p.status === 'Pending' || p.status === 'Rejected') && (
                      <StudentDeleteProjectButton
                        projectId={p.projectId}
                        title={p.title}
                        onDeleted={(projectId) => setProjects((current) => current.filter((project) => project.projectId !== projectId))}
                      />
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
