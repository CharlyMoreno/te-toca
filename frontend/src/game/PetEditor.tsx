import { useState, type FormEvent } from 'react'
import { petCatalog, petColors, petKinds, petLimit, type Pet, type PetKind } from '../../../shared/pets'
import { request, type Occurrence } from './model'

export default function PetEditor({pets,tasks,today,admin,changed,onTasks,onTask}:{pets:Pet[];tasks:Occurrence[];today:string;admin:boolean;changed:()=>Promise<void>;onTasks:(id:string)=>void;onTask:(id:string)=>void}) {
  const [name,setName]=useState(''),[kind,setKind]=useState<PetKind>('dog'),[color,setColor]=useState<string>(petColors[0])
  const [editing,setEditing]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  function reset(){setName('');setEditing(null)}
  async function act(action:()=>Promise<void>) {setBusy(true);setError('');try{await action()}catch(error){setError(error instanceof Error?error.message:'No pudimos guardar la mascota.')}finally{setBusy(false)}}
  function save(event:FormEvent) {
    event.preventDefault()
    void act(async()=>{await request(editing?`/pets/${encodeURIComponent(editing)}`:'/pets',editing?'PATCH':'POST',{name,kind,color});reset();await changed()})
  }
  return <div className="pet-editor">
    <p>Sumá un compañero a la casa. Tocá su personaje para ver sus tareas.</p>
    <div className="pet-list">{pets.map(pet=>{
      const pending=tasks.filter(task=>task.pet_id===pet.id&&!task.completed_at&&task.due_date<=today).length
      const hasTasks=tasks.some(task=>task.pet_id===pet.id)
      return <article className="pet-card" key={pet.id}>
        <button className="pet-card-main" onClick={()=>onTasks(pet.id)}><span className="pet-portrait" style={{background:pet.color}}>{petCatalog[pet.kind].emoji}</span><span><strong>{pet.name}</strong><small>{petCatalog[pet.kind].name} · {pending?`${pending} pendientes`:'Todo al día'}</small></span><span>→</span></button>
        <div className="pet-card-actions"><button disabled={busy} onClick={()=>onTask(pet.id)}>+ Tarea</button><button disabled={busy} onClick={()=>{setEditing(pet.id);setName(pet.name);setKind(pet.kind);setColor(pet.color);setError('')}}>Personalizar</button>{admin&&<button disabled={busy||hasTasks} title={hasTasks?'Conservamos las mascotas con tareas asociadas':'Quitar mascota'} onClick={()=>void act(async()=>{await request(`/pets/${encodeURIComponent(pet.id)}`,'DELETE',{});if(editing===pet.id)reset();await changed()})}>Quitar</button>}</div>
      </article>
    })}</div>
    <form className="task-form" onSubmit={save}>
      <fieldset disabled={busy} className="pet-kind-picker"><legend>{editing?'Personalizar mascota':'Una nueva mascota'}</legend>{petKinds.map(type=><button type="button" key={type} aria-pressed={kind===type} className={kind===type?'chosen':''} onClick={()=>setKind(type)}><span>{petCatalog[type].emoji}</span>{petCatalog[type].name}</button>)}</fieldset>
      <label>Nombre<input required maxLength={24} value={name} onChange={event=>setName(event.target.value)} placeholder={kind==='dog'?'Por ejemplo, Rocco':'Por ejemplo, Luna'} /></label>
      <fieldset disabled={busy} className="pet-colors"><legend>Pelaje</legend>{petColors.map((value,index)=><button key={value} type="button" aria-label={['Marrón','Crema','Gris oscuro','Blanco','Naranja','Gris'][index]} aria-pressed={color===value} className={color===value?'chosen':''} style={{background:value}} onClick={()=>setColor(value)}>{color===value?'✓':''}</button>)}</fieldset>
      <button className="game-primary" disabled={busy||(!editing&&pets.length>=petLimit)}>{busy?'Guardando…':editing?'Guardar mascota':pets.length>=petLimit?'Ya hay 6 mascotas':'Sumar a la casa'}</button>
      {editing&&<button className="game-link" type="button" disabled={busy} onClick={reset}>Cancelar edición</button>}
    </form>
    <p className="room-editor-help">{pets.length}/{petLimit} mascotas. Las tareas pueden rotar entre sus cuidadores; quien las completa suma los puntos.</p>
    {error&&<p className="avatar-error" role="alert">{error}</p>}
  </div>
}
