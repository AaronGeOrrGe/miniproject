'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  ExternalLink,
  ThumbsUp,
  Bookmark,
  BookOpen,
  Eye,
  Quote,
  Check,
  ArrowLeft,
  Code2,
  FileText,
  Images,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { recordView, toggleHelpful, toggleBookmark, isBookmarked, getProjectImageUrls } from '@/lib/actions/projects'
import { useAuth } from './AuthProvider'
import { ProjectCard } from './ProjectCard'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { GitHubRepoViewer } from './GitHubRepoViewer'
import type { Project } from '@/lib/types'

export function ProjectDetailClient({
  project,
  related,
}: {
  project: Project
  related: Project[]
}) {
  const { user } = useAuth()
  const router = useRouter()

  const [helpful, setHelpful] = useState(project.helpfulCount || 0)
  const [voted, setVoted] = useState(project.helpfulBy?.includes(user?.userId || '') || false)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'source' | 'gallery'>('overview')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [fullscreenPdf, setFullscreenPdf] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const hasImages = !!project.images?.length

  useEffect(() => {
    if (!fullscreenPdf && lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenPdf(false)
        setLightboxIndex(null)
      } else if (lightboxIndex !== null && e.key === 'ArrowRight') {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % imageUrls.length))
      } else if (lightboxIndex !== null && e.key === 'ArrowLeft') {
        setLightboxIndex((i) => (i === null ? null : (i - 1 + imageUrls.length) % imageUrls.length))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenPdf, lightboxIndex, imageUrls.length])

  useEffect(() => {
    recordView(project.projectId)
  }, [project.projectId])

  useEffect(() => {
    if (user) {
      isBookmarked(project.projectId).then(setBookmarked)
    }
  }, [user, project.projectId])

  useEffect(() => {
    if (hasImages) {
      getProjectImageUrls(project.projectId).then(setImageUrls)
    }
  }, [hasImages, project.projectId])

  const handleHelpful = async () => {
    if (!user) return router.push(`/login?returnUrl=/projects/${project.projectId}`)
    const result = await toggleHelpful(project.projectId)
    setHelpful(result.helpfulCount)
    setVoted(result.isHelpful)
  }

  const handleBookmark = async () => {
    if (!user) return router.push(`/login?returnUrl=/projects/${project.projectId}`)
    await toggleBookmark(project.projectId)
    setBookmarked((prev) => !prev)
  }

  const canPreview = project.status === 'Approved' || user?.role === 'admin' || user?.userId === project.uploaderId
  const hasSource = !!project.githubUrl || !!project.sourceCodeZipUrl

  const apa = `${project.authorName}. (${project.academicYear}). ${project.title}. ${project.department}.`
  const bibtex = `@misc{${project.projectId},
  author = {${project.authorName}},
  title = {${project.title}},
  year = {${project.academicYear}},
  note = {${project.department}}
}`

  const copyCitation = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-lg text-foreground/70">
            {project.authorName} &bull; {project.department} &bull; {project.academicYear}
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              {project.projectType}
            </span>
          </p>
        </div>
        {project.status !== 'Approved' && <ProjectStatusBadge status={project.status} />}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-2 ring-green-500/30 transition-colors hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4" /> Visit Live Site
          </a>
        )}
        {canPreview && project.pdfUrl && (
          <button
            onClick={() => setFullscreenPdf(true)}
            className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Eye className="h-4 w-4" /> View PDF
          </button>
        )}
        {project.pdfUrl && (
          <a
            href={`/api/download/${project.projectId}?type=pdf`}
            className="flex items-center gap-2 rounded-md border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        )}
        {project.sourceCodeZipUrl && (
          <a
            href={`/api/download/${project.projectId}?type=zip`}
            className="flex items-center gap-2 rounded-md border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            <Download className="h-4 w-4" /> Download ZIP
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            <ExternalLink className="h-4 w-4" /> GitHub
          </a>
        )}
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${
            voted
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
              : 'border-foreground/10 hover:bg-foreground/5'
          }`}
        >
          <ThumbsUp className="h-4 w-4" /> Helpful ({helpful})
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${
            bookmarked
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
              : 'border-foreground/10 hover:bg-foreground/5'
          }`}
        >
          <Bookmark className="h-4 w-4" /> {bookmarked ? 'Saved' : 'Bookmark'}
        </button>
        <div className="relative group">
          <button
            className="flex items-center gap-2 rounded-md border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            <Quote className="h-4 w-4" /> Cite
          </button>
          <div className="absolute right-0 z-10 mt-2 hidden w-80 rounded-lg border border-foreground/10 bg-white p-3 shadow-lg group-hover:block dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase text-foreground/50">APA</p>
            <p className="mt-1 text-sm">{apa}</p>
            <button
              onClick={() => copyCitation(apa)}
              className="mt-2 text-xs font-medium text-foreground/70 hover:text-foreground"
            >
              {copied ? <Check className="inline h-3 w-3" /> : 'Copy APA'}
            </button>
            <p className="mt-3 text-xs font-semibold uppercase text-foreground/50">BibTeX</p>
            <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs">{bibtex}</pre>
            <button
              onClick={() => copyCitation(bibtex)}
              className="mt-2 text-xs font-medium text-foreground/70 hover:text-foreground"
            >
              {copied ? <Check className="inline h-3 w-3" /> : 'Copy BibTeX'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm text-foreground/60">
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {project.viewCount || 0} views</span>
        <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {project.downloadCount || 0} downloads</span>
        <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {helpful} helpful</span>
      </div>

      <div className="mt-6 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('source')}
            disabled={!hasSource}
            className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'source'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:hover:text-slate-400 dark:text-slate-400 dark:hover:text-slate-200 dark:disabled:text-slate-600'
            }`}
          >
            <Code2 className="h-4 w-4" /> Source Code
            {project.githubUrl && (
              <span className="flex h-2 w-2 rounded-full bg-green-500" title="GitHub repo attached" />
            )}
          </button>
          {hasImages && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Images className="h-4 w-4" /> Gallery
            </button>
          )}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold">Abstract</h2>
              <p className="mt-2 whitespace-pre-wrap text-foreground/80">{project.abstract}</p>

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase text-foreground/50">Keywords</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-foreground/5 px-3 py-1 text-sm text-foreground/70">{k}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Related Projects</h3>
              {related.length === 0 ? (
                <p className="mt-2 text-sm text-foreground/60">No related projects found.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {related.map((p) => <ProjectCard key={p.projectId} project={p} />)}
                </div>
              )}
            </div>
          </div>

          {canPreview && project.pdfUrl && (
            <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-5xl items-center justify-between">
                <h3 className="text-lg font-semibold">PDF Preview</h3>
                <button
                  onClick={() => setFullscreenPdf(true)}
                  className="flex items-center gap-2 rounded-md border border-foreground/10 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5"
                >
                  <Maximize2 className="h-4 w-4" /> Full screen
                </button>
              </div>
              <iframe
                src={`/api/download/${project.projectId}?type=pdf&preview=1`}
                title="PDF preview"
                className="mt-2 h-[85vh] min-h-[600px] w-full rounded-lg border border-foreground/10 bg-white"
              />
            </div>
          )}
        </>
      )}

      {fullscreenPdf && project.pdfUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
            <button
              onClick={() => setFullscreenPdf(false)}
              className="flex items-center gap-2 text-sm font-medium text-white hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <p className="truncate text-sm font-medium text-white">{project.title}</p>
            <button
              onClick={() => setFullscreenPdf(false)}
              aria-label="Close full screen"
              className="rounded-full p-1.5 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            src={`/api/download/${project.projectId}?type=pdf&preview=1`}
            title="PDF preview full screen"
            className="flex-1 w-full bg-white"
          />
        </div>
      )}

      {activeTab === 'source' && (
        <div className={project.githubUrl ? 'relative left-1/2 mt-8 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8' : 'mt-8'}>
          {project.githubUrl ? (
            <GitHubRepoViewer githubUrl={project.githubUrl} />
          ) : project.sourceCodeZipUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A source code ZIP was uploaded for this project.
              </p>
              <a
                href={`/api/download/${project.projectId}?type=zip`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-4 w-4" /> Download Source Code
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No source code available for this project.</p>
          )}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="mt-8">
          {imageUrls.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading images...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {imageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="block overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${project.title} screenshot ${i + 1}`} className="h-56 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && imageUrls[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
            <button
              onClick={() => setLightboxIndex(null)}
              className="flex items-center gap-2 text-sm font-medium text-white hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <p className="truncate text-sm font-medium text-white">
              {project.title} &middot; {lightboxIndex + 1} / {imageUrls.length}
            </p>
            <button
              onClick={() => setLightboxIndex(null)}
              aria-label="Close"
              className="rounded-full p-1.5 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {imageUrls.length > 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i === null ? null : (i - 1 + imageUrls.length) % imageUrls.length))}
                aria-label="Previous image"
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[lightboxIndex]}
              alt={`${project.title} screenshot ${lightboxIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            {imageUrls.length > 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i === null ? null : (i + 1) % imageUrls.length))}
                aria-label="Next image"
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
