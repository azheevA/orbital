import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CELESTIAL_BODIES } from '@/entities/celestial-body';
import { fetchJplEphemeris } from '@/server/astronomy/jpl.adapter';

export const runtime = 'nodejs';

const querySchema = z.object({
  body: z.enum(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']),
  date: z.iso.date().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    body: url.searchParams.get('body'),
    date: url.searchParams.get('date') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Параметры body/date некорректны.', issues: parsed.error.issues }, { status: 400 });
  }

  const body = CELESTIAL_BODIES.find((item) => item.id === parsed.data.body);
  if (!body) return NextResponse.json({ error: 'Объект не найден.' }, { status: 404 });

  try {
    const ephemeris = await fetchJplEphemeris(body, parsed.data.date ?? new Date().toISOString().slice(0, 10));
    return NextResponse.json(ephemeris, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JPL Horizons недоступен.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
