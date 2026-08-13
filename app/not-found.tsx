import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center dark:bg-zinc-950">
      <Image src="/logo.png" alt="Students Academic Repository" width={56} height={56} className="rounded-xl" />
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">404 error</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist, may have been moved, or the project record may have been removed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
        >
          <Search className="h-4 w-4" /> Search the archive
        </Link>
      </div>
    </div>
  )
}
