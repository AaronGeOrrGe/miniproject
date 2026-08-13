import Link from 'next/link'
import { FileText, Lock } from 'lucide-react'

export function LockedProjectCard() {
  return (
    <Link
      href="/login"
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900"
    >
      <div className="relative flex h-44 items-center justify-center bg-slate-100 dark:bg-zinc-800">
        <FileText className="h-16 w-16 text-slate-300 transition-transform group-hover:scale-110 dark:text-zinc-600" />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/15 dark:bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <Lock className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-zinc-800">Record</span>
          <span>—</span>
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
          Project record
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Titles, reports, and source code are visible to signed-in students and staff only.
        </p>
        <div className="mt-auto border-t border-slate-100 pt-4 text-sm font-medium text-blue-600 group-hover:underline dark:border-zinc-800 dark:text-blue-400">
          Sign in to view this record
        </div>
      </div>
    </Link>
  )
}
