import { Vector } from "./types"

export type IndexPair = [number, number]
export type IndexPairConstraint = [number, number, number]

export class PhyPoint {
  position: Vector
  velocity: Vector = { x: 0, y: 0 }
  constructor(position?: Vector) {
    this.position = typeof position === "undefined" ? { x: 0, y: 0 } : position
  }

  dist(point: PhyPoint) {
    return Math.sqrt(
      (this.position.x - point.position.x) ** 2 +
      (this.position.y - point.position.y) ** 2
    )
  }
}

const computeConstraintLengths = (points: PhyPoint[], relationships: IndexPair[]) => {
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
  points: PhyPoint[]
  constraints: IndexPairConstraint[]

  constructor(points: PhyPoint[], pairs: IndexPair[]) {
    this.points = points
    this.constraints = computeConstraintLengths(points, pairs)
  }

  update() {
    // const F = 0.95
    for(const [i, j, len] of this.constraints){
      const A = this.points[i]
      const B = this.points[j]

      const dx = B.position.x - A.position.x
      const dy = B.position.y - A.position.y
      const dist = A.dist(B)
      const diff = (len - dist) / dist

      const vx = dx * diff * 0.75
      const vy = dy * diff * 0.75
      const C = 0.25
      A.velocity.x -= vx
      A.velocity.y -= vy
      B.velocity.x += vx
      B.velocity.y += vy
      A.position.x -= vx * C
      A.position.y -= vy * C
      B.position.x += vx * C
      B.position.y += vy * C
    }
    // for (const point of this.points) {
    //   point.velocity.x *= F
    //   point.velocity.y *= F
    // }
    // for (const point of this.points) {
      // point.position.x += point.velocity.x
      // point.position.y += point.velocity.y
    // }
  }

  translate(x: number, y: number){
    for(const point of this.points){
      point.position.x += x
      point.position.y += y
    }
  }
}

export const test = () => {
  const points: PhyPoint[] = [
    new PhyPoint({ x: 0, y: 0 }),
    new PhyPoint({ x: 0, y: 10 }),
    new PhyPoint({ x: 10, y: 0 }),
    new PhyPoint({ x: 10, y: 10 }),
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