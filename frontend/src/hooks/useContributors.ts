import { useEffect, useState } from 'react'
import { listContributors, type Contributor } from '#api/versions'

export type ContributorsStatus = 'loading' | 'ready' | 'error'

export interface UseContributorsResult {
  contributors: Contributor[]
  status: ContributorsStatus
}

export function useContributors(pageId: string | undefined): UseContributorsResult {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [status, setStatus] = useState<ContributorsStatus>('loading')

  useEffect(() => {
    if (!pageId) return
    let cancelled = false
    setStatus('loading')
    listContributors(pageId)
      .then((result) => {
        if (cancelled) return
        setContributors(result)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [pageId])

  return { contributors, status }
}
