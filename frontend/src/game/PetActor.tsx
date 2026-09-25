import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Pet } from '../../../shared/pets'
import type { HouseRoom } from '../../../shared/rooms'

type V3=[number,number,number]
function Fur({p,s,color}:{p:V3;s:V3;color:string}) {
  return <mesh position={p} scale={s} castShadow><sphereGeometry args={[1,16,12]} /><meshStandardMaterial color={color} roughness={.92} /></mesh>
}

export default function PetActor({pet,rooms,reduced,selected,pending,onClick}:{pet:Pet;rooms:HouseRoom[];reduced:boolean;selected:boolean;pending:number;onClick:()=>void}) {
  const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),legs=useRef<THREE.Group>(null),tail=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null)
  const cat=pet.kind==='cat'
  const seed=useMemo(()=>Array.from(pet.id).reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7),[pet.id])
  const route=useMemo(()=>{
    // Door openings are at local z=2.35. Stay in that clear lane and the central corridor.
    // The shared wall clock and stable seed give each pet the same route on every client.
    const points:V3[]=[]
    for(let i=0;i<rooms.length;i++) {
      const room=rooms[(i+seed%rooms.length)%rooms.length]
      const z=room.position[1]+2.35
      points.push([0,.1,z],[room.position[0],.1,z],[0,.1,z])
    }
    return points.length?points:[[0,.1,0] as V3]
  },[rooms,seed])
  const segments=useMemo(()=>{
    let elapsed=0
    return route.map((from,index)=>{
      const to=route[(index+1)%route.length]
      const distance=Math.hypot(to[0]-from[0],to[2]-from[2])
      const walk=distance/(cat?.8:1)
      const rest=index%3===1?2.5:0
      const start=elapsed;elapsed+=walk+rest
      return {from,to,start,end:elapsed,walk,rest}
    })
  },[route,cat])
  useFrame((_,delta)=>{
    if(!root.current)return
    const duration=segments.at(-1)!.end||1
    const time=reduced?0:(Date.now()/1000+seed%1000)%duration
    const segment=segments.find(segment=>time<segment.end)??segments[0]
    const progress=segment.walk?Math.min(1,Math.max(0,time-segment.start-segment.rest)/segment.walk):0
    const walking=!reduced&&time-segment.start>segment.rest&&segment.walk>0
    root.current.position.set(
      THREE.MathUtils.lerp(segment.from[0],segment.to[0],progress),.1,
      THREE.MathUtils.lerp(segment.from[2],segment.to[2],progress))
    if(walking){
      const desired=Math.atan2(segment.to[0]-segment.from[0],segment.to[2]-segment.from[2])
      root.current.rotation.y+=Math.atan2(Math.sin(desired-root.current.rotation.y),Math.cos(desired-root.current.rotation.y))*Math.min(1,delta*12)
    }
    const beat=Date.now()/1000
    if(body.current)body.current.position.y=walking?Math.abs(Math.sin(beat*9))*.026:0
    legs.current?.children.forEach((leg,i)=>{leg.rotation.x=walking?Math.sin(beat*9+(i===0||i===3?0:Math.PI))*.42:0})
    if(tail.current)tail.current.rotation.z=reduced?0:Math.sin(beat*(cat?2:6))*(cat?.15:.38)
    if(head.current)head.current.rotation.y=reduced||walking?0:Math.sin(beat*1.5+seed)*.17
  })
  return <group ref={root} position={route[0]} onClick={event=>{event.stopPropagation();onClick()}}>
    <group ref={body} scale={cat?.82:1}>
      <Fur p={[0,.43,0]} s={[.24,.27,.43]} color={pet.color} />
      <Fur p={[0,.4,.25]} s={[.17,.22,.2]} color="#eee1c9" />
      <group ref={legs}>{[[-.16,.35,.25],[.16,.35,.25],[-.16,.35,-.26],[.16,.35,-.26]].map((p,i)=><group key={i} position={p as V3}>
        <Fur p={[0,-.14,0]} s={[.073,.19,.083]} color={pet.color} /><Fur p={[0,-.28,.035]} s={[.083,.065,.12]} color={i%2?'#ede1cc':pet.color} />
      </group>)}</group>
      <group ref={head} position={[0,.68,.34]}>
        <Fur p={[0,0,0]} s={[.25,.23,.23]} color={pet.color} />
        {[-1,1].map(side=><group key={side} position={[side*.17,.14,-.025]} rotation-z={side*(cat?-.15:.22)}>
          {cat?<><mesh castShadow><coneGeometry args={[.115,.3,3]} /><meshStandardMaterial color={pet.color} roughness={.9} /></mesh><mesh position={[0,.015,.062]} scale={.57}><coneGeometry args={[.115,.27,3]} /><meshStandardMaterial color="#d1a2a0" /></mesh></>:<Fur p={[side*.036,-.1,0]} s={[.095,.22,.11]} color={pet.color==='#ede8df'?'#bba88f':'#705440'} />}
        </group>)}
        <Fur p={[0,-.065,.2]} s={[cat?.14:.17,.1,cat?.09:.16]} color="#f1e4cc" />
        <Fur p={[0,-.015,cat?.285:.34]} s={[.049,.035,.035]} color={cat?'#b97775':'#373939'} />
        {[-1,1].map(side=><group key={side}>
          <Fur p={[side*.105,.045,.199]} s={[.039,.045,.022]} color={cat?'#c7cb84':'#332b28'} />
          {cat&&<Fur p={[side*.105,.045,.22]} s={[.012,.034,.01]} color="#292c26" />}
          <Fur p={[side*.096,.06,.225]} s={[.009,.012,.008]} color="#fffdf7" />
          {cat&&[-1,1].map(slope=><mesh key={slope} position={[side*.19,-.04,.26]} rotation-z={side*(Math.PI/2+slope*.18)}><cylinderGeometry args={[.003,.003,.18,4]} /><meshStandardMaterial color="#e9dfd1" /></mesh>)}
        </group>)}
      </group>
      <mesh position={[0,.61,.29]} rotation-x={Math.PI/2}><torusGeometry args={[.19,.029,8,24]} /><meshStandardMaterial color="#779d96" /></mesh>
      <Fur p={[0,.49,.43]} s={[.045,.055,.018]} color="#ddbd72" />
      <group ref={tail} position={[0,.49,-.36]} rotation-x={cat?-.28:-.8}>
        <mesh position={[0,.22,0]} castShadow><capsuleGeometry args={[cat?.042:.065,cat?.47:.31,4,10]} /><meshStandardMaterial color={pet.color} roughness={.95} /></mesh>
      </group>
    </group>
    {selected&&<mesh rotation-x={-Math.PI/2} position={[0,.008,0]}><ringGeometry args={[.42,.47,32]} /><meshBasicMaterial color="#b4a1cd" /></mesh>}
    <Html center position={[0,cat?1.06:1.25,0]} zIndexRange={[19,0]}><button className={`person-tag pet-tag ${selected?'focused':''}`} onClick={event=>{event.stopPropagation();onClick()}} aria-label={`Ver tareas de ${pet.name}: ${pending} pendientes`}><span>🐾</span>{pet.name}{pending>0&&<b>{pending}</b>}</button></Html>
  </group>
}
