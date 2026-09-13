import { useCallback, useEffect, useState } from 'react'
import { listMyActivity, type UserActivityLogItem } from '#api/user-activity-log'

export type MyActivityStatus = 'loading' | 'ready' | 'error'

const PAGE_SIZE = 8

export interface UseMyActivityResult {
  items: UserActivityLogItem[]
  total: number
  page: number
  limit: number
  status: MyActivityStatus
  goToPage: (page: number) => void
}

export function useMyActivity(): UseMyActivityResult {
  const [items, setItems] = useState<UserActivityLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<MyActivityStatus>('loading')

  const load = useCallback(async (targetPage: number) => {
    setStatus('loading')
    try {
      const result = await listMyActivity(targetPage, PAGE_SIZE)
      setItems(result.items)
      setTotal(result.total)
      setPage(targetPage)
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

  return { items, total, page, limit: PAGE_SIZE, status, goToPage }
}
