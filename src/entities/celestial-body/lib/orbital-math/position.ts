import type { OrbitalElements, Vector3Au } from '../../model/types';
import { normalizeRadians, solveKepler } from './solve-kepler';

const DEG_TO_RAD = Math.PI / 180;

export function getHeliocentricPosition(elements: OrbitalElements, elapsedDays: number): Vector3Au {
  if (!Number.isFinite(elapsedDays)) throw new RangeError('Elapsed days must be finite.');

  const numericElements = [
    elements.semiMajorAxisAu,
    elements.eccentricity,
    elements.inclinationDeg,
    elements.longitudeAscendingNodeDeg,
    elements.argumentOfPeriapsisDeg,
    elements.meanAnomalyAtEpochDeg,
    elements.orbitalPeriodDays,
  ];
  if (!numericElements.every(Number.isFinite)) throw new RangeError('Orbital elements must contain only finite numbers.');
  if (elements.semiMajorAxisAu <= 0) throw new RangeError('Semi-major axis must be positive.');
  if (elements.orbitalPeriodDays <= 0) throw new RangeError('Orbital period must be positive.');

  const meanAnomalyAtEpoch = elements.meanAnomalyAtEpochDeg * DEG_TO_RAD;
  const meanMotion = (Math.PI * 2) / elements.orbitalPeriodDays;
  const meanAnomaly = normalizeRadians(meanAnomalyAtEpoch + meanMotion * elapsedDays);
  const eccentricAnomaly = solveKepler(meanAnomaly, elements.eccentricity);
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + elements.eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - elements.eccentricity) * Math.cos(eccentricAnomaly / 2),
  );
  const radius = elements.semiMajorAxisAu * (1 - elements.eccentricity * Math.cos(eccentricAnomaly));

  const inclination = elements.inclinationDeg * DEG_TO_RAD;
  const ascendingNode = elements.longitudeAscendingNodeDeg * DEG_TO_RAD;
  const argumentOfPeriapsis = elements.argumentOfPeriapsisDeg * DEG_TO_RAD;
  const argumentOfLatitude = argumentOfPeriapsis + trueAnomaly;

  return {
    x: radius * (Math.cos(ascendingNode) * Math.cos(argumentOfLatitude) - Math.sin(ascendingNode) * Math.sin(argumentOfLatitude) * Math.cos(inclination)),
    y: radius * Math.sin(argumentOfLatitude) * Math.sin(inclination),
    z: radius * (Math.sin(ascendingNode) * Math.cos(argumentOfLatitude) + Math.cos(ascendingNode) * Math.sin(argumentOfLatitude) * Math.cos(inclination)),
  };
}

export function getScenePosition(elements: OrbitalElements, elapsedDays: number): [number, number, number] {
  const position = getHeliocentricPosition(elements, elapsedDays);
  const distanceAu = Math.hypot(position.x, position.y, position.z);
  if (distanceAu === 0) return [0, 0, 0];
  const sceneRadius = 2.8 + (Math.log1p(distanceAu) / Math.log1p(30.07)) * 15.5;
  const scale = sceneRadius / distanceAu;
  return [position.x * scale, position.y * scale, position.z * scale];
}

export function getOrbitPath(elements: OrbitalElements, samples = 180): [number, number, number][] {
  if (!Number.isInteger(samples) || samples < 12) throw new RangeError('At least 12 orbit samples are required.');
  const points: [number, number, number][] = [];
  const orbitElements = { ...elements, meanAnomalyAtEpochDeg: 0 };
  const daysPerRadian = elements.orbitalPeriodDays / (Math.PI * 2);

  for (let index = 0; index <= samples; index += 1) {
    const meanAnomaly = (index / samples) * Math.PI * 2;
    points.push(getScenePosition(orbitElements, meanAnomaly * daysPerRadian));
  }
  return points;
}
