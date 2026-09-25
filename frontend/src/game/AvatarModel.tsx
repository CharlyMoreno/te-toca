import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { AvatarConfig } from '../../../shared/avatar'

type Vec3 = [number, number, number]
function Ball({ at, scale = [1,1,1], radius, color }: { at: Vec3; scale?: Vec3; radius: number; color: string }) {
  return <mesh position={at} scale={scale} castShadow><sphereGeometry args={[radius,16,12]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
}
function Capsule({ at, radius, length, color }: { at: Vec3; radius: number; length: number; color: string }) {
  return <mesh position={at} castShadow><capsuleGeometry args={[radius,length,4,12]} /><meshStandardMaterial color={color} roughness={.85} /></mesh>
}
export default function AvatarModel({ avatar, walking, reduced = false, mood = 'idle' }: { avatar: AvatarConfig; walking?: RefObject<boolean>; reduced?: boolean; mood?: 'idle'|'celebrate'|'nudge' }) {
  const left = useRef<Group>(null), right = useRef<Group>(null)
  const leftArm=useRef<Group>(null),rightArm=useRef<Group>(null)
  useFrame(state => {
    const swing = !reduced && walking?.current ? Math.sin(state.clock.elapsedTime * 12) * .48 : 0
    if (left.current) left.current.rotation.x = swing
    if (right.current) right.current.rotation.x = -swing
    for(const [index,arm] of [leftArm.current,rightArm.current].entries()) {
      if(!arm)continue
      const side=index===0?-1:1
      arm.rotation.x=mood==='idle'?-swing*(index===0?1:-1):0
      arm.rotation.z=side*(mood==='celebrate'?2.5+(reduced?0:Math.sin(state.clock.elapsedTime*12)*.2):mood==='nudge'?1.1+(reduced?0:Math.sin(state.clock.elapsedTime*7)*.16):.12)
    }
  })
  return <group>
    <Capsule at={[0,.65,0]} radius={.23} length={.35} color={avatar.shirt} />
    <Capsule at={[0,.95,0]} radius={.08} length={.08} color={avatar.skin} />
    <Ball at={[0,1.19,0]} radius={.255} color={avatar.skin} />
    {[-.25,.25].map(x => <Ball key={x} at={[x,1.19,0]} scale={[.6,1,.8]} radius={.065} color={avatar.skin} />)}
    <Ball at={[0,1.16,.246]} scale={[.85,1,1]} radius={.045} color={avatar.skin} />
    {[-.085,.085].map(x => <group key={x}>
      <Ball at={[x,1.21,.235]} radius={.026} color="#302a32" />
      <mesh position={[x,1.285,.22]} rotation-z={x < 0 ? -.1 : .1}><boxGeometry args={[.065,.017,.025]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
    </group>)}
    <mesh position={[0,1.095,.234]} rotation-z={Math.PI}><torusGeometry args={[.047,.009,6,16,Math.PI]} /><meshStandardMaterial color="#925a51" /></mesh>
    {avatar.hairStyle !== 'bald' && <Ball at={[0,1.33,-.035]} scale={[1.03,.6,1]} radius={.26} color={avatar.hairColor} />}
    {avatar.hairStyle === 'short' && <><Ball at={[-.11,1.38,.13]} scale={[1.5,.6,1]} radius={.13} color={avatar.hairColor} /><Ball at={[.14,1.36,.1]} radius={.11} color={avatar.hairColor} /></>}
    {avatar.hairStyle === 'curly' && Array.from({length:9},(_,i) => <Ball key={i} at={[Math.sin(i*2.4)*.2,1.36+(i%3)*.055,Math.cos(i*2.4)*.16]} radius={.12} color={avatar.hairColor} />)}
    {avatar.hairStyle === 'long' && <><Ball at={[0,1.16,-.16]} scale={[1,.95,.55]} radius={.29} color={avatar.hairColor} />{[-.22,.22].map(x=><Capsule key={x} at={[x,1.1,-.05]} radius={.09} length={.25} color={avatar.hairColor} />)}</>}
    {avatar.hairStyle === 'bun' && <Ball at={[0,1.55,-.07]} radius={.145} color={avatar.hairColor} />}
    {avatar.glasses && <group position={[0,1.21,.26]}>
      {[-.085,.085].map(x => <mesh key={x} position={[x,0,0]}><torusGeometry args={[.068,.014,8,20]} /><meshStandardMaterial color="#514457" /></mesh>)}
      <mesh><boxGeometry args={[.05,.018,.025]} /><meshStandardMaterial color="#514457" /></mesh>
    </group>}
    {[-.32,.32].map(x => <group key={x} ref={x<0?leftArm:rightArm} position={[x,.83,0]}>
      <Capsule at={[0,-.07,0]} radius={.085} length={.12} color={avatar.shirt} />
      <Capsule at={[0,-.27,0]} radius={.064} length={.15} color={avatar.skin} />
    </group>)}
    {[-1,1].map(side => <group key={side} ref={side === -1 ? left : right} position={[side*.11,.41,0]}>
      <Capsule at={[0,-.18,0]} radius={.083} length={.23} color={avatar.pants} />
      <Ball at={[0,-.35,.065]} scale={[.9,.6,1.5]} radius={.1} color="#fff5df" />
    </group>)}
  </group>
}
