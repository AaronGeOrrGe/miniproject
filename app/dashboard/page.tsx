import Link from 'next/link'
import { ArrowRight, Bookmark, FileText, Upload, Download, Eye, ThumbsUp } from 'lucide-react'
import { getMyProjects, getStudentStats, getRepositoryStats } from '@/lib/actions/projects'
import { getMyNotifications } from '@/lib/actions/notifications'
import { getCurrentUser } from '@/lib/auth'
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge'

export default async function DashboardPage() {
  const { user } = await getCurrentUser()
  const [projects, stats, notifications, globalStats] = await Promise.all([
    getMyProjects(),
    getStudentStats(),
    getMyNotifications(),
    getRepositoryStats().catch(() => ({
      projectCount: 0,
      departmentCount: 0,
      downloadCount: 0,
      departmentCounts: {},
    })),
  ])

  const unreadCount = notifications.filter((n) => n.status === 'unread').length

  const recentActivity = [
    ...projects.slice(0, 3).map((p) => ({
      id: p.projectId,
      title: p.title,
      date: p.uploadDate,
      type: 'upload' as const,
      status: p.status,
    })),
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.fullName || 'Student'}!</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here is what is happening with your academic projects today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Repository Total"
          value={globalStats.projectCount.toLocaleString()}
          sub="+12 this week"
        />
        <StatCard icon={Upload} label="My Uploads" value={stats.totalUploads} sub="2 pending approval" />
        <StatCard icon={Bookmark} label="Bookmarks" value={stats.totalBookmarks} sub="Saved for later" />
        <StatCard icon={Download} label="Recent Downloads" value={stats.totalDownloads} sub="Last 30 days" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-600" /> Recent Activity
            </h2>
            <Link
              href="/dashboard/history"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              View History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                No recent activity. Start by uploading your first project.
              </div>
            ) : (
              <div className="relative space-y-6 pl-4 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200 dark:before:bg-zinc-700">
                {recentActivity.map((item) => (
                  <Link key={item.id} href={`/projects/${item.id}`} className="relative block rounded-lg pl-6 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800">
                    <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.type === 'upload' && 'New Upload Started'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">You uploaded &quot;{item.title}&quot;.</p>
                    {item.status === 'Approved' && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Success
                      </span>
                    )}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h3 className="text-lg font-semibold">Need to reference a previous work?</h3>
            <p className="mt-1 max-w-lg text-sm text-blue-100">
              Our advanced search filters let you find projects by index number, academic year, or specific department tags.
            </p>
            <Link
              href="/projects"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Start Searching <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <span className="relative">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </span>
              Notifications
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.notificationId} className="border-b border-slate-100 pb-4 last:border-0 dark:border-zinc-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(n.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
              <ThumbsUp className="h-4 w-4" /> Pro Tip
            </h3>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              Adding descriptive keywords to your project metadata increases its discoverability in the repository by up to 65%.
            </p>
          </div>
        </div>
      </div>

      <div id="my-uploads" className="mt-8 scroll-mt-20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Link href="/dashboard/history" className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
              My Uploads
            </Link>
            <Link href="/dashboard/history" className="block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {projects.length > 5 ? `View all ${projects.length} uploads` : 'View full history'}
            </Link>
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" /> Submit New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-zinc-900">
            <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-slate-600 dark:text-slate-400">You have not uploaded any projects yet.</p>
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Upload your first project
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Title</th>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Department</th>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Year</th>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Downloads</th>
                  <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {projects.slice(0, 5).map((p) => (
                  <tr key={p.projectId}>
                    <td className="px-6 py-4">
                      <Link href={`/projects/${p.projectId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.department}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.academicYear}</td>
                    <td className="px-6 py-4"><ProjectStatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{p.downloadCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.viewCount || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof FileText
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
