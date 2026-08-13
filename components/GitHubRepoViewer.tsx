'use client'

import { useEffect, useMemo, useState } from 'react'
import { Folder, FileText, ChevronRight, ChevronDown, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { getGitHubFileContent, getGitHubTree, type GitHubFile } from '@/lib/actions/github'

interface TreeNode {
  name: string
  path: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'tree' ? -1 : 1
  })
  for (const node of nodes) {
    if (node.children) sortNodes(node.children)
  }
  return nodes
}

function buildTree(files: GitHubFile[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    if (parts.length === 0) continue
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isLeaf = i === parts.length - 1
      const path = parts.slice(0, i + 1).join('/')
      let existing = current.find((n) => n.name === name)

      if (existing) {
        // If this path segment needs to act as a directory but the existing
        // node was created as a leaf (or has no children array yet), promote it.
        if (!isLeaf && !existing.children) {
          existing.type = 'tree'
          existing.children = []
        }
        if (!isLeaf) {
          current = existing.children!
        }
        continue
      }

      const node: TreeNode = {
        name,
        path,
        type: isLeaf ? file.type : 'tree',
        children: isLeaf ? undefined : [],
      }

      current.push(node)

      if (!isLeaf) {
        current = node.children!
      }
    }
  }

  return sortNodes(root)
}

function FileTree({
  nodes,
  selectedPath,
  onSelect,
  expanded,
  toggleExpand,
  depth = 0,
}: {
  nodes: TreeNode[]
  selectedPath: string | null
  onSelect: (path: string) => void
  expanded: Set<string>
  toggleExpand: (path: string) => void
  depth?: number
}) {
  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'ml-4 space-y-0.5'}>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === 'tree' ? (
            <button
              onClick={() => toggleExpand(node.path)}
              className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-200/60 dark:text-[#c9d1d9] dark:hover:bg-[#21262d]"
              style={{ paddingLeft: `${depth * 0.75}rem` }}
            >
              {expanded.has(node.path) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Folder className="h-4 w-4 text-blue-500 dark:text-[#58a6ff]" />
              {node.name}
            </button>
          ) : (
            <button
              onClick={() => onSelect(node.path)}
              className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-slate-200/60 dark:hover:bg-[#21262d] ${
                selectedPath === node.path
                  ? 'bg-slate-200/60 font-medium text-blue-600 dark:bg-[#21262d] dark:text-[#58a6ff]'
                  : 'text-slate-700 dark:text-[#c9d1d9]'
              }`}
              style={{ paddingLeft: `${depth * 0.75}rem` }}
            >
              <ChevronRight className="h-3.5 w-3.5 text-transparent" />
              <FileText className="h-4 w-4 text-slate-500 dark:text-[#8b949e]" />
              {node.name}
            </button>
          )}
          {node.children && expanded.has(node.path) && (
            <FileTree
              nodes={node.children}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expanded={expanded}
              toggleExpand={toggleExpand}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export function GitHubRepoViewer({ githubUrl }: { githubUrl: string }) {
  const [tree, setTree] = useState<Awaited<ReturnType<typeof getGitHubTree>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const treeNodes = useMemo(() => (tree ? buildTree(tree.files) : []), [tree])

  useEffect(() => {
    setLoading(true)
    setError('')
    getGitHubTree(githubUrl)
      .then((data) => {
        setTree(data)
        if (data?.files.length) {
          const firstBlob = data.files.find((f) => f.type === 'blob')
          if (firstBlob) handleSelect(firstBlob.path)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load repository'))
      .finally(() => setLoading(false))
  }, [githubUrl])

  const handleSelect = async (path: string) => {
    setSelectedPath(path)
    setContentLoading(true)
    setContent(null)
    try {
      const text = await getGitHubFileContent(githubUrl, path)
      setContent(text)
    } catch (err) {
      setContent(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setContentLoading(false)
    }
  }

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading repository…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-red-700 underline hover:text-red-800 dark:text-red-300"
        >
          Open on GitHub <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  if (!tree || tree.files.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        No files found in this repository.
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#30363d] dark:bg-[#0d1117]">
      <div className="border-b border-slate-200 bg-[#f6f8fa] px-4 py-3 dark:border-[#30363d] dark:bg-[#161b22]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#c9d1d9]">
            {tree.owner}/{tree.repo} — {tree.branch}
          </h3>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-[#58a6ff]"
          >
            Open on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="grid h-[80vh] min-h-[600px] grid-cols-1 overflow-hidden sm:grid-cols-[300px_1fr]">
        <div className="overflow-y-auto border-b border-slate-200 bg-[#f6f8fa] p-2 dark:border-[#30363d] dark:bg-[#0d1117] sm:border-b-0 sm:border-r">
          <FileTree
            nodes={treeNodes}
            selectedPath={selectedPath}
            onSelect={handleSelect}
            expanded={expanded}
            toggleExpand={toggleExpand}
          />
        </div>

        <div className="flex h-full min-h-0 flex-col bg-white dark:bg-[#0d1117]">
          {selectedPath && (
            <div className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-[#30363d] dark:text-[#8b949e]">
              {selectedPath}
            </div>
          )}
          <div className="flex-1 overflow-auto p-0">
            {contentLoading ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : content === null ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Select a file to view its contents.
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-slate-800 dark:text-[#c9d1d9]">
                <code>{content}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
