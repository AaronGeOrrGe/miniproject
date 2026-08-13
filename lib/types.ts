export type UserRole = 'student' | 'admin'

export interface User {
  userId: string
  fullName: string
  email: string
  role: UserRole
  department: string
  indexNumber?: string
  programme?: string
  levelYear?: string
  contact?: string
  active?: boolean
  avatarUrl?: string
  dateCreated: string
}

export type ProjectStatus = 'Pending' | 'Approved' | 'Rejected'

export type ProjectType = 'Research Paper' | 'Software / App' | 'Website' | 'Design / Art' | 'Other'

export interface Project {
  projectId: string
  title: string
  authorName: string
  department: string
  academicYear: string
  abstract: string
  keywords: string[]
  projectType: ProjectType
  pdfUrl?: string
  pdfPath?: string
  githubUrl?: string
  sourceCodeZipUrl?: string
  sourceCodeZipPath?: string
  liveUrl?: string
  images?: string[]
  status: ProjectStatus
  uploadDate: string
  downloadCount: number
  viewCount: number
  helpfulCount: number
  helpfulBy: string[]
  uploaderId: string
}

export interface Download {
  downloadId: string
  userId?: string
  projectId: string
  downloadDate: string
}

export interface Bookmark {
  bookmarkId: string
  userId: string
  projectId: string
  bookmarkDate: string
}

export interface Notification {
  notificationId: string
  userId: string
  message: string
  status: 'unread' | 'read'
  dateCreated: string
}

export type SortOption = 'newest' | 'most-downloaded' | 'department'
