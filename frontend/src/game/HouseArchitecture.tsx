import { Box, Plant } from './HouseFurnishings'
import { Surface } from './HouseMaterials'
import { houseBounds, type HouseRoom } from '../../../shared/rooms'

function Window({p}:{p:[number,number,number]}) {
  return <group position={p}>
    <Box p={[0,0,0]} s={[2.18,1.5,.09]} finish="glass" color="#bad4d0" />
    {[-1.1,0,1.1].map(x=><Box key={x} p={[x,0,.01]} s={[.06,1.6,.09]} color="#f3f0e4" />)}
    {[-.78,.78].map(y=><Box key={y} p={[0,y,.01]} s={[2.26,.06,.11]} color="#f3f0e4" />)}
    <Box p={[0,-.82,.05]} s={[2.38,.055,.24]} finish="stone" color="#f4eee2" />
    {[-1,1].map(side=><group key={side}>
      {[0,1,2,3].map(i=><mesh key={i} position={[side*(1.25+i*.07),-.03,.12]} scale={[.06,.82,.035]} castShadow><sphereGeometry args={[1,8,10]} /><Surface finish="fabric" color="#f1ebdc" /></mesh>)}
    </group>)}
  </group>
}
export function RoomArchitecture({room,index}:{room:HouseRoom;index:number}) {
  const back=index<2, left=index%2===0
  const wood=room.kind==='bedroom'||room.kind==='living'
  return <>
    <Box p={[0,.015,0]} s={[6,.12,6]} finish={wood?'wood':'tile'} color={wood?'#c5a886':room.kind==='bathroom'?'#d6d9d2':'#d4cabc'} radius={.005} />
    {back?<>
      <Box p={[-2.07,1.36,-3]} s={[1.86,2.72,.16]} color="#ece6d8" />
      <Box p={[2.07,1.36,-3]} s={[1.86,2.72,.16]} color="#ece6d8" />
      <Box p={[0,.43,-3]} s={[2.28,.86,.16]} color="#ece6d8" />
      <Box p={[0,2.57,-3]} s={[2.28,.3,.16]} color="#ece6d8" />
      <Window p={[0,1.65,-3]} />
    </>:<Box p={[0,.43,-3]} s={[6,.86,.16]} color="#ece6d8" />}
    <Box p={[left?-3:3,left?1.36:.44,0]} s={[.16,left?2.72:.88,6.12]} color="#e4dfd1" />
    <Box p={[left?3:-3,.39,-.59]} s={[.13,.78,4.82]} color="#e8e2d3" />
    <Box p={[left?3:-3,.39,2.88]} s={[.13,.78,.23]} color="#e8e2d3" />
    <Box p={[0,.13,-2.88]} s={[5.84,.17,.045]} finish="wood" color="#ded2ba" />
    <Box p={[left?-2.89:2.89,.13,0]} s={[.045,.17,5.8]} finish="wood" color="#ded2ba" />
    <Box p={[left?2.93:-2.93,.78,1.83]} s={[.19,.04,.12]} finish="wood" color="#b89b78" />
    {room.kind==='bathroom'&&<>
      <Box p={[-1.48,1.38,-2.83]} s={[1.82,2.6,.07]} finish="tile" color="#d2d9cf" />
      <Box p={[-1.48,1.89,-2.76]} s={[1.26,1.04,.055]} finish="metal" color="#ab9771" />
      <Box p={[-1.48,1.89,-2.72]} s={[1.15,.93,.015]} finish="metal" color="#bfd0ce" />
    </>}
    {room.kind==='kitchen'&&<Box p={[-.32,1.53,-2.81]} s={[4.22,.86,.075]} finish="tile" color="#e8e5d8" />}
    {left&&<group position={[-2.89,1.8,.1]} rotation-y={Math.PI/2}>
      <Box p={[0,0,0]} s={[1.1,.85,.05]} finish="wood" color="#967354" />
      <Box p={[0,0,.034]} s={[.94,.69,.015]} color="#e8ddc6" />
      <mesh position={[.12,.05,.052]}><circleGeometry args={[.21,32]} /><meshBasicMaterial color="#b28e6f" /></mesh>
      <Box p={[-.17,-.15,.06]} s={[.35,.12,.01]} color="#829078" />
    </group>}
  </>
}
export function HouseFoundation({rooms}:{rooms:HouseRoom[]}) {
  const {width,depth,entranceZ}=houseBounds(rooms)
  return <>
    <mesh rotation-x={-Math.PI/2} position={[0,-.52,0]} receiveShadow><planeGeometry args={[300,300]} /><meshStandardMaterial color="#bfc6b0" roughness={1} /></mesh>
    <Box p={[0,-.24,.65]} s={[width+.3,.44,depth+2.4]} finish="stone" color="#b5aa93" radius={.06} />
    <Box p={[0,-.035,.65]} s={[width,.055,depth+2.1]} finish="tile" color="#d4c6ae" />
    {[-1,1].map(side=><group key={side}>
      <Box p={[side*(width/2+.7),-.37,0]} s={[.9,.26,depth]} finish="stone" color="#9d9d88" />
      {Array.from({length:Math.min(8,Math.ceil(depth/2.6))},(_,i)=><Plant key={i} p={[side*(width/2+.7),-.25,-depth/2+1.1+i*2.6]} scale={1.15} />)}
    </group>)}
    {[0,1,2].map(i=><Box key={i} p={[0,-.47,entranceZ+1.5+i*1.03]} s={[1.8,.13,.7]} finish="stone" color="#cbc1ab" radius={.025} />)}
    <Box p={[0,-.38,entranceZ+.75]} s={[3.2,.18,.55]} finish="stone" color="#c7baa1" />
  </>
}
