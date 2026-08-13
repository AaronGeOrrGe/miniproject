'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center dark:bg-zinc-950">
      <Image src="/logo.png" alt="Students Academic Repository" width={56} height={56} className="rounded-xl" />
      <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        An unexpected error occurred while loading this page. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
  )
}
