const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost:5000'

export function createSocket(url = SOCKET_URL) {
  return new WebSocket(url)
}
