import { describe, expect, it } from 'vitest';
import { parseHorizonsVector } from './parse-horizons-vector';
import { CELESTIAL_BODY_BY_ID } from '@/entities/celestial-body';

const fixture = `Target body name: Earth (399)\n$$SOE\n2450000.500000000, A.D. 1995-Oct-09 00:00:00.0000, 1.000000000, -0.250000000, 0.125000000, 0.010000000, 0.020000000, 0.030000000\n$$EOE`;

describe('parseHorizonsVector', () => {
  it('reads heliocentric AU coordinates from the CSV vector table', () => {
    const result = parseHorizonsVector(fixture, 'earth', '1995-10-09', '1.3');
    expect(result.bodyId).toBe('earth');
    expect(result.positionAu).toEqual({ x: 1, y: -0.25, z: 0.125 });
    expect(result.distanceAu).toBeCloseTo(Math.hypot(1, 0.25, 0.125), 12);
    expect(result.dataVersion).toBe('1.3');
  });

  it('rejects a response without an ephemeris table', () => {
    expect(() => parseHorizonsVector('No ephemeris was generated.', 'earth', '1995-10-09')).toThrow(/\$\$SOE/);
  });

  it('uses an explicit JPL command for each supported target', () => {
    expect(CELESTIAL_BODY_BY_ID.earth.jplCommand).toBe('399');
    expect(CELESTIAL_BODY_BY_ID.neptune.jplCommand).toBe('899');
  });
});
