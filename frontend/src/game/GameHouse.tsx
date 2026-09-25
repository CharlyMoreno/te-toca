import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { colors, request, rooms, type House, type Occurrence, type Person, type RoomId, type Routine } from './model'
import './game.css'
const HouseScene = lazy(() => import('./HouseScene'))

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state={failed:false}
  static getDerivedStateFromError() { return {failed:true} }
  render() { return this.state.failed ? <div className="scene-fallback"><strong>Sigamos desde las habitaciones.</strong><p>No pudimos iniciar el 3D en este dispositivo. Tus tareas están disponibles en la lista.</p></div> : this.props.children }
}
function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement
    const el=ref.current
    el?.querySelector<HTMLElement>('input,button,select')?.focus()
    function key(event: KeyboardEvent) {
      if(event.key==='Escape') close()
      if(event.key==='Tab' && el) {
        const nodes=Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]'))
        if(event.shiftKey && document.activeElement===nodes[0]) {event.preventDefault();nodes.at(-1)?.focus()}
        else if(!event.shiftKey && document.activeElement===nodes.at(-1)) {event.preventDefault();nodes[0]?.focus()}
      }
    }
    document.addEventListener('keydown',key)
    return ()=>{document.removeEventListener('keydown',key);previous?.focus()}
  },[close])
  return <div className="game-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)close()}}><div ref={ref} className="game-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="game-icon-button" onClick={close} aria-label="Cerrar">×</button></header>{children}</div></div>
}

export default function GameHouse({ home, user, members: initialMembers, onLogout, authError }: { home: House; user: Person; members: Person[]; onLogout: () => void; authError: string }) {
  const [members,setMembers]=useState(initialMembers)
  const [tasks,setTasks]=useState<Occurrence[]>([])
  const [routines,setRoutines]=useState<Routine[]>([])
  const [today,setToday]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [room,setRoom]=useState<RoomId|null>(null)
  const [focus,setFocus]=useState<string|null>(null)
  const [selected,setSelected]=useState<string|null>(null)
  const [tab,setTab]=useState<'pending'|'done'|'upcoming'>('pending')
  const [dialog,setDialog]=useState<'task'|'invite'|'history'|'routines'|null>(null)
  const [celebration,setCelebration]=useState<string|null>(null)
  const [undo,setUndo]=useState<{id:string;title:string}|null>(null)
  const [cameraRevision,setCameraRevision]=useState(0)
  const [flat,setFlat]=useState(false)
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [title,setTitle]=useState('')
  const [taskRoom,setTaskRoom]=useState<RoomId>('kitchen')
  const [icon,setIcon]=useState('dishes')
  const [frequency,setFrequency]=useState('daily')
  const [firstDate,setFirstDate]=useState('')
  const [participants,setParticipants]=useState<string[]>(members.map(p=>p.id))
  const [invite,setInvite]=useState('')
  const [copied,setCopied]=useState(false)
  const [history,setHistory]=useState<{id:string;title:string;action:string;display_name:string;created_at:number;room:RoomId}[]>([])
  const [historyLoading,setHistoryLoading]=useState(false)
  const close=useCallback(()=>setDialog(null),[])
  const refresh=useCallback(async()=>{
    const [data,house]=await Promise.all([request<{occurrences:Occurrence[];routines:Routine[];today:string}>('/tasks'),request<{members:Person[]}>('/homes/current')])
    setMembers(house.members)
    setTasks(data.occurrences);setRoutines(data.routines);setToday(data.today)
  },[])
  useEffect(()=>{
    refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false))
    const update=()=>{if(document.visibilityState==='visible')refresh().catch(e=>setError(e.message))}
    window.addEventListener('focus',update);document.addEventListener('visibilitychange',update)
    return ()=>{window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update)}
  },[refresh])
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>setReduced(media.matches)
    media.addEventListener('change',update)
    return ()=>media.removeEventListener('change',update)
  },[])
  useEffect(()=>{if(!undo)return;const timer=setTimeout(()=>setUndo(null),10000);return ()=>clearTimeout(timer)},[undo])
  async function act(action:()=>Promise<void>) {
    setBusy(true);setError('')
    try{await action()}catch(e){setError(e instanceof Error?e.message:'No pudimos guardar el cambio.')}finally{setBusy(false)}
  }
  function chooseRoom(id:RoomId|null){setRoom(id);setSelected(null);setTab('pending')}
  function chooseTask(task:Occurrence){setRoom(task.room);setSelected(task.id);setTab(task.completed_at?'done':task.due_date>today?'upcoming':'pending')}
  function newTask(id:RoomId=room??'kitchen') {
    setTaskRoom(id);setIcon(rooms.find(r=>r.id===id)!.icon);setTitle(rooms.find(r=>r.id===id)!.suggestion);setFirstDate(today);setFrequency('daily');setParticipants(members.map(p=>p.id));setDialog('task')
  }
  function createTask(event:FormEvent) {
    event.preventDefault()
    void act(async()=>{
      await request('/tasks','POST',{title,room:taskRoom,icon,frequency,firstDate,participants})
      await refresh();setDialog(null);chooseRoom(taskRoom)
    })
  }
  function complete(task:Occurrence) {
    void act(async()=>{
      await request(`/tasks/${encodeURIComponent(task.id)}/complete`,'POST',{})
      setCelebration(task.id);setUndo({id:task.id,title:task.title});setSelected(null)
      await refresh()
    })
  }
  function openHistory() {
    setDialog('history');setHistoryLoading(true)
    request<{events:typeof history}>('/tasks/history').then(data=>setHistory(data.events)).catch(e=>setError(e.message)).finally(()=>setHistoryLoading(false))
  }
  const currentRoom=rooms.find(r=>r.id===room)
  const currentTask=tasks.find(t=>t.id===selected)
  const inView=tasks.filter(t=>(!room||t.room===room)&&(!focus||t.assignee===focus))
  const pending=inView.filter(t=>!t.completed_at&&t.due_date<=today)
  const visible=tab==='pending'?pending:tab==='done'?inView.filter(t=>t.completed_at):inView.filter(t=>!t.completed_at&&t.due_date>today)
  const daily=tasks.filter(t=>t.due_date===today)
  const done=daily.filter(t=>t.completed_at).length
  const overdue=tasks.filter(t=>t.due_date<today&&!t.completed_at).length
  const name=(id:string)=>members.find(p=>p.id===id)?.display_name??'Integrante'
  return <div className="game-shell">
    <header className="game-header"><img src="/brand/te-toca-logo.svg" alt="Te Toca" /><div className="house-name"><small>NUESTRA CASA</small><strong>{home.name}</strong></div><nav><button onClick={openHistory}>Historial</button><button onClick={()=>setDialog('invite')}>Integrantes <b>{members.length}</b></button><button onClick={onLogout}>Salir</button></nav></header>
    <main className="game-layout">
      <section className="world-column" aria-label="Casa interactiva">
        <div className="world-heading"><div><span className="game-eyebrow">UN POQUITO ENTRE TODOS</span><h1>Hola, {user.display_name}<span> ✦</span></h1><p>{currentRoom?`Entraste a ${currentRoom.name.toLowerCase()}. Tocá un objeto para ver su tarea.`:'Elegí una habitación. Descubrí qué te toca hoy.'}</p></div><div className="daily-progress"><strong>{done}<span>/{daily.length}</span></strong><small>tareas de hoy</small><progress value={done} max={daily.length||1} /></div></div>
        <div className="room-navigation" aria-label="Habitaciones"><button className={!room?'active':''} onClick={()=>chooseRoom(null)}>⌂ Toda la casa</button>{rooms.map(r=><button key={r.id} className={room===r.id?'active':''} onClick={()=>chooseRoom(r.id)}><i style={{background:r.color}} />{r.name}<b>{tasks.filter(t=>t.room===r.id&&!t.completed_at&&t.due_date<=today&&(!focus||t.assignee===focus)).length}</b></button>)}</div>
        <div className="world-canvas">
          {flat?<div className="room-grid">{rooms.map(r=><button key={r.id} style={{borderColor:r.color}} onClick={()=>chooseRoom(r.id)}><span>{r.name}</span><strong>{tasks.filter(t=>t.room===r.id&&!t.completed_at&&t.due_date<=today).length}</strong><small>tareas pendientes</small></button>)}</div>:
            <SceneBoundary><Suspense fallback={<div className="scene-fallback">Abriendo las puertas de tu casa…</div>}><HouseScene cameraRevision={cameraRevision} room={room} people={members} self={user.id} tasks={tasks} today={today} focus={focus} celebration={celebration} reduced={reduced} onRoom={chooseRoom} onTask={chooseTask} onPerson={id=>setFocus(focus===id?null:id)} /></Suspense></SceneBoundary>}
          <div className="scene-toolbar"><span>{flat?'Elegí una habitación':'Arrastrá para girar · Rueda o pellizco para acercar'}</span><button onClick={()=>setFlat(!flat)}>{flat?'Ver en 3D':'Vista simple'}</button>{!flat&&<button onClick={()=>{chooseRoom(null);setCameraRevision(value=>value+1)}}>Ver toda la casa ↗</button>}</div>
          {loading&&<div className="scene-loading">Cargando tareas…</div>}
        </div>
        <footer className="house-people"><div><span className="game-eyebrow">VIVEN ACÁ</span><small>Elegí a alguien para ver sus pendientes</small></div><div className="people-chips">{members.map((person,index)=>{
          const personal=tasks.filter(t=>t.assignee===person.id)
          const count=personal.filter(t=>!t.completed_at&&t.due_date<=today).length
          const scheduled=personal.filter(t=>t.due_date===today)
          const completed=scheduled.filter(t=>t.completed_at).length
          return <button key={person.id} className={focus===person.id?'active':''} onClick={()=>setFocus(focus===person.id?null:person.id)} aria-pressed={focus===person.id}><span style={{background:colors[index%colors.length]}}>{person.display_name.slice(0,1)}</span><div><strong>{person.display_name}{person.id===user.id?' (vos)':''}</strong><small>{scheduled.length?`${completed}/${scheduled.length} hechas hoy`:'Sin tareas hoy'}{count>0&&` · ${count} pendientes`}</small></div></button>
        })}</div></footer>
      </section>
      <aside className="tasks-sidebar">
        <div className="sidebar-title"><span className="game-eyebrow">{currentRoom?'ESTÁS EN':'VISTA GENERAL'}</span><h2>{currentRoom?.name??'Tu casa, al día'}</h2><p>{pending.length?`${pending.length} cosas por hacer${focus?` para ${name(focus)}`:''}.`:'Un espacio para compartir lo cotidiano.'}</p></div>
        {overdue>0&&<div className="overdue-note">{overdue} {overdue===1?'tarea atrasada':'tareas atrasadas'} en la casa</div>}
        <div className="task-tabs">{(['pending','done','upcoming'] as const).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setSelected(null)}}>{t==='pending'?'Pendientes':t==='done'?'Hechas':'Próximas'}</button>)}</div>
        <div className="task-list">
          {!loading&&visible.length===0&&<div className="task-empty"><span>{tab==='done'?'✧':'✦'}</span><h3>{tab==='pending'?'Por acá está todo listo':tab==='done'?'Todavía no hay tareas hechas':'Sin próximos turnos'}</h3><p>{routines.length?'El progreso de todos aparece en esta casa.':'Agregá la primera tarea y va a aparecer como un objeto en su habitación.'}</p>{home.role==='admin'&&<button onClick={()=>newTask()}>+ Agregar una tarea</button>}</div>}
          {visible.map(task=><button key={task.id} className={`task-row ${selected===task.id?'selected':''}`} onClick={()=>chooseTask(task)}><span className={`task-check ${task.completed_at?'done':''}`}>{task.completed_at?'✓':'·'}</span><span><strong>{task.title}</strong><small>{name(task.assignee)} · {task.due_date===today?'Hoy':task.due_date}{!room&&` · ${rooms.find(r=>r.id===task.room)?.name}`}</small></span><span>↗</span></button>)}
        </div>
        {currentTask&&<section className="task-detail"><button className="detail-close" onClick={()=>setSelected(null)} aria-label="Cerrar detalle">×</button><span className="game-eyebrow">{currentTask.frequency==='daily'?'CADA DÍA':'CADA SEMANA'}</span><h3>{currentTask.title}</h3><p>Le toca a <strong>{name(currentTask.assignee)}</strong>.</p>{currentTask.completed_at?<div className="completed-note">✓ Hecha el {new Date(currentTask.completed_at*1000).toLocaleDateString('es-AR')}</div>:currentTask.assignee===user.id&&currentTask.due_date<=today?<><p className="real-task-note">Cuando la termines en casa, registrala acá.</p><button className="game-primary" disabled={busy} onClick={()=>complete(currentTask)}>{busy?'Guardando…':'Ya la hice ✓'}</button></>:<p className="real-task-note">{currentTask.due_date>today?'Este turno es para más adelante.':'Su responsable puede marcarla como hecha.'}</p>}</section>}
        <div className="sidebar-bottom">{home.role==='admin'&&<><button className="game-primary" onClick={()=>newTask()}>+ Nueva tarea</button><button className="game-link" onClick={()=>setDialog('routines')}>Administrar rutinas</button></>}<span>Un turno a la vez. Una casa entre todos.</span></div>
      </aside>
    </main>
    {(error||authError)&&<div className="game-error" role="alert">{error||authError}<button onClick={()=>{setError('');void refresh().catch(e=>setError(e.message))}}>Reintentar</button></div>}
    {undo&&<div className="game-toast" role="status"><span>✓ {undo.title}</span><button disabled={busy} onClick={()=>void act(async()=>{await request(`/tasks/${encodeURIComponent(undo.id)}/undo`,'POST',{});setUndo(null);setCelebration(null);await refresh()})}>Deshacer</button></div>}
    {dialog==='task'&&<Dialog title="Una nueva tarea" close={close}><form onSubmit={createTask} className="task-form"><label>¿Qué hay que hacer?<input autoFocus required minLength={2} maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} /></label><div className="form-columns"><label>Habitación<select value={taskRoom} onChange={e=>setTaskRoom(e.target.value as RoomId)}>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Se repite<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="daily">Cada día</option><option value="weekly">Cada semana</option></select></label></div><label>Objeto en la habitación<select value={icon} onChange={e=>setIcon(e.target.value)}><option value="dishes">Platos</option><option value="trash">Bolsa de basura</option><option value="clean">Escoba</option><option value="laundry">Canasto de ropa</option></select></label><label>Primer turno<input type="date" required min={today} value={firstDate} onChange={e=>setFirstDate(e.target.value)} /></label><fieldset><legend>¿Entre quiénes rota?</legend><p>El número indica el orden de los turnos.</p>{members.map(person=><label className="participant-option" key={person.id}><input type="checkbox" checked={participants.includes(person.id)} onChange={()=>setParticipants(participants.includes(person.id)?participants.filter(id=>id!==person.id):[...participants,person.id])} /><span>{person.display_name}</span><b>{participants.includes(person.id)?participants.indexOf(person.id)+1:'—'}</b></label>)}</fieldset><p className="rotation-preview">Próximos responsables: {[0,1,2].map(i=>participants.length?name(participants[i%participants.length]):'—').join(' → ')}</p><button className="game-primary" disabled={busy||!participants.length}>{busy?'Creando…':'Agregar a la habitación'}</button></form></Dialog>}
    {dialog==='invite'&&<Dialog title="Las personas de tu casa" close={close}><div className="dialog-people">{members.map((person,i)=><div key={person.id}><span style={{background:colors[i%colors.length]}}>{person.display_name.slice(0,1)}</span><strong>{person.display_name}</strong><small>{person.role==='admin'?'Administra':'Integrante'}</small></div>)}</div>{home.role==='admin'&&<><p>El código dura siete días. Generar otro deja sin efecto el anterior.</p><button className="game-primary" disabled={busy||members.length>=6} onClick={()=>void act(async()=>{const result=await request<{inviteCode:string}>('/homes/invite','POST',{});setInvite(result.inviteCode);setCopied(false)})}>Generar invitación</button>{invite&&<div className="invite-code"><strong>{invite}</strong><button onClick={()=>void act(async()=>{await navigator.clipboard.writeText(invite);setCopied(true)})}>{copied?'Copiado ✓':'Copiar'}</button></div>}</>}</Dialog>}
    {dialog==='history'&&<Dialog title="Lo que hicimos" close={close}>{historyLoading?<p>Cargando historial…</p>:!history.length?<p>Acá aparecerán las tareas que completen y los cambios de la casa.</p>:<div className="history-list">{history.map(event=><article key={event.id}><span>{event.action==='completed'?'✓':'↶'}</span><div><strong>{event.title}</strong><p>{event.display_name} · {event.action==='completed'?'La completó':event.action==='undone'?'Deshizo la finalización':'Intercambió el turno'}</p><small>{new Date(event.created_at*1000).toLocaleString('es-AR',{timeZone:home.timezone})}</small></div></article>)}</div>}</Dialog>}
    {dialog==='routines'&&<Dialog title="Rutinas de la casa" close={close}><p>Pausar detiene los turnos nuevos. Los ya asignados conservan su fecha y responsable.</p>{!routines.length?<p>Todavía no hay rutinas.</p>:routines.map(r=><div className="routine-row" key={r.id}><div><strong>{r.title}</strong><small>{rooms.find(room=>room.id===r.room)?.name} · {r.frequency==='daily'?'Diaria':'Semanal'}</small></div>{r.active?<button disabled={busy} onClick={()=>void act(async()=>{await request(`/tasks/${r.id}/pause`,'POST',{});await refresh()})}>Pausar</button>:<small>Pausada</small>}</div>)}</Dialog>}
  </div>
}
