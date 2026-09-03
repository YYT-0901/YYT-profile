import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const createBeam = (start, end, radius, material, radialSegments = 8) => {
  const direction = new THREE.Vector3().subVectors(end, start)
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(midpoint)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return mesh
}

// Retro desktop computer (CRT monitor + console/keyboard), replaces the cinema camera rig.
const createRetroComputer = (isCompact) => {
  const group = new THREE.Group()

  const caseMaterial = new THREE.MeshStandardMaterial({
    color: '#d9d0b8',
    roughness: 0.55,
    metalness: 0.08,
  })
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.5,
    metalness: 0.2,
  })
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: '#0d2417',
    emissive: '#39ff6a',
    emissiveIntensity: isCompact ? 1.2 : 1.9,
    roughness: 0.25,
  })
  const keyMaterial = new THREE.MeshStandardMaterial({
    color: '#4b4b4b',
    roughness: 0.6,
    metalness: 0.1,
  })
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: '#a94032',
    roughness: 0.4,
    metalness: 0.5,
  })
  const cableMaterial = new THREE.MeshStandardMaterial({ color: '#111416', roughness: 0.85 })

  // Monitor body
  const monitorBody = new THREE.Mesh(new RoundedBoxGeometry(2.5, 2.05, 2.1, 4, 0.16), caseMaterial)
  monitorBody.position.set(0, 3.1, -0.35)
  group.add(monitorBody)

  // Monitor stand + base
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.6, 16), caseMaterial)
  neck.position.set(0, 1.95, -0.35)
  group.add(neck)

  const base = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.22, 1.6, 3, 0.08), caseMaterial)
  base.position.set(0, 1.6, -0.35)
  group.add(base)

  // Screen bezel + glowing screen
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(1.95, 1.55, 0.12, 3, 0.08), bezelMaterial)
  bezel.position.set(0, 3.15, 0.72)
  group.add(bezel)

  const screen = new THREE.Mesh(new RoundedBoxGeometry(1.68, 1.28, 0.04, 2, 0.05), screenMaterial)
  screen.position.set(0, 3.15, 0.79)
  group.add(screen)

  // Thin accent stripe, echoes the set's red accent color
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.02), trimMaterial)
  stripe.position.set(0, 2.18, 0.71)
  group.add(stripe)

  // Console / keyboard deck
  const deck = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.34, 1.35, 3, 0.08), caseMaterial)
  deck.position.set(0, 1.02, 1.4)
  group.add(deck)

  const keyRows = 3
  const keyCols = 12
  for (let row = 0; row < keyRows; row += 1) {
    for (let col = 0; col < keyCols; col += 1) {
      const key = new THREE.Mesh(new RoundedBoxGeometry(0.19, 0.07, 0.19, 1, 0.02), keyMaterial)
      key.position.set(-1.4 + col * 0.245, 1.22, 1.0 + row * 0.235)
      group.add(key)
    }
  }

  // Floppy / cartridge slot on the side of the console
  const slot = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.02, 1, 0.01), bezelMaterial)
  slot.position.set(1.4, 1.14, 1.7)
  group.add(slot)

  // Power cable trailing from the back down to the floor
  const cable = createBeam(
    new THREE.Vector3(0, 1.5, -1.35),
    new THREE.Vector3(0.6, 0.05, -1.8),
    0.035,
    cableMaterial,
    8,
  )
  group.add(cable)

  const screenGlow = new THREE.PointLight('#39ff6a', isCompact ? 1.4 : 2.2, 6, 2)
  screenGlow.position.set(0, 3.15, 1.4)
  group.add(screenGlow)

  return {
    group,
    screenGlow,
    screenMaterial,
    screenCenter: new THREE.Vector3(0, 3.15, 0.8),
  }
}

// Small rubber duck sitting beside the keyboard.
const createRubberDuck = () => {
  const group = new THREE.Group()
  group.position.set(1.7, 1.2, 1.55)
  group.rotation.y = 0.4

  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: '#ffd93b',
    roughness: 0.4,
    metalness: 0.05,
  })
  const orangeMaterial = new THREE.MeshStandardMaterial({ color: '#ff9f1c', roughness: 0.5 })
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.3 })

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 32), yellowMaterial)
  body.scale.set(1, 0.85, 1.15)
  body.position.set(0, 0.28, 0)
  group.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), yellowMaterial)
  head.position.set(0, 0.56, 0.14)
  group.add(head)

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 16), orangeMaterial)
  beak.rotation.x = Math.PI / 2
  beak.position.set(0, 0.54, 0.34)
  group.add(beak)

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), eyeMaterial)
    eye.position.set(side * 0.09, 0.6, 0.28)
    group.add(eye)
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 12), yellowMaterial)
  tail.rotation.x = -Math.PI / 2.4
  tail.position.set(0, 0.42, -0.32)
  group.add(tail)

  return group
}

export const createDirectorSet = (isCompact, groundHeight) => {
  const group = new THREE.Group()
  const itemScale = 1.5
  const itemGroundOffset = -1.5
  const duckOffsetX = 2.5
  const duckOffsetZ = 0
  const duckOffsetY = 0

  group.position.y = groundHeight

  const computer = createRetroComputer(isCompact)
  computer.group.scale.setScalar(itemScale)
  computer.group.position.y = itemGroundOffset

  const duck = createRubberDuck()
  duck.scale.setScalar(itemScale)
  duck.position.x = duckOffsetX
  duck.position.z = duckOffsetZ
  duck.position.y = duckOffsetY

  group.add(computer.group, duck)

  group.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = !isCompact
    child.receiveShadow = true
  })

  return {
    group,
    lensGlow: computer.screenGlow,
    lensMaterial: computer.screenMaterial,
    lensCenter: computer.screenCenter
      .clone()
      .multiplyScalar(itemScale)
      .add(new THREE.Vector3(0, groundHeight + itemGroundOffset, 0)),
  }
}