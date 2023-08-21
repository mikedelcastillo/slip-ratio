import { BeamBody } from "../beam";
import { numberNegOneToPosOne, numberZeroToOne } from "../types";
import { Wheel, WheelUpdatePayload } from "../wheel";

export type VehicleConfig = {
    beamBody: BeamBody
    wheels: Wheel[]
}

export enum DriveTrain {
    AWD,
    RWD,
    FWD,
}

export type VehicleInput = {
    throttle: numberZeroToOne,
    brake: numberZeroToOne,
    steer: numberNegOneToPosOne,
    driveTrain: DriveTrain,
}

export type UpdateCallback = (wheel: Wheel) => WheelUpdatePayload

export interface VehicleBase {
    applyInput(input: VehicleInput): void
    update(wheelUpdateCallback: UpdateCallback): void
}

export class Vehicle implements VehicleBase {
    beamBody: BeamBody
    wheels: Wheel[]

    inputs: VehicleInput = {
        throttle: 0,
        brake: 0,
        steer: 0,
        driveTrain: DriveTrain.RWD,
    }

    constructor(config: VehicleConfig) {
        this.beamBody = config.beamBody
        this.wheels = config.wheels
    }

    applyInput(input: Partial<VehicleInput>) {
        this.inputs = { ...this.inputs, ...input }
    }

    update(wheelUpdateCallback: UpdateCallback) {
        for (const wheel of this.wheels) wheel.update(wheelUpdateCallback(wheel))
        this.beamBody.update()
    }
}
