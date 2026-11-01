import { describe, expect, it } from 'vitest';
import { formatNumber, parseTapRows, readNumber, readText, sqlLiteral } from './tap-json';

describe('astronomy TAP response normalization', () => {
  it('maps positional TAP rows using metadata column names', () => {
    const rows = parseTapRows({
      metadata: [{ name: 'main_id' }, { name: 'ra' }, { name: 'dec' }],
      data: [['M 31', 10.6847, 41.269], ['M 33', 23.462, 30.66]],
    });
    expect(rows).toEqual([
      { main_id: 'M 31', ra: 10.6847, dec: 41.269 },
      { main_id: 'M 33', ra: 23.462, dec: 30.66 },
    ]);
  });

  it('accepts object-shaped TAP rows as well as arrays', () => {
    expect(parseTapRows({ data: [{ pl_name: 'Kepler-186 f', pl_rade: 1.17 }] })).toEqual([
      { pl_name: 'Kepler-186 f', pl_rade: 1.17 },
    ]);
  });

  it('accepts NASA Exoplanet Archive JSON object arrays', () => {
    expect(parseTapRows([
      { pl_name: 'Kepler-22 b', pl_rade: 2.4 },
      { pl_name: 'TOI-700 d', pl_rade: 1.1 },
    ])).toEqual([
      { pl_name: 'Kepler-22 b', pl_rade: 2.4 },
      { pl_name: 'TOI-700 d', pl_rade: 1.1 },
    ]);
  });

  it('rejects invalid responses instead of silently showing empty data', () => {
    expect(() => parseTapRows({ error: 'invalid query' })).toThrow('invalid query');
  });

  it('normalizes optional numeric and text fields safely', () => {
    expect(readNumber('1.250')).toBe(1.25);
    expect(readNumber('not-a-number')).toBeNull();
    expect(readText('  M 87  ')).toBe('M 87');
    expect(readText('   ')).toBeNull();
    expect(formatNumber(1.234567, 3)).toBe('1,235');
  });

  it('escapes single quotes before inserting user text into ADQL/SQL literals', () => {
    expect(sqlLiteral("O'Brien")).toBe("O''Brien");
  });
});
