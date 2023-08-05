import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const canvas = document.querySelector<HTMLCanvasElement>("canvas#canvas")
if (canvas === null) throw new Error("Could not find canvas")
const context = canvas.getContext("2d")
if (context === null) throw new Error("Could not get context")


type Vector = { x: number, y: number }
type numberRadians = number
type numberZeroToOne = number

type WheelConfig = {
  radius: number;
  width: number;
  grip: numberZeroToOne;
  angularFriction: numberZeroToOne;
  contactFriction: numberZeroToOne;
  mass: number
}

type WheelUpdatePayload = {
  surfaceGrip: numberZeroToOne;
  contactPercent: numberZeroToOne;
  brakePressure: numberZeroToOne;
}

const limitValue = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value))

// const computeSlipGripp = (value: number, slipRatio: number = 0.2, slope: number = 1) =>
// value < slipRatio ? 1 : -slope * (value - slipRatio) + 1

const computeSlipGripp = (value: number, slipRatio: number = 0.1, coef: number = 1) =>
  value < slipRatio ? 1 : -coef * (value - slipRatio) ** 2 + 1

const getSlipAmount = (groundSpeed: number, wheelSurfaceSpeed: number) => {
  const wheel = Math.abs((wheelSurfaceSpeed - groundSpeed) / wheelSurfaceSpeed)
  const ground = Math.abs((groundSpeed - wheelSurfaceSpeed) / groundSpeed)
  if (isNaN(wheel) && isNaN(ground)) return 0
  if (wheel === Infinity && ground === Infinity) return 0
  return Math.min(wheel, ground)
}

const MAX_ACC = 0.1

class Wheel {
  config: WheelConfig

  position: Vector = { x: 0, y: 0 }
  velocity: Vector = { x: 0, y: 0 }
  direction: numberRadians = 0
  rotationAngle: numberRadians = 0
  angularVelocity: number = 0

  constructor(config: WheelConfig) {
    this.config = config
  }

  update(payload: WheelUpdatePayload) {
    const { surfaceGrip, contactPercent, brakePressure } = payload;
    const { grip, radius, contactFriction, angularFriction } = this.config
    const { x, y } = this.position
    const { x: groundSpeed, y: vy } = this.velocity

    const maxGrip = grip * surfaceGrip * contactPercent
    const wheelSurfaceSpeed = radius * this.angularVelocity

    const slipRatio = getSlipAmount(groundSpeed, wheelSurfaceSpeed)

    const moveSpeed = limitValue((wheelSurfaceSpeed - this.velocity.x) * maxGrip, MAX_ACC * computeSlipGripp(slipRatio))
    this.velocity.x += moveSpeed

    this.angularVelocity -= (moveSpeed / radius) * brakePressure
    this.velocity.x *= 1 - ((1 - contactFriction) * maxGrip)
    this.angularVelocity *= (angularFriction - brakePressure * 0.5)
    this.rotationAngle += this.angularVelocity
    this.position.x += this.velocity.x;

  }
}

const config: WheelConfig = {
  radius: 10,
  width: 10,
  grip: 1,
  angularFriction: 0.975,
  contactFriction: 0.99,
  mass: 50
}

const wheel = new Wheel(config)
// wheel.direction = Math.PI / 4
wheel.angularVelocity = 0.5
canvas.width = window.innerWidth
canvas.height = window.innerHeight
wheel.position.x = canvas.width / 2
wheel.position.y = canvas.height / 2
wheel.velocity.x = 2

console.log(wheel)

function loop() {
  wheel.update({
    surfaceGrip: 0.1,
    contactPercent: 1,
    brakePressure: 0.25,
  })

  if (canvas === null || context === null) throw new Error("Canvas or context null")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  context.clearRect(0, 0, canvas.width, canvas.height)
  {
    context.save()
    const { x, y } = wheel.position
    context.translate(x, y)
    context.rotate(wheel.direction)
    const w2 = wheel.config.width / 2
    const r = wheel.config.radius
    context.strokeRect(-r, -w2, r * 2, w2 * 2)
    context.restore()

    context.beginPath()
    context.moveTo(x, y)
    const A = 0
    context.lineTo(x + wheel.velocity.x * A, y + wheel.velocity.y * A)
    context.stroke()
  }
  {
    const offsetX = 50
    const offsetY = 50
    const { rotationAngle, position } = wheel
    const { radius } = wheel.config
    context.beginPath()
    context.moveTo(offsetX + radius, offsetY + radius)
    context.arc(offsetX + radius, offsetY + radius, radius, rotationAngle, rotationAngle + Math.PI * 2)
    context.stroke()

    const gaps = 10
    const offset = -position.x % gaps * 2
    const offsetLineX = offsetX / 2 + radius / 2
    const offsetLineY = offsetY + radius * 2
    context.beginPath()
    for (let i = 0; i < 10; i += 2) {
      context.moveTo(offsetLineX + offset + i * gaps, offsetLineY)
      context.lineTo(offsetLineX + offset + (i + 1) * gaps, offsetLineY)
    }
    context.stroke()
  }
}

setInterval(loop, 1000 / 60)