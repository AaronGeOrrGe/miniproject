'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteProject } from '@/lib/actions/projects'

export function StudentDeleteProjectButton({
  projectId,
  title,
  onDeleted,
}: {
  projectId: string
  title: string
  onDeleted?: (projectId: string) => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!confirm(`Delete "${title}" permanently? This cannot be undone.`)) return
    setDeleting(true)
    setError('')
    try {
      await deleteProject(projectId)
      onDeleted?.(projectId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete project')
      setDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
      {error && <p className="mt-1 max-w-48 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
