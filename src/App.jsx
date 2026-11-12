import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, ContactShadows, Environment, Lightformer, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

const MODEL_URL = '/models/SheenChair.glb'

// Fabric colours the user can pick (applied to the fabric material)
const FABRICS = [
  { name: 'Mango', color: '#e8a33d' },
  { name: 'Peacock', color: '#1f6f78' },
  { name: 'Rose', color: '#c45b7a' },
  { name: 'Charcoal', color: '#3b3b40' },
  { name: 'Ivory', color: '#e9e2d0' },
]
const WOODS = [
  { name: 'Walnut', color: '#6b4226' },
  { name: 'Ebony', color: '#1c1a19' },
  { name: 'Oak', color: '#b98a5a' },
]

// Camera presets animated with GSAP
const VIEWS = {
  Front: { pos: [0, 0.55, 1.6], target: [0, 0.35, 0] },
  Side: { pos: [1.6, 0.5, 0], target: [0, 0.35, 0] },
  Top: { pos: [0.01, 2.0, 0.01], target: [0, 0.3, 0] },
  Detail: { pos: [0.45, 0.45, 0.55], target: [0, 0.38, 0.05] },
}

function Loader() {
  const { progress } = useProgress()
  return <Html center className="loader">Loading 3D model… {progress.toFixed(0)}%</Html>
}

function Chair({ fabric, wood }) {
  const { scene } = useGLTF(MODEL_URL)
  // Clone so we can change materials without touching the cached original
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = obj.material.clone()
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  useEffect(() => {
    model.traverse((obj) => {
      if (!obj.isMesh) return
      const name = (obj.material.name || '').toLowerCase()
      if (name.includes('fabric')) {
        obj.material.color = new THREE.Color(fabric)
        if (obj.material.sheenColor) obj.material.sheenColor = new THREE.Color(fabric).multiplyScalar(0.6)
      }
      if (name.includes('wood')) obj.material.color = new THREE.Color(wood)
    })
  }, [model, fabric, wood])

  return <primitive object={model} />
}

function CameraRig({ view, controlsRef }) {
  const { camera, size } = useThree()
  const first = useRef(true)
  // On narrow (portrait) screens pull the camera back so the chair still fits the width
  const fit = Math.max(1, Math.round((0.85 / (size.width / size.height)) * 10) / 10)
  useEffect(() => {
    const v = VIEWS[view]
    const controls = controlsRef.current
    if (!v || !controls) return
    const pos = v.pos.map((p, i) => v.target[i] + (p - v.target[i]) * fit)
    // Slower sweep for the very first (intro) move, quicker for button clicks
    const tl = gsap.timeline({ defaults: { duration: first.current ? 2.2 : 1.2, ease: 'power3.inOut' } })
    first.current = false
    tl.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], onUpdate: () => controls.update() }, 0)
    tl.to(controls.target, { x: v.target[0], y: v.target[1], z: v.target[2], onUpdate: () => controls.update() }, 0)
    return () => tl.kill()
  }, [view, camera, controlsRef, fit])
  return null
}

export default function App() {
  const [fabric, setFabric] = useState(FABRICS[0].color)
  const [wood, setWood] = useState(WOODS[0].color)
  const [view, setView] = useState('Front')
  const [autoRotate, setAutoRotate] = useState(false)
  const controlsRef = useRef()
  const panelRef = useRef()

  // GSAP intro: fade and slide the control panel in
  useEffect(() => {
    const tween = gsap.fromTo(panelRef.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1, delay: 0.8, ease: 'power2.out' })
    return () => tween.kill()
  }, [])

  return (
    <div className="app">
      <header className="title">
        <h1>3D Product Viewer</h1>
        <p>Drag to rotate · Scroll to zoom · Pick a finish</p>
      </header>

      <Canvas shadows camera={{ position: [2.4, 1.6, 2.4], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#f3f1ec']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 2]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={<Loader />}>
          <Chair fabric={fabric} wood={wood} />
          <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={3} blur={2.4} far={1} />
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 3, 2]} scale={[4, 2, 1]} />
            <Lightformer intensity={1} position={[-3, 1, -1]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
            <Lightformer intensity={1} position={[3, 1, 1]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
          </Environment>
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan={false} minDistance={0.5} maxDistance={5}
          maxPolarAngle={Math.PI / 2.05} autoRotate={autoRotate} autoRotateSpeed={1.2} />
        <CameraRig view={view} controlsRef={controlsRef} />
      </Canvas>

      <aside className="panel" ref={panelRef}>
        <section>
          <h2>Fabric</h2>
          <div className="swatches">
            {FABRICS.map((f) => (
              <button key={f.name} title={f.name} aria-label={`Fabric ${f.name}`}
                className={`swatch ${fabric === f.color ? 'active' : ''}`} style={{ background: f.color }}
                onClick={() => setFabric(f.color)} />
            ))}
          </div>
        </section>
        <section>
          <h2>Wood</h2>
          <div className="swatches">
            {WOODS.map((w) => (
              <button key={w.name} title={w.name} aria-label={`Wood ${w.name}`}
                className={`swatch ${wood === w.color ? 'active' : ''}`} style={{ background: w.color }}
                onClick={() => setWood(w.color)} />
            ))}
          </div>
        </section>
        <section>
          <h2>Camera</h2>
          <div className="views">
            {Object.keys(VIEWS).map((v) => (
              <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} /> Auto-rotate
          </label>
        </section>
      </aside>

      <footer className="credit">Model: SheenChair (Khronos glTF Sample Assets, CC BY 4.0) · Built with React Three Fiber, Three.js &amp; GSAP</footer>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
