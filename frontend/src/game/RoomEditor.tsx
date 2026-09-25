import { useState, type FormEvent } from 'react'
import { roomCatalog, roomKinds, type HouseRoom, type RoomKind } from '../../../shared/rooms'
import { request } from './model'
import GameIcon from './GameIcon'

export default function RoomEditor({rooms,changed}:{rooms:HouseRoom[];changed:(id?:string)=>Promise<void>}) {
  const [kind,setKind]=useState<RoomKind>('bedroom'),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [editing,setEditing]=useState<string|null>(null),[editName,setEditName]=useState('')
  async function act(action:()=>Promise<void>) {setBusy(true);setError('');try{await action()}catch(error){setError(error instanceof Error?error.message:'No pudimos guardar el ambiente.')}finally{setBusy(false)}}
  function add(event:FormEvent) {event.preventDefault();void act(async()=>{const result=await request<{id:string}>('/rooms','POST',{kind,name});await changed(result.id);setName('')})}
  return <div className="room-editor">
    <p>Ampliá tu casa. Cada ambiente tiene sus propios muebles y tareas.</p>
    <div className="room-editor-list">{rooms.map(room=><div className="room-editor-row" key={room.id}>
      <GameIcon name={room.kind} />
      {editing===room.id?<form onSubmit={event=>{event.preventDefault();void act(async()=>{await request(`/rooms/${encodeURIComponent(room.id)}`,'PATCH',{name:editName});await changed();setEditing(null)})}}><input aria-label="Nombre del ambiente" required minLength={2} maxLength={32} value={editName} onChange={event=>setEditName(event.target.value)} autoFocus /><button disabled={busy}>Guardar</button><button type="button" onClick={()=>setEditing(null)} disabled={busy}>Cancelar</button></form>:<><div><strong>{room.name}</strong><small>{roomCatalog[room.kind].name}</small></div><button disabled={busy} onClick={()=>{setEditing(room.id);setEditName(room.name)}}>Renombrar</button><button disabled={busy||rooms.length===1} onClick={()=>void act(async()=>{await request(`/rooms/${encodeURIComponent(room.id)}`,'DELETE',{});await changed()})} aria-label={`Quitar ${room.name}`}>×</button></>}
    </div>)}</div>
    <form onSubmit={add} className="task-form"><fieldset className="room-type-picker"><legend>Agregar un ambiente</legend>{roomKinds.map(type=><button type="button" key={type} className={kind===type?'chosen':''} aria-pressed={kind===type} onClick={()=>setKind(type)}><GameIcon name={type} /><span>{roomCatalog[type].name}</span></button>)}</fieldset><label>Nombre<input required minLength={2} maxLength={32} value={name} onChange={event=>setName(event.target.value)} placeholder={kind==='bathroom'?'Baño de arriba':kind==='bedroom'?'Dormitorio de invitados':roomCatalog[kind].name} /></label><button className="game-primary" disabled={busy||rooms.length>=12}>{busy?'Guardando…':rooms.length>=12?'Casa completa (12 ambientes)':'Agregar a mi casa'}</button></form>
    <p className="room-editor-help">{rooms.length}/12 ambientes. La distribución se acomoda automáticamente. Solo se pueden quitar ambientes sin tareas.</p>
    {error&&<p className="avatar-error" role="alert">{error}</p>}
  </div>
}
