export type CelestialBodyId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type CelestialBodyKind = 'terrestrial' | 'gas-giant' | 'ice-giant';

export interface OrbitalElements {
  semiMajorAxisAu: number;
  eccentricity: number;
  inclinationDeg: number;
  longitudeAscendingNodeDeg: number;
  argumentOfPeriapsisDeg: number;
  meanAnomalyAtEpochDeg: number;
  orbitalPeriodDays: number;
}

export interface CelestialBody {
  id: CelestialBodyId;
  name: string;
  englishName: string;
  kind: CelestialBodyKind;
  description: string;
  meanDistanceLabel: string;
  orbitalPeriodLabel: string;
  radiusEarth: number;
  sceneRadius: number;
  color: string;
  texture: string;
  orbital: OrbitalElements;
  jplCommand: string;
}

export interface Vector3Au {
  x: number;
  y: number;
  z: number;
}

export interface JplEphemeris {
  bodyId: CelestialBodyId;
  date: string;
  julianDate: number;
  positionAu: Vector3Au;
  distanceAu: number;
  source: 'JPL Horizons';
  dataVersion: string;
}
