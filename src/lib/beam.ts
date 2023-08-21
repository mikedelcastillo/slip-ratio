import { Vector } from "./types"

export type IndexPair = [number, number]
export type IndexPairConstraint = [number, number, number]

export class BeamPoint {
  position: Vector
  velocity: Vector = { x: 0, y: 0 }
  mass = 1
  constructor(position?: Vector, mass?: number) {
    this.position = typeof position === "undefined" ? { x: 0, y: 0 } : position
    if (typeof mass === "number") this.mass = mass
  }

  dist(point: BeamPoint) {
    return Math.sqrt(
      (this.position.x - point.position.x) ** 2 +
      (this.position.y - point.position.y) ** 2
    )
  }
}

const computeConstraintLengths = (points: BeamPoint[], relationships: IndexPair[]) => {
  const constraints: IndexPairConstraint[] = []
  for (const [i, j] of relationships) {
    const A = points[i]
    const B = points[j]
    if (typeof A === "undefined") throw new Error(`Making constraint for ${i} in points length ${points.length}`)
    if (typeof B === "undefined") throw new Error(`Making constraint for ${j} in points length ${points.length}`)

    constraints.push([i, j, A.dist(B)])
  }
  return constraints
}

export class BeamBody {
  points: BeamPoint[]
  constraints: IndexPairConstraint[]

  constructor(points: BeamPoint[], pairs: IndexPair[]) {
    this.points = points
    this.constraints = computeConstraintLengths(points, pairs)
  }

  update() {
    for (const [i, j, len] of this.constraints) {
      const A = this.points[i]
      const B = this.points[j]

      const dx = B.position.x - A.position.x
      const dy = B.position.y - A.position.y
      const dist = A.dist(B)
      const diff = (len - dist) / dist
      const s1 = (1 / A.mass) / ((1 / A.mass) + (1 / B.mass))
      const s2 = 1 - s1

      const D = 0.5
      const vx = dx * diff * D
      const vy = dy * diff * D
      A.velocity.x -= vx * s1
      A.velocity.y -= vy * s1
      B.velocity.x += vx * s2
      B.velocity.y += vy * s2
      // const C = 0.1
      // A.position.x -= vx * C
      // A.position.y -= vy * C
      // B.position.x += vx * C
      // B.position.y += vy * C
    }

    this.updatePositions()
  }

  updatePositions(){
    for (const point of this.points) {
      point.position.x += point.velocity.x
      point.position.y += point.velocity.y
    }
  }

  get centerOfMass(): Vector {
    let xSum = 0
    let ySum = 0
    let massSum = 0
    for (const point of this.points) {
      xSum += point.position.x * point.mass
      ySum += point.position.y * point.mass
      massSum += point.mass
    }
    return {
      x: xSum / massSum,
      y: ySum / massSum,
    }
  }

  translate(x: number, y: number) {
    for (const point of this.points) {
      point.position.x += x
      point.position.y += y
    }
  }
}

export const test = () => {
  const points: BeamPoint[] = [
    new BeamPoint({ x: 0, y: 0 }),
    new BeamPoint({ x: 0, y: 10 }),
    new BeamPoint({ x: 10, y: 0 }),
    new BeamPoint({ x: 10, y: 10 }),
  ]
  const beamBody = new BeamBody(points, [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 1],
    [2, 3],
    [3, 1],
  ])
  console.log(beamBody)
}