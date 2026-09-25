import { chatBubbleDuration, type ChatMessage } from '../../../shared/chat'
import HouseChat from './HouseChat'
import { emotes, type Emote, type EmoteEvent } from '../../../shared/emotes'
import type { GameEvent, Score } from '../../../shared/game'
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { colors, request, rooms, type House, type Occurrence, type Person, type RoomId, type Routine } from './model'
import './game.css'
import './hud.css'
import GameIcon from './GameIcon'
import AvatarEditor from './AvatarEditor'
import { usePresence } from './usePresence'
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
  const [messages,setMessages]=useState<ChatMessage[]>([])
  const [speech,setSpeech]=useState<(ChatMessage&{expiresAt:number})[]>([])
  const [character,setCharacter]=useState<string|null>(null)
  const [reactions,setReactions]=useState<(EmoteEvent&{expiresAt:number})[]>([])
  const [members,setMembers]=useState(initialMembers)
  const [tasks,setTasks]=useState<Occurrence[]>([])
  const [routines,setRoutines]=useState<Routine[]>([])
  const [scores,setScores]=useState<Score[]>([])
  const [points,setPoints]=useState(10)
  const [panelOpen,setPanelOpen]=useState(false)
  const [gameEvent,setGameEvent]=useState<GameEvent|null>(null)
  const seenEvents=useRef(new Set<string>())
  const [today,setToday]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [room,setRoom]=useState<RoomId|null>(null)
  const [focus,setFocus]=useState<string|null>(null)
  const [selected,setSelected]=useState<string|null>(null)
  const [tab,setTab]=useState<'pending'|'done'|'upcoming'>('pending')
  const [dialog,setDialog]=useState<'task'|'invite'|'history'|'routines'|'avatar'|'scores'|'menu'|null>(null)
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
  useEffect(()=>{if(dialog)setCharacter(null)},[dialog])
  useEffect(()=>{
    if(!character)return
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setCharacter(null)}
    document.addEventListener('keydown',onKey)
    return ()=>document.removeEventListener('keydown',onKey)
  },[character])
  const refreshVersion=useRef(0)
  const refresh=useCallback(async()=>{
    const version=++refreshVersion.current
    const [data,house]=await Promise.all([request<{occurrences:Occurrence[];routines:Routine[];scores:Score[];today:string}>('/tasks'),request<{members:Person[]}>('/homes/current')])
    if(version!==refreshVersion.current)return
    setMembers(house.members)
    setScores(data.scores);setTasks(data.occurrences);setRoutines(data.routines);setToday(data.today)
  },[])
  const realtimeRefresh=useCallback(()=>{void refresh().catch(e=>setError(e.message))},[refresh])
  const receiveEvent=useCallback((event:GameEvent)=>{
    if(seenEvents.current.has(event.id))return
    seenEvents.current.add(event.id)
    if(seenEvents.current.size>200)seenEvents.current.delete(seenEvents.current.values().next().value!)
    setGameEvent(event)
    if(event.kind==='task.completed')setCelebration(event.occurrenceId)
    if(event.kind==='task.undone')setCelebration(null)
  },[])
  const receiveEmote=useCallback((event:EmoteEvent)=>{
    setReactions(previous=>[...previous.filter(item=>item.userId!==event.userId),{...event,expiresAt:Date.now()+3200}])
  },[])
  const receiveChat=useCallback((message:ChatMessage)=>{
    setMessages(previous=>[...previous,message].slice(-30))
    setSpeech(previous=>[...previous.filter(item=>item.userId!==message.userId),{...message,expiresAt:Date.now()+chatBubbleDuration}])
  },[])
  const presence=usePresence(home.id,room,realtimeRefresh,receiveEvent,receiveEmote,receiveChat)
  useEffect(()=>{
    if(!speech.length)return
    const timer=setTimeout(()=>setSpeech(previous=>previous.filter(item=>item.expiresAt>Date.now())),Math.max(0,Math.min(...speech.map(item=>item.expiresAt))-Date.now()))
    return ()=>clearTimeout(timer)
  },[speech])
  useEffect(()=>{
    if(!reactions.length)return
    const timeout=setTimeout(()=>setReactions(previous=>previous.filter(item=>item.expiresAt>Date.now())),Math.max(0,Math.min(...reactions.map(item=>item.expiresAt))-Date.now()))
    return ()=>clearTimeout(timeout)
  },[reactions])
  function react(emoji:Emote) {
    if(!character)return
    if(presence.sendEmote(emoji,character))setCharacter(null)
    else setError(presence.status==='connected'?'Esperá un instante antes de reaccionar otra vez.':'Reconectando: vas a poder reaccionar cuando vuelva la conexión.')
  }
  useEffect(()=>{if(!gameEvent)return;const timer=setTimeout(()=>{setGameEvent(null);setCelebration(null)},5000);return ()=>clearTimeout(timer)},[gameEvent])
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
  function chooseRoom(id:RoomId|null){setCharacter(null);setRoom(id);setSelected(null);setTab('pending')}
  function chooseTask(task:Occurrence){setPanelOpen(true);setRoom(task.room);setSelected(task.id);setTab(task.completed_at?'done':task.due_date>today?'upcoming':'pending')}
  function newTask(id:RoomId=room??'kitchen') {
    setTaskRoom(id);setIcon(rooms.find(r=>r.id===id)!.icon);setTitle(rooms.find(r=>r.id===id)!.suggestion);setFirstDate(today);setFrequency('daily');setPoints(10);setParticipants(members.map(p=>p.id));setDialog('task')
  }
  function createTask(event:FormEvent) {
    event.preventDefault()
    void act(async()=>{
      const result=await request<{event:GameEvent}>('/tasks','POST',{title,room:taskRoom,icon,frequency,firstDate,participants,points})
      receiveEvent(result.event)
      await refresh();setDialog(null);chooseRoom(taskRoom)
    })
  }
  function complete(task:Occurrence) {
    void act(async()=>{
      const result=await request<{event:GameEvent}>(`/tasks/${encodeURIComponent(task.id)}/complete`,'POST',{})
      receiveEvent(result.event)
      setCelebration(task.id);setUndo({id:task.id,title:task.title});setSelected(null)
      await refresh()
    })
  }
  function nudge(task:Occurrence) {
    void act(async()=>{
      const result=await request<{event:GameEvent}>(`/tasks/${encodeURIComponent(task.id)}/nudge`,'POST',{})
      receiveEvent(result.event);await refresh()
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
  const ownPending=tasks.filter(t=>t.assignee===user.id&&!t.completed_at&&t.due_date<=today).length
  const name=(id:string)=>members.find(p=>p.id===id)?.display_name??'Integrante'
  return <div className="game-shell">
    <header className="game-header">
      <div className="hud-house"><img src="/brand/te-toca-logo.svg" alt="Te Toca" /><div><strong>{home.name}</strong><button className={`hud-presence ${presence.status}`} onClick={()=>setDialog('invite')} title={presence.status==='connected'?'Ver integrantes conectados':presence.status==='expired'?'Tu sesión venció. Volvé a entrar.':'Reconectando con la casa'}><i />{presence.status==='connected'?`${presence.people.length} en línea`:presence.status==='expired'?'Sesión vencida':presence.status==='offline'?'Sin conexión':'Conectando…'}</button></div></div>
      <nav aria-label="Juego"><button className="hud-score" onClick={()=>setDialog('scores')} aria-label="Ver puntajes"><GameIcon name="trophy" /><strong>{scores.find(score=>score.userId===user.id)?.points??0}</strong><span>pts</span></button><button className="hud-menu-button" onClick={()=>setDialog('menu')} aria-label="Abrir menú"><GameIcon name="menu" /></button></nav>
    </header>
    <main className={`game-layout immersive ${panelOpen?'panel-open':'panel-closed'}`}>
      <section className="world-column" aria-label="Casa interactiva">
        <nav className="room-navigation" aria-label="Ir a una habitación"><button className={!room?'active':''} aria-pressed={!room} onClick={()=>{chooseRoom(null);setCameraRevision(value=>value+1)}}><GameIcon name="home" /><span>Casa</span></button>{rooms.map(r=><button key={r.id} className={room===r.id?'active':''} aria-pressed={room===r.id} onClick={()=>chooseRoom(r.id)}><GameIcon name={r.id} /><span>{r.name}</span></button>)}</nav>
        <div className="world-canvas">
          {flat?<div className="room-grid">{rooms.map(r=><button key={r.id} style={{borderColor:r.color}} onClick={()=>chooseRoom(r.id)}><span>{r.name}</span><strong>{tasks.filter(t=>t.room===r.id&&!t.completed_at&&t.due_date<=today).length}</strong><small>tareas pendientes</small></button>)}</div>:
            <SceneBoundary><Suspense fallback={<div className="scene-fallback">Abriendo las puertas de tu casa…</div>}><HouseScene speech={speech} reactions={reactions} character={character} event={gameEvent} panelOpen={panelOpen} online={presence.people} cameraRevision={cameraRevision} room={room} people={members} self={user.id} tasks={tasks} today={today} focus={focus} celebration={celebration} reduced={reduced} onRoom={chooseRoom} onTask={chooseTask} onPerson={id=>setCharacter(character===id?null:id)} /></Suspense></SceneBoundary>}
          <div className="scene-toolbar"><button className="scene-add" aria-label="Crear tarea" onClick={()=>newTask()}><GameIcon name="plus" /><span>Crear tarea</span></button><button aria-label={panelOpen?'Cerrar tareas':'Ver tareas'} onClick={()=>setPanelOpen(value=>!value)} aria-expanded={panelOpen} aria-controls="house-tasks"><GameIcon name="tasks" /><span>Tareas</span>{ownPending>0&&<b>{ownPending}</b>}</button></div>
          {loading&&<div className="scene-loading">Cargando tareas…</div>}
        </div>
      </section>
      <aside id="house-tasks" className="tasks-sidebar" hidden={!panelOpen}><button className="panel-close" onClick={()=>setPanelOpen(false)} aria-label="Cerrar tareas">×</button>
        <div className="sidebar-title"><span className="game-eyebrow">{currentRoom?'ESTÁS EN':'VISTA GENERAL'}</span><h2>{currentRoom?.name??'Tu casa, al día'}</h2><p>{pending.length} pendientes{focus?` · ${name(focus)}`:''}</p>{focus&&<button className="game-link" onClick={()=>setFocus(null)}>Ver a todos</button>}</div>
        {tasks.some(task=>task.assignee===user.id&&!task.completed_at&&task.nudged_at)&&<div className="reminder-note">📣 Te dejaron recordatorios. {tasks.filter(task=>task.assignee===user.id&&!task.completed_at&&task.nudged_at).map(task=><button key={task.id} onClick={()=>{setFocus(null);chooseTask(task)}}>{task.title}</button>)}</div>}
        <div className="task-tabs">{(['pending','done','upcoming'] as const).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setSelected(null)}}>{t==='pending'?'Pendientes':t==='done'?'Hechas':'Próximas'}</button>)}</div>
        <div className="task-list">
          {!loading&&visible.length===0&&<div className="task-empty"><span>{tab==='done'?'✧':'✦'}</span><h3>{tab==='pending'?'Por acá está todo listo':tab==='done'?'Todavía no hay tareas hechas':'Sin próximos turnos'}</h3><p>{routines.length?'El progreso de todos aparece en esta casa.':'Agregá la primera tarea y va a aparecer como un objeto en su habitación.'}</p><button onClick={()=>newTask()}>+ Agregar una tarea</button></div>}
          {visible.map(task=><button key={task.id} className={`task-row ${selected===task.id?'selected':''}`} onClick={()=>chooseTask(task)}><span className={`task-check ${task.completed_at?'done':''}`}>{task.completed_at?'✓':'·'}</span><span><strong>{task.title} <em className="points-badge">+{task.points} pts</em></strong><small>{name(task.assignee)} · {task.due_date===today?'Hoy':task.due_date}{!room&&` · ${rooms.find(r=>r.id===task.room)?.name}`}</small></span><span>↗</span></button>)}
        </div>
        {currentTask&&<section className="task-detail"><button className="detail-close" onClick={()=>setSelected(null)} aria-label="Cerrar detalle">×</button><span className="game-eyebrow">{currentTask.frequency==='daily'?'CADA DÍA':'CADA SEMANA'}</span><h3>{currentTask.title} <em className="points-badge">+{currentTask.points} pts</em></h3><p>Le toca a <strong>{name(currentTask.assignee)}</strong>.</p>{currentTask.completed_at?<div className="completed-note">✓ Hecha el {new Date(currentTask.completed_at*1000).toLocaleDateString('es-AR')}</div>:currentTask.assignee===user.id&&currentTask.due_date<=today?<><p className="real-task-note">Cuando la termines en casa, registrala acá.</p><button className="game-primary" disabled={busy} onClick={()=>complete(currentTask)}>{busy?'Guardando…':'Ya la hice ✓'}</button></>:<p className="real-task-note">{currentTask.due_date>today?'Este turno es para más adelante.':'Su responsable puede marcarla como hecha.'}</p>}{!currentTask.completed_at&&currentTask.assignee!==user.id&&currentTask.due_date<=today&&<button className="nudge-button" disabled={busy} onClick={()=>nudge(currentTask)}>📣 Retar con onda</button>}{currentTask.nudged_at&&!currentTask.completed_at&&<p className="real-task-note">{name(currentTask.nudged_by!)} recordó esta tarea el {new Date(currentTask.nudged_at*1000).toLocaleString('es-AR',{timeZone:home.timezone})}.</p>}</section>}

      </aside>
    </main>
    {(error||authError)&&<div className="game-error" role="alert">{error||authError}<button onClick={()=>{setError('');void refresh().catch(e=>setError(e.message))}}>Reintentar</button></div>}
    {undo&&<div className="game-toast" role="status"><span>✓ {undo.title}</span><button disabled={busy} onClick={()=>void act(async()=>{const result=await request<{event:GameEvent}>(`/tasks/${encodeURIComponent(undo.id)}/undo`,'POST',{});receiveEvent(result.event);setUndo(null);setCelebration(null);await refresh()})}>Deshacer</button></div>}
    {gameEvent&&<div className={`live-event ${gameEvent.kind.replace('.','-')}`} role="status"><span>{gameEvent.kind==='task.created'?'✦':gameEvent.kind==='task.nudged'?'📣':gameEvent.kind==='task.completed'?'★':'↶'}</span><div><strong>{gameEvent.kind==='task.created'?`${gameEvent.actorName} agregó una tarea`:gameEvent.kind==='task.nudged'?`${gameEvent.actorName}: ¡${name(gameEvent.targetId)}, te toca!`:gameEvent.kind==='task.completed'?`${gameEvent.actorName} sumó ${gameEvent.points} puntos`:`${gameEvent.actorName} deshizo una tarea`}</strong><small>{gameEvent.title}</small></div><button onClick={()=>{setFocus(null);setRoom(gameEvent.room);setPanelOpen(true);setSelected(gameEvent.occurrenceId);setTab(gameEvent.kind==='task.completed'?'done':(tasks.find(t=>t.id===gameEvent.occurrenceId)?.due_date??today)>today?'upcoming':'pending')}}>Ver</button></div>}
    <HouseChat messages={messages} people={members} self={user.id} status={presence.status} send={presence.sendChat} />
    {character&&<div className="emote-picker" role="dialog" aria-label={`Acciones con ${name(character)}`}><header><strong>{name(character)}</strong><button aria-label="Cerrar reacciones" onClick={()=>setCharacter(null)}>×</button></header><div>{emotes.map(item=><button key={item.emoji} onClick={()=>react(item.emoji)} title={item.label} aria-label={item.label}><span>{item.emoji}</span><small>{item.label}</small></button>)}</div><footer><span>La reacción sale sobre tu personaje</span><button onClick={()=>{setFocus(character);setPanelOpen(true);setCharacter(null)}}>Ver tareas →</button></footer></div>}
    {dialog==='menu'&&<Dialog title={home.name} close={close}><div className="menu-progress"><span>Hoy completamos</span><strong>{done} / {daily.length}</strong><progress value={done} max={daily.length||1} /></div><div className="game-menu"><button onClick={()=>setDialog('avatar')}><GameIcon name="avatar" />Mi personaje<span>→</span></button><button onClick={()=>setDialog('invite')}><GameIcon name="people" />Integrantes<span>{members.length}</span></button><button onClick={()=>setDialog('scores')}><GameIcon name="trophy" />Puntajes<span>→</span></button><button onClick={openHistory}><GameIcon name="history" />Historial<span>→</span></button>{home.role==='admin'&&<button onClick={()=>setDialog('routines')}><GameIcon name="settings" />Rutinas<span>→</span></button>}<button onClick={()=>{setFlat(value=>!value);close()}}><GameIcon name="view" />{flat?'Volver al 3D':'Usar vista simple'}<span>→</span></button><button onClick={onLogout}><GameIcon name="exit" />Salir<span>→</span></button></div><p className="menu-help">Tocá una habitación para entrar y un objeto para ver su tarea. Arrastrá para girar; usá la rueda o un pellizco para acercarte.</p></Dialog>}
    {dialog==='scores'&&<Dialog title="Puntos de la casa" close={close}><p>★ {scores.reduce((total,score)=>total+score.points,0)} puntos entre todos. Cada tarea completada suma; deshacer revierte sus puntos.</p><div className="scoreboard">{scores.map((score,index)=><article key={score.userId}><span>{index===0&&score.points>0?'🏆':index+1}</span><div><strong>{name(score.userId)}{score.userId===user.id?' (vos)':''}</strong><small>{score.completed} tareas completadas</small></div><b>{score.points}<small>puntos</small></b></article>)}</div></Dialog>}
    {dialog==='avatar'&&<Dialog title="Tu personaje" close={close}><AvatarEditor initial={members.find(p=>p.id===user.id)?.avatar} saved={avatar=>{setMembers(previous=>previous.map(p=>p.id===user.id?{...p,avatar}:p));setDialog(null)}} /></Dialog>}
    {dialog==='task'&&<Dialog title="Una nueva tarea" close={close}><form onSubmit={createTask} className="task-form"><label>¿Qué hay que hacer?<input autoFocus required minLength={2} maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} /></label><div className="form-columns"><label>Habitación<select value={taskRoom} onChange={e=>setTaskRoom(e.target.value as RoomId)}>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Se repite<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="daily">Cada día</option><option value="weekly">Cada semana</option></select></label></div><label>Objeto en la habitación<select value={icon} onChange={e=>setIcon(e.target.value)}><option value="dishes">Platos</option><option value="trash">Bolsa de basura</option><option value="clean">Escoba</option><option value="laundry">Canasto de ropa</option></select></label><label>Puntos por completarla<input type="number" required min={5} max={100} step={1} value={points} onChange={e=>setPoints(Number(e.target.value))} /><small>De 5 a 100. Elegí el valor según el esfuerzo.</small></label><label>Primer turno<input type="date" required min={today} value={firstDate} onChange={e=>setFirstDate(e.target.value)} /></label><fieldset><legend>¿Entre quiénes rota?</legend><p>Elegí una persona para asignársela, o varias para rotar. El número indica el orden.</p>{members.map(person=><label className="participant-option" key={person.id}><input type="checkbox" checked={participants.includes(person.id)} onChange={()=>setParticipants(participants.includes(person.id)?participants.filter(id=>id!==person.id):[...participants,person.id])} /><span>{person.display_name}</span><b>{participants.includes(person.id)?participants.indexOf(person.id)+1:'—'}</b></label>)}</fieldset><p className="rotation-preview">Próximos responsables: {[0,1,2].map(i=>participants.length?name(participants[i%participants.length]):'—').join(' → ')}</p><button className="game-primary" disabled={busy||!participants.length}>{busy?'Creando…':'Agregar a la habitación'}</button></form></Dialog>}
    {dialog==='invite'&&<Dialog title="Las personas de tu casa" close={close}><div className="dialog-people">{members.map((person,i)=>{
      const online=presence.people.find(p=>p.userId===person.id)
      const score=scores.find(score=>score.userId===person.id)
      return <button className="member-card" key={person.id} onClick={()=>{setFocus(person.id);setRoom(null);setPanelOpen(true);close()}}><span style={{background:person.avatar?.shirt??colors[i%colors.length]}}>{person.display_name.slice(0,1)}</span><div><strong>{person.display_name}{person.id===user.id?' (vos)':''}</strong><small>{online?`${online.active?'En línea':'Ausente'} · ${rooms.find(r=>r.id===online.room)?.name??'Entrada'}`:presence.status==='connected'?'Desconectado':'Sin datos de conexión'}</small></div><b>{score?.points??0} pts</b></button>
    })}</div>{home.role==='admin'&&<><p>El código dura siete días. Generar otro deja sin efecto el anterior.</p><button className="game-primary" disabled={busy||members.length>=6} onClick={()=>void act(async()=>{const result=await request<{inviteCode:string}>('/homes/invite','POST',{});setInvite(result.inviteCode);setCopied(false)})}>Generar invitación</button>{invite&&<div className="invite-code"><strong>{invite}</strong><button onClick={()=>void act(async()=>{await navigator.clipboard.writeText(invite);setCopied(true)})}>{copied?'Copiado ✓':'Copiar'}</button></div>}</>}</Dialog>}
    {dialog==='history'&&<Dialog title="Lo que hicimos" close={close}>{historyLoading?<p>Cargando historial…</p>:!history.length?<p>Acá aparecerán las tareas que completen y los cambios de la casa.</p>:<div className="history-list">{history.map(event=><article key={event.id}><span>{event.action==='completed'?'✓':'↶'}</span><div><strong>{event.title}</strong><p>{event.display_name} · {event.action==='completed'?'La completó':event.action==='undone'?'Deshizo la finalización':'Intercambió el turno'}</p><small>{new Date(event.created_at*1000).toLocaleString('es-AR',{timeZone:home.timezone})}</small></div></article>)}</div>}</Dialog>}
    {dialog==='routines'&&<Dialog title="Rutinas de la casa" close={close}><p>Pausar detiene los turnos nuevos. Los ya asignados conservan su fecha y responsable.</p>{!routines.length?<p>Todavía no hay rutinas.</p>:routines.map(r=><div className="routine-row" key={r.id}><div><strong>{r.title}</strong><small>{rooms.find(room=>room.id===r.room)?.name} · {r.frequency==='daily'?'Diaria':'Semanal'}</small></div>{r.active?<button disabled={busy} onClick={()=>void act(async()=>{await request(`/tasks/${r.id}/pause`,'POST',{});await refresh()})}>Pausar</button>:<small>Pausada</small>}</div>)}</Dialog>}
  </div>
}
