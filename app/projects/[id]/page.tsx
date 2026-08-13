import { notFound } from 'next/navigation'
import { getProjectByIdWithAuth, getRelatedProjects } from '@/lib/actions/projects'
import { ProjectDetailClient } from '@/components/ProjectDetailClient'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectByIdWithAuth(id)

  if (!project) notFound()

  const related = await getRelatedProjects(project.department, project.projectId, 3)

  return <ProjectDetailClient project={project} related={related} />
}
