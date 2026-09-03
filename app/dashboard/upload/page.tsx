'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle } from 'lucide-react'
import { prepareProjectUpload, uploadProject } from '@/lib/actions/projects'
import { PROJECT_TYPES, ALL_DEPARTMENTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase-client'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pdfRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<HTMLInputElement>(null)
  const [liveUrl, setLiveUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const hasPdf = !!pdfRef.current?.files?.length
    const hasZip = !!zipRef.current?.files?.length
    const hasImages = !!imagesRef.current?.files?.length
    if (!hasPdf && !hasZip && !githubUrl.trim() && !liveUrl.trim() && !hasImages) {
      setError('Please provide at least one of: PDF, GitHub link, live/external link, or images')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const metadata = {
        title: String(formData.get('title') || ''),
        authorName: String(formData.get('authorName') || ''),
        department: String(formData.get('department') || ''),
        academicYear: String(formData.get('academicYear') || ''),
        abstract: String(formData.get('abstract') || ''),
        projectType: String(formData.get('projectType') || ''),
        githubUrl: String(formData.get('githubUrl') || ''),
        liveUrl: String(formData.get('liveUrl') || ''),
        keywords: String(formData.get('keywords') || ''),
      }
      const selectedFiles = [
        ...(pdfRef.current?.files?.[0] ? [{ kind: 'pdf' as const, file: pdfRef.current.files[0] }] : []),
        ...(zipRef.current?.files?.[0] ? [{ kind: 'zip' as const, file: zipRef.current.files[0] }] : []),
        ...Array.from(imagesRef.current?.files || []).map((file) => ({ kind: 'image' as const, file })),
      ]
      const descriptors = selectedFiles.map(({ kind, file }) => ({ kind, name: file.name, size: file.size, type: file.type }))
      const prepared = await prepareProjectUpload(metadata, descriptors)
      const supabase = createClient()

      for (let index = 0; index < prepared.uploads.length; index++) {
        const upload = prepared.uploads[index]
        const file = selectedFiles[index].file
        const { error: uploadError } = await supabase.storage.from('projects').uploadToSignedUrl(upload.path, upload.token, file, {
          contentType: file.type || 'application/octet-stream',
        })
        if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}. Please submit the form again.`)
      }

      await uploadProject(prepared.projectId, metadata, descriptors)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      // Clear file inputs on error so a stale selected file does not resubmit
      if (pdfRef.current) pdfRef.current.value = ''
      if (zipRef.current) zipRef.current.value = ''
      if (imagesRef.current) imagesRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }

  const MAX_SIZE_MB = 50

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload a New Project</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your project will be reviewed by an admin before it is published.</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Project Details</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="title" className={labelClass}>Title *</label>
              <input id="title" name="title" type="text" required className={inputClass} />
            </div>

            <div>
              <label htmlFor="authorName" className={labelClass}>Author name *</label>
              <input id="authorName" name="authorName" type="text" required className={inputClass} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="department" className={labelClass}>Department *</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  list="department-options"
                  required
                  placeholder="Start typing to search departments"
                  className={inputClass}
                />
                <datalist id="department-options">
                  {ALL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="academicYear" className={labelClass}>Academic year *</label>
                <input id="academicYear" name="academicYear" type="text" required placeholder="e.g. 2025" className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="projectType" className={labelClass}>Project type *</label>
              <select id="projectType" name="projectType" required defaultValue="" className={inputClass}>
                <option value="" disabled>Select a project type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="abstract" className={labelClass}>Abstract *</label>
              <textarea id="abstract" name="abstract" required rows={5} className={`${inputClass} resize-none`} />
            </div>

            <div>
              <label htmlFor="keywords" className={labelClass}>Keywords *</label>
              <input id="keywords" name="keywords" type="text" required placeholder="machine learning, education, separated by commas" className={inputClass} />
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 p-4 dark:border-zinc-700">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Project artifacts</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Not every project is a PDF report — provide at least one of the options below: a PDF, a GitHub repo, a live/external link (website, hosted demo, Figma, etc.), or images (screenshots, artwork, diagrams).
              </p>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="githubUrl" className={labelClass}>GitHub URL</label>
                  <input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="liveUrl" className={labelClass}>Live / External URL</label>
                  <input
                    id="liveUrl"
                    name="liveUrl"
                    type="url"
                    placeholder="Website, hosted demo, Figma, Behance..."
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="pdf" className={labelClass}>Project PDF</label>
                  <input
                    id="pdf"
                    ref={pdfRef}
                    name="pdf"
                    type="file"
                    accept="application/pdf"
                    className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF only, max {MAX_SIZE_MB}MB.</p>
                </div>

                <div>
                  <label htmlFor="zip" className={labelClass}>Source code ZIP</label>
                  <input
                    id="zip"
                    ref={zipRef}
                    name="zip"
                    type="file"
                    accept=".zip"
                    className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-zinc-800 dark:file:text-slate-300 dark:hover:file:bg-zinc-700"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ZIP only, max {MAX_SIZE_MB}MB.</p>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="images" className={labelClass}>Images / Screenshots / Artwork</label>
                <input
                  id="images"
                  ref={imagesRef}
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-zinc-800 dark:file:text-slate-300 dark:hover:file:bg-zinc-700"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Up to 5 images, JPEG/PNG/WEBP/GIF, max 10MB each.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {loading ? 'Uploading...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
