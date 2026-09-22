import { useEffect, useRef } from 'react'
import { mergePreview, type MergePreviewResult } from '#api/pages'
import { getRealtimeSocket } from '#lib/realtime-client'
import { usePageRoom } from '#hooks/usePageRoom'

interface PageVersionCreatedPayload {
  pageId: string
}

export interface UsePageRealtimeSyncOptions {
  getBaseVersionId: () => string
  getContent: () => string
  onMergeResult: (result: MergePreviewResult) => void
}

export function usePageRealtimeSync(
  pageId: string | undefined,
  options: UsePageRealtimeSyncOptions,
): void {
  usePageRoom(pageId)

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    if (!pageId) {
      return
    }

    const socket = getRealtimeSocket()

    async function handleVersionCreated(payload: PageVersionCreatedPayload) {
      if (payload.pageId !== pageId) {
        return
      }

      try {
        const result = await mergePreview(pageId as string, {
          baseVersionId: optionsRef.current.getBaseVersionId(),
          content: optionsRef.current.getContent(),
        })

        optionsRef.current.onMergeResult(result)
      } catch (error) {
        console.error(error)
      }
    }

    socket.on('page:version-created', handleVersionCreated)
    return () => {
      socket.off('page:version-created', handleVersionCreated)
    }
  }, [pageId])
}
