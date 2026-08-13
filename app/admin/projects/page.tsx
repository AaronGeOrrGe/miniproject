'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, Trash2, Eye, FileText, SlidersHorizontal } from 'lucide-react'
import { getAllProjects, approveOrRejectProject, deleteProject } from '@/lib/actions/projects'
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge'
import { ProjectArtifactBadges } from '@/components/ProjectArtifactBadges'
import type { Project, ProjectStatus } from '@/lib/types'

export default function AdminProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAllProjects(status || undefined)
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [status])

  const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    await approveOrRejectProject(id, newStatus)
    setProjects((prev) => prev.map((p) => (p.projectId === id ? { ...p, status: newStatus } : p)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project permanently?')) return
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.projectId !== id))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Projects</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, approve, and manage repository submissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-slate-600 dark:text-slate-400">No projects found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Title</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Artifacts</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Author</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Department</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Year</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {projects.map((p) => (
                <tr key={p.projectId}>
                  <td className="px-6 py-4">
                    <Link href={`/projects/${p.projectId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <ProjectArtifactBadges project={p} />
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.authorName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.department}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.academicYear}</td>
                  <td className="px-6 py-4"><ProjectStatusBadge status={p.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/projects/${p.projectId}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-400 dark:hover:bg-zinc-800"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {p.status !== 'Approved' && (
                        <button
                          onClick={() => handleAction(p.projectId, 'Approved')}
                          className="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {p.status !== 'Rejected' && (
                        <button
                          onClick={() => handleAction(p.projectId, 'Rejected')}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.projectId)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-400 dark:hover:bg-zinc-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
