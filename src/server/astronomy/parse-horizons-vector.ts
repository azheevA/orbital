import type { CelestialBodyId, JplEphemeris } from '../../entities/celestial-body';

export function parseHorizonsVector(result: string, bodyId: CelestialBodyId, date: string, dataVersion = 'unknown'): JplEphemeris {
  const table = result.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!table) throw new Error('JPL Horizons не вернул таблицу векторов ($$SOE / $$EOE).');

  const row = table[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && /^\d/.test(line));

  if (!row) throw new Error('В ответе JPL Horizons отсутствует строка координат.');
  const columns = row.split(',').map((column) => column.trim());
  const julianDate = Number(columns[0]);
  const x = Number(columns[2]);
  const y = Number(columns[3]);
  const z = Number(columns[4]);

  if (![julianDate, x, y, z].every(Number.isFinite)) {
    throw new Error('Не удалось разобрать координаты JPL Horizons.');
  }

  return {
    bodyId,
    date,
    julianDate,
    positionAu: { x, y, z },
    distanceAu: Math.hypot(x, y, z),
    source: 'JPL Horizons',
    dataVersion,
  };
}
