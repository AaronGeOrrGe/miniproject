export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-6 h-8 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
      <div className="mb-6 h-14 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}
