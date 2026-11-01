import { describe, expect, it } from 'vitest';
import { CELESTIAL_BODIES } from './solar-system';
import { getHeliocentricPosition } from '../lib/orbital-math/position';

describe('solar system catalogue', () => {
  it('contains eight unique planets', () => {
    expect(CELESTIAL_BODIES).toHaveLength(8);
    expect(new Set(CELESTIAL_BODIES.map((body) => body.id)).size).toBe(8);
  });

  it('contains valid orbital elements for every planet', () => {
    for (const body of CELESTIAL_BODIES) {
      expect(body.orbital.semiMajorAxisAu).toBeGreaterThan(0);
      expect(body.orbital.eccentricity).toBeGreaterThanOrEqual(0);
      expect(body.orbital.eccentricity).toBeLessThan(1);
      expect(body.orbital.orbitalPeriodDays).toBeGreaterThan(0);
      const position = getHeliocentricPosition(body.orbital, 0);
      expect(Object.values(position).every(Number.isFinite)).toBe(true);
    }
  });

  it('keeps all planetary distances inside perihelion and aphelion bounds', () => {
    for (const body of CELESTIAL_BODIES) {
      const { semiMajorAxisAu, eccentricity, orbitalPeriodDays } = body.orbital;
      const perihelion = semiMajorAxisAu * (1 - eccentricity);
      const aphelion = semiMajorAxisAu * (1 + eccentricity);
      const samples = Array.from({ length: 24 }, (_, index) =>
        getHeliocentricPosition(body.orbital, (index / 24) * orbitalPeriodDays),
      );

      for (const point of samples) {
        const distance = Math.hypot(point.x, point.y, point.z);
        expect(distance).toBeGreaterThanOrEqual(perihelion - 1e-8);
        expect(distance).toBeLessThanOrEqual(aphelion + 1e-8);
      }
    }
  });
});
