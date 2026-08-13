import Link from 'next/link'
import type { Project } from '@/lib/types'
import { Eye, Download, ThumbsUp, FileText } from 'lucide-react'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900"
    >
      <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700">
        <FileText className="h-16 w-16 text-slate-300 transition-transform group-hover:scale-110 dark:text-zinc-600" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-900/20">{project.department}</span>
          {project.projectType && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-zinc-800 dark:text-slate-400">{project.projectType}</span>
          )}
          <span className="text-slate-400 dark:text-slate-500">{project.academicYear}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {project.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{project.authorName}</p>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{project.abstract}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.keywords.slice(0, 3).map((k) => (
            <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-zinc-800 dark:text-slate-400">
              {k}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-zinc-800 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {project.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> {project.downloadCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" /> {project.helpfulCount || 0}
            </span>
          </div>
          <span className="font-medium text-blue-600 group-hover:underline dark:text-blue-400">Details</span>
        </div>
      </div>
    </Link>
  )
}
