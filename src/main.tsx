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
  slipProfile: SurfaceSlipProfile,
}

type SurfaceSlipProfile = {
  slipRatio: numberZeroToOne;
  slope: number;
}

const limitValue = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value))

const compuleSlipProfile = (value: number, profile: SurfaceSlipProfile) =>
  value < profile.slipRatio ? 1 : Math.max(0, -profile.slope * (value - profile.slipRatio) ** 2 + 1)

const getSlipRatio = (groundSpeed: number, wheelSurfaceSpeed: number) => {
  const wheel = Math.abs((wheelSurfaceSpeed - groundSpeed) / wheelSurfaceSpeed)
  const ground = Math.abs((groundSpeed - wheelSurfaceSpeed) / groundSpeed)
  if (isNaN(wheel) && isNaN(ground)) return 0
  if (wheel === Infinity && ground === Infinity) return 0
  return Math.min(wheel, ground)
}

function areRadiansOverPI2Apart(radianA: number, radianB: number): boolean {
  // Ensure radianA and radianB are within the range of 0 to 2 * PI
  radianA = radianA % (2 * Math.PI);
  radianB = radianB % (2 * Math.PI);

  // Calculate the absolute difference between radianA and radianB
  const absoluteDifference = Math.abs(radianA - radianB);

  // Check if the absolute difference is greater than PI/2
  return absoluteDifference >= Math.PI / 2;
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

  get groundSpeed() {
    const { x, y } = this.velocity
    return Math.sqrt(x * x + y * y)
  }

  get wheelGroundSpeed() {
    const { x, y } = this.velocity
    return x
    const angleDiff = this.direction - this.velocityDirection
    return Math.sqrt(x ** 2 + y ** 2 - 2 * x * y * Math.cos(angleDiff)) *
      (areRadiansOverPI2Apart(this.direction, this.velocityDirection) ? 1 : -1)
  }

  get velocityDirection() {
    const { x, y } = this.velocity
    return Math.atan2(y, x)
  }

  get wheelSurfaceSpeed() {
    return this.config.radius * this.angularVelocity
  }

  update(payload: WheelUpdatePayload) {
    const { surfaceGrip, contactPercent, brakePressure } = payload;
    const { grip, radius, contactFriction, angularFriction } = this.config
    const maxGrip = grip * surfaceGrip * contactPercent
    const { x: vx, y: vy } = this.velocity

    const { wheelGroundSpeed, wheelSurfaceSpeed, velocityDirection} = this

    // const movingBackwards = 0

    const slipRatio = getSlipRatio(wheelGroundSpeed, wheelSurfaceSpeed)

    const acc = MAX_ACC * compuleSlipProfile(
      slipRatio,
      payload.slipProfile,
    )
    const moveSpeed = limitValue((wheelSurfaceSpeed - wheelGroundSpeed) * maxGrip, acc)
    // console.log(slipRatio.toFixed(5), inlineGroundSpeed.toFixed(5), wheelSurfaceSpeed.toFixed(5), acc.toFixed(5), moveSpeed.toFixed(5))
    console.log(wheelGroundSpeed.toFixed(5), this.velocity.x.toFixed(5),  wheelSurfaceSpeed.toFixed(5))

    this.velocity.x += moveSpeed
    // this.velocity.y += moveSpeed * Math.sin(this.direction)

    this.angularVelocity -= moveSpeed / radius
    this.angularVelocity *= (angularFriction - brakePressure * 0.5)
    this.rotationAngle += this.angularVelocity

    const velFriction = 1 - ((1 - contactFriction) * maxGrip)
    this.velocity.x *= velFriction
    this.velocity.y *= velFriction
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

  }
}

const config: WheelConfig = {
  radius: 10,
  width: 10,
  grip: 0.8,
  angularFriction: 0.975,
  contactFriction: 0.99,
  mass: 50
}

const wheel = new Wheel(config)
// wheel.direction = Math.PI / 4
// wheel.direction = Math.PI / 2
// wheel.direction = Math.PI
canvas.width = window.innerWidth
canvas.height = window.innerHeight
wheel.position.x = canvas.width / 2
wheel.position.y = canvas.height / 2
wheel.angularVelocity = -2
wheel.velocity.x = 2

console.log(wheel)

function loop() {
  wheel.update({
    surfaceGrip: 0.9,
    contactPercent: 1,
    brakePressure: 0,
    slipProfile: {
      slipRatio: 0.1,
      slope: 0.6,
    },
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
    const A = 10
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