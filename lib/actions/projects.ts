'use server'

import { cookies } from 'next/headers'
import { createAuthClient, supabaseAdmin } from '@/lib/supabase-server'
import { getCurrentUser, requireAdmin, requireAuth, requireUploaderOrAdmin } from '@/lib/auth'
import type { Bookmark, Project, SortOption, User } from '@/lib/types'
import { createNotification } from '@/lib/actions/notifications'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGES = 5
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function downloadApiUrl(projectId: string, type: 'pdf' | 'zip') {
  return `/api/download/${projectId}?type=${type}`
}

function newId() {
  return crypto.randomUUID()
}

export async function getApprovedProjects(options: { sort?: SortOption; limit?: number; cursor?: string } = {}) {
  await requireAuth()
  const { sort = 'newest', limit = 50, cursor } = options

  let query = supabaseAdmin.from('projects').select('*').eq('status', 'Approved')

  if (sort === 'newest') query = query.order('uploadDate', { ascending: false })
  else if (sort === 'most-downloaded') query = query.order('downloadCount', { ascending: false })
  else if (sort === 'department') {
    query = query.order('department', { ascending: true }).order('title', { ascending: true })
  }

  query = query.limit(limit)

  if (cursor) {
    const { data, error } = await supabaseAdmin.from('projects').select('uploadDate').eq('projectId', cursor).single()
    if (data) query = query.gt('uploadDate', data.uploadDate)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Project[]
}

export async function searchProjects(options: {
  title?: string
  department?: string
  author?: string
  year?: string
  keyword?: string
  projectType?: string
  sort?: SortOption
} = {}) {
  await requireAuth()
  const { title, department, author, year, keyword, projectType, sort = 'newest' } = options

  let query = supabaseAdmin.from('projects').select('*').eq('status', 'Approved')

  if (department) query = query.eq('department', department)
  if (year) query = query.eq('academicYear', year)
  if (projectType) query = query.eq('projectType', projectType)

  if (sort === 'newest') query = query.order('uploadDate', { ascending: false })
  else if (sort === 'most-downloaded') query = query.order('downloadCount', { ascending: false })
  else if (sort === 'department') {
    query = query.order('department', { ascending: true }).order('title', { ascending: true })
  }

  const { data, error } = await query.limit(200)
  if (error) throw new Error(error.message)
  let projects = (data || []) as Project[]

  const t = (title || '').trim().toLowerCase()
  const a = (author || '').trim().toLowerCase()
  const k = (keyword || '').trim().toLowerCase()

  if (t) projects = projects.filter((p) => p.title.toLowerCase().includes(t))
  if (a) projects = projects.filter((p) => p.authorName.toLowerCase().includes(a))
  if (k) {
    projects = projects.filter((p) =>
      p.keywords.some((kw) => kw.toLowerCase().includes(k)) ||
      p.title.toLowerCase().includes(k) ||
      p.abstract.toLowerCase().includes(k)
    )
  }

  return projects
}

export async function getProjectById(id: string): Promise<Project | null> {
  await requireAuth()
  const { data, error } = await supabaseAdmin.from('projects').select('*').eq('projectId', id).single()
  if (error || !data) return null
  return data as Project
}

export async function getProjectByIdWithAuth(id: string) {
  const user = await requireAuth()
  const project = await getProjectById(id)
  if (!project) return null

  if (project.status === 'Approved') return project
  if (user.role === 'admin' || user.userId === project.uploaderId) return project

  throw new Error('Forbidden')
}

export async function getProjectImageUrls(id: string): Promise<string[]> {
  const project = await getProjectByIdWithAuth(id)
  if (!project || !project.images?.length) return []

  const urls = await Promise.all(
    project.images.map(async (path) => {
      const { data, error } = await supabaseAdmin.storage.from('projects').createSignedUrl(path, 60 * 60)
      if (error || !data) return null
      return data.signedUrl
    })
  )

  return urls.filter((u): u is string => !!u)
}

export async function getRelatedProjects(department: string, excludeId: string, limit = 3) {
  await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('status', 'Approved')
    .eq('department', department)
    .neq('projectId', excludeId)
    .order('uploadDate', { ascending: false })
    .limit(limit + 1)

  if (error) throw new Error(error.message)
  return ((data || []) as Project[])
    .filter((p) => p.projectId !== excludeId)
    .slice(0, limit)
}

export async function recordView(projectId: string) {
  const cookieStore = await cookies()
  const viewedRaw = cookieStore.get('viewed_projects')?.value || '[]'
  let viewed: string[] = []
  try {
    viewed = JSON.parse(viewedRaw)
  } catch {
    viewed = []
  }

  if (viewed.includes(projectId)) return

  const { error } = await supabaseAdmin.rpc('increment_view_count', { p_project_id: projectId })
  if (error) return

  cookieStore.set('viewed_projects', JSON.stringify([...viewed, projectId]), { path: '/', maxAge: 60 * 60 * 24 })
}

export async function recordDownload(projectId: string) {
  const { user } = await getCurrentUser()
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found')

  if (project.status !== 'Approved') {
    await requireUploaderOrAdmin(project.uploaderId)
  }

  await supabaseAdmin.rpc('increment_download_count', { p_project_id: projectId })

  await supabaseAdmin.from('downloads').insert({
    userId: user?.userId,
    projectId,
    downloadDate: new Date().toISOString(),
  })
}

export async function toggleHelpful(projectId: string) {
  const user = await requireAuth()
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found')

  const { data, error } = await supabaseAdmin
    .rpc('toggle_helpful', { p_project_id: projectId, p_user_id: user.userId })
    .single()
  if (error) throw new Error(error.message)

  return data as { isHelpful: boolean; helpfulCount: number }
}

export async function getMyProjects(): Promise<Project[]> {
  const user = await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('uploaderId', user.userId)
    .order('uploadDate', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as Project[]
}

export async function getStudentStats() {
  const user = await requireAuth()

  const { data: uploads, error: uploadsError } = await supabaseAdmin
    .from('projects')
    .select('downloadCount, status, uploadDate')
    .eq('uploaderId', user.userId)

  if (uploadsError) throw new Error(uploadsError.message)

  const { count: bookmarksCount, error: bookmarksError } = await supabaseAdmin
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('userId', user.userId)

  if (bookmarksError) throw new Error(bookmarksError.message)

  const totalUploads = uploads?.length || 0
  const totalDownloads = (uploads || []).reduce((sum, p) => sum + ((p as Project).downloadCount || 0), 0)
  const totalBookmarks = bookmarksCount || 0

  const pendingApprovals = (uploads || []).filter((p) => (p as Project).status === 'Pending').length

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const uploadsThisWeek = (uploads || []).filter(
    (p) => (p as Project).uploadDate >= oneWeekAgo
  ).length

  return { totalUploads, totalDownloads, totalBookmarks, pendingApprovals, uploadsThisWeek }
}

type ProjectUploadMetadata = {
  title: string
  authorName: string
  department: string
  academicYear: string
  abstract: string
  projectType: string
  githubUrl?: string
  liveUrl?: string
  keywords: string
}

type UploadFileDescriptor = {
  kind: 'pdf' | 'zip' | 'image'
  name: string
  size: number
  type: string
}

type PreparedUpload = UploadFileDescriptor & { path: string; token: string }

function validateUpload(metadata: ProjectUploadMetadata, files: UploadFileDescriptor[]) {
  const title = String(metadata.title || '').trim()
  const authorName = String(metadata.authorName || '').trim()
  const department = String(metadata.department || '').trim()
  const academicYear = String(metadata.academicYear || '').trim()
  const abstract = String(metadata.abstract || '').trim()
  const projectType = String(metadata.projectType || '').trim()
  const githubUrl = String(metadata.githubUrl || '').trim() || undefined
  const liveUrl = String(metadata.liveUrl || '').trim() || undefined
  const keywords = String(metadata.keywords || '').split(',').map((keyword) => keyword.trim()).filter(Boolean)

  if (!title || !authorName || !department || !academicYear || !abstract || !projectType || !keywords.length) {
    throw new Error('Please fill in all required fields')
  }

  const pdfs = files.filter((file) => file.kind === 'pdf')
  const zips = files.filter((file) => file.kind === 'zip')
  const images = files.filter((file) => file.kind === 'image')
  if (pdfs.length > 1 || zips.length > 1) throw new Error('Only one PDF and one ZIP file may be uploaded')
  if (!pdfs.length && !zips.length && !githubUrl && !liveUrl && !images.length) {
    throw new Error('Please provide at least one of: PDF, GitHub link, live/external link, or images')
  }

  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size <= 0) throw new Error('Selected files must not be empty')
    const lowerName = String(file.name || '').toLowerCase()
    if (file.kind === 'pdf' && (file.size > MAX_FILE_SIZE || (file.type !== 'application/pdf' && !lowerName.endsWith('.pdf')))) {
      throw new Error(file.size > MAX_FILE_SIZE ? 'PDF file exceeds 50MB limit' : 'Only PDF files are allowed for the document')
    }
    if (file.kind === 'zip' && (file.size > MAX_FILE_SIZE || !lowerName.endsWith('.zip'))) {
      throw new Error(file.size > MAX_FILE_SIZE ? 'ZIP file exceeds 50MB limit' : 'Only ZIP files are allowed for source code')
    }
  }
  if (images.length > MAX_IMAGES) throw new Error(`You can upload at most ${MAX_IMAGES} images`)
  for (const image of images) {
    if (image.size > MAX_IMAGE_SIZE) throw new Error('Each image must be under 10MB')
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) throw new Error('Images must be JPEG, PNG, WEBP, or GIF')
  }

  return { title, authorName, department, academicYear, abstract, projectType, githubUrl, liveUrl, keywords }
}

function uploadPaths(projectId: string, files: UploadFileDescriptor[]) {
  let imageIndex = 0
  return files.map((file) => {
    if (file.kind === 'pdf') return `projects/${projectId}/document.pdf`
    if (file.kind === 'zip') return `projects/${projectId}/source.zip`
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg'
    return `projects/${projectId}/images/${imageIndex++}.${ext}`
  })
}

async function requireUploadRole() {
  const user = await requireAuth()
  if (user.role !== 'student' && user.role !== 'admin') throw new Error('Only students and admins can upload projects')
  return user
}

export async function prepareProjectUpload(metadata: ProjectUploadMetadata, files: UploadFileDescriptor[]) {
  try {
    await requireUploadRole()
    validateUpload(metadata, files)

    const projectId = newId()
    const paths = uploadPaths(projectId, files)
    const uploads = await Promise.all(files.map(async (file, index): Promise<PreparedUpload> => {
      const path = paths[index]
      const { data, error } = await supabaseAdmin.storage.from('projects').createSignedUploadUrl(path)
      if (error || !data) throw new Error(`Could not prepare ${file.name}: ${error?.message || 'unknown storage error'}`)
      return { ...file, path, token: data.token }
    }))

    return { ok: true as const, projectId, uploads }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Could not prepare project upload' }
  }
}

async function finalizeProjectUpload(projectId: string, metadata: ProjectUploadMetadata, files: UploadFileDescriptor[]) {
  const user = await requireUploadRole()
  const values = validateUpload(metadata, files)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) {
    throw new Error('Invalid upload session')
  }

  const paths = uploadPaths(projectId, files)
  for (let index = 0; index < paths.length; index++) {
    const path = paths[index]
    const slash = path.lastIndexOf('/')
    const { data, error } = await supabaseAdmin.storage.from('projects').list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 2 })
    const object = data?.find((item) => item.name === path.slice(slash + 1))
    if (error || !object) throw new Error(`Upload incomplete: ${files[index].name} was not received`)
    const storedSize = Number(object.metadata?.size)
    if (Number.isFinite(storedSize) && storedSize !== files[index].size) throw new Error(`Upload incomplete: ${files[index].name} has an unexpected size`)
  }

  const pdfPath = files.findIndex((file) => file.kind === 'pdf')
  const zipPath = files.findIndex((file) => file.kind === 'zip')
  const imagePaths = paths.filter((_, index) => files[index].kind === 'image')
  const project: Project = {
    projectId,
    ...values,
    projectType: values.projectType as Project['projectType'],
    pdfUrl: pdfPath >= 0 ? downloadApiUrl(projectId, 'pdf') : undefined,
    pdfPath: pdfPath >= 0 ? paths[pdfPath] : undefined,
    sourceCodeZipUrl: zipPath >= 0 ? downloadApiUrl(projectId, 'zip') : undefined,
    sourceCodeZipPath: zipPath >= 0 ? paths[zipPath] : undefined,
    images: imagePaths.length ? imagePaths : undefined,
    status: 'Pending',
    uploadDate: new Date().toISOString(),
    downloadCount: 0,
    viewCount: 0,
    helpfulCount: 0,
    helpfulBy: [],
    uploaderId: user.userId,
  }

  const { error } = await supabaseAdmin.from('projects').insert(project)
  if (error) {
    await supabaseAdmin.storage.from('projects').remove(paths)
    throw new Error(`Could not finalize project: ${error.message}`)
  }

  const { data: admins } = await supabaseAdmin.from('users').select('userId').eq('role', 'admin')
  if (admins) {
    await Promise.allSettled(admins.map((admin) => createNotification((admin as User).userId, `New project pending review: ${values.title}`)))
  }

  return { projectId }
}

export async function uploadProject(projectId: string, metadata: ProjectUploadMetadata, files: UploadFileDescriptor[]) {
  try {
    const project = await finalizeProjectUpload(projectId, metadata, files)
    return { ok: true as const, ...project }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Could not finalize project upload' }
  }
}

export async function getAllProjects(status?: 'Pending' | 'Approved' | 'Rejected') {
  await requireAdmin()
  let query = supabaseAdmin.from('projects').select('*')
  if (status) query = query.eq('status', status)
  query = query.order('uploadDate', { ascending: false })

  const { data, error } = await query.limit(200)
  if (error) throw new Error(error.message)
  return (data || []) as Project[]
}

export async function approveOrRejectProject(projectId: string, status: 'Approved' | 'Rejected') {
  await requireAdmin()
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found')

  const { error } = await supabaseAdmin.from('projects').update({ status }).eq('projectId', projectId)
  if (error) throw new Error(error.message)

  await createNotification(
    project.uploaderId,
    `Your project "${project.title}" has been ${status.toLowerCase()}`
  )
}

export async function deleteProject(projectId: string) {
  const user = await requireAuth()
  const { data, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('projectId', projectId)
    .single()

  if (projectError || !data) throw new Error('Project not found')
  const project = data as Project
  const isUploader = project.uploaderId === user.userId
  const studentCanDelete = isUploader && (project.status === 'Pending' || project.status === 'Rejected')
  if (user.role !== 'admin' && !studentCanDelete) {
    throw new Error(project.status === 'Approved' ? 'Approved projects can only be deleted by an administrator' : 'You cannot delete this project')
  }

  const paths = [project.pdfPath, project.sourceCodeZipPath, ...(project.images || [])].filter(
    (path): path is string => !!path
  )
  if (paths.length) {
    const { error } = await supabaseAdmin.storage.from('projects').remove(paths)
    if (error) throw new Error(`Could not delete project files: ${error.message}`)
  }

  const { error } = await supabaseAdmin.from('projects').delete().eq('projectId', projectId)
  if (error) throw new Error(`Could not delete project: ${error.message}`)
}

export async function getRepositoryStats() {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('department, downloadCount, uploadDate')
    .eq('status', 'Approved')

  if (error) throw new Error(error.message)

  const projects = (data || []) as Project[]
  const projectCount = projects.length
  const departmentCount = new Set(projects.map((p) => p.department)).size
  const downloadCount = projects.reduce((sum, p) => sum + (p.downloadCount || 0), 0)

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const projectsThisWeek = projects.filter((p) => p.uploadDate >= oneWeekAgo).length

  const departmentCounts: Record<string, number> = {}
  projects.forEach((p) => {
    departmentCounts[p.department] = (departmentCounts[p.department] || 0) + 1
  })

  return { projectCount, departmentCount, downloadCount, departmentCounts, projectsThisWeek }
}

export async function getProjectStats() {
  const { count: totalProjects, error: pErr } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
  if (pErr) throw new Error(pErr.message)

  const { count: totalUsers, error: uErr } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
  if (uErr) throw new Error(uErr.message)

  const { count: totalDownloads, error: dErr } = await supabaseAdmin
    .from('downloads')
    .select('*', { count: 'exact', head: true })
  if (dErr) throw new Error(dErr.message)

  const { data: allProjects, error: qErr } = await supabaseAdmin.from('projects').select('*')
  if (qErr) throw new Error(qErr.message)

  const departmentCounts: Record<string, number> = {}
  const uploadsPerMonth: Record<string, number> = {}

  ;(allProjects || []).forEach((p) => {
    const project = p as Project
    departmentCounts[project.department] = (departmentCounts[project.department] || 0) + 1
    const month = project.uploadDate.slice(0, 7)
    uploadsPerMonth[month] = (uploadsPerMonth[month] || 0) + 1
  })

  const topDepartments = Object.entries(departmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const uploadsByMonth = Object.entries(uploadsPerMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }))

  return {
    totalProjects: totalProjects || 0,
    totalUsers: totalUsers || 0,
    totalDownloads: totalDownloads || 0,
    topDepartments,
    uploadsByMonth,
  }
}

export async function getMyBookmarks() {
  const user = await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('bookmarks')
    .select('projectId')
    .eq('userId', user.userId)
    .order('bookmarkDate', { ascending: false })

  if (error) throw new Error(error.message)

  const projectIds = ((data || []) as Bookmark[]).map((b) => b.projectId)
  if (!projectIds.length) return []

  const { data: projects, error: pErr } = await supabaseAdmin
    .from('projects')
    .select('*')
    .in('projectId', projectIds)

  if (pErr) throw new Error(pErr.message)
  return (projects || []) as Project[]
}

export async function toggleBookmark(projectId: string) {
  const user = await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('bookmarks')
    .select('bookmarkId')
    .eq('userId', user.userId)
    .eq('projectId', projectId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  if (!data) {
    await supabaseAdmin.from('bookmarks').insert({
      userId: user.userId,
      projectId,
      bookmarkDate: new Date().toISOString(),
    })
    return true
  } else {
    await supabaseAdmin.from('bookmarks').delete().eq('bookmarkId', (data as Bookmark).bookmarkId)
    return false
  }
}

export async function isBookmarked(projectId: string) {
  const user = await requireAuth()
  const { data, error } = await supabaseAdmin
    .from('bookmarks')
    .select('bookmarkId')
    .eq('userId', user.userId)
    .eq('projectId', projectId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return !!data
}

