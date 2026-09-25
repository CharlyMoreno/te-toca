import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import AvatarModel from './AvatarModel'
import type { AvatarConfig } from '../../../shared/avatar'

export default function AvatarPreview({ avatar }: { avatar: AvatarConfig }) {
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[0,1.2,3.5],fov:35}} fallback={<p>La vista 3D no está disponible. Podés personalizar los colores y guardar igualmente.</p>}>
    <color attach="background" args={['#eee6f3']} />
    <ambientLight intensity={1.7} /><directionalLight position={[3,5,4]} intensity={2} />
    <group position={[0,-.05,0]}><AvatarModel avatar={avatar} reduced /></group>
    <mesh rotation-x={-Math.PI/2} position={[0,-.09,0]}><circleGeometry args={[.6,48]} /><meshStandardMaterial color="#d7c7e2" /></mesh>
    <OrbitControls target={[0,.8,0]} enablePan={false} enableZoom={false} minPolarAngle={.6} maxPolarAngle={1.8} />
  </Canvas>
}
