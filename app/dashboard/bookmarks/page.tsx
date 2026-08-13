import Link from 'next/link'
import { getMyBookmarks } from '@/lib/actions/projects'
import { ProjectCard } from '@/components/ProjectCard'
import { UnbookmarkButton } from '@/components/UnbookmarkButton'
import { Bookmark, Search } from 'lucide-react'

export default async function BookmarksPage() {
  const projects = await getMyBookmarks()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <Bookmark className="h-6 w-6 text-blue-600" /> My Bookmarks
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Projects you have saved for later.</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
          <Bookmark className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">You have not bookmarked any projects yet.</p>
          <Link
            href="/projects"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Search className="h-4 w-4" /> Browse projects
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.projectId} className="relative">
              <ProjectCard project={p} />
              <div className="absolute right-3 top-3">
                <UnbookmarkButton projectId={p.projectId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
