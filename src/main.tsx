import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'
import { Wheel, WheelConfig } from './lib/wheel'
import { Car } from './lib/vehicles/car'
import { Vehicle } from './lib/vehicles'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const canvas = document.querySelector<HTMLCanvasElement>("canvas#canvas")
if (canvas === null) throw new Error("Could not find canvas")
const context = canvas.getContext("2d")
if (context === null) throw new Error("Could not get context")


const wheelConfig: WheelConfig = {
  radius: 10,
  width: 10,
  grip: 0.8,
  angularFriction: 0.9995,
  contactFriction: 0.7,
  brakeFrictionIncrease: 0.4,
  mass: 100
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
    // mass: 1000,
  },
  frontWheelConfig: {
    ...wheelConfig,
    // mass: 200,
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

const vehicles: Vehicle[] = [car]

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
  car.inputs.steer += (tarS - car.inputs.steer) * s

  if (canvas === null || context === null) throw new Error("Canvas or context null")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  context.clearRect(0, 0, canvas.width, canvas.height)
  {
    for (const vehicle of vehicles) {
      vehicle.update(() => ({
        surfaceGrip: 1,
        contactPercent: 1,
        brakePressure: keeb.keys.Space ? 1 : 0,
        slipProfile: {
          slipRatio: 0.1,
          slope: 0.6,
        },
      }))
      {
        context.beginPath()
        for (const [i, j] of vehicle.beamBody.constraints) {
          const A = vehicle.beamBody.points[i]
          const B = vehicle.beamBody.points[j]
          context.moveTo(A.position.x, A.position.y)
          context.lineTo(B.position.x, B.position.y)
        }
        context.stroke()
        context.beginPath()
        const {centerOfMass} = vehicle.beamBody
        context.arc(centerOfMass.x, centerOfMass.y, 5, 0, Math.PI * 2)
        context.stroke()
      }
      {
        for (const point of vehicle.beamBody.points) {
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
}

setInterval(loop, 1000 / 60)