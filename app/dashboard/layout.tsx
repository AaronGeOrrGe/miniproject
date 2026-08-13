import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50 lg:flex-row dark:bg-zinc-950">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
    </div>
  )
}
