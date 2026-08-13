'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown, Download, Eye, Bookmark } from 'lucide-react'
import { searchProjects } from '@/lib/actions/projects'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project, SortOption } from '@/lib/types'
import { DEPARTMENTS, KEYWORDS, PROJECT_TYPES, EXTENDED_DEPARTMENTS } from '@/lib/constants'

const MIN_ACADEMIC_YEAR = 2024

export default function ProjectsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [department, setDepartment] = useState(searchParams.get('department') || '')
  const [projectType, setProjectType] = useState(searchParams.get('projectType') || '')
  const [author, setAuthor] = useState(searchParams.get('author') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest')

  const [projects, setProjects] = useState<Project[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const isOtherDept = !!department && !(DEPARTMENTS as readonly string[]).includes(department)
  const [otherDeptOpen, setOtherDeptOpen] = useState(isOtherDept)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const timeout = setTimeout(() => {
      searchProjects({ title, department, projectType, author, year, keyword, sort })
        .then((data) => {
          if (mounted) setProjects(data)
        })
        .catch((err) => {
          if (mounted) setError(err instanceof Error ? err.message : 'Search failed')
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }, 350)
    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [title, department, projectType, author, year, keyword, sort])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (title) params.set('title', title)
    if (department) params.set('department', department)
    if (projectType) params.set('projectType', projectType)
    if (author) params.set('author', author)
    if (year) params.set('year', year)
    if (keyword) params.set('keyword', keyword)
    if (sort) params.set('sort', sort)
    router.push(`/projects?${params.toString()}`)
  }

  const handleSortChange = (value: SortOption) => {
    setSort(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`/projects?${params.toString()}`)
  }

  const clearFilters = () => {
    setTitle('')
    setDepartment('')
    setOtherDeptOpen(false)
    setProjectType('')
    setAuthor('')
    setYear('')
    setKeyword('')
    setSort('newest')
    router.push('/projects')
  }

  const filterSidebar = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Quick Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Title, Author, or Keyword"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Department</h3>
        <div className="space-y-2">
          {DEPARTMENTS.map((d) => {
            const selected = !otherDeptOpen && department === d
            return (
              <button
                type="button"
                key={d}
                onClick={() => {
                  setOtherDeptOpen(false)
                  setDepartment(selected ? '' : d)
                }}
                className="flex w-full items-center gap-2 text-left text-sm text-slate-600 dark:text-slate-400"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-blue-600' : 'border-slate-300 dark:border-zinc-600'}`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </span>
                {d}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => {
              if (otherDeptOpen) {
                setOtherDeptOpen(false)
                setDepartment('')
              } else {
                setOtherDeptOpen(true)
              }
            }}
            className="flex w-full items-center gap-2 text-left text-sm text-slate-600 dark:text-slate-400"
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${otherDeptOpen ? 'border-blue-600' : 'border-slate-300 dark:border-zinc-600'}`}>
              {otherDeptOpen && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </span>
            Other
          </button>
        </div>

        {otherDeptOpen && (
          <>
            <input
              type="text"
              list="extended-department-options"
              value={isOtherDept ? department : ''}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Type to search departments..."
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
            <datalist id="extended-department-options">
              {EXTENDED_DEPARTMENTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Project Type</h3>
        <div className="space-y-2">
          {PROJECT_TYPES.map((t) => {
            const selected = projectType === t
            return (
              <button
                type="button"
                key={t}
                onClick={() => setProjectType(selected ? '' : t)}
                className="flex w-full items-center gap-2 text-left text-sm text-slate-600 dark:text-slate-400"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-blue-600' : 'border-slate-300 dark:border-zinc-600'}`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </span>
                {t}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Academic Year</h3>
        <div className="relative pt-1">
          <input
            type="range"
            min={MIN_ACADEMIC_YEAR}
            max={currentYear}
            value={year ? parseInt(year) : currentYear}
            onChange={(e) => setYear(e.target.value)}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{MIN_ACADEMIC_YEAR}</span>
            <span>{year || currentYear}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Popular Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {KEYWORDS.map((k) => (
            <button
              key={k}
              onClick={() => setKeyword(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                keyword === k
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-400 dark:hover:bg-zinc-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" /> Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Projects</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Discover and learn from peer-reviewed academic projects across all departments.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Filters</h2>
            </div>
            {filterSidebar}
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {loading ? 'Searching...' : `${projects?.length || 0} Results Found`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="most-downloaded">Most Downloaded</option>
                  <option value="department">Department</option>
                </select>
              </div>
            </div>
          </div>

          {mobileFiltersOpen && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm lg:hidden dark:bg-zinc-900">
              {filterSidebar}
            </div>
          )}

          {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
              ))}
            </div>
          ) : projects && projects.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm dark:bg-zinc-900">
              <p className="text-lg font-medium text-slate-900 dark:text-white">No matching projects found</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Try different keywords or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects?.map((p) => (
                <ProjectListItem key={p.projectId} project={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectListItem({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-zinc-800 dark:text-slate-300">{project.academicYear}</span>
            <span>{project.department}</span>
            {project.keywords.slice(0, 2).map((k) => (
              <span key={k} className="text-blue-600 dark:text-blue-400">{k}</span>
            ))}
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
            <a href={`/projects/${project.projectId}`}>{project.title}</a>
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            {project.authorName} · {project.projectId.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{project.abstract}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {project.downloadCount || 0} downloads</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {project.viewCount || 0} views</span>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:flex-col lg:items-end">
          <a
            href={`/projects/${project.projectId}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
          >
            View Details
          </a>
          <a
            href={`/api/download/${project.projectId}?type=pdf`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
