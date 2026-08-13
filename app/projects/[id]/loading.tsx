export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 h-4 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
      <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-zinc-800" />

      <div className="mt-6 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-md bg-slate-200 dark:bg-zinc-800" />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
