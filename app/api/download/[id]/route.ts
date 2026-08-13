import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { recordDownload } from '@/lib/actions/projects'
import type { Project } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') as 'pdf' | 'zip' | null
  const isPreview = searchParams.has('preview')

  if (!type || (type !== 'pdf' && type !== 'zip')) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  try {
    const { user } = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin.from('projects').select('*').eq('projectId', id).single()
    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = data as Project

    if (project.status !== 'Approved' && user.role !== 'admin' && user.userId !== project.uploaderId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const filePath = type === 'pdf' ? project.pdfPath : project.sourceCodeZipPath
    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
      .from('projects')
      .createSignedUrl(
        filePath,
        60 * 60,
        isPreview ? undefined : { download: `${project.title}.${type}` }
      )

    if (signError || !signedUrlData) {
      return NextResponse.json({ error: signError?.message || 'Failed to generate download URL' }, { status: 500 })
    }

    if (!isPreview) await recordDownload(id)

    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
