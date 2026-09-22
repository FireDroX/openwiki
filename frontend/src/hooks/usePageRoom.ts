import { useEffect } from 'react'
import { getRealtimeSocket } from '#lib/realtime-client'

export function usePageRoom(pageId: string | undefined): void {
  useEffect(() => {
    if (!pageId) {
      return
    }

    const socket = getRealtimeSocket()
    socket.emit('page:join', { pageId })

    function handleReconnect() {
      socket.emit('page:join', { pageId })
    }
    socket.on('connect', handleReconnect)

    return () => {
      socket.off('connect', handleReconnect)
      socket.emit('page:leave', { pageId })
    }
  }, [pageId])
}
