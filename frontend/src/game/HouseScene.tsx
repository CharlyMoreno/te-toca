import { houseBounds, type HouseRoom } from '../../../shared/rooms'
import { HouseMaterials } from './HouseMaterials'
import { Furnishings } from './HouseFurnishings'
import { Garage, Garden } from './OutdoorRooms'
import PetActor from './PetActor'
import type { Pet } from '../../../shared/pets'
import { HouseFoundation, RoomArchitecture } from './HouseArchitecture'
import type { ChatMessage } from '../../../shared/chat'
import type { EmoteEvent } from '../../../shared/emotes'
import type { GameEvent } from '../../../shared/game'
import { AvatarEffect, RoomBeacon } from './GameEffects'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html, RoundedBox, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import AvatarModel from './AvatarModel'
import { defaultAvatar } from '../../../shared/avatar'
import type { OnlinePerson } from './usePresence'
import { type Occurrence, type Person, type RoomId } from './model'

type V3 = [number, number, number]
type Props = {
  pets:Pet[]; onPet:(id:string)=>void; rooms:HouseRoom[]; speech: ChatMessage[]; reactions: EmoteEvent[]; character: string|null; event: GameEvent | null; panelOpen: boolean; room: RoomId | null; online: OnlinePerson[]; people: Person[]; self: string; tasks: Occurrence[]; today: string;
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
function Avatar({ rooms, entranceZ, person, index, room, own, reduced, reaction, pending, completed, scheduled, overdue, selected, presenceLabel, emote, speech, onClick }: {
  rooms:HouseRoom[]; entranceZ:number; person: Person; index: number; room: RoomId | null; own: boolean; reduced: boolean; reaction: GameEvent | null;
  speech?:ChatMessage; emote?:EmoteEvent; presenceLabel: string; pending: number; completed: number; scheduled: number; overdue: number; selected: boolean; onClick: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const walkingRef = useRef(false)
  const route = useRef<THREE.Vector3[]>([])
  const celebrated = useRef(-100)
  const elapsed = useRef(0)
  const spawn=useRef<V3>([-4.5+index*1.65,0,entranceZ]).current
  const position=rooms.find(r=>r.id===room)?.position
  const targetX=position?position[0]-2.15+index*.85:-4.5+index*1.65
  const targetZ=position?position[1]+2.48:entranceZ
  useEffect(() => {
    if (!ref.current) return
    // The central corridor stays clear as the house grows.
    const target=[targetX,targetZ]
    if (reduced) { ref.current.position.set(target[0],0,target[1]); route.current=[]; return }
    const current = ref.current.position
    route.current = [new THREE.Vector3(0,0,current.z),new THREE.Vector3(0,0,target[1]),new THREE.Vector3(target[0],0,target[1])]
  }, [targetX,targetZ,reduced])
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
    {speech&&<Html key={speech.id} center zIndexRange={[28,0]} position={[0,2.7,0]}><div className="avatar-speech">{speech.text}</div></Html>}
    {emote&&!speech&&<Html key={emote.id} center zIndexRange={[27,0]} position={[0,2.8,0]}><span className="avatar-emote" role="img" aria-label={emote.emoji}>{emote.emoji}</span></Html>}
    {reaction&&!emote&&!speech&&<AvatarEffect key={reaction.id} event={reaction} reduced={reduced} />}
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
    {task.pet_id&&task.icon==='dishes' ? <><mesh position={[0,.2,0]} castShadow><cylinderGeometry args={[.27,.2,.19,24,1,true]} /><meshStandardMaterial color="#d0ab79" side={THREE.DoubleSide} /></mesh><Cylinder p={[0,.17,0]} radius={.21} height={.04} color="#88b9bd" /></>
      : task.icon==='trash' ? <><mesh position={[0,.35,0]} castShadow><sphereGeometry args={[.25,10,8]} /><meshStandardMaterial color="#667e74" /></mesh><Block p={[0,.58,0]} s={[.13,.13,.13]} color="#667e74" /></>
      : task.icon==='dishes' ? <>{[0,1,2].map(n=><Cylinder key={n} p={[0,.12+n*.06,0]} radius={.27} height={.045} color={n%2?'#c9dde1':'#fbf6eb'} />)}<Cylinder p={[.12,.42,0]} radius={.09} height={.27} color="#eeb991" /></>
      : task.icon==='laundry' ? <><Block p={[0,.25,0]} s={[.55,.38,.42]} color="#cbb49b" /><Block p={[-.07,.49,0]} s={[.4,.12,.35]} color="#c3b1dd" /><Block p={[.05,.59,.04]} s={[.32,.08,.24]} color="#f0a98d" /></>
      : <><Cylinder p={[0,.47,0]} radius={.035} height={.8} color="#ad866a" /><Block p={[0,.12,0]} s={[.5,.17,.2]} color="#e5b774" /></>}
    {!task.completed_at && <Html zIndexRange={[20, 0]} center position={[0,active ? 1.13 : .95,0]}><button className="task-pin" onClick={onClick} title={task.title} aria-label={task.title}><span>{task.pet_id?'🐾':'!'}</span></button></Html>}
  </group>
}
function ViewCamera({ rooms, room, reduced, panelOpen }: Pick<Props,'rooms'|'room'|'reduced'|'panelOpen'>) {
  const controls=useRef<ComponentRef<typeof CameraControls>>(null)
  const {camera,size}=useThree()
  useEffect(()=>{
    if(camera instanceof THREE.PerspectiveCamera){
      camera.setViewOffset(size.width,size.height,panelOpen&&size.width>750?170:0,size.width<=750?35:0,size.width,size.height)
      camera.updateProjectionMatrix()
    }
    return ()=>{if(camera instanceof THREE.PerspectiveCamera)camera.clearViewOffset()}
  },[camera,size.width,size.height,panelOpen])
  const target=rooms.find(r=>r.id===room)?.position
  const {depth}=houseBounds(rooms)
  const targetX=target?.[0],targetZ=target?.[1]
  useEffect(()=>{
    const availableWidth=size.width-(panelOpen&&size.width>750?350:0)
    const fit=Math.max(.92,.95/(availableWidth/size.height))
    const expansion=Math.max(1,depth/13.5)
    if (targetX!==undefined&&targetZ!==undefined) void controls.current?.setLookAt(targetX+6.8*fit,9*fit,targetZ+8*fit,targetX,.3,targetZ,!reduced)
    else void controls.current?.setLookAt(13*fit*expansion,15*fit*expansion,17*fit*expansion,0,.3,.7,!reduced)
  },[targetX,targetZ,depth,reduced,size.width,size.height,panelOpen])
  return <CameraControls ref={controls} makeDefault minDistance={6} maxDistance={200} minPolarAngle={.15} maxPolarAngle={Math.PI/2.3} smoothTime={.6} />
}
export default function HouseScene(props: Props) {
  const {depth,entranceZ}=houseBounds(props.rooms)
  const shadowExtent=Math.max(12,depth/2+4)
  return <Canvas frameloop={props.reduced ? 'demand' : 'always'} shadows gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}} dpr={[1,1.5]} camera={{position:[13,15,17],fov:42}} fallback={<div className="scene-fallback">Tu navegador no puede mostrar el 3D. Usá las habitaciones y la lista de tareas.</div>}>
    <HouseMaterials>
    <color attach="background" args={['#dfe4d8']} />
    <fog attach="fog" args={['#dfe4d8',65,150]} />
    <ambientLight intensity={.35} />
    <hemisphereLight args={['#e9f0ff','#b6a387',.65]} />
    <directionalLight position={[-10,18,8]} color="#fff1d5" intensity={3.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-shadowExtent} shadow-camera-right={shadowExtent} shadow-camera-top={shadowExtent} shadow-camera-bottom={-shadowExtent} shadow-camera-far={90} shadow-bias={-.00015} shadow-normalBias={.025} shadow-radius={3} />
    <Environment frames={1} resolution={128}>
      <Lightformer form="rect" intensity={2.4} color="#fff4dc" position={[-8,10,4]} scale={[10,12,1]} rotation-y={Math.PI/3} />
      <Lightformer form="rect" intensity={1.2} color="#dceafa" position={[8,5,-8]} scale={[12,8,1]} rotation-y={-Math.PI/3} />
    </Environment>
    <HouseFoundation rooms={props.rooms} />
    <ContactShadows key={depth} position={[0,-.475,0]} opacity={.3} scale={[20,depth+8]} blur={2.4} far={8} resolution={512} frames={1} color="#544535" />
    {props.rooms.map((room,index)=>{
      const [x,z]=room.position
      const visible=props.tasks.filter(t=>t.room===room.id && t.due_date<=props.today && (!props.focus || props.focus===t.assignee || props.focus===t.pet_id))
      const pending=visible.filter(t=>!t.completed_at)
      const objects=visible.filter(t=>!t.completed_at||t.id===props.celebration).slice(0,6)
      return <group key={room.id} position={[x,0,z]} onClick={e=>{e.stopPropagation();props.onRoom(room.id)}}>
        <RoomArchitecture room={room} index={index} />
        {room.kind==='garage'?<Garage />:room.kind==='garden'?<Garden />:<Furnishings kind={room.kind} />}
        <RoomBeacon color={room.color} active={props.room===room.id||props.event?.room===room.id} reduced={props.reduced} />
        <Html zIndexRange={[20, 0]} center position={[0,.15,2.72]}><button className={`room-tag ${props.room===room.id?'selected':''}`} onClick={()=>props.onRoom(room.id)}><i style={{background:room.color}} />{room.name}<b>{pending.length || '✓'}</b></button></Html>
        {pending.length > 6 && <Html zIndexRange={[20, 0]} center position={[0,.8,2.8]}><button className="room-tag" onClick={()=>props.onRoom(room.id)}>+{pending.length - 6} en la lista</button></Html>}
        {objects.map((task,i)=><TaskProp key={task.id} task={task} index={i} active={props.room===room.id} celebrate={props.celebration===task.id} reduced={props.reduced} onClick={()=>props.onTask(task)} />)}
      </group>
    })}
    {props.pets.map(pet=><PetActor key={pet.id} pet={pet} rooms={props.rooms} reduced={props.reduced} selected={props.focus===pet.id} pending={props.tasks.filter(task=>task.pet_id===pet.id&&!task.completed_at&&task.due_date<=props.today).length} onClick={()=>props.onPet(pet.id)} />)}
    {props.people.map((person,index)=> (person.id===props.self || props.online.some(p=>p.userId===person.id) || (props.event?.kind==='task.nudged'&&props.event.targetId===person.id)) && <Avatar rooms={props.rooms} entranceZ={entranceZ} key={person.id} person={person} index={index} room={person.id===props.self ? props.room : props.online.find(p=>p.userId===person.id)?.room ?? (props.event?.targetId===person.id?props.event.room:null)} presenceLabel={props.online.some(p=>p.userId===person.id) ? (props.online.find(p=>p.userId===person.id)?.active ? '● En línea' : '◐ Ausente') : props.event?.targetId===person.id?'Desconectado · aviso guardado':'Sin conexión'} own={person.id===props.self} reduced={props.reduced}
      reaction={props.event?.targetId===person.id&&['task.completed','task.nudged'].includes(props.event.kind)?props.event:null} pending={props.tasks.filter(t=>!t.completed_at && t.due_date<=props.today && t.assignee===person.id).length}
      completed={props.tasks.filter(t=>t.completed_at && t.due_date===props.today && t.assignee===person.id).length}
      scheduled={props.tasks.filter(t=>t.due_date===props.today && t.assignee===person.id).length}
      overdue={props.tasks.filter(t=>!t.completed_at && t.due_date<props.today && t.assignee===person.id).length}
      speech={props.speech.find(item=>item.userId===person.id)} emote={props.reactions.find(item=>item.userId===person.id)} selected={props.character===person.id||props.focus===person.id} onClick={()=>props.onPerson(person.id)} />)}
    <ViewCamera rooms={props.rooms} panelOpen={props.panelOpen} key={props.cameraRevision} room={props.room} reduced={props.reduced} />
    </HouseMaterials>
  </Canvas>
}
