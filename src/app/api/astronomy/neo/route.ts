import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchNearEarthObjects } from '@/server/astronomy/nasa-neows.adapter';

export const runtime = 'nodejs';

const querySchema = z.object({ date: z.iso.date().optional() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ date: url.searchParams.get('date') ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: 'Дата должна быть в формате YYYY-MM-DD.' }, { status: 400 });

  try {
    const report = await fetchNearEarthObjects(parsed.data.date ?? new Date().toISOString().slice(0, 10));
    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NASA NEO API недоступен.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
