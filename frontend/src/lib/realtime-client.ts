import { io, type Socket } from 'socket.io-client'
import { AUTH_LOGOUT_EVENT } from '#lib/api-client'

let socket: Socket | null = null

function realtimeOrigin(): string {
  return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
}

export function getRealtimeSocket(): Socket {
  socket ??= io(realtimeOrigin(), { withCredentials: true })
  return socket
}

export function reconnectRealtimeSocket(): void {
  socket?.disconnect()
  socket?.connect()
}

window.addEventListener(AUTH_LOGOUT_EVENT, () => reconnectRealtimeSocket())
