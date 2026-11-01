import 'server-only';
import { z } from 'zod';

const NeoSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_potentially_hazardous_asteroid: z.boolean(),
  estimated_diameter: z.object({
    meters: z.object({
      estimated_diameter_min: z.number(),
      estimated_diameter_max: z.number(),
    }),
  }),
  close_approach_data: z.array(z.object({
    close_approach_date: z.string(),
    miss_distance: z.object({ kilometers: z.string() }),
  }).passthrough()).default([]),
}).passthrough();

const NeoFeedSchema = z.object({
  near_earth_objects: z.record(z.string(), z.array(NeoSchema)),
}).passthrough();

export interface NearEarthObjectSummary {
  id: string;
  name: string;
  hazardous: boolean;
  diameterMeters: number;
  missDistanceKm: number | null;
}

export interface NearEarthObjectReport {
  date: string;
  count: number;
  hazardousCount: number;
  objects: NearEarthObjectSummary[];
}

export async function fetchNearEarthObjects(date: string): Promise<NearEarthObjectReport> {
  const apiKey = process.env.NASA_API_KEY ?? 'DEMO_KEY';
  const parameters = new URLSearchParams({ start_date: date, end_date: date, api_key: apiKey });
  const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?${parameters.toString()}`, {
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'NASA API: достигнут лимит запросов. Добавьте личный NASA_API_KEY.'
      : `NASA NEO API вернул HTTP ${response.status}.`);
  }

  const payload = NeoFeedSchema.parse(await response.json());
  const objects = Object.values(payload.near_earth_objects).flat().map((item) => {
    const approach = item.close_approach_data[0];
    const minDiameter = item.estimated_diameter.meters.estimated_diameter_min;
    const maxDiameter = item.estimated_diameter.meters.estimated_diameter_max;
    return {
      id: item.id,
      name: item.name,
      hazardous: item.is_potentially_hazardous_asteroid,
      diameterMeters: (minDiameter + maxDiameter) / 2,
      missDistanceKm: approach ? Number(approach.miss_distance.kilometers) : null,
    } satisfies NearEarthObjectSummary;
  }).sort((a, b) => (a.missDistanceKm ?? Infinity) - (b.missDistanceKm ?? Infinity));

  return {
    date,
    count: objects.length,
    hazardousCount: objects.filter((item) => item.hazardous).length,
    objects: objects.slice(0, 12),
  };
}
