import { Vehicle, UpdateCallback } from ".";
import { BeamBody, BeamPoint } from "../beam";
import { Wheel, WheelConfig } from "../wheel";

export type CarConfig = {
    width: number,
    length: number,
    dip: number,
    rearWheelConfig: WheelConfig,
    frontWheelConfig: WheelConfig,
}

export class Car extends Vehicle {
    frontLeftWheel: Wheel
    frontRightWheel: Wheel
    rearLeftWheel: Wheel
    rearRightWheel: Wheel

    maxSteer = Math.PI / 3

    constructor(config: CarConfig) {
        const frontLeftWheel = new Wheel({ x: -config.width / 2 + config.dip, y: -config.length / 2 }, config.frontWheelConfig)
        const frontRightWheel = new Wheel({ x: config.width / 2 - config.dip, y: -config.length / 2 }, config.frontWheelConfig)
        const rearLeftWheel = new Wheel({ x: -config.width / 2, y: config.length / 2 }, config.rearWheelConfig)
        const rearRightWheel = new Wheel({ x: config.width / 2, y: config.length / 2 }, config.rearWheelConfig)

        const wheels: Wheel[] = [
            frontLeftWheel,
            frontRightWheel,
            rearLeftWheel,
            rearRightWheel,
        ]

        const points: BeamPoint[] = [
            ...wheels,
            new BeamPoint({ x: config.width / 2 + 10, y: -10 }),
            new BeamPoint({ x: -config.width / 2 - 10, y: -10 }),
        ]

        const beamBody = new BeamBody(points, [
            [0, 1],
            [0, 2],
            [0, 3],
            [2, 1],
            [2, 3],
            [3, 1],
            [4, 0],
            [4, 1],
            [4, 2],
            [4, 3],
            [4, 5],
            [5, 0],
            [5, 1],
            [5, 2],
            [5, 3],
        ])

        super({ beamBody, wheels })

        this.frontLeftWheel = frontLeftWheel
        this.frontRightWheel = frontRightWheel
        this.rearLeftWheel = rearLeftWheel
        this.rearRightWheel = rearRightWheel
    }

    get axelAngle() {
        return Math.atan2(
            this.rearRightWheel.position.y - this.rearLeftWheel.position.y,
            this.rearRightWheel.position.x - this.rearLeftWheel.position.x,
        ) - Math.PI / 2
    }
    
    update(wheelUpdateCallback: UpdateCallback): void {
        this.rearRightWheel.direction = this.axelAngle
        this.rearLeftWheel.direction = this.axelAngle
        this.frontRightWheel.direction = this.axelAngle + this.inputs.steer * this.maxSteer
        this.frontLeftWheel.direction = this.axelAngle + this.inputs.steer * this.maxSteer

        super.update(wheelUpdateCallback)
    }
}