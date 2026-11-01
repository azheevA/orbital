import { describe, expect, it } from 'vitest';
import { solveKepler } from './solve-kepler';

describe('solveKepler', () => {
  it('returns the normalized mean anomaly for a circular orbit', () => {
    expect(solveKepler(Math.PI * 2 + 0.5, 0)).toBeCloseTo(0.5, 12);
  });

  it('solves an eccentric orbit with a small residual', () => {
    const meanAnomaly = 2.1;
    const eccentricity = 0.8;
    const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);
    expect(Math.abs(eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly)).toBeLessThan(1e-10);
  });

  it('rejects invalid eccentricity', () => {
    expect(() => solveKepler(1, 1)).toThrow(RangeError);
    expect(() => solveKepler(1, -0.1)).toThrow(RangeError);
  });
});
