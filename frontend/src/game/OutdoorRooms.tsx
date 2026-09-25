import { Box, Plant, Tube } from './HouseFurnishings'
import { Surface } from './HouseMaterials'

export function GardenGround({left}:{left:boolean}) {
  const side=left?-1:1
  return <>
    <Box p={[0,.01,0]} s={[6,.12,6]} finish="grass" color="#89a56c" radius={.01} />
    <Box p={[0,.085,2.35]} s={[6,.04,.9]} finish="stone" color="#d8c7a7" />
    {[0,1].map(edge=><group key={edge} position={edge===0?[0,0,-2.95]:[side*2.95,0,0]} rotation-y={edge===0?0:Math.PI/2}>
      {Array.from({length:15},(_,i)=><Box key={i} p={[-2.8+i*.4,.6,0]} s={[.15,1.14,.09]} finish="wood" color="#c6b090" />)}
      {[.35,.87].map(y=><Box key={y} p={[0,y,.055]} s={[5.8,.09,.06]} finish="wood" color="#b29670" />)}
    </group>)}
  </>
}

export function GarageShell({left}:{left:boolean}) {
  const side=left?-1:1
  return <>
    <Box p={[0,.015,0]} s={[6,.12,6]} finish="concrete" color="#adb0aa" radius={.005} />
    <Box p={[0,1.36,-3]} s={[6,2.72,.16]} finish="concrete" color="#d7d7cd" />
    <Box p={[side*3,.55,0]} s={[.16,1.1,6]} finish="concrete" color="#c7c8c0" />
    <Box p={[-side*3,.39,-.59]} s={[.13,.78,4.82]} color="#c7c8c0" />
    <Box p={[-side*3,.39,2.88]} s={[.13,.78,.23]} color="#c7c8c0" />
    <Box p={[-.65,1.23,-2.88]} s={[3.5,2.42,.12]} finish="metal" color="#a1acac" />
    {Array.from({length:8},(_,i)=><Box key={i} p={[-.65,.18+i*.29,-2.795]} s={[3.36,.026,.03]} finish="metal" color="#727f80" />)}
    <Box p={[-.65,.69,-2.72]} s={[.43,.045,.045]} finish="metal" color="#424e51" />
    {[-2.47,1.17].map(x=><Box key={x} p={[x,1.27,-2.76]} s={[.065,2.52,.12]} finish="metal" color="#5a6261" />)}
    {[-1.95,.75].map(x=><Box key={x} p={[x,.083,-.35]} s={[.035,.01,4.3]} color="#e8ddba" />)}
  </>
}

export function Garage() {
  return <>
    <group position={[-.6,0,-.52]}>
      <Box p={[0,.54,0]} s={[1.7,.49,3.12]} finish="metal" color="#718e98" radius={.16} />
      <Box p={[0,.88,-.23]} s={[1.46,.55,1.62]} finish="metal" color="#8fadb5" radius={.15} />
      <Box p={[0,1.02,.59]} s={[1.27,.35,.035]} finish="glass" color="#344e59" />
      <Box p={[0,1.02,-1.055]} s={[1.27,.32,.035]} finish="glass" color="#344e59" />
      {[-1,1].map(side=><group key={side}>
        <Box p={[side*.743,1.02,-.23]} s={[.025,.3,1.25]} finish="glass" color="#344e59" />
        <Box p={[side*.55,.62,1.565]} s={[.39,.15,.035]} finish="ceramic" color="#fff0c0" />
        <Box p={[side*.55,.62,-1.565]} s={[.36,.13,.035]} color="#bc6653" />
        {[-.98,.97].map(z=><group key={z} position={[side*.82,.34,z]} rotation-z={Math.PI/2}>
          <mesh castShadow><cylinderGeometry args={[.32,.32,.19,24]} /><meshStandardMaterial color="#303637" roughness={.92} /></mesh>
          <Tube p={[0,-side*.105,0]} r={.17} h={.02} finish="metal" color="#c1c6c3" />
        </group>)}
      </group>)}
      <Box p={[0,.4,1.59]} s={[1.45,.1,.06]} finish="metal" color="#899391" />
    </group>
    <Box p={[2.12,.85,-1.4]} s={[1.02,.1,2.6]} finish="wood" color="#c2a074" />
    {[-2.5,-.3].map(z=><Box key={z} p={[2.12,.45,z]} s={[.83,.8,.055]} finish="metal" color="#687778" />)}
    <Box p={[2.12,1.05,-1.95]} s={[.7,.3,.62]} finish="metal" color="#bc735d" />
    <Box p={[2.12,1.23,-1.95]} s={[.31,.07,.07]} finish="metal" color="#4c5655" />
    <Box p={[2.12,1.0,-.8]} s={[.65,.15,.42]} finish="wood" color="#b9a083" />
    <Tube p={[2.22,.32,.65]} r={.28} h={.58} finish="metal" color="#8e9d7f" />
    <Box p={[2.25,.49,1.12]} s={[.68,.8,.48]} color="#bca47b" />
  </>
}

export function Garden() {
  return <>
    <group position={[-1.95,.08,-1.85]}>
      <Tube p={[0,.94,0]} r={.13} h={1.88} finish="wood" color="#927452" />
      {[[0,2.05,0],[-.48,1.8,.13],[.44,1.94,-.17],[.1,2.45,.05]].map((p,i)=><mesh key={i} position={p as [number,number,number]} scale={[.78,.68,.76]} castShadow><icosahedronGeometry args={[1,2]} /><meshStandardMaterial color={i%2?'#6c8951':'#819b5e'} roughness={.95} /></mesh>)}
    </group>
    <Box p={[1.63,.21,-2.15]} s={[2.2,.38,1.08]} finish="wood" color="#a88a64" />
    <Box p={[1.63,.415,-2.15]} s={[2.04,.035,.91]} finish="concrete" color="#655642" />
    {[.86,1.53,2.2].map((x,i)=><group key={x}><Plant p={[x,.24,-2.15]} scale={.66} /><mesh position={[x,.91,-2.13]} castShadow><sphereGeometry args={[.095,10,8]} /><meshStandardMaterial color={i===1?'#dca06d':'#baa0bb'} /></mesh></group>)}
    <group position={[1.65,.08,-.22]} rotation-y={-.2}>
      {[-.57,.57].map(x=><Box key={x} p={[x,.23,0]} s={[.08,.46,.61]} finish="metal" color="#5f7063" />)}
      {[0,1,2].map(i=><Box key={i} p={[0,.48,-.22+i*.22]} s={[1.75,.07,.17]} finish="wood" color="#c3a77b" />)}
      {[.77,1].map(y=><Box key={y} p={[0,y,-.32]} s={[1.75,.16,.07]} finish="wood" color="#c3a77b" />)}
      {[-.75,.75].map(x=><Box key={x} p={[x,.7,-.34]} s={[.055,.7,.055]} finish="metal" color="#5f7063" />)}
    </group>
    {[-.9,-.1,.7].map((z,i)=><Box key={z} p={[-.75+i*.22,.087,z]} s={[.69,.045,.49]} finish="stone" color="#d3c4a9" rotation={i*.12} />)}
    <Tube p={[-2.18,.23,.58]} r={.26} h={.3} finish="metal" color="#9eaf98" />
    <mesh position={[-2.18,.28,.58]} rotation-x={Math.PI/2}><torusGeometry args={[.31,.035,8,20]} /><Surface finish="metal" color="#718f79" /></mesh>
    <Box p={[-1.88,.28,.58]} s={[.35,.065,.065]} finish="metal" color="#9eaf98" rotation={.2} />
  </>
}
