import 'server-only';
import { z } from 'zod';
import type { CelestialBody, JplEphemeris } from '@/entities/celestial-body';
import { parseHorizonsVector } from './parse-horizons-vector';

const HorizonsPayloadSchema = z.object({
  version: z.string().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
}).passthrough();

export async function fetchJplEphemeris(body: CelestialBody, date: string): Promise<JplEphemeris> {
  const start = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new Error('Некорректная дата для JPL Horizons.');
  const stop = new Date(start);
  stop.setUTCDate(stop.getUTCDate() + 1);

  const parameters = new URLSearchParams({
    format: 'json',
    COMMAND: body.jplCommand,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS',
    CENTER: '500@10',
    REF_PLANE: 'ECLIPTIC',
    TIME_TYPE: 'UT',
    START_TIME: date,
    STOP_TIME: stop.toISOString().slice(0, 10),
    STEP_SIZE: '1 d',
    OUT_UNITS: 'AU-D',
    VEC_TABLE: '1',
    VEC_CORR: 'NONE',
    CSV_FORMAT: 'YES',
    VEC_LABELS: 'NO',
  });

  const contact = process.env.ORBITAL_CONTACT_EMAIL ?? 'local-development';
  const response = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${parameters.toString()}`, {
    headers: { 'User-Agent': `ORBITAL-Explorer/0.1 (${contact})` },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw new Error(`JPL Horizons вернул HTTP ${response.status}.`);
  const payload = HorizonsPayloadSchema.parse(await response.json());
  if (payload.error) throw new Error(`JPL Horizons: ${payload.error}`);
  if (!payload.result) throw new Error('JPL Horizons вернул пустой ответ.');
  return parseHorizonsVector(payload.result, body.id, date, payload.version ?? 'unknown');
}
