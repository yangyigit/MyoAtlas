import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { STRESS_COLORS } from '../data/knowledge'
import type { JointGroup, JointMotion, StressLevel } from '../data/types'

const PERIOD = 2400

export class JointGizmo {
  readonly root = new THREE.Group()
  private readonly pivots: THREE.Group[] = []
  private readonly disposables: Array<THREE.BufferGeometry | THREE.Material> = []
  private readonly label: CSS2DObject
  private readonly arc: [number, number]

  constructor(motion: JointMotion, joint: JointGroup, stress: StressLevel = 'low') {
    this.arc = motion.arc
    this.root.name = `gizmo__${joint.id}`
    this.root.userData.jointId = joint.id

    const axis = new THREE.Vector3(...motion.axis).normalize()
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis)
    const stressColor = new THREE.Color(STRESS_COLORS[stress])
    const isPseudo = joint.type === 'pseudo'
    const radius = joint.type === 'ball-and-socket' ? 0.05 : isPseudo ? 0.045 : 0.042

    const dotGeometry = new THREE.SphereGeometry(isPseudo ? 0.007 : 0.009, 12, 12)
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: stressColor.clone().lerp(new THREE.Color(0xffffff), 0.45),
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    })
    this.disposables.push(dotGeometry, dotMaterial)

    let ringGeometry: THREE.TorusGeometry | null = null
    let ringMaterial: THREE.MeshBasicMaterial | null = null
    let arrowGeometry: THREE.ConeGeometry | null = null
    let arrowMaterial: THREE.MeshBasicMaterial | null = null

    if (!isPseudo) {
      ringGeometry = new THREE.TorusGeometry(radius, 0.0022, 10, 64)
      ringMaterial = new THREE.MeshBasicMaterial({
        color: stressColor,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      arrowGeometry = new THREE.ConeGeometry(0.0065, 0.018, 10)
      arrowMaterial = new THREE.MeshBasicMaterial({
        color: stressColor,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      })
      this.disposables.push(ringGeometry, ringMaterial, arrowGeometry, arrowMaterial)
    }

    const anchor = new THREE.Vector3(...joint.anchor)
    const sides = joint.bilateral ? [1, -1] : [1]
    for (const side of sides) {
      const holder = new THREE.Group()
      holder.position.set(anchor.x * side, anchor.y, anchor.z)
      holder.quaternion.copy(orientation)
      holder.renderOrder = 10

      const dot = new THREE.Mesh(dotGeometry, dotMaterial)
      dot.renderOrder = 11
      holder.add(dot)

      if (ringGeometry && ringMaterial && arrowGeometry && arrowMaterial) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.renderOrder = 10
        const pivot = new THREE.Group()
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
        arrow.position.set(radius, 0, 0)
        pivot.add(arrow)
        this.pivots.push(pivot)
        holder.add(ring, pivot)
      }

      this.root.add(holder)
    }

    const labelEl = document.createElement('div')
    labelEl.className = 'joint-label'
    const name = document.createElement('span')
    name.textContent = joint.nameZh
    const motionName = document.createElement('em')
    motionName.textContent = motion.motionZh
    labelEl.style.borderColor = `${STRESS_COLORS[stress]}66`
    motionName.style.color = STRESS_COLORS[stress]
    labelEl.append(name, motionName)
    this.label = new CSS2DObject(labelEl)
    const lift = isPseudo ? 0.035 : 0.075
    this.label.position.set(anchor.x + 0.02, anchor.y + lift, anchor.z)
    this.root.add(this.label)
  }

  update(time: number, reducedMotion: boolean) {
    const [start, end] = this.arc
    const t = reducedMotion ? 0.5 : 0.5 - 0.5 * Math.cos((time / PERIOD) * Math.PI * 2)
    const angle = THREE.MathUtils.degToRad(start + (end - start) * t)
    for (const pivot of this.pivots) pivot.rotation.z = angle
  }

  setVisible(visible: boolean) {
    this.root.visible = visible
  }

  dispose() {
    this.root.removeFromParent()
    this.label.element.remove()
    for (const item of this.disposables) item.dispose()
  }
}
