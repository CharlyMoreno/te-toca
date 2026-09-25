import { useEffect, useRef, useState, type FormEvent } from 'react'
import { chatMaxLength, type ChatMessage } from '../../../shared/chat'
import type { ConnectionStatus } from './usePresence'
import type { Person } from './model'
import GameIcon from './GameIcon'

export default function HouseChat({messages,people,self,status,send}:{messages:ChatMessage[];people:Person[];self:string;status:ConnectionStatus;send:(text:string)=>Promise<void>}) {
  const [open,setOpen]=useState(false),[text,setText]=useState(''),[error,setError]=useState(''),[sending,setSending]=useState(false)
  const input=useRef<HTMLInputElement>(null),feed=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(open)input.current?.focus()},[open])
  useEffect(()=>{if(open&&feed.current)feed.current.scrollTop=feed.current.scrollHeight},[open,messages])
  async function submit(event:FormEvent) {
    event.preventDefault()
    if(sending||!text.trim())return
    setSending(true);setError('')
    try{await send(text);setText('')}catch(error){setError(error instanceof Error?error.message:'No se pudo enviar.')}
    finally{setSending(false);input.current?.focus()}
  }
  return <div className={`house-chat ${open?'open':''}`} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);event.stopPropagation()}}}>
    {open&&<section className="chat-panel" aria-label="Charla de la casa"><header><strong>Charla de la casa</strong><button onClick={()=>setOpen(false)} aria-label="Cerrar chat">×</button></header>
      <div className="chat-feed" ref={feed} role="log" aria-live="polite" aria-relevant="additions">{messages.length?messages.map(message=><p key={message.id} className={message.userId===self?'mine':''}><strong>{message.userId===self?'Vos':people.find(p=>p.id===message.userId)?.display_name??'Integrante'}</strong><span>{message.text}</span></p>):<p className="chat-empty">Lo que escribas aparece sobre tu personaje. Solo lo ven los conectados de esta casa.</p>}</div>
      <form onSubmit={submit}><label className="chat-label" htmlFor="house-chat-input">Tu mensaje</label><div className="chat-compose"><input id="house-chat-input" ref={input} value={text} readOnly={sending} maxLength={chatMaxLength} autoComplete="off" placeholder="Decile algo a la casa…" onChange={event=>{setText(event.target.value);setError('')}} onKeyDown={event=>{if(event.key==='Enter'&&event.nativeEvent.isComposing)event.preventDefault()}} /><button type="submit" disabled={sending||status!=='connected'||!text.trim()} aria-label="Enviar mensaje">{sending?'…':'↑'}</button></div><footer><span>{status==='connected'?'Enter para enviar':status==='expired'?'Volvé a entrar para charlar':'Reconectando…'} · sin historial guardado</span><span>{text.length}/{chatMaxLength}</span></footer>{error&&<p className="chat-error" role="alert">{error}</p>}</form>
    </section>}
    <button className="chat-toggle" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-label={open?'Cerrar chat':'Charlar con la casa'}><GameIcon name="chat" /><span>Charlar</span></button>
  </div>
}
