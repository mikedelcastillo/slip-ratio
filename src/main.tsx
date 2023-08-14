import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'
import { BeamBody, PhyPoint } from './lib/kine'
import { numberNegOneToPosOne, numberZeroToOne } from './lib/types'
import { Wheel, WheelConfig, WheelUpdatePayload } from './lib/wheel'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const canvas = document.querySelector<HTMLCanvasElement>("canvas#canvas")
if (canvas === null) throw new Error("Could not find canvas")
const context = canvas.getContext("2d")
if (context === null) throw new Error("Could not get context")


type VehicleInput = {
  throttle: numberZeroToOne,
  brake: numberZeroToOne,
  steer: numberNegOneToPosOne,
}

interface Vehicle {
  beamBody: BeamBody,
  applyInput(input: VehicleInput): void
  update(payloads: WheelUpdatePayload): void
}

type CarConfig = {
  width: number,
  length: number,
  dip: number,
  rearWheelConfig: WheelConfig,
  frontWheelConfig: WheelConfig,
}

class Car implements Vehicle {
  beamBody: BeamBody

  frontLeftWheel: Wheel
  frontRightWheel: Wheel
  rearLeftWheel: Wheel
  rearRightWheel: Wheel

  steer = 0
  maxSteer = Math.PI / 3

  get wheels() {
    return [
      this.frontLeftWheel,
      this.frontRightWheel,
      this.rearLeftWheel,
      this.rearRightWheel,
    ]
  }

  constructor(config: CarConfig) {
    this.frontLeftWheel = new Wheel({ x: -config.width / 2 + config.dip, y: -config.length / 2 }, config.frontWheelConfig)
    this.frontRightWheel = new Wheel({ x: config.width / 2 - config.dip, y: -config.length / 2 }, config.frontWheelConfig)
    this.rearLeftWheel = new Wheel({ x: -config.width / 2, y: config.length / 2 }, config.rearWheelConfig)
    this.rearRightWheel = new Wheel({ x: config.width / 2, y: config.length / 2 }, config.rearWheelConfig)

    const points: PhyPoint[] = [
      this.frontLeftWheel,
      this.frontRightWheel,
      this.rearLeftWheel,
      this.rearRightWheel,
    ]

    this.beamBody = new BeamBody(points, [
      [0, 1],
      [0, 2],
      [0, 3],
      [2, 1],
      [2, 3],
      [3, 1],
    ])
  }

  get axelAngle() {
    return Math.atan2(
      this.rearRightWheel.position.y - this.rearLeftWheel.position.y,
      this.rearRightWheel.position.x - this.rearLeftWheel.position.x,
    ) - Math.PI / 2
  }

  update(payload: WheelUpdatePayload): void {
    this.rearRightWheel.direction = this.axelAngle
    this.rearLeftWheel.direction = this.axelAngle
    this.frontRightWheel.direction = this.axelAngle + this.steer * this.maxSteer
    this.frontLeftWheel.direction = this.axelAngle + this.steer * this.maxSteer
    this.rearRightWheel.updateWheel(payload)
    this.rearLeftWheel.updateWheel(payload)
    
    this.beamBody.update()
    this.frontRightWheel.updateWheel(payload)
    this.frontLeftWheel.updateWheel(payload)
  }
  applyInput(input: VehicleInput): void {
    input
    throw new Error('Method not implemented.')
  }
}

const wheelConfig: WheelConfig = {
  radius: 10,
  width: 10,
  grip: 0.8,
  angularFriction: 0.9995,
  contactFriction: 0.7,
  brakeFrictionIncrease: 0.4,
  mass: 50
}

const car = new Car({
  width: 45,
  length: 75,
  dip: 5,
  rearWheelConfig: {
    ...wheelConfig,
    width: wheelConfig.width + 2,
    brakeFrictionIncrease: 0.01,
    contactFriction: 0.95,
    grip: 1,
  },
  frontWheelConfig: {
    ...wheelConfig,
    // grip: 0.8,
  }
})

console.log(car)

class Keeb {
  keys: Record<string, boolean | undefined> = {}

  constructor() {
    window.addEventListener("keydown", this.handler.bind(this))
    window.addEventListener("keyup", this.handler.bind(this))
  }

  handler(event: KeyboardEvent) {
    this.keys[event.code] = event.type === "keydown"
    console.log(this.keys)
  }
}

const keeb = new Keeb()

car.beamBody.translate(100, 100)

const cars: Vehicle[] = [car]

function loop() {
  const wA = 0.5
  const a = 1 / 10
  const s = 1 / 10
  if (keeb.keys.KeyW) {
    car.rearLeftWheel.angularVelocity += (wA - car.rearLeftWheel.angularVelocity) * a
    car.rearRightWheel.angularVelocity += (wA - car.rearRightWheel.angularVelocity) * a
    // car.frontLeftWheel.angularVelocity += (wA - car.frontLeftWheel.angularVelocity) * a
    // car.frontRightWheel.angularVelocity += (wA - car.frontRightWheel.angularVelocity) * a
  }
  if (keeb.keys.KeyS) {
    car.rearLeftWheel.angularVelocity += (-wA - car.rearLeftWheel.angularVelocity) * a
    car.rearRightWheel.angularVelocity += (-wA - car.rearRightWheel.angularVelocity) * a
    // car.frontLeftWheel.angularVelocity += (-wA - car.frontLeftWheel.angularVelocity) * a
    // car.frontRightWheel.angularVelocity += (-wA - car.frontRightWheel.angularVelocity) * a
  }
  let tarS = 0
  if (keeb.keys.KeyA) tarS = -1
  if (keeb.keys.KeyD) tarS = 1
  car.steer += (tarS - car.steer) * s

  if (canvas === null || context === null) throw new Error("Canvas or context null")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  context.clearRect(0, 0, canvas.width, canvas.height)
  {
    for (const v of cars) {
      v.update({
        surfaceGrip: 1,
        contactPercent: 1,
        brakePressure: keeb.keys.Space ? 1 : 0,
        slipProfile: {
          slipRatio: 0.1,
          slope: 0.6,
        },
      })
      {
        context.beginPath()
        for (const [i, j] of v.beamBody.constraints) {
          const A = v.beamBody.points[i]
          const B = v.beamBody.points[j]
          context.moveTo(A.position.x, A.position.y)
          context.lineTo(B.position.x, B.position.y)
        }
        context.stroke()
      }
      {
        for (const point of v.beamBody.points) {
          if (point instanceof Wheel) {
            const wheel = point
            context.save()
            const { x, y } = wheel.position
            context.translate(x, y)
            context.rotate(wheel.direction)
            const w2 = wheel.config.width / 2
            const r = wheel.config.radius
            context.strokeRect(-r, -w2, r * 2, w2 * 2)
            {
              const lines = 4
              context.beginPath()
              for(let i = 0; i < 4; i++){
                const offset = Math.PI / (lines)
                const lineX = Math.cos((wheel.rotationAngle + i * offset) % (Math.PI)) * r
                context.moveTo(lineX, -w2)
                context.lineTo(lineX, w2)
              }
              context.moveTo(0, 0)
              context.lineTo(r, 0)
              context.stroke()
            }

            context.restore()
          }
        }
      }
    }
  }
  // {
  //   context.save()
  //   const { x, y } = wheel.position
  //   context.translate(x, y)
  //   context.rotate(wheel.direction)
  //   const w2 = wheel.config.width / 2
  //   const r = wheel.config.radius
  //   context.strokeRect(-r, -w2, r * 2, w2 * 2)
  //   context.restore()

  //   context.beginPath()
  //   context.moveTo(x, y)
  //   const A = 10
  //   context.lineTo(x + wheel.velocity.x * A, y + wheel.velocity.y * A)
  //   context.stroke()
  // }
  // {
  //   const offsetX = 50
  //   const offsetY = 50
  //   const { rotationAngle, position } = wheel
  //   const { radius } = wheel.config
  //   const a = rotationAngle * Math.cos(wheel.direction)
  //   context.beginPath()
  //   context.moveTo(offsetX + radius, offsetY + radius)
  //   context.arc(offsetX + radius, offsetY + radius, radius, a, a + Math.PI * 2)
  //   context.stroke()

  //   const gaps = 10
  //   const offset = -position.x % gaps * 2
  //   const offsetLineX = offsetX / 2 + radius / 2
  //   const offsetLineY = offsetY + radius * 2
  //   context.beginPath()
  //   for (let i = 0; i < 10; i += 2) {
  //     context.moveTo(offsetLineX + offset + i * gaps, offsetLineY)
  //     context.lineTo(offsetLineX + offset + (i + 1) * gaps, offsetLineY)
  //   }
  //   context.stroke()
  // }
  // car.update()
  // {
  //   context.beginPath()
  //   for (const [i, j] of beamBody.constraints) {
  //     const A = beamBody.points[i]
  //     const B = beamBody.points[j]
  //     context.moveTo(A.position.x, A.position.y)
  //     context.lineTo(B.position.x, B.position.y)
  //   }
  //   context.stroke()
  // }
}

setInterval(loop, 1000 / 60)