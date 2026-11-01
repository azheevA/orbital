import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getScientificCatalogObject } from '@/server/astronomy/catalog.service';

export const runtime = 'nodejs';

const querySchema = z.object({
  source: z.enum(['exoplanets', 'asteroids', 'comets', 'simbad']),
  id: z.string().trim().min(1).max(120),
  group: z.enum(['stars', 'galaxies', 'nebulae', 'clusters']).default('galaxies'),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    source: url.searchParams.get('source'),
    id: url.searchParams.get('id'),
    group: url.searchParams.get('group') ?? 'galaxies',
  });

  if (!parsed.success) return NextResponse.json({ error: 'Параметры объекта некорректны.' }, { status: 400 });

  try {
    const object = await getScientificCatalogObject(parsed.data.source, parsed.data.id, parsed.data.group);
    if (!object) return NextResponse.json({ error: 'Объект не найден в научном каталоге.' }, { status: 404 });
    return NextResponse.json(object, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить досье объекта.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
