import { chatText, type ChatMessage } from '../../../shared/chat'
import type { Emote, EmoteEvent } from '../../../shared/emotes'
import type { GameEvent } from '../../../shared/game'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RoomId } from './model'

export type OnlinePerson = { userId: string; room: RoomId | null; active: boolean }
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'expired'
export function usePresence(homeId: string, room: RoomId | null, onChanged: () => void, onEvent: (event: GameEvent) => void, onEmote: (event: EmoteEvent) => void, onChat: (message: ChatMessage) => void) {
  const [people, setPeople] = useState<OnlinePerson[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const socket = useRef<WebSocket | null>(null)
  const currentRoom = useRef(room)
  const changed = useRef(onChanged)
  const gameEvent = useRef(onEvent)
  const emoteEvent = useRef(onEmote)
  const lastEmote=useRef(0)
  const chatEvent=useRef(onChat)
  const pendingChats=useRef(new Map<string,{resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>())
  useEffect(()=>{chatEvent.current=onChat},[onChat])
  useEffect(()=>{emoteEvent.current=onEmote},[onEmote])
  useEffect(() => { gameEvent.current = onEvent }, [onEvent])
  useEffect(() => { changed.current = onChanged }, [onChanged])
  useEffect(() => {
    currentRoom.current = room
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: 'move', room, active: document.visibilityState === 'visible' }))
    }
  }, [room])
  useEffect(() => {
    let disposed = false, paused = false, expired = false, attempts = 0, lastMessage = Date.now()
    let retry: ReturnType<typeof setTimeout> | undefined
    let refresh: ReturnType<typeof setTimeout> | undefined
    function move() {
      const ws = socket.current
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'move', room: currentRoom.current, active: document.visibilityState === 'visible' }))
    }
    function connect() {
      if (disposed || paused || expired || socket.current) return
      clearTimeout(retry)
      if (!navigator.onLine) { setStatus('offline'); return }
      setStatus(attempts ? 'reconnecting' : 'connecting')
      const url = new URL('/api/presence', window.location.href)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(url)
      socket.current = ws
      lastMessage = Date.now()
      ws.onopen = () => {
        if (disposed || socket.current !== ws) return
        attempts = 0; lastMessage = Date.now(); setStatus('connected'); move(); changed.current()
      }
      ws.onmessage = event => {
        if (disposed || socket.current !== ws) return
        lastMessage = Date.now()
        try {
          const data = JSON.parse(event.data)
          if(data.type==='chat' && data.message) chatEvent.current(data.message)
          if(data.type==='chat-sent' || data.type==='chat-error') {
            const pending=pendingChats.current.get(data.requestId)
            if(pending){clearTimeout(pending.timer);pendingChats.current.delete(data.requestId);if(data.type==='chat-sent')pending.resolve();else pending.reject(new Error(data.error??'No se pudo enviar.'))}
          }
          if (data.type === 'presence'  && Array.isArray(data.people)) setPeople(data.people)
          if (data.type === 'emote' && data.event) emoteEvent.current(data.event)
          if (data.type === 'game' && data.event) gameEvent.current(data.event)
          if (data.type === 'changed' || data.type === 'game') {
            clearTimeout(refresh)
            refresh = setTimeout(() => changed.current(), 120)
          }
        } catch { /* Ignore malformed messages without breaking the game. */ }
      }
      ws.onerror = () => ws.close()
      ws.onclose = event => {
        if (socket.current !== ws) return
        socket.current = null
        for(const pending of pendingChats.current.values()){clearTimeout(pending.timer);pending.reject(new Error('Se perdió la conexión. Tu texto sigue acá.'))}
        pendingChats.current.clear()
        if (disposed) return
        setPeople([])
        if (event.code === 4001) { expired = true; setStatus('expired'); return }
        setStatus(navigator.onLine ? 'reconnecting' : 'offline')
        if (!paused) retry = setTimeout(connect, Math.min(20_000, 1000 * 2 ** Math.min(attempts++, 5)) + Math.random() * 500)
      }
    }
    function offline() { setPeople([]); setStatus('offline'); socket.current?.close() }
    function hide() { paused = true; clearTimeout(retry); socket.current?.close(1000, 'Page closed') }
    function show() { paused = false; connect(); move() }
    function visibility() { if (document.visibilityState === 'visible') connect(); move() }
    const heartbeat = setInterval(() => {
      const ws = socket.current
      if (!ws) return
      if (Date.now() - lastMessage > 55_000) { ws.close(4000, 'Heartbeat timed out'); return }
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
    }, 20_000)
    window.addEventListener('online', show)
    window.addEventListener('offline', offline)
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', show)
    document.addEventListener('visibilitychange', visibility)
    connect()
    return () => {
      disposed = true
      for(const pending of pendingChats.current.values()){clearTimeout(pending.timer);pending.reject(new Error('Saliste de la casa.'))}
      pendingChats.current.clear()
      clearTimeout(retry); clearTimeout(refresh); clearInterval(heartbeat)
      const ws = socket.current; socket.current = null; ws?.close(1000, 'Left house')
      window.removeEventListener('online', show); window.removeEventListener('offline', offline)
      window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [homeId])
  const sendEmote=useCallback((emoji:Emote,targetId:string)=>{
    if(socket.current?.readyState!==WebSocket.OPEN || Date.now()-lastEmote.current<1600)return false
    lastEmote.current=Date.now()
    socket.current.send(JSON.stringify({type:'emote',emoji,targetId}))
    return true
  },[])
  const sendChat=useCallback((value:string):Promise<void>=>{
    const text=chatText(value),ws=socket.current
    if(!text)return Promise.reject(new Error('Escribí un mensaje de hasta 160 caracteres.'))
    if(ws?.readyState!==WebSocket.OPEN)return Promise.reject(new Error('Esperá a que vuelva la conexión para enviar.'))
    const requestId=crypto.randomUUID()
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pendingChats.current.delete(requestId);reject(new Error('No llegó la confirmación. Revisá la charla antes de reenviar.'))},8000)
      pendingChats.current.set(requestId,{resolve,reject,timer})
      try{ws.send(JSON.stringify({type:'chat',text,requestId}))}catch{clearTimeout(timer);pendingChats.current.delete(requestId);reject(new Error('No se pudo enviar. Tu texto sigue acá.'))}
    })
  },[])
  return { people, status, sendEmote, sendChat }
}
