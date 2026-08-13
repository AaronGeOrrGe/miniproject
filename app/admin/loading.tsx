export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-7 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-72 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="h-8 w-32 rounded-full bg-slate-200 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
