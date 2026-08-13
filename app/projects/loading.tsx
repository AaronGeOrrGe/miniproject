import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-3 bg-slate-50 dark:bg-zinc-950">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  )
}
