import { GitFork, Archive, FileText, ExternalLink, Images } from 'lucide-react'
import type { Project } from '@/lib/types'

export function ProjectArtifactBadges({ project }: { project: Project }) {
  const hasAny = project.pdfUrl || project.githubUrl || project.sourceCodeZipUrl || project.liveUrl || project.images?.length

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        {project.projectType}
      </span>
      {project.pdfUrl && (
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-slate-300">
          <FileText className="h-3 w-3" /> PDF
        </span>
      )}
      {project.githubUrl && (
        <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-slate-900">
          <GitFork className="h-3 w-3" /> GitHub
        </span>
      )}
      {project.sourceCodeZipUrl && (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <Archive className="h-3 w-3" /> ZIP
        </span>
      )}
      {project.liveUrl && (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <ExternalLink className="h-3 w-3" /> Live Link
        </span>
      )}
      {!!project.images?.length && (
        <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          <Images className="h-3 w-3" /> {project.images.length} Image{project.images.length > 1 ? 's' : ''}
        </span>
      )}
      {!hasAny && <span className="text-xs text-slate-400 dark:text-slate-600">No artifacts</span>}
    </div>
  )
}
