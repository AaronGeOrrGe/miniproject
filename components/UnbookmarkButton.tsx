'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toggleBookmark } from '@/lib/actions/projects'

export function UnbookmarkButton({ projectId }: { projectId: string }) {
  const router = useRouter()

  const handleClick = async () => {
    await toggleBookmark(projectId)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full p-2 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      aria-label="Remove bookmark"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
