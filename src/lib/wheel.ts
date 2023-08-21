import { BeamPoint } from "./beam";
import { Vector, numberRadians, numberZeroToOne } from "./types";
import { limitValue } from "./util";

export type WheelConfig = {
  radius: number;
  width: number;
  grip: numberZeroToOne;
  angularFriction: numberZeroToOne;
  contactFriction: numberZeroToOne;
  brakeFrictionIncrease: numberZeroToOne;
  mass: number
}

export type WheelUpdatePayload = {
  surfaceGrip: numberZeroToOne;
  contactPercent: numberZeroToOne;
  brakePressure: numberZeroToOne;
  slipProfile: SurfaceSlipProfile,
}

export type SurfaceSlipProfile = {
  slipRatio: numberZeroToOne;
  slope: number;
}

const compuleSlipProfile = (value: number, profile: SurfaceSlipProfile) =>
  value < profile.slipRatio ? 1 : Math.max(0, Math.min(1, -profile.slope * (value - profile.slipRatio) ** 2 + 1))

const getSlipRatio = (groundSpeed: number, wheelSurfaceSpeed: number) => {
  const wheel = Math.abs((wheelSurfaceSpeed - groundSpeed) / wheelSurfaceSpeed)
  const ground = Math.abs((groundSpeed - wheelSurfaceSpeed) / groundSpeed)
  if (isNaN(wheel) && isNaN(ground)) return 0
  if (wheel === Infinity && ground === Infinity) return 0
  return Math.max(0, Math.min(1, Math.min(wheel, ground)))
}

const MAX_ACC = 0.2

export class Wheel extends BeamPoint{
  config: WheelConfig

  direction: numberRadians = 0
  rotationAngle: numberRadians = 0
  angularVelocity: number = 0

  constructor(position: Vector, config: WheelConfig) {
    super(position, config.mass)
    this.config = config
  }

  get groundSpeed() {
    const { x, y } = this.velocity
    return Math.sqrt(x * x + y * y)
  }

  get directionSide(){
    return this.direction + Math.PI / 2
  }

  get wheelGroundSpeed() {
    const { x, y } = this.velocity
    return x * Math.cos(this.direction) + y * Math.sin(this.direction)
  }

  get wheelSidewaysSpeed() {
    const { x, y } = this.velocity
    return x * Math.cos(this.directionSide) + y * Math.sin(this.directionSide)
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

    const { wheelGroundSpeed, wheelSurfaceSpeed} = this

    const slipRatio = getSlipRatio(wheelGroundSpeed, wheelSurfaceSpeed)
    const slipSlip = compuleSlipProfile(
      slipRatio,
      payload.slipProfile,
    )

    const acc = MAX_ACC * slipSlip
    const moveSpeed = limitValue((wheelSurfaceSpeed - wheelGroundSpeed) * maxGrip, acc)
    
    this.velocity.x += moveSpeed * Math.cos(this.direction) * maxGrip
    this.velocity.y += moveSpeed * Math.sin(this.direction) * maxGrip
    
    this.angularVelocity -= moveSpeed / radius
    this.angularVelocity *= (angularFriction - brakePressure * this.config.brakeFrictionIncrease)
    
    const velFriction = ((1 - contactFriction) * maxGrip) * slipSlip
    const sideways = this.wheelSidewaysSpeed * velFriction * (1 - slipRatio)
    this.velocity.x -= sideways * Math.cos(this.directionSide)
    this.velocity.y -= sideways * Math.sin(this.directionSide)
    this.rotationAngle += this.angularVelocity
  }
}