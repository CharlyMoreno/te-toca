import type { EmoteEvent } from '../../../shared/emotes'
import type { GameEvent } from '../../../shared/game'
import { AvatarEffect, RoomBeacon } from './GameEffects'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import AvatarModel from './AvatarModel'
import { defaultAvatar } from '../../../shared/avatar'
import type { OnlinePerson } from './usePresence'
import { rooms, type Occurrence, type Person, type RoomId } from './model'

type V3 = [number, number, number]
type Props = {
  reactions: EmoteEvent[]; character: string|null; event: GameEvent | null; panelOpen: boolean; room: RoomId | null; online: OnlinePerson[]; people: Person[]; self: string; tasks: Occurrence[]; today: string;
  cameraRevision: number; focus: string | null; celebration: string | null; reduced: boolean;
  onRoom: (room: RoomId | null) => void; onTask: (task: Occurrence) => void; onPerson: (id: string) => void
}
function Block({ p, s, color, round = .06, rotation = 0 }: { p: V3; s: V3; color: string; round?: number; rotation?: number }) {
  return <RoundedBox args={s} radius={Math.min(round, ...s.map(v => v / 3))} smoothness={2} position={p} rotation-y={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={.85} />
  </RoundedBox>
}
function Cylinder({ p, radius, height, color }: { p: V3; radius: number; height: number; color: string }) {
  return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[radius, radius, height, 16]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
}
function Plant({ p, size = 1 }: { p: V3; size?: number }) {
  return <group position={p} scale={size}>
    <Cylinder p={[0,.2,0]} radius={.25} height={.4} color="#bd8062" />
    <Cylinder p={[0,.55,0]} radius={.045} height={.7} color="#655e3b" />
    {[0,1,2,3,4].map(i => <mesh key={i} position={[Math.sin(i * 2.4) * .18,.8 + (i % 2) * .18,Math.cos(i * 2.4) * .18]} rotation={[.3,i*2.4,.5]} castShadow><sphereGeometry args={[.28,10,8]} /><meshStandardMaterial color={i%2 ? '#709880' : '#4b7866'} /></mesh>)}
  </group>
}
function Kitchen() {
  return <>
    <Block p={[-.3,.58,-1.85]} s={[3.8,1.1,.9]} color="#a6b6a1" />
    <Block p={[-.3,1.18,-1.85]} s={[4.05,.14,1.07]} color="#f4ede0" />
    {[-1.65,-.55,.55].map(x => <group key={x}><Block p={[x,.6,-1.36]} s={[.95,.91,.05]} color="#bfccb5" /><Block p={[x,.9,-1.3]} s={[.32,.045,.05]} color="#777867" /></group>)}
    <Block p={[-1.3,1.26,-1.85]} s={[.8,.035,.65]} color="#84989a" />
    <Cylinder p={[-1.3,1.47,-2.1]} radius={.035} height={.45} color="#616e75" />
    <Block p={[-1.3,1.67,-1.94]} s={[.07,.06,.35]} color="#616e75" />
    <Block p={[.72,1.26,-1.85]} s={[.95,.035,.7]} color="#444650" />
    {[.49,.95].map(x => [-1.66,-2.03].map(z => <Cylinder key={`${x}:${z}`} p={[x,1.29,z]} radius={.13} height={.02} color="#72717b" />))}
    <Block p={[2,1.05,-1.75]} s={[.85,2.1,1.02]} color="#f5eee0" />
    <Block p={[1.7,1.45,-1.22]} s={[.05,.44,.06]} color="#c69b71" />
    <Block p={[2,.75,-1.23]} s={[.73,.035,.03]} color="#dfd4bc" />
    <Block p={[-.8,1,.55]} s={[2,.12,1]} color="#d9ae80" />
    {[-1.55,-.05].map(x => <Block key={x} p={[x,.49,.55]} s={[.13,.95,.7]} color="#bb916c" />)}
    <Cylinder p={[-1.15,1.12,.53]} radius={.22} height={.05} color="#f8f3e9" />
    <Plant p={[1.25,1.26,-2.05]} size={.5} />
  </>
}
function Bathroom() {
  return <>
    {[-2,-1,0,1,2].map(x => [-2,-1,0,1,2].map(z => <Block key={`${x}:${z}`} p={[x,.065,z]} s={[.96,.02,.96]} color={(x+z)%2 ? '#d1e2dc' : '#e9eeea'} round={0} />))}
    <Block p={[1.3,.5,-1.45]} s={[1.65,.9,2.25]} color="#fbfaf3" round={.25} />
    <Block p={[1.3,.96,-1.45]} s={[1.24,.04,1.82]} color="#95c8c8" round={.2} />
    <Cylinder p={[1.3,1.15,-2.37]} radius={.04} height={.5} color="#a6a49b" />
    <Block p={[-1.4,.55,-1.9]} s={[1.25,1.1,.85]} color="#8bac9f" />
    <Block p={[-1.4,1.15,-1.9]} s={[1.4,.17,1]} color="#fdf9ef" />
    <Block p={[-1.4,2,-2.53]} s={[1.18,1.15,.08]} color="#cda982" />
    <Block p={[-1.4,2,-2.47]} s={[1.02,.98,.02]} color="#bbd6d7" />
    <Cylinder p={[-1.5,.38,.15]} radius={.34} height={.7} color="#fff9ef" />
    <Block p={[-1.5,.89,-.1]} s={[.66,.78,.3]} color="#f6f1e8" round={.13} />
    <Block p={[-1.5,.73,.26]} s={[.73,.12,.9]} color="#fffdf5" round={.2} />
    <Block p={[1.4,.11,.65]} s={[1.5,.045,.8]} color="#bbaa8c" />
    <Plant p={[-2.05,0,1.7]} size={.85} />
  </>
}
function Bedroom() {
  return <>
    <Block p={[-.4,.1,-.2]} s={[3.5,.05,3.7]} color="#baabc9" round={.18} />
    <Block p={[-.5,.4,-.55]} s={[2.5,.55,3.25]} color="#b99074" round={.12} />
    <Block p={[-.5,.74,-.55]} s={[2.46,.24,3.14]} color="#f6eedd" round={.15} />
    <Block p={[-.5,1.04,-2.04]} s={[2.6,1.18,.17]} color="#b9977d" round={.08} />
    <Block p={[-.5,.91,-.08]} s={[2.43,.14,2.15]} color="#a797c0" round={.14} />
    <Block p={[-.5,1,.66]} s={[2.4,.08,.53]} color="#c7b8dd" />
    {[-1.13,.14].map(x => <Block key={x} p={[x,.95,-1.58]} s={[.94,.2,.57]} color="#fff7e6" round={.15} />)}
    <Block p={[1.57,.46,-1.75]} s={[.76,.9,.8]} color="#d9b99b" />
    <Cylinder p={[1.57,1.13,-1.75]} radius={.06} height={.44} color="#a99477" />
    <mesh position={[1.57,1.47,-1.75]} castShadow><coneGeometry args={[.32,.4,16]} /><meshStandardMaterial color="#ffe1ad" /></mesh>
    <Block p={[2.2,1.1,.25]} s={[.4,2.15,1.5]} color="#d4b79d" />
    {[.4,1,1.65].map(y => <Block key={y} p={[1.96,y,.25]} s={[.13,.07,1.38]} color="#9f826d" />)}
    <Plant p={[-2.1,0,1.9]} size={.65} />
  </>
}
function Living() {
  return <>
    <Block p={[.2,.09,.1]} s={[3.7,.045,3.1]} color="#e3b49c" round={.25} />
    <Block p={[.2,.51,-1.43]} s={[3.7,.75,1.15]} color="#a4b89c" round={.17} />
    <Block p={[.2,1.02,-1.92]} s={[3.7,1.2,.25]} color="#8ba284" round={.12} />
    {[-1.6,2].map(x => <Block key={x} p={[x,.77,-1.42]} s={[.3,.92,1.25]} color="#8ba284" round={.13} />)}
    {[-.94,.2,1.34].map(x => <Block key={x} p={[x,.93,-1.36]} s={[1.07,.13,.9]} color="#b4c6a9" round={.1} />)}
    <Block p={[-1,1.18,-1.63]} s={[.52,.5,.18]} color="#eed8ab" rotation={-.2} round={.15} />
    <Cylinder p={[.1,.55,.3]} radius={.85} height={.13} color="#d3af87" />
    <Cylinder p={[.1,.29,.3]} radius={.37} height={.5} color="#bd946f" />
    <Block p={[-.1,.65,.35]} s={[.5,.07,.34]} color="#f4e2c3" rotation={.2} />
    <Plant p={[.5,.63,.2]} size={.35} />
    <Block p={[2.2,.36,1.5]} s={[.42,.65,1.2]} color="#b59475" />
    <Block p={[2.2,1.2,1.5]} s={[.12,1.12,1.58]} color="#414555" />
    <Block p={[2.12,1.2,1.5]} s={[.025,.97,1.4]} color="#738a95" />
    <Plant p={[-2,0,-1.9]} size={1.2} />
  </>
}
function Avatar({ person, index, room, own, reduced, reaction, pending, completed, scheduled, overdue, selected, presenceLabel, emote, onClick }: {
  person: Person; index: number; room: RoomId | null; own: boolean; reduced: boolean; reaction: GameEvent | null;
  emote?:EmoteEvent; presenceLabel: string; pending: number; completed: number; scheduled: number; overdue: number; selected: boolean; onClick: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const walkingRef = useRef(false)
  const route = useRef<THREE.Vector3[]>([])
  const celebrated = useRef(-100)
  const elapsed = useRef(0)
  const spawn: V3 = [-4.5+index*1.65,0,7.15]
  useEffect(() => {
    if (!ref.current) return
    const position = rooms.find(r => r.id === room)?.position
    // Enter along the clear strip in front of the furniture.
    const target = position ? [position[0] - 2.15 + index * .85, position[1] + 2.48] : [-4.5+index*1.65,7.15]
    if (reduced) { ref.current.position.set(target[0],0,target[1]); route.current=[]; return }
    const current = ref.current.position
    route.current = [new THREE.Vector3(0,0,current.z),new THREE.Vector3(0,0,target[1]),new THREE.Vector3(target[0],0,target[1])]
  }, [room,index,reduced])
  useEffect(() => { if (reaction) celebrated.current=elapsed.current }, [reaction])
  useFrame((state,delta) => {
    elapsed.current=state.clock.elapsedTime
    const actor=ref.current
    if (!actor) return
    const target=route.current[0]
    let walking=false
    if (target && !reaction) {
      const distance=actor.position.distanceTo(target)
      if (distance < .06) { actor.position.copy(target); route.current.shift() }
      else {
        walking=true
        const direction=target.clone().sub(actor.position).normalize()
        actor.position.addScaledVector(direction,Math.min(distance,delta*4.4))
        const desired=Math.atan2(direction.x,direction.z)
        actor.rotation.y+=Math.atan2(Math.sin(desired-actor.rotation.y),Math.cos(desired-actor.rotation.y))*Math.min(1,delta*10)
      }
    }
    if (body.current) body.current.position.y=reduced ? 0 : walking ? Math.abs(Math.sin(state.clock.elapsedTime*12))*.045 : Math.sin(state.clock.elapsedTime*2+index)*.018
    walkingRef.current=walking
    const age=state.clock.elapsedTime-celebrated.current
    if(body.current){
      body.current.rotation.z=!reduced&&reaction?.kind==='task.nudged'?Math.sin(age*18)*.12*Math.exp(-age*.7):0
      body.current.rotation.y=!reduced&&reaction?.kind==='task.completed'?Math.min(1,age/1.2)*Math.PI*2:0
      const squash=!reduced&&reaction?.kind==='task.completed'?Math.sin(age*10)*.08*Math.exp(-age):0
      body.current.scale.set(1-squash,1+squash,1-squash)
    }
    actor.position.y=!reduced&&reaction?.kind==='task.completed'&&age<2.5?Math.abs(Math.sin(age*6))*.55*Math.exp(-age*.55):0
  })
  return <group ref={ref} position={spawn} onClick={e=>{e.stopPropagation();onClick()}}>
    <group ref={body}><AvatarModel avatar={person.avatar ?? defaultAvatar} walking={walkingRef} reduced={reduced} mood={reaction?.kind==='task.completed'?'celebrate':reaction?.kind==='task.nudged'?'nudge':'idle'} /></group>
    <mesh rotation-x={-Math.PI/2} position={[0,.018,0]}><ringGeometry args={[.34,.41,32]} /><meshBasicMaterial color={selected || own ? '#af92d7' : '#e3dcd4'} transparent opacity={.9} /></mesh>
    {emote&&<Html key={emote.id} center zIndexRange={[27,0]} position={[0,2.8,0]}><span className="avatar-emote" role="img" aria-label={emote.emoji}>{emote.emoji}</span></Html>}
    {reaction&&!emote&&<AvatarEffect key={reaction.id} event={reaction} reduced={reduced} />}
    <Html zIndexRange={[20, 0]} center position={[0,1.95,0]} style={{pointerEvents:'auto'}}><button className={`person-tag ${selected?'focused':''}`} onClick={onClick} title={`${person.display_name} · ${presenceLabel} · ${completed}/${scheduled} hechas hoy · ${pending} pendientes · ${overdue} atrasadas`}><i className={presenceLabel.includes('En línea')?'online':'away'} />{person.display_name}{own && ' · vos'}</button></Html>
  </group>
}
function TaskProp({ task, index, active, celebrate, reduced, onClick }: { task: Occurrence; index: number; active: boolean; celebrate: boolean; reduced: boolean; onClick: () => void }) {
  const group=useRef<THREE.Group>(null)
  const baseScale=task.completed_at && !celebrate ? 0 : 1
  const completedAt=useRef<number|null>(null)
  const effect=useRef<THREE.Group>(null)
  useEffect(()=>{completedAt.current=null},[task.completed_at])
  useFrame((state,delta)=>{
    if (!group.current) return
    if(task.completed_at)completedAt.current??=state.clock.elapsedTime
    const age=completedAt.current===null?0:state.clock.elapsedTime-completedAt.current
    const finishing=Boolean(task.completed_at)
    const disappear=finishing&&age>1.15
    const scale=reduced ? (finishing?0:1) : THREE.MathUtils.damp(group.current.scale.x,disappear?0:1,7,delta)
    group.current.scale.setScalar(scale)
    const lift=task.icon==='trash'?age*.9:task.icon==='laundry'?Math.sin(age*6)*.15:0
    group.current.position.y=.14+(reduced?0:finishing?lift:Math.sin(state.clock.elapsedTime*2+index)*.045)
    group.current.rotation.y=reduced?0:finishing?(task.icon==='clean'?Math.sin(age*16)*.55:age*5):0
    group.current.rotation.z=!reduced&&finishing&&task.icon==='clean'?Math.sin(age*16)*.22:0
    if(effect.current)effect.current.children.forEach((child,i)=>{
      child.position.set(Math.sin(i*2.4)*(.35+age*.3),.3+age*.9+(i%3)*.12,Math.cos(i*2.4)*(.35+age*.3))
      child.scale.setScalar(Math.max(0,1-age/1.6))
    })
  })
  return <group position={[-1.6+(index%3)*1.4,.14,2.05-Math.floor(index/3)*.65]} ref={group} scale={baseScale} onClick={e=>{e.stopPropagation();onClick()}}>
    {!reduced&&task.completed_at&&celebrate&&<group ref={effect}>{Array.from({length:9},(_,i)=><mesh key={i}><sphereGeometry args={[task.icon==='dishes'?.075:.045,8,6]} /><meshStandardMaterial color={task.icon==='dishes'?'#b9f1f4':'#ffdfa3'} transparent opacity={.8} /></mesh>)}</group>}
    <Cylinder p={[0,.04,0]} radius={.35} height={.05} color="#fff4dd" />
    {task.icon==='trash' ? <><mesh position={[0,.35,0]} castShadow><sphereGeometry args={[.25,10,8]} /><meshStandardMaterial color="#667e74" /></mesh><Block p={[0,.58,0]} s={[.13,.13,.13]} color="#667e74" /></>
      : task.icon==='dishes' ? <>{[0,1,2].map(n=><Cylinder key={n} p={[0,.12+n*.06,0]} radius={.27} height={.045} color={n%2?'#c9dde1':'#fbf6eb'} />)}<Cylinder p={[.12,.42,0]} radius={.09} height={.27} color="#eeb991" /></>
      : task.icon==='laundry' ? <><Block p={[0,.25,0]} s={[.55,.38,.42]} color="#cbb49b" /><Block p={[-.07,.49,0]} s={[.4,.12,.35]} color="#c3b1dd" /><Block p={[.05,.59,.04]} s={[.32,.08,.24]} color="#f0a98d" /></>
      : <><Cylinder p={[0,.47,0]} radius={.035} height={.8} color="#ad866a" /><Block p={[0,.12,0]} s={[.5,.17,.2]} color="#e5b774" /></>}
    {!task.completed_at && <Html zIndexRange={[20, 0]} center position={[0,active ? 1.13 : .95,0]}><button className="task-pin" onClick={onClick} title={task.title} aria-label={task.title}><span>!</span></button></Html>}
  </group>
}
function ViewCamera({ room, reduced, panelOpen }: Pick<Props,'room'|'reduced'|'panelOpen'>) {
  const controls=useRef<ComponentRef<typeof CameraControls>>(null)
  const {camera,size}=useThree()
  useEffect(()=>{
    if(camera instanceof THREE.PerspectiveCamera){
      camera.setViewOffset(size.width,size.height,panelOpen&&size.width>750?170:0,size.width<=750?35:0,size.width,size.height)
      camera.updateProjectionMatrix()
    }
    return ()=>{if(camera instanceof THREE.PerspectiveCamera)camera.clearViewOffset()}
  },[camera,size.width,size.height,panelOpen])
  useEffect(()=>{
    const target=rooms.find(r=>r.id===room)?.position
    const availableWidth=size.width-(panelOpen&&size.width>750?350:0)
    const fit=Math.max(.92,.95/(availableWidth/size.height))
    if (target) void controls.current?.setLookAt(target[0]+6.8*fit,9*fit,target[1]+8*fit,target[0],.3,target[1],!reduced)
    else void controls.current?.setLookAt(13*fit,15*fit,17*fit,0,.3,.7,!reduced)
  },[room,reduced,size.width,size.height,panelOpen])
  return <CameraControls ref={controls} makeDefault minDistance={6} maxDistance={80} minPolarAngle={.15} maxPolarAngle={Math.PI/2.3} smoothTime={.6} />
}
export default function HouseScene(props: Props) {
  const furnishings=[Kitchen,Bathroom,Bedroom,Living]
  return <Canvas frameloop={props.reduced ? 'demand' : 'always'} shadows dpr={[1,1.5]} camera={{position:[13,15,17],fov:42}} fallback={<div className="scene-fallback">Tu navegador no puede mostrar el 3D. Usá las habitaciones y la lista de tareas.</div>}>
    <color attach="background" args={['#ebe9e1']} />
    <ambientLight intensity={1.3} />
    <hemisphereLight args={['#fff6dc','#b1b7a4',1.3]} />
    <directionalLight position={[-5,15,8]} intensity={2.3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={.035} />
    <mesh rotation-x={-Math.PI/2} position={[0,-.55,0]} receiveShadow><planeGeometry args={[200,200]} /><meshStandardMaterial color="#e5e5d9" /></mesh>
    {[-1,1].map(side=><group key={side}>
      <Block p={[side*8,-.36,-1]} s={[1.2,.3,11]} color="#b4c59c" round={.15} />
      {[-5,-2,1,4].map(z=><Plant key={z} p={[side*8,-.2,z]} size={1.15+(z+5)*.03} />)}
    </group>)}
    {[0,1,2].map(i=><Block key={i} p={[0,-.47,8.8+i*1.1]} s={[1.8,.13,.75]} color="#d1c3a7" round={.14} />)}
    <Block p={[0,-.25,.3]} s={[13.6,.5,15.1]} color="#c4af91" round={.16} />
    <Block p={[0,.015,0]} s={[12.8,.09,12.8]} color="#e9dfca" />
    <Block p={[0,1.35,-6.15]} s={[12.7,2.7,.2]} color="#eee6d6" />
    <Block p={[-6.15,1.35,0]} s={[.2,2.7,12.7]} color="#e8dfd0" />
    <Block p={[6.15,.32,0]} s={[.2,.64,12.7]} color="#eee6d6" />
    <Block p={[0,.22,6.15]} s={[12.7,.44,.2]} color="#eee6d6" />
    {[-3.2,3.2].map(x=><Block key={x} p={[x,1.65,-6.025]} s={[1.7,1.2,.035]} color="#bed7d5" />)}
    {rooms.map((room,index)=>{
      const [x,z]=room.position
      const visible=props.tasks.filter(t=>t.room===room.id && t.due_date<=props.today && (!props.focus || props.focus===t.assignee))
      const pending=visible.filter(t=>!t.completed_at)
      const objects=visible.filter(t=>!t.completed_at||t.id===props.celebration).slice(0,6)
      const Furnish= furnishings[index]
      return <group key={room.id} position={[x,0,z]} onClick={e=>{e.stopPropagation();props.onRoom(room.id)}}>
        <Block p={[0,.025,0]} s={[5.7,.1,5.7]} color={room.floor} />
        <Furnish />
        <RoomBeacon color={room.color} active={props.room===room.id||props.event?.room===room.id} reduced={props.reduced} />
        <Html zIndexRange={[20, 0]} center position={[0,.15,2.72]}><button className={`room-tag ${props.room===room.id?'selected':''}`} onClick={()=>props.onRoom(room.id)}><i style={{background:room.color}} />{room.name}<b>{pending.length || '✓'}</b></button></Html>
        {pending.length > 6 && <Html zIndexRange={[20, 0]} center position={[0,.8,2.8]}><button className="room-tag" onClick={()=>props.onRoom(room.id)}>+{pending.length - 6} en la lista</button></Html>}
        {objects.map((task,i)=><TaskProp key={task.id} task={task} index={i} active={props.room===room.id} celebrate={props.celebration===task.id} reduced={props.reduced} onClick={()=>props.onTask(task)} />)}
      </group>
    })}
    {[-4.7,-1.7,1.7,4.7].map(x=><Block key={x} p={[x,.4,0]} s={[1.7,.8,.13]} color="#e4d9c8" />)}
    <Plant p={[-6.75,-.35,6.65]} size={1.3} /><Plant p={[6.8,-.35,-5.7]} size={1.7} />
    {props.people.map((person,index)=> (person.id===props.self || props.online.some(p=>p.userId===person.id) || (props.event?.kind==='task.nudged'&&props.event.targetId===person.id)) && <Avatar key={person.id} person={person} index={index} room={person.id===props.self ? props.room : props.online.find(p=>p.userId===person.id)?.room ?? (props.event?.targetId===person.id?props.event.room:null)} presenceLabel={props.online.some(p=>p.userId===person.id) ? (props.online.find(p=>p.userId===person.id)?.active ? '● En línea' : '◐ Ausente') : props.event?.targetId===person.id?'Desconectado · aviso guardado':'Sin conexión'} own={person.id===props.self} reduced={props.reduced}
      reaction={props.event?.targetId===person.id&&['task.completed','task.nudged'].includes(props.event.kind)?props.event:null} pending={props.tasks.filter(t=>!t.completed_at && t.due_date<=props.today && t.assignee===person.id).length}
      completed={props.tasks.filter(t=>t.completed_at && t.due_date===props.today && t.assignee===person.id).length}
      scheduled={props.tasks.filter(t=>t.due_date===props.today && t.assignee===person.id).length}
      overdue={props.tasks.filter(t=>!t.completed_at && t.due_date<props.today && t.assignee===person.id).length}
      emote={props.reactions.find(item=>item.userId===person.id)} selected={props.character===person.id||props.focus===person.id} onClick={()=>props.onPerson(person.id)} />)}
    <ViewCamera panelOpen={props.panelOpen} key={props.cameraRevision} room={props.room} reduced={props.reduced} />
  </Canvas>
}
