import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SPACE_OBJECTS } from '@/entities/space-object';
import { getCatalogMedia } from '@/server/astronomy/nasa-images.adapter';

export const runtime = 'nodejs';
export const revalidate = 21_600;

const validSlugs = new Set(SPACE_OBJECTS.map((object) => object.slug));
const slugsSchema = z.array(z.string().min(1).max(80)).max(SPACE_OBJECTS.length);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSlugs = url.searchParams.get('slugs');
  const requestedSlugs = rawSlugs
    ? rawSlugs.split(',').map((slug) => slug.trim()).filter(Boolean)
    : SPACE_OBJECTS.map((object) => object.slug);
  const parsed = slugsSchema.safeParse(requestedSlugs);

  if (!parsed.success || parsed.data.some((slug) => !validSlugs.has(slug))) {
    return NextResponse.json({ error: 'Передан неизвестный объект каталога.' }, { status: 400 });
  }

  const media = await getCatalogMedia(parsed.data);
  return NextResponse.json(media, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' },
  });
}
