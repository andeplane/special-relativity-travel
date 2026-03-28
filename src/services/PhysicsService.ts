import type { FuelResult, JourneyResult, PhysicsService, Preset, PresetService } from '../types/physics';

const C_M_S = 299792458;
const G_M_S2 = 9.80665;
const SECONDS_PER_YEAR = 31557600;
// 1g in ly/y^2
const G_IN_LY_Y2 = G_M_S2 * Math.pow(SECONDS_PER_YEAR, 2) / (C_M_S * SECONDS_PER_YEAR); // roughly 1.0323

export class DefaultPhysicsService implements PhysicsService {
  lorentzFactor(velocityC: number): number {
    if (velocityC >= 1) return Infinity;
    return 1 / Math.sqrt(1 - velocityC * velocityC);
  }

  contractedDistance(distanceLy: number, velocityC: number): number {
    return distanceLy / this.lorentzFactor(velocityC);
  }

  fuelRequirements(deltaV: number, payloadMassKg: number): FuelResult {
    const gamma = this.lorentzFactor(deltaV);
    const antimatterMassRatio = gamma * (1 + deltaV);
    const antimatterMass = payloadMassKg * (antimatterMassRatio - 1);
    
    // Antimatter cost: ~$62.5 trillion per gram = $62.5e15 per kg
    const antimatterCost = antimatterMass * 62.5e15;

    // Chemical rocket: delta_v in m/s, I_sp = 450s, g0 = 9.80665
    const deltaV_m_s = deltaV * C_M_S;
    const vExhaust = 450 * G_M_S2;
    // For very high deltaV, this will easily exceed standard numbers and return Infinity
    let chemicalMass = 0;
    if (deltaV_m_s / vExhaust > 700) { // Math.exp will overflow > 709
        chemicalMass = Infinity;
    } else {
        const chemicalMassRatio = Math.exp(deltaV_m_s / vExhaust);
        chemicalMass = payloadMassKg * (chemicalMassRatio - 1);
    }

    return {
      antimatterMass,
      antimatterCost,
      chemicalMass,
    };
  }

  calculateJourney(distanceLy: number, maxSpeedC: number, accelerationG: number): JourneyResult {
    // acceleration in ly/y^2
    const a = accelerationG * G_IN_LY_Y2;
    
    // Half distance is the max distance we can accelerate for
    const maxAccelDistance = distanceLy / 2;
    
    // Distance required to reach maxSpeedC: d = (c^2/a) * (gamma - 1), where c=1
    const gammaMax = this.lorentzFactor(maxSpeedC);
    const accelDistanceForMaxSpeed = (1 / a) * (gammaMax - 1);

    let peakVelocity = maxSpeedC;
    let accelDistance = accelDistanceForMaxSpeed;
    let coastDistance = 0;

    if (accelDistanceForMaxSpeed >= maxAccelDistance) {
      // We never reach maxSpeedC, we accelerate for half the trip, then decelerate
      accelDistance = maxAccelDistance;
      coastDistance = 0;
      // Calculate peak velocity at this distance
      // d = (1/a)*(gamma - 1) => gamma = a*d + 1
      const gammaPeak = a * accelDistance + 1;
      // v = sqrt(1 - 1/gamma^2)
      peakVelocity = Math.sqrt(1 - 1 / (gammaPeak * gammaPeak));
    } else {
      coastDistance = distanceLy - 2 * accelDistance;
    }

    // Time calculations for acceleration phase (c=1)
    // proper time (ship): tau = (1/a) * acosh(a*d + 1)
    // coordinate time (earth): t = (1/a) * sqrt((a*d + 1)^2 - 1)
    const accelShipTime = (1 / a) * Math.acosh(a * accelDistance + 1);
    const accelEarthTime = (1 / a) * Math.sqrt(Math.pow(a * accelDistance + 1, 2) - 1);

    const accelPhase = {
      distance: accelDistance,
      shipTime: accelShipTime,
      earthTime: accelEarthTime,
    };

    let coastPhase = null;
    let totalShipTime = accelShipTime * 2;
    let totalEarthTime = accelEarthTime * 2;

    if (coastDistance > 0) {
      const coastEarthTime = coastDistance / peakVelocity;
      const coastShipTime = coastEarthTime / this.lorentzFactor(peakVelocity);
      coastPhase = {
        distance: coastDistance,
        shipTime: coastShipTime,
        earthTime: coastEarthTime,
      };
      totalShipTime += coastShipTime;
      totalEarthTime += coastEarthTime;
    }

    const decelPhase = { ...accelPhase };

    return {
      earthTime: totalEarthTime,
      shipTime: totalShipTime,
      timeSaved: totalEarthTime - totalShipTime,
      maxLorentzFactor: this.lorentzFactor(peakVelocity),
      contractedDistance: this.contractedDistance(distanceLy, peakVelocity),
      peakVelocity,
      phases: {
        accel: accelPhase,
        coast: coastPhase,
        decel: decelPhase,
      },
    };
  }
}

export class DefaultPresetService implements PresetService {
  getPresets(): Preset[] {
    return [
      { name: 'Proxima Centauri', distance: 4.24 },
      { name: "Barnard's Star", distance: 5.96 },
      { name: 'Sirius', distance: 8.6 },
      { name: 'Vega', distance: 25.0 },
      { name: 'Polaris', distance: 323 },
      { name: 'Betelgeuse', distance: 700 },
      { name: 'Sagittarius A*', distance: 26000 },
      { name: 'Andromeda Galaxy', distance: 2537000 },
    ];
  }
}
