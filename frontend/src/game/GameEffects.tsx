import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { GameEvent } from '../../../shared/game'

// Deterministic particles keep both clients' bursts visually consistent.
export function AvatarEffect({ event, reduced }: {event:GameEvent;reduced:boolean}) {
  const particles=useRef<THREE.Group>(null), ring=useRef<THREE.Mesh>(null)
  const started=useRef<number|null>(null)
  const celebration=event.kind==='task.completed'
  useFrame(state=>{
    started.current??=state.clock.elapsedTime
    const age=state.clock.elapsedTime-started.current
    if(particles.current) particles.current.children.forEach((child,i)=>{
      const angle=i*2.399, speed=.6+(i%5)*.16
      child.position.set(Math.cos(angle)*age*speed,1.2+age*(1.8+(i%3)*.3)-age*age*.65,Math.sin(angle)*age*speed)
      child.rotation.set(age*3+i,age*2,age*4)
      child.scale.setScalar(Math.max(0,1-age/2.8))
    })
    if(ring.current){ring.current.scale.setScalar(1+age*1.8);(ring.current.material as THREE.MeshBasicMaterial).opacity=Math.max(0,.65-age*.3)}
  })
  return <group>
    {!reduced&&<>
      <mesh ref={ring} rotation-x={-Math.PI/2} position={[0,.1,0]}><ringGeometry args={[.45,.5,48]} /><meshBasicMaterial color={celebration?'#f5cb69':'#e49c68'} transparent depthWrite={false} /></mesh>
      {celebration&&<group ref={particles}>{Array.from({length:26},(_,i)=><mesh key={i}><boxGeometry args={[.08,.13,.045]} /><meshStandardMaterial color={['#e7ad57','#a48bd0','#6dac9e','#e88976'][i%4]} /></mesh>)}</group>}
    </>}
    <Html center zIndexRange={[25,0]} position={[0,2.6,0]}><div className={`avatar-reaction ${celebration?'celebrate':'nudge'}`}>{celebration?`★ +${event.points}`:'📣 ¡Te toca!'}<small>{celebration?'¡Bien ahí!':event.title}</small></div></Html>
  </group>
}

export function RoomBeacon({ color, active, reduced }: {color:string;active:boolean;reduced:boolean}) {
  const ref=useRef<THREE.Mesh>(null)
  useFrame(state=>{if(ref.current)(ref.current.material as THREE.MeshBasicMaterial).opacity=active ? (reduced ? .4 : .28+Math.sin(state.clock.elapsedTime*2)*.1) : .08})
  return <mesh ref={ref} rotation-x={-Math.PI/2} position={[0,.085,0]}><ringGeometry args={[3.9,3.94,4]} /><meshBasicMaterial color={color} transparent depthWrite={false} /></mesh>
}
