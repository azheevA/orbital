export type SpaceObjectCategory =
  | 'star'
  | 'planet'
  | 'dwarf-planet'
  | 'moon'
  | 'exoplanet'
  | 'galaxy'
  | 'asteroid'
  | 'comet'
  | 'nebula'
  | 'cluster'
  | 'quasar';

export interface SpaceObjectStat {
  label: string;
  value: string;
}

export interface SpaceObject {
  slug: string;
  name: string;
  englishName: string;
  category: SpaceObjectCategory;
  categoryLabel: string;
  system: string;
  summary: string;
  description: string;
  significance: string;
  composition: string;
  stats: readonly SpaceObjectStat[];
  facts: readonly string[];
  art: string;
  sourceLabel: string;
  sourceUrl: string;
}

export type SpaceObjectImageKind = 'photo' | 'concept';

export interface SpaceObjectImage {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string | null;
  center: string | null;
  photographer: string | null;
  thumbnailUrl: string;
  sourceUrl: string;
  kind: SpaceObjectImageKind;
}

export interface SpaceObjectMedia {
  images: readonly SpaceObjectImage[];
}

export interface SpaceObjectMediaResponse {
  source: 'NASA Image and Video Library';
  fetchedAt: string;
  bySlug: Record<string, SpaceObjectMedia>;
  missingSlugs: string[];
}

export type CatalogSearchSource = 'exoplanets' | 'asteroids' | 'comets' | 'simbad';
export type SimbadObjectGroup = 'stars' | 'galaxies' | 'nebulae' | 'clusters';

export interface CatalogSearchItem {
  id: string;
  source: CatalogSearchSource;
  name: string;
  englishName: string;
  category: SpaceObjectCategory;
  categoryLabel: string;
  system: string;
  summary: string;
  description: string;
  stats: readonly SpaceObjectStat[];
  sourceName: string;
  sourceUrl: string;
  image?: SpaceObjectImage;
  images?: readonly SpaceObjectImage[];
  objectType?: string;
}

export interface CatalogSearchPage {
  source: CatalogSearchSource;
  fetchedAt: string;
  items: readonly CatalogSearchItem[];
  nextCursor: string | null;
  hasMore: boolean;
  countEstimate: number | null;
}

export interface CatalogSearchOptions {
  source: CatalogSearchSource;
  query: string;
  cursor: string | null;
  simbadGroup?: SimbadObjectGroup;
  pageSize?: number;
}
