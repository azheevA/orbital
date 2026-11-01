const TWO_PI = Math.PI * 2;

export function normalizeRadians(value: number): number {
  return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

export function solveKepler(meanAnomaly: number, eccentricity: number, tolerance = 1e-12): number {
  if (!Number.isFinite(meanAnomaly)) throw new RangeError('Mean anomaly must be finite.');
  if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError('Eccentricity must be in the interval [0, 1).');
  }
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new RangeError('Tolerance must be positive.');

  const normalizedMeanAnomaly = normalizeRadians(meanAnomaly);
  if (eccentricity === 0) return normalizedMeanAnomaly;

  let eccentricAnomaly = eccentricity < 0.8
    ? normalizedMeanAnomaly
    : Math.PI;

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const residual = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - normalizedMeanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    const correction = residual / derivative;
    eccentricAnomaly -= correction;
    if (Math.abs(correction) <= tolerance) return normalizeRadians(eccentricAnomaly);
  }

  throw new Error('Kepler equation did not converge within 32 iterations.');
}
