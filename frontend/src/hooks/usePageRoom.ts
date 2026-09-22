import { useEffect } from 'react'
import { getRealtimeSocket } from '#lib/realtime-client'

export function usePageRoom(pageId: string | undefined): void {
  useEffect(() => {
    if (!pageId) {
      return
    }

    const socket = getRealtimeSocket()
    socket.emit('page:join', { pageId })

    return () => {
      socket.emit('page:leave', { pageId })
    }
  }, [pageId])
}
