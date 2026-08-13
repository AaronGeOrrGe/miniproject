import type { ProjectStatus } from '@/lib/types'

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const styles = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
