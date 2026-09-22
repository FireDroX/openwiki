import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

function realtimeOrigin(): string {
  return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
}

export function getRealtimeSocket(): Socket {
  socket ??= io(realtimeOrigin(), { withCredentials: true })
  return socket
}
