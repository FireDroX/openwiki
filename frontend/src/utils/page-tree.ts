import type { PageTreeNode } from '#api/pages'

export function filterTree(nodes: PageTreeNode[], query: string): PageTreeNode[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return nodes
  }

  return nodes.reduce<PageTreeNode[]>((result, node) => {
    const children = filterTree(node.children, query)
    const matches = node.title.toLowerCase().includes(normalized)
    if (matches || children.length > 0) {
      result.push({ ...node, children })
    }
    return result
  }, [])
}

export function findPathToNode(
  nodes: PageTreeNode[],
  predicate: (node: PageTreeNode) => boolean,
): PageTreeNode[] | null {
  for (const node of nodes) {
    if (predicate(node)) {
      return [node]
    }
    const childPath = findPathToNode(node.children, predicate)
    if (childPath) {
      return [node, ...childPath]
    }
  }
  return null
}

export function findNodeByPath(
  nodes: PageTreeNode[],
  pathSegments: string[],
): PageTreeNode[] | null {
  const [head, ...rest] = pathSegments
  if (!head) {
    return null
  }
  const node = nodes.find((candidate) => candidate.slug === head)
  if (!node) {
    return null
  }
  if (rest.length === 0) {
    return [node]
  }
  const childPath = findNodeByPath(node.children, rest)
  return childPath ? [node, ...childPath] : null
}

export function collectSubtreeIds(nodes: PageTreeNode[], rootId: string): string[] {
  const path = findPathToNode(nodes, (node) => node.id === rootId)
  const root = path?.at(-1)
  if (!root) {
    return [rootId]
  }

  const ids: string[] = [root.id]
  function walk(node: PageTreeNode) {
    for (const child of node.children) {
      ids.push(child.id)
      walk(child)
    }
  }
  walk(root)
  return ids
}

export function buildPagePath(nodes: PageTreeNode[], pageId: string): string[] | null {
  const path = findPathToNode(nodes, (node) => node.id === pageId)
  return path?.map((node) => node.slug) ?? null
}

export interface FlatPageTreeNode {
  id: string
  title: string
  path: string
}

export function flattenTree(nodes: PageTreeNode[], parentPath: string[] = []): FlatPageTreeNode[] {
  return nodes.flatMap((node) => {
    const path = [...parentPath, node.title]
    return [{ id: node.id, title: node.title, path: path.join(' / ') }, ...flattenTree(node.children, path)]
  })
}
