import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Edges, OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import type { Config, Part } from '../types'
import { MATERIALS } from '../lib/materials'
import { buildParts } from '../lib/model'

const MM = 0.001

interface Props {
  config: Config
  doorsOpen: boolean
}

export default function Scene({ config, doorsOpen }: Props) {
  const parts = useMemo(() => buildParts(config), [config])
  const size = Math.max(config.width, config.height) * MM

  return (
    <Canvas shadows="percentage" camera={{ position: [size * 0.9, size * 0.75, size * 1.6], fov: 40 }} dpr={[1, 2]}>
      <color attach="background" args={['#ece9e4']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[0.5, 1.5, 4]} intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} />

      <group position={[(-config.width / 2) * MM, 0, (-config.depth / 2) * MM]}>
        {parts.map((p, i) =>
          p.kind === 'door' ? (
            <Door key={i} part={p} config={config} open={doorsOpen} />
          ) : (
            <Panel key={i} part={p} config={config} />
          ),
        )}
      </group>

      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={6} blur={2.2} far={3} />
      <OrbitControls
        makeDefault
        target={[0, (config.height / 2) * MM, 0]}
        minDistance={1}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  )
}

function Panel({ part, config }: { part: Part; config: Config }) {
  const mat = MATERIALS[config.material]
  const [x, y, z] = part.pos.map((v) => v * MM)
  const [sx, sy, sz] = part.size.map((v) => v * MM)

  if (part.kind === 'rod') {
    return (
      <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[sy / 2, sy / 2, sx, 24]} />
        <meshStandardMaterial color="#b9bcc0" metalness={0.9} roughness={0.25} />
      </mesh>
    )
  }

  const color = part.kind === 'back' ? '#e7e2da' : mat.color
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={color} roughness={0.75} />
      <Edges color={mat.edge} />
    </mesh>
  )
}

// Дверь вращается вокруг петель; петли — с внешней стороны, ручка — ближе к центру шкафа
function Door({ part, config, open }: { part: Part; config: Config; open: boolean }) {
  const ref = useRef<Group>(null)
  const mat = MATERIALS[config.material]
  const [cx, cy, cz] = part.pos
  const [w, h, t] = part.size
  const hingeLeft = cx < config.width / 2
  const hingeX = hingeLeft ? cx - w / 2 : cx + w / 2
  const dir = hingeLeft ? 1 : -1
  const target = open ? -dir * 1.75 : 0

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += (target - g.rotation.y) * Math.min(1, dt * 6)
  })

  return (
    <group ref={ref} position={[hingeX * MM, cy * MM, (cz + t / 2) * MM]}>
      <mesh position={[((dir * w) / 2) * MM, 0, (-t / 2) * MM]} castShadow>
        <boxGeometry args={[w * MM, h * MM, t * MM]} />
        <meshStandardMaterial color={mat.color} roughness={0.6} />
        <Edges color={mat.edge} />
      </mesh>
      <mesh position={[dir * (w - 45) * MM, 0, 0.012]} castShadow>
        <boxGeometry args={[0.012, Math.min(0.32, h * MM * 0.2), 0.012]} />
        <meshStandardMaterial color="#2d2f33" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}
