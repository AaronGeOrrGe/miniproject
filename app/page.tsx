import Link from 'next/link'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { Search, ArrowRight, Library, Cpu, Building2, Zap, Wrench, Landmark, Lock, Upload, Check, BookOpen, LayoutDashboard, Settings } from 'lucide-react'
import { getApprovedProjects, getRepositoryStats } from '@/lib/actions/projects'
import { ProjectCard } from '@/components/ProjectCard'
import { LockedProjectCard } from '@/components/LockedProjectCard'
import { getCurrentUser } from '@/lib/auth'
import type { Project } from '@/lib/types'
import { DEPARTMENTS } from '@/lib/constants'

const departmentIconMap: Record<string, LucideIcon> = {
  'Department of Computer Science': Cpu,
  'Department of Computer Engineering': Cpu,
  'Department of Architecture': Building2,
  'Department of Electrical and Electronic Engineering': Zap,
  'Department of Mechanical Engineering': Wrench,
  'Department of Accounting and Finance': Landmark,
}

const departmentOrder = DEPARTMENTS

export default async function Home() {
  const { user } = await getCurrentUser()
  const stats = await getRepositoryStats()

  const departmentList = [
    ...departmentOrder.map((name) => ({
      name,
      icon: departmentIconMap[name],
      count: stats.departmentCounts[name] || 0,
    })),
    ...Object.entries(stats.departmentCounts)
      .filter(([name]) => !departmentOrder.includes(name))
      .map(([name, count]) => ({ name, icon: Building2, count })),
  ]

  let recent: Project[] = []
  let popular: Project[] = []
  if (user) {
    const [r, p] = await Promise.all([
      getApprovedProjects({ sort: 'newest', limit: 3 }),
      getApprovedProjects({ sort: 'most-downloaded', limit: 3 }),
    ])
    recent = r
    popular = p
  }

  const featured = popular.length > 0 ? popular : recent
  const dashboardHref = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-85" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1507842217343-eb3f3a3c7f4d?auto=format&fit=crop&w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent dark:from-zinc-950" />
        <BookOpen className="pointer-events-none absolute right-4 top-12 z-0 h-48 w-48 text-white/10 blur-2xl animate-float hidden lg:block" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Students Academic Repository
          </h1>
          <p className="animate-fade-in-up animation-delay-150 mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Every project this department has built, kept and findable. Reports, source code, and repository links — uploaded once, reviewed by staff, and searchable by every verified student in the department.
          </p>

          {user ? (
            <>
              <form action="/projects" method="get" className="animate-fade-in-up animation-delay-300 mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-xl bg-white p-2 shadow-lg">
                <Search className="ml-3 h-5 w-5 text-slate-400" />
                <input
                  name="keyword"
                  type="text"
                  placeholder="Search by title, author, or keyword..."
                  className="flex-1 bg-transparent px-2 py-3 text-sm text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Search Projects
                </button>
              </form>

              <div className="animate-fade-in-up animation-delay-500 mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/projects"
                  className="rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  Browse All Projects
                </Link>
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  My Dashboard
                </Link>
              </div>
            </>
          ) : (
            <div className="animate-fade-in-up animation-delay-300 mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur sm:p-8">
              <p className="text-sm text-slate-200">
                Create a free account with your student email to search and download.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}

          <div className="animate-fade-in-up animation-delay-500 mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-3xl font-bold text-white">{stats.projectCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-300">Projects catalogued</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-3xl font-bold text-white">{stats.departmentCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-300">Departments</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-3xl font-bold text-white">{stats.downloadCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-300">Downloads to date</p>
            </div>
          </div>
        </div>
      </section>

      {/* Moving text marquee */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="animate-marquee flex whitespace-nowrap">
          {[
            'Reports',
            'Source code',
            'GitHub links',
            'Reviewed by staff',
            'Searchable by department',
            'Searchable by year',
            'Searchable by keyword',
            'Preserved for the next cohort',
          ]
            .concat([
              'Reports',
              'Source code',
              'GitHub links',
              'Reviewed by staff',
              'Searchable by department',
              'Searchable by year',
              'Searchable by keyword',
              'Preserved for the next cohort',
            ])
            .map((text, i) => (
              <span
                key={i}
                className="mx-6 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
                {text}
              </span>
            ))}
        </div>
      </section>

      {user ? (
        <>
          {/* Featured Projects */}
          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">In the archive</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Every project this department has built, kept and findable.
                </p>
              </div>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                View all records <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {featured.length === 0 ? (
              <p className="rounded-2xl bg-white py-12 text-center text-slate-500 shadow-sm dark:bg-zinc-900 dark:text-slate-400">
                No approved projects yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProjectCard key={p.projectId} project={p} />
                ))}
              </div>
            )}
          </section>

          {/* Browse by Department */}
          <section id="departments" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Browse by Department</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Explore specialized research within your field of study.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {departmentList.map((dept) => {
                  const Icon = dept.icon
                  return (
                    <Link
                      key={dept.name}
                      href={`/projects?department=${encodeURIComponent(dept.name)}`}
                      className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/20 dark:text-blue-400 dark:group-hover:bg-blue-500">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {dept.count} {dept.count === 1 ? 'Project' : 'Projects'}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Recently Uploaded + CTA */}
          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recently Uploaded</h2>
                  <Link href="/projects?sort=newest" className="text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Search repository
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-8 text-slate-500 dark:text-slate-400">No recent uploads.</p>
                ) : (
                  <div className="space-y-4">
                    {recent.slice(0, 4).map((p) => (
                      <Link
                        key={p.projectId}
                        href={`/projects/${p.projectId}`}
                        className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <Library className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-600 dark:text-slate-400">{p.abstract}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                            <span>{p.authorName}</span>
                            <span>{p.department}</span>
                            <span>{p.academicYear}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                  <h3 className="text-lg font-bold">Start Contributing</h3>
                  <p className="mt-2 text-sm text-blue-100">
                    Are you a student? Upload your capstone project to build your academic visibility.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-blue-100">
                    <li className="flex items-center gap-2">Global Visibility</li>
                    <li className="flex items-center gap-2">Secure Archiving</li>
                    <li className="flex items-center gap-2">Peer Recognition</li>
                  </ul>
                  <Link
                    href="/dashboard/upload"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    Upload Now
                  </Link>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Access</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link href={dashboardHref} className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800">
                      Dashboard
                    </Link>
                    <Link href="/projects" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800">
                      Search
                    </Link>
                    <Link href="/dashboard/upload" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800">
                      Upload
                    </Link>
                    <Link href="/dashboard/profile" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800">
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Guests: archive preview */
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">In the archive</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {stats.projectCount.toLocaleString()} projects, waiting behind an account.
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              View all records <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <LockedProjectCard />
            <LockedProjectCard />
            <LockedProjectCard />
          </div>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Titles, reports, and source code are visible to signed-in students and staff only.
          </p>
        </section>
      )}

      {/* Create a free account / benefits */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user ? 'How the archive works' : 'Create a free account'}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              {user
                ? 'The departmental archive is built for long-term academic preservation.'
                : 'Join your department’s archive to search, download, and contribute.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Upload once</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Report, source code, and GitHub link, submitted together and reviewed before publishing.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Reviewed by staff</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Every submission is checked by an administrator before it joins the public record.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Kept for the next cohort</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Searchable by department, year, and keyword — long after the author has graduated.
              </p>
            </div>
          </div>

          {!user && (
            <div className="mt-10 text-center">
              <Link
                href="/register"
                className="inline-flex rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Create a free account
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Info / Quick actions section */}
      <section id="about" className="scroll-mt-20 border-t border-slate-200 px-4 py-16 dark:border-zinc-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {user ? (
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick actions</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Jump straight to where you need to go.</p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { href: dashboardHref, icon: LayoutDashboard, label: 'Dashboard' },
                  { href: '/projects', icon: Search, label: 'Browse archive' },
                  { href: '/dashboard/upload', icon: Upload, label: 'Upload project' },
                  { href: '/dashboard/profile', icon: Settings, label: 'Profile' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
                  >
                    <Icon className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
                    <span className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  Verified & Preserved
                </span>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                  Built to outlast the semester.
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  Every approved project is indexed by department, year, and keyword. The archive stays searchable for students and staff long after graduation.
                </p>
                <div className="mt-6 flex gap-3">
                  <Link href="/register" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Create account
                  </Link>
                  <Link href="/login" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800">
                    Log in
                  </Link>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-md dark:bg-zinc-900">
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80"
                  alt="Library archive"
                  className="h-full w-full object-cover animate-float-image"
                  />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-4 py-12 dark:border-zinc-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                <Image src="/logo.png" alt="Students Academic Repository" width={20} height={20} className="rounded" />
                Students Academic Repository
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                A secure cloud-enabled repository designed for modern academic collaboration, knowledge sharing, and long-term preservation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Quick Links</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {user ? (
                  <>
                    <li><Link href="/projects" className="hover:text-blue-600">Browse Projects</Link></li>
                    <li><Link href="/projects?sort=most-downloaded" className="hover:text-blue-600">Top Downloads</Link></li>
                    <li><Link href="/projects?sort=newest" className="hover:text-blue-600">Recently Added</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="hover:text-blue-600">Log In</Link></li>
                    <li><Link href="/register" className="hover:text-blue-600">Register</Link></li>
                  </>
                )}
                <li><Link href="/#about" className="hover:text-blue-600">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Contact Us</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>repository@university.edu</li>
                <li>0554192904</li>
                <li>KNUST</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Newsletter</h4>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Stay updated with the latest academic uploads.</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Join</button>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-zinc-800 sm:flex-row">
            <p>© 2026 Students Academic Repository. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</Link>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
