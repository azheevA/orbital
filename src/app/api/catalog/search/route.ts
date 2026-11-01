import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CatalogSearchSource, SimbadObjectGroup } from '@/entities/space-object';
import { searchScientificCatalog } from '@/server/astronomy/catalog.service';

export const runtime = 'nodejs';
export const revalidate = 21_600;

const querySchema = z.object({
  source: z.enum(['exoplanets', 'asteroids', 'comets', 'simbad']),
  q: z.string().trim().max(80).default(''),
  cursor: z.string().max(120).nullable().default(null),
  group: z.enum(['stars', 'galaxies', 'nebulae', 'clusters']).default('galaxies'),
  limit: z.coerce.number().int().min(1).max(30).default(18),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    source: url.searchParams.get('source'),
    q: url.searchParams.get('q') ?? '',
    cursor: url.searchParams.get('cursor'),
    group: url.searchParams.get('group') ?? 'galaxies',
    limit: url.searchParams.get('limit') ?? '18',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Параметры научного каталога некорректны.' }, { status: 400 });
  }

  try {
    const result = await searchScientificCatalog({
      source: parsed.data.source as CatalogSearchSource,
      query: parsed.data.q,
      cursor: parsed.data.cursor,
      simbadGroup: parsed.data.group as SimbadObjectGroup,
      pageSize: parsed.data.limit,
    });
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить данные научного каталога.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
