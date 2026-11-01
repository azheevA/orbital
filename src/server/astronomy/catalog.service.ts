import 'server-only';
import type {
  CatalogSearchItem,
  CatalogSearchOptions,
  CatalogSearchPage,
  CatalogSearchSource,
  SimbadObjectGroup,
} from '@/entities/space-object';
import { searchNasaImagesForObject } from './nasa-images.adapter';
import { getExoplanetByName, searchExoplanets } from './exoplanet-archive.adapter';
import { getSmallBodyByIdentifier, searchSmallBodies } from './jpl-small-body.adapter';
import { getSimbadObjectByName, searchSimbadObjects } from './simbad.adapter';

const DEFAULT_PAGE_SIZE = 18;

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

async function enrichWithImages(items: readonly CatalogSearchItem[], maxImages = 8): Promise<CatalogSearchItem[]> {
  return mapWithConcurrency(items, 4, async (item, index) => {
    if (index >= maxImages) return item;
    const images = await searchNasaImagesForObject(item.name, item.category, 1);
    return images[0] ? { ...item, image: images[0] } : item;
  });
}

export async function searchScientificCatalog(options: CatalogSearchOptions): Promise<CatalogSearchPage> {
  const pageSize = Math.min(Math.max(options.pageSize ?? DEFAULT_PAGE_SIZE, 1), 30);
  const group = options.simbadGroup ?? 'galaxies';
  const result = await (async () => {
    switch (options.source) {
      case 'exoplanets':
        return searchExoplanets(options.query, options.cursor, pageSize);
      case 'asteroids':
        return searchSmallBodies(options.query, 'asteroid', options.cursor, pageSize);
      case 'comets':
        return searchSmallBodies(options.query, 'comet', options.cursor, pageSize);
      case 'simbad':
        return searchSimbadObjects(options.query, group, options.cursor, pageSize);
      default: {
        const exhaustiveSource: never = options.source;
        throw new Error(`Неподдерживаемый источник каталога: ${exhaustiveSource}`);
      }
    }
  })();

  const items = await enrichWithImages(result.items);
  return {
    source: options.source,
    fetchedAt: new Date().toISOString(),
    items,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
    countEstimate: result.countEstimate,
  };
}

export async function getScientificCatalogObject(
  source: CatalogSearchSource,
  identifier: string,
  simbadGroup: SimbadObjectGroup = 'galaxies',
): Promise<CatalogSearchItem | null> {
  let item: CatalogSearchItem | null = null;
  switch (source) {
    case 'exoplanets':
      item = await getExoplanetByName(identifier);
      break;
    case 'asteroids':
      item = await getSmallBodyByIdentifier(identifier, 'asteroid');
      break;
    case 'comets':
      item = await getSmallBodyByIdentifier(identifier, 'comet');
      break;
    case 'simbad':
      item = await getSimbadObjectByName(identifier, simbadGroup);
      break;
  }

  if (!item) return null;
  const images = await searchNasaImagesForObject(item.name, item.category, 4);
  return images.length ? { ...item, image: images[0], images } : item;
}

export const CATALOG_SOURCE_LABELS: Record<CatalogSearchSource, string> = {
  exoplanets: 'NASA Exoplanet Archive',
  asteroids: 'NASA/JPL Small-Body Database',
  comets: 'NASA/JPL Small-Body Database',
  simbad: 'CDS SIMBAD',
};
