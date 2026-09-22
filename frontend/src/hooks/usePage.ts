import { useCallback, useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { getPageByPath, type PageDetail } from '#api/pages'

export type PageStatus = 'loading' | 'success' | 'notFound' | 'forbidden' | 'error'

export interface UsePageResult {
  status: PageStatus
  page: PageDetail | null
  refresh: () => Promise<void>
}

export function usePage(pathSegments: string[]): UsePageResult {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [page, setPage] = useState<PageDetail | null>(null)
  const pathKey = pathSegments.join('/')
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current

    if (!pathKey) {
      setStatus('notFound')
      setPage(null)
      return
    }

    setStatus('loading')
    setPage(null)

    try {
      const result = await getPageByPath(pathKey.split('/'))
      if (requestId !== requestIdRef.current) return
      setPage(result)
      setStatus('success')
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) return
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setStatus('notFound')
          return
        }
        if (error.response?.status === 403) {
          setStatus('forbidden')
          return
        }
      }
      setStatus('error')
    }
  }, [pathKey])

  useEffect(() => {
    void load()
  }, [load])

  return { status, page, refresh: load }
}
