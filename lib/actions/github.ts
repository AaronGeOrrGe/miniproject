'use server'

export interface GitHubFile {
  path: string
  type: 'blob' | 'tree'
  sha: string
}

export interface GitHubRepoTree {
  owner: string
  repo: string
  branch: string
  files: GitHubFile[]
}

interface ParsedGitHubUrl {
  owner: string
  repo: string
  branch?: string
  path?: string
}

function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const [owner] = parts
    const repo = parts[1].replace(/\.git$/i, '')
    let branch: string | undefined
    let path: string | undefined
    if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
      branch = parts[3]
      path = parts.slice(4).join('/')
    }
    return { owner, repo, branch, path }
  } catch {
    return null
  }
}

async function fetchGitHub(path: string) {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'student-project-repository',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Repository not found. It may be private, deleted, or the URL may be incorrect.')
    }
    if (res.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN.')
    }
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function getGitHubTree(githubUrl: string): Promise<GitHubRepoTree | null> {
  const parsed = parseGitHubUrl(githubUrl)
  if (!parsed) return null

  const { owner, repo, branch } = parsed
  const repoData = await fetchGitHub(`/repos/${owner}/${repo}`)
  const targetBranch = branch || repoData.default_branch || 'main'

  const treeData = (await fetchGitHub(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(targetBranch)}?recursive=1`
  )) as { tree: { path: string; type: string; sha: string }[] }

  const files = treeData.tree
    .filter((item) => item.type === 'blob' || item.type === 'tree')
    .map((item) => ({
      path: item.path,
      type: item.type as 'blob' | 'tree',
      sha: item.sha,
    }))

  return { owner, repo, branch: targetBranch, files }
}

export async function getGitHubFileContent(githubUrl: string, filePath: string): Promise<string | null> {
  const parsed = parseGitHubUrl(githubUrl)
  if (!parsed) return null

  const { owner, repo, branch } = parsed
  const repoData = await fetchGitHub(`/repos/${owner}/${repo}`)
  const targetBranch = branch || repoData.default_branch || 'main'

  const data = (await fetchGitHub(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(targetBranch)}`
  )) as { content?: string; encoding?: string; type: string }

  if (!data.content || data.encoding !== 'base64') return null

  const buffer = Buffer.from(data.content, 'base64')

  // Skip binary files
  if (buffer.includes(0)) return '[Binary file]'

  return buffer.toString('utf8')
}
