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

export async function uploadProject(formData: FormData) {
  const user = await requireAuth()
  if (user.role !== 'student' && user.role !== 'admin') {
    throw new Error('Only students and admins can upload projects')
  }

  const title = String(formData.get('title') || '').trim()
  const authorName = String(formData.get('authorName') || '').trim()
  const department = String(formData.get('department') || '').trim()
  const academicYear = String(formData.get('academicYear') || '').trim()
  const abstract = String(formData.get('abstract') || '').trim()
  const projectType = String(formData.get('projectType') || '').trim()
  const githubUrl = String(formData.get('githubUrl') || '').trim() || undefined
  const liveUrl = String(formData.get('liveUrl') || '').trim() || undefined
  const keywordsRaw = String(formData.get('keywords') || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const pdfFile = formData.get('pdf') as File | null
  const zipFile = formData.get('zip') as File | null
  const imageFiles = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)

  if (!title || !authorName || !department || !academicYear || !abstract || !projectType || !keywordsRaw.length) {
    throw new Error('Please fill in all required fields')
  }

  const hasPdf = !!pdfFile && pdfFile.size > 0
  const hasZip = !!zipFile && zipFile.size > 0
  if (!hasPdf && !hasZip && !githubUrl && !liveUrl && imageFiles.length === 0) {
    throw new Error('Please provide at least one of: PDF, GitHub link, live/external link, or images')
  }

  if (hasPdf && pdfFile!.size > MAX_FILE_SIZE) throw new Error('PDF file exceeds 50MB limit')
  if (hasZip && zipFile!.size > MAX_FILE_SIZE) throw new Error('ZIP file exceeds 50MB limit')
  if (hasPdf && pdfFile!.type !== 'application/pdf' && !pdfFile!.name.endsWith('.pdf')) {
    throw new Error('Only PDF files are allowed for the document')
  }
  if (hasZip && !zipFile!.name.endsWith('.zip')) throw new Error('Only ZIP files are allowed for source code')

  if (imageFiles.length > MAX_IMAGES) throw new Error(`You can upload at most ${MAX_IMAGES} images`)
  for (const img of imageFiles) {
    if (img.size > MAX_IMAGE_SIZE) throw new Error('Each image must be under 10MB')
    if (!ALLOWED_IMAGE_TYPES.includes(img.type)) throw new Error('Images must be JPEG, PNG, WEBP, or GIF')
  }

  const projectId = newId()

  async function uploadFile(file: File, path: string) {
    const { error } = await supabaseAdmin.storage.from('projects').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
    })
    if (error) throw new Error(error.message)
    return path
  }

  let pdfPath: string | undefined
  if (hasPdf) {
    pdfPath = `projects/${projectId}/document.pdf`
    await uploadFile(pdfFile!, pdfPath)
  }

  let zipPath: string | undefined
  if (hasZip) {
    zipPath = `projects/${projectId}/source.zip`
    await uploadFile(zipFile!, zipPath)
  }

  const imagePaths: string[] = []
  for (let i = 0; i < imageFiles.length; i++) {
    const img = imageFiles[i]
    const ext = img.type === 'image/png' ? 'png' : img.type === 'image/webp' ? 'webp' : img.type === 'image/gif' ? 'gif' : 'jpg'
    const imgPath = `projects/${projectId}/images/${i}.${ext}`
    await uploadFile(img, imgPath)
    imagePaths.push(imgPath)
  }

  const project: Project = {
    projectId,
    title,
    authorName,
    department,
    academicYear,
    abstract,
    keywords: keywordsRaw,
    projectType: projectType as Project['projectType'],
    pdfUrl: pdfPath ? downloadApiUrl(projectId, 'pdf') : undefined,
    pdfPath,
    githubUrl,
    sourceCodeZipUrl: zipPath ? downloadApiUrl(projectId, 'zip') : undefined,
    sourceCodeZipPath: zipPath,
    liveUrl,
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
  if (error) throw new Error(error.message)

  const { data: admins } = await supabaseAdmin.from('users').select('userId').eq('role', 'admin')
  if (admins) {
    await Promise.all(
      admins.map((admin) => createNotification((admin as User).userId, `New project pending review: ${title}`))
    )
  }

  return { projectId }
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
  await requireAdmin()
  const project = await getProjectById(projectId)
  if (project) {
    const paths = [project.pdfPath, project.sourceCodeZipPath, ...(project.images || [])].filter(
      (p): p is string => !!p
    )
    if (paths.length) await supabaseAdmin.storage.from('projects').remove(paths)
  }
  await supabaseAdmin.from('downloads').delete().eq('projectId', projectId)
  await supabaseAdmin.from('bookmarks').delete().eq('projectId', projectId)
  await supabaseAdmin.from('projects').delete().eq('projectId', projectId)
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

