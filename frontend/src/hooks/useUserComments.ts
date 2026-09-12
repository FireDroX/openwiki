import { useCallback, useEffect, useState } from 'react'
import { listUserComments, purgeUserComments, type AdminUserComment } from '#api/comments'

export type UserCommentsStatus = 'loading' | 'ready' | 'error'

const PAGE_SIZE = 20

export interface UseUserCommentsResult {
  comments: AdminUserComment[]
  total: number
  page: number
  limit: number
  status: UserCommentsStatus
  selectedIds: string[]
  pending: boolean
  toggleSelected: (id: string) => void
  goToPage: (page: number) => void
  purgeSelected: () => Promise<number>
  purgeAll: () => Promise<number>
}

export function useUserComments(userId: string, enabled: boolean): UseUserCommentsResult {
  const [comments, setComments] = useState<AdminUserComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<UserCommentsStatus>('loading')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)

  const load = useCallback(
    async (targetPage: number) => {
      setStatus('loading')
      try {
        const result = await listUserComments(userId, targetPage, PAGE_SIZE)
        setComments(result.items)
        setTotal(result.total)
        setPage(result.page)
        setSelectedIds([])
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    },
    [userId],
  )

  useEffect(() => {
    if (!enabled) return
    void load(1)
  }, [enabled, load])

  function toggleSelected(id: string): void {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function goToPage(target: number): void {
    void load(target)
  }

  async function purgeSelected(): Promise<number> {
    setPending(true)
    try {
      const count = await purgeUserComments(userId, selectedIds)
      await load(1)
      return count
    } finally {
      setPending(false)
    }
  }

  async function purgeAll(): Promise<number> {
    setPending(true)
    try {
      const count = await purgeUserComments(userId)
      await load(1)
      return count
    } finally {
      setPending(false)
    }
  }

  return {
    comments,
    total,
    page,
    limit: PAGE_SIZE,
    status,
    selectedIds,
    pending,
    toggleSelected,
    goToPage,
    purgeSelected,
    purgeAll,
  }
}
