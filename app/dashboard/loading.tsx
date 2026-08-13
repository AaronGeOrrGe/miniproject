export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-64 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-200 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-zinc-800 lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-8">
        <div className="mb-4 h-6 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}
