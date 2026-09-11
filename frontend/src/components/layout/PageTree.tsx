import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePageTree } from '#hooks/usePageTree'
import { PageTreeItem } from '#components/layout/PageTreeItem'
import { filterTree, findNodeByPath } from '#utils/page-tree'

interface PageTreeProps {
  filter?: string
}

export function PageTree({ filter = '' }: PageTreeProps) {
  const { t } = useTranslation()
  const params = useParams()
  const pathKey = params['*'] ?? ''
  const { tree, status } = usePageTree()
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map())
  const isFiltering = filter.trim().length > 0
  const visibleTree = useMemo(() => filterTree(tree, filter), [tree, filter])

  const activePath = useMemo(() => {
    const segments = pathKey.split('/').filter(Boolean)
    return segments.length > 0 ? findNodeByPath(tree, segments) : null
  }, [tree, pathKey])
  const ancestorIds = activePath?.map((node) => node.id) ?? []
  const activeId = activePath?.at(-1)?.id

  function isExpanded(id: string): boolean {
    if (isFiltering) {
      return true
    }
    return overrides.get(id) ?? ancestorIds.includes(id)
  }

  function toggle(id: string) {
    setOverrides((current) => {
      const next = new Map(current)
      next.set(id, !isExpanded(id))
      return next
    })
  }

  if (status === 'loading') {
    return null
  }

  if (status === 'error') {
    return <p className="px-2.5 py-1.5 text-sm text-destructive">{t('pageTree.loadError')}</p>
  }

  if (isFiltering && visibleTree.length === 0) {
    return <p className="px-2.5 py-1.5 text-sm text-muted-foreground">{t('pageTree.noMatch')}</p>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {visibleTree.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          parentPath={[]}
          activeId={activeId}
          isExpanded={isExpanded}
          onToggle={toggle}
        />
      ))}
    </div>
  )
}
