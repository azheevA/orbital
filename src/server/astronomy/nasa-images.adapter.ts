import { z } from 'zod';
import { SPACE_OBJECT_BY_SLUG } from '@/entities/space-object';
import type { SpaceObject, SpaceObjectImage, SpaceObjectMediaResponse } from '@/entities/space-object';

const NASA_IMAGES_SEARCH = 'https://images-api.nasa.gov/search';
const NASA_IMAGE_QUERIES: Record<string, string> = {
  sun: 'Sun Solar Dynamics Observatory SDO',
  mercury: 'Mercury MESSENGER NASA planet surface',
  venus: 'Venus Magellan NASA planet',
  earth: 'Earth Blue Marble NASA',
  moon: 'Moon Apollo NASA lunar surface',
  mars: 'Mars Perseverance rover NASA',
  jupiter: 'Jupiter Juno NASA planet',
  saturn: 'Saturn Cassini NASA planet rings',
  uranus: 'Uranus Voyager 2 NASA',
  neptune: 'Neptune Voyager 2 NASA',
  pluto: 'Pluto New Horizons NASA',
  ceres: 'Ceres Dawn mission NASA',
  europa: 'Europa Jupiter moon Galileo NASA',
  titan: 'Titan Saturn Cassini NASA',
  enceladus: 'Enceladus Cassini NASA',
  ganymede: 'Ganymede Galileo NASA',
  'proxima-centauri-b': 'Proxima Centauri b exoplanet NASA artist concept',
  'kepler-186f': 'Kepler-186f NASA artist concept',
  andromeda: 'Andromeda Galaxy M31 Hubble NASA',
};

const nasaImageItemSchema = z.object({
  data: z.array(z.object({
    nasa_id: z.string().optional(),
    title: z.string().optional(),
    description: z.string().nullish(),
    date_created: z.string().nullish(),
    center: z.string().nullish(),
    photographer: z.string().nullish(),
  }).passthrough()),
  links: z.array(z.object({ href: z.string(), rel: z.string().optional() }).passthrough()).optional(),
}).passthrough();

const nasaSearchResponseSchema = z.object({
  collection: z.object({
    items: z.array(nasaImageItemSchema),
  }).passthrough(),
}).passthrough();

function isNasaAssetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov'));
  } catch {
    return false;
  }
}

export function classifyNasaImageKind(title: string, description: string, category: SpaceObject['category']): SpaceObjectImage['kind'] {
  const text = `${title} ${description}`.toLowerCase();
  const conceptPattern = /artist['’]?s?\s+(?:concept|impression|rendering|illustration|rendition)|artist\s+(?:view|depiction)|illustration|render(?:ing)?|visuali[sz]ation|computer[- ]generated|simulation|schematic|infographic|diagram|model(?:led)?\s+(?:of|showing)/i;
  if (category === 'exoplanet' || conceptPattern.test(text)) return 'concept';
  return 'photo';
}

export function normalizeNasaImages(payload: unknown, category: SpaceObject['category'], limit = 4): SpaceObjectImage[] {
  const parsed = nasaSearchResponseSchema.safeParse(payload);
  if (!parsed.success) return [];

  const images: SpaceObjectImage[] = [];
  const seen = new Set<string>();

  for (const item of parsed.data.collection.items) {
    const metadata = item.data[0];
    if (!metadata?.nasa_id || !metadata.title || seen.has(metadata.nasa_id)) continue;
    const preview = item.links?.find((link: { href: string; rel?: string }) => link.rel === 'preview')?.href ?? item.links?.[0]?.href;
    if (!preview || !isNasaAssetUrl(preview)) continue;

    seen.add(metadata.nasa_id);
    const description = metadata.description?.trim() ?? '';
    images.push({
      nasaId: metadata.nasa_id,
      title: metadata.title.trim(),
      description: description.slice(0, 700),
      dateCreated: metadata.date_created ?? null,
      center: metadata.center ?? null,
      photographer: metadata.photographer ?? null,
      thumbnailUrl: preview,
      sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(metadata.nasa_id)}`,
      kind: classifyNasaImageKind(metadata.title, description, category),
    });

    if (images.length >= limit) break;
  }

  return images;
}

async function fetchImagesByQuery(query: string, category: SpaceObject['category'], limit: number): Promise<SpaceObjectImage[]> {
  const params = new URLSearchParams({ q: query, media_type: 'image', page_size: '12' });
  try {
    const response = await fetch(`${NASA_IMAGES_SEARCH}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500),
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return [];
    return normalizeNasaImages(await response.json(), category, limit);
  } catch {
    return [];
  }
}

async function fetchImagesForObject(slug: string): Promise<SpaceObjectImage[]> {
  const object = SPACE_OBJECT_BY_SLUG[slug];
  const query = NASA_IMAGE_QUERIES[slug];
  if (!object || !query) return [];
  return fetchImagesByQuery(query, object.category, 4);
}

export async function searchNasaImagesForObject(name: string, category: SpaceObject['category'], limit = 1): Promise<SpaceObjectImage[]> {
  const safeName = name.trim().replace(/[\r\n]/g, ' ').slice(0, 100);
  if (!safeName) return [];

  const contextByCategory: Partial<Record<SpaceObject['category'], string>> = {
    asteroid: 'asteroid NASA spacecraft',
    comet: 'comet NASA spacecraft',
    star: 'star NASA space telescope',
    galaxy: 'galaxy NASA Hubble',
    nebula: 'nebula NASA Hubble',
    cluster: 'star cluster NASA Hubble',
    quasar: 'quasar NASA Hubble',
    moon: 'moon NASA spacecraft',
    planet: 'planet NASA spacecraft',
    'dwarf-planet': 'dwarf planet NASA spacecraft',
  };
  const query = category === 'exoplanet'
    ? `${safeName} exoplanet artist concept`
    : `${safeName} ${contextByCategory[category] ?? 'NASA space'}`;

  return fetchImagesByQuery(query, category, limit);
}

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), items.length);

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }));

  return results;
}

export async function getCatalogMedia(slugs: readonly string[]): Promise<SpaceObjectMediaResponse> {
  const uniqueSlugs = [...new Set(slugs)].filter((slug) => Boolean(SPACE_OBJECT_BY_SLUG[slug]));
  const mediaEntries = await mapWithConcurrency(uniqueSlugs, 4, async (slug) => ({
    slug,
    images: await fetchImagesForObject(slug),
  }));

  const bySlug = Object.fromEntries(mediaEntries.map(({ slug, images }) => [slug, { images }])) as SpaceObjectMediaResponse['bySlug'];
  const missingSlugs = mediaEntries.filter(({ images }) => images.length === 0).map(({ slug }) => slug);

  return {
    source: 'NASA Image and Video Library',
    fetchedAt: new Date().toISOString(),
    bySlug,
    missingSlugs,
  };
}
