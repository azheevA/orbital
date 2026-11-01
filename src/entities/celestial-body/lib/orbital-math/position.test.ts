import { describe, expect, it } from 'vitest';
import { getHeliocentricPosition, getOrbitPath } from './position';
import type { OrbitalElements } from '@/entities/celestial-body';

const circularOrbit: OrbitalElements = {
  semiMajorAxisAu: 2,
  eccentricity: 0,
  inclinationDeg: 0,
  longitudeAscendingNodeDeg: 0,
  argumentOfPeriapsisDeg: 0,
  meanAnomalyAtEpochDeg: 0,
  orbitalPeriodDays: 100,
};

describe('getHeliocentricPosition', () => {
  it('places a circular orbit at its semi-major axis at epoch', () => {
    const position = getHeliocentricPosition(circularOrbit, 0);
    expect(position.x).toBeCloseTo(2, 10);
    expect(position.y).toBeCloseTo(0, 10);
    expect(position.z).toBeCloseTo(0, 10);
  });

  it('returns to the same position after one orbital period', () => {
    const first = getHeliocentricPosition(circularOrbit, 0);
    const next = getHeliocentricPosition(circularOrbit, circularOrbit.orbitalPeriodDays);
    expect(next.x).toBeCloseTo(first.x, 10);
    expect(next.y).toBeCloseTo(first.y, 10);
    expect(next.z).toBeCloseTo(first.z, 10);
  });

  it('keeps an eccentric orbit within periapsis and apoapsis bounds', () => {
    const earthLike = { ...circularOrbit, semiMajorAxisAu: 1, eccentricity: 0.1 };
    const samples = Array.from({ length: 100 }, (_, index) => getHeliocentricPosition(earthLike, index));
    const distances = samples.map((point) => Math.hypot(point.x, point.y, point.z));
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(0.9 - 1e-8);
    expect(Math.max(...distances)).toBeLessThanOrEqual(1.1 + 1e-8);
  });
});


describe('getOrbitPath', () => {
  it('returns a closed path with the requested number of segments', () => {
    const points = getOrbitPath(circularOrbit, 64);
    expect(points).toHaveLength(65);
    expect(points[0][0]).toBeCloseTo(points.at(-1)![0], 10);
    expect(points[0][1]).toBeCloseTo(points.at(-1)![1], 10);
    expect(points[0][2]).toBeCloseTo(points.at(-1)![2], 10);
  });

  it('rejects too few orbit samples', () => {
    expect(() => getOrbitPath(circularOrbit, 5)).toThrow(RangeError);
  });
});


describe('orbital input validation', () => {
  it('rejects a zero orbital period', () => {
    expect(() => getHeliocentricPosition({ ...circularOrbit, orbitalPeriodDays: 0 }, 1)).toThrow(RangeError);
  });

  it('rejects non-finite orbital elements', () => {
    expect(() => getHeliocentricPosition({ ...circularOrbit, inclinationDeg: Number.NaN }, 1)).toThrow(RangeError);
  });
});
