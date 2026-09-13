import { useCallback, useEffect, useState } from 'react'
import { listMyComments, type AdminUserComment } from '#api/comments'

export type MyCommentsStatus = 'loading' | 'ready' | 'error'

const PAGE_SIZE = 10

export interface UseMyCommentsResult {
  comments: AdminUserComment[]
  total: number
  page: number
  limit: number
  status: MyCommentsStatus
  goToPage: (page: number) => void
}

export function useMyComments(): UseMyCommentsResult {
  const [comments, setComments] = useState<AdminUserComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<MyCommentsStatus>('loading')

  const load = useCallback(async (targetPage: number) => {
    setStatus('loading')
    try {
      const result = await listMyComments(targetPage, PAGE_SIZE)
      setComments(result.items)
      setTotal(result.total)
      setPage(result.page)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  function goToPage(target: number): void {
    void load(target)
  }

  return { comments, total, page, limit: PAGE_SIZE, status, goToPage }
}
