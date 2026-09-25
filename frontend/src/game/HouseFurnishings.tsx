import { RoundedBox } from '@react-three/drei'
import { Surface, type Finish } from './HouseMaterials'
import type { RoomKind } from '../../../shared/rooms'
export type V3=[number,number,number]
export function Box({p,s,color='#fff',finish='plaster',radius=.025,rotation=0}:{p:V3;s:V3;color?:string;finish?:Finish;radius?:number;rotation?:number}) {
  return <RoundedBox position={p} args={s} radius={Math.min(radius,...s.map(v=>v/3))} smoothness={2} rotation-y={rotation} castShadow receiveShadow><Surface finish={finish} color={color} /></RoundedBox>
}
export function Tube({p,r,h,color='#bababa',finish='metal'}:{p:V3;r:number;h:number;color?:string;finish?:Finish}) {
  return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[r,r,h,24]} /><Surface finish={finish} color={color} /></mesh>
}
export function Plant({p,scale=1}:{p:V3;scale?:number}) {
  return <group position={p} scale={scale}>
    <mesh position={[0,.21,0]} castShadow><cylinderGeometry args={[.23,.16,.42,24]} /><Surface finish="ceramic" color="#b5a390" /></mesh>
    <Tube p={[0,.43,0]} r={.022} h={.5} color="#74664c" finish="wood" />
    {Array.from({length:8},(_,i)=><group key={i} rotation-y={i*2.4} position={[0,.48+(i%3)*.13,0]}>
      <mesh position={[.15,.13,0]} rotation-z={-.6} scale={[.13,.31,.045]} castShadow><sphereGeometry args={[1,10,8]} /><meshStandardMaterial color={i%2?'#496744':'#75895b'} roughness={.8} /></mesh>
    </group>)}
  </group>
}
function Faucet({p}:{p:V3}) {
  return <group position={p}><Tube p={[0,.17,0]} r={.025} h={.34} /><mesh position={[0,.32,.095]} rotation-x={Math.PI/2}><cylinderGeometry args={[.025,.025,.19,16]} /><Surface finish="metal" /></mesh><Tube p={[0,.28,.19]} r={.028} h={.09} /></group>
}
function Books({p}:{p:V3}) {
  return <group position={p}>{['#d8cbbb','#758f83','#9a7c67','#d0b489'].map((color,i)=><Box key={i} p={[i*.12,.2,0]} s={[.1,.4+(i%2)*.08,.29]} color={color} radius={.004} />)}</group>
}
function Lamp({p}:{p:V3}) {
  return <group position={p}><Tube p={[0,.03,0]} r={.14} h={.055} color="#ad8f59" /><Tube p={[0,.23,0]} r={.024} h={.4} color="#ad8f59" /><mesh position={[0,.49,0]} castShadow><cylinderGeometry args={[.16,.27,.34,28,1,true]} /><meshStandardMaterial color="#f2dfba" roughness={.9} side={2} emissive="#eccb86" emissiveIntensity={.25} /></mesh></group>
}
function Kitchen() {
  return <>
    <Box p={[-.35,.52,-2.14]} s={[4.12,1,.82]} color="#aab3a0" />
    {[-1.92,-.88,.16,1.2].map(x=><group key={x}><Box p={[x,.55,-1.708]} s={[.98,.92,.045]} color="#bac0ae" /><Box p={[x,.86,-1.665]} s={[.34,.025,.027]} finish="metal" color="#a2936d" /></group>)}
    <Box p={[-.35,1.055,-2.14]} s={[4.2,.09,.94]} finish="stone" color="#fff9ed" />
    <Box p={[-1.3,1.108,-2.14]} s={[.91,.03,.63]} finish="metal" color="#b5baba" radius={.065} />
    <Box p={[-1.3,1.128,-2.14]} s={[.74,.015,.49]} finish="metal" color="#556260" radius={.07} />
    <Faucet p={[-1.3,1.12,-2.43]} />
    <Box p={[.67,1.11,-2.12]} s={[1,.025,.65]} finish="ceramic" color="#242a2a" />
    {[.4,.94].map(x=>[-2.3,-1.95].map(z=><mesh key={`${x}:${z}`} position={[x,1.13,z]} rotation-x={-Math.PI/2}><ringGeometry args={[.085,.105,24]} /><Surface finish="metal" color="#969c9c" /></mesh>))}
    <Box p={[.67,.57,-1.678]} s={[.91,.55,.05]} finish="metal" color="#b9bfbc" />
    <Box p={[.67,.52,-1.64]} s={[.73,.36,.03]} finish="glass" color="#24312e" /><Box p={[.67,.79,-1.605]} s={[.68,.028,.04]} finish="metal" />
    <Box p={[2.18,1.1,-2.05]} s={[.86,2.2,1]} finish="metal" color="#d3d6cc" radius={.05} />
    <Box p={[2.18,.75,-1.538]} s={[.8,.024,.02]} color="#626e68" /><Box p={[1.88,1.44,-1.51]} s={[.027,.48,.045]} finish="metal" />
    <Box p={[-.5,.48,.15]} s={[2.4,.95,.91]} finish="wood" color="#b99873" />
    <Box p={[-.5,1.01,.15]} s={[2.65,.1,1.13]} finish="stone" color="#f9f1df" />
    <Box p={[-.8,1.08,.13]} s={[.58,.03,.32]} finish="wood" color="#b98b61" rotation={.15} />
    {[-1.24,.32].map(x=><group key={x}><Tube p={[x,.73,.98]} r={.25} h={.06} finish="wood" color="#b6936e" />{[-.15,.15].map(dx=><Box key={dx} p={[x+dx,.35,.98]} s={[.035,.7,.3]} finish="metal" color="#414946" />)}</group>)}
    <Plant p={[1.4,1.1,-2.35]} scale={.5} />
  </>
}
function Bathroom() {
  return <>
    <Box p={[1.48,.12,-1.55]} s={[1.9,.2,2.45]} finish="stone" color="#f8f8f0" radius={.06} />
    <Box p={[.52,1.18,-1.56]} s={[.026,2.18,2.45]} finish="glass" color="#adc8c5" radius={.005} />
    <Box p={[.52,2.29,-1.56]} s={[.036,.035,2.45]} finish="metal" />
    <Tube p={[1.7,1.53,-2.68]} r={.028} h={1.5} /><mesh position={[1.7,2.23,-2.42]} rotation-x={Math.PI/2}><cylinderGeometry args={[.025,.025,.5,16]} /><Surface finish="metal" /></mesh><Tube p={[1.7,2.22,-2.17]} r={.19} h={.028} />
    <Box p={[-1.48,.62,-2.1]} s={[1.55,.8,.85]} finish="wood" color="#b89472" />
    <Box p={[-1.48,1.06,-2.1]} s={[1.67,.08,.97]} finish="stone" color="#faf8ec" />
    <mesh position={[-1.48,1.15,-2.03]} scale={[.51,.11,.32]}><sphereGeometry args={[1,24,12]} /><Surface finish="ceramic" color="#fffdf2" /></mesh>
    <Faucet p={[-1.48,1.1,-2.47]} />
    <Box p={[-1.53,.38,.03]} s={[.43,.55,.56]} finish="ceramic" color="#fdfcf3" radius={.15} />
    <Box p={[-1.53,.93,-.27]} s={[.68,.69,.24]} finish="ceramic" color="#fdfcf3" radius={.06} />
    <mesh position={[-1.53,.7,.04]} rotation-x={-Math.PI/2} scale={[1,1.22,1]}><torusGeometry args={[.265,.068,12,32]} /><Surface finish="ceramic" color="#fffdf7" /></mesh>
    <Box p={[.97,.08,.86]} s={[1.6,.055,.83]} finish="fabric" color="#c6b99b" radius={.045} />
    <Box p={[-2.78,1.13,.77]} s={[.05,.6,.48]} finish="fabric" color="#e1d6bd" />
    <Plant p={[-2.2,.06,1.67]} scale={.72} />
  </>
}
function Bedroom() {
  return <>
    <Box p={[-.48,.08,-.42]} s={[3.55,.045,3.85]} finish="fabric" color="#b9ac9c" />
    <Box p={[-.48,.31,-.56]} s={[2.58,.39,3.25]} finish="wood" color="#aa815e" />
    <Box p={[-.48,.61,-.56]} s={[2.48,.29,3.16]} finish="fabric" color="#fff7e7" radius={.1} />
    <Box p={[-.48,.98,-2.18]} s={[2.64,1.32,.15]} finish="fabric" color="#b6a690" radius={.075} />
    <Box p={[-.48,.83,-.09]} s={[2.52,.14,2.27]} finish="fabric" color="#bdc4b0" radius={.09} />
    <Box p={[-.48,.89,.65]} s={[2.57,.09,.72]} finish="fabric" color="#b59f8c" radius={.06} />
    {[-1.12,.13].map(x=><Box key={x} p={[x,.87,-1.64]} s={[1,.2,.61]} finish="fabric" color="#fff7e8" radius={.095} rotation={x<0?.06:-.08} />)}
    {[-2.18,1.34].map(x=><group key={x}><Box p={[x,.38,-1.9]} s={[.64,.74,.67]} finish="wood" color="#b79169" /><Box p={[x,.58,-1.554]} s={[.2,.025,.025]} finish="metal" color="#b59e6b" /><Lamp p={[x,.77,-1.9]} /></group>)}
    <Box p={[2.35,1.19,-.63]} s={[.65,2.35,2.4]} finish="wood" color="#c1a989" />
    {[0,1].map(i=><group key={i}><Box p={[1.998,1.2,-1.25+i*1.22]} s={[.025,2.24,1.16]} finish="wood" color="#d3bda0" /><Box p={[1.961,1.14,-.8+i*.3]} s={[.03,.35,.025]} finish="metal" color="#a18b62" /></group>)}
    <Plant p={[-2.21,.06,1.95]} scale={.88} />
  </>
}
function Living() {
  return <>
    <Box p={[0,.08,-.12]} s={[4,.045,3.7]} finish="fabric" color="#c9bba4" radius={.08} />
    <Box p={[-.17,.38,-1.67]} s={[3.62,.55,1.12]} finish="fabric" color="#b5bba4" radius={.12} />
    <Box p={[-.17,.86,-2.13]} s={[3.7,.95,.24]} finish="fabric" color="#a4ac93" radius={.09} />
    {[-1.98,1.64].map(x=><Box key={x} p={[x,.63,-1.66]} s={[.26,.91,1.2]} finish="fabric" color="#a4ac93" radius={.09} />)}
    {[-1.36,-.17,1.02].map(x=><Box key={x} p={[x,.72,-1.64]} s={[1.1,.17,.94]} finish="fabric" color="#c3c8b3" radius={.08} />)}
    {[-1.34,.94].map(x=><Box key={x} p={[x,.99,-1.91]} s={[.56,.52,.18]} finish="fabric" color={x<0?'#d3b691':'#f1e6d3'} radius={.08} rotation={x<0?.18:-.18} />)}
    <Tube p={[-.17,.48,.04]} r={.89} h={.075} finish="wood" color="#b5966f" />
    <Tube p={[-.17,.26,.04]} r={.34} h={.42} finish="wood" color="#9e7c58" />
    <Box p={[-.35,.55,.12]} s={[.55,.045,.37]} color="#ebe3d4" rotation={.15} />
    <Tube p={[.25,.59,-.05]} r={.08} h={.14} finish="ceramic" color="#e9e1ce" />
    <Box p={[2.39,.32,-.05]} s={[.57,.5,2.68]} finish="wood" color="#b99977" />
    <Box p={[2.4,1.11,-.12]} s={[.075,1.04,1.87]} color="#272e2e" radius={.025} />
    <Box p={[2.35,1.11,-.12]} s={[.01,.94,1.74]} finish="metal" color="#4d615e" />
    <Books p={[2.24,.61,1.05]} />
    <Plant p={[-2.24,.06,-1.91]} scale={1.3} />
    <Tube p={[1.94,.83,-2.4]} r={.02} h={1.55} color="#b9a06c" /><Lamp p={[1.94,1.36,-2.4]} />
  </>
}
export function Furnishings({kind}:{kind:Exclude<RoomKind,'garage'|'garden'>}) {
  const Component={kitchen:Kitchen,bathroom:Bathroom,bedroom:Bedroom,living:Living}[kind]
  return <Component />
}
