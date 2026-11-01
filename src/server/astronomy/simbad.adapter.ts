import 'server-only';
import type { CatalogSearchItem, SimbadObjectGroup, SpaceObjectCategory, SpaceObjectStat } from '@/entities/space-object';
import { fetchTapJson, formatNumber, parseTapRows, readNumber, readText, sqlLiteral } from './tap-json';

const SIMBAD_TAP = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
const PAGE_SIZE = 18;

const GROUPS: Record<SimbadObjectGroup, { filter: string; category: SpaceObjectCategory; label: string }> = {
  stars: { filter: "otype = '*..'", category: 'star', label: 'Звезда' },
  galaxies: { filter: "otype = 'G..'", category: 'galaxy', label: 'Галактика' },
  nebulae: { filter: "(otype = 'ISM..' OR otype = 'PN')", category: 'nebula', label: 'Туманность' },
  clusters: { filter: "otype IN ('Cl*', 'GlC', 'OpC', 'As*', 'St*', 'MGr', 'ClG', 'SCG', 'CGG')", category: 'cluster', label: 'Скопление' },
};

type DataRow = Record<string, unknown>;

function safeSearchTerm(query: string): string {
  return query.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s.+_:#'-]/gu, '');
}

function makeStats(row: DataRow): SpaceObjectStat[] {
  const stats: SpaceObjectStat[] = [];
  const ra = formatNumber(readNumber(row.ra), 6);
  const dec = formatNumber(readNumber(row.dec), 6);
  const parallax = formatNumber(readNumber(row.plx_value), 4);
  const radialVelocity = formatNumber(readNumber(row.rvz_radvel), 2);
  if (ra) stats.push({ label: 'Прямое восхождение', value: `${ra}°` });
  if (dec) stats.push({ label: 'Склонение', value: `${dec}°` });
  if (parallax) stats.push({ label: 'Параллакс', value: `${parallax} mas` });
  if (radialVelocity) stats.push({ label: 'Лучевая скорость', value: `${radialVelocity} км/с` });
  return stats;
}

function toCatalogItem(row: DataRow, group: SimbadObjectGroup): CatalogSearchItem | null {
  const name = readText(row.main_id);
  if (!name) return null;
  const config = GROUPS[group];
  const objectType = readText(row.otype_txt) ?? readText(row.otype) ?? 'Астрономический объект';
  const stats = makeStats(row);
  const coordinateSummary = [readNumber(row.ra), readNumber(row.dec)]
    .every((value) => value !== null)
    ? `Координаты ICRS: ${formatNumber(readNumber(row.ra), 4)}°, ${formatNumber(readNumber(row.dec), 4)}°.`
    : '';

  return {
    id: name,
    source: 'simbad',
    name,
    englishName: name,
    category: config.category,
    categoryLabel: config.label,
    system: 'Глубокий космос',
    summary: `${objectType}. ${coordinateSummary}`.trim(),
    description: `${name} — запись в астрономической базе SIMBAD, объединяющей идентификаторы и опубликованные сведения об объектах за пределами Солнечной системы. Тип объекта и координаты получены из таблицы basic; физические характеристики могут быть доступны в связанных каталогах и публикациях.`,
    stats,
    sourceName: 'CDS · SIMBAD Astronomical Database',
    sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(name)}`,
    objectType,
  };
}

async function querySimbad(statement: string): Promise<DataRow[]> {
  const payload = await fetchTapJson(SIMBAD_TAP, statement, 43_200);
  return parseTapRows(payload);
}

export function buildSimbadSearchQuery(query: string, group: SimbadObjectGroup, cursor: string | null, pageSize = PAGE_SIZE): string {
  const config = GROUPS[group];
  const filters = [config.filter];
  const term = safeSearchTerm(query);
  const joinsIdentifiers = Boolean(term);
  if (term) filters.push(`(basic.main_id LIKE '%${sqlLiteral(term)}%' OR ident.id LIKE '%${sqlLiteral(term)}%')`);
  if (cursor) filters.push(`basic.main_id > '${sqlLiteral(safeSearchTerm(cursor))}'`);
  const from = joinsIdentifiers ? 'basic JOIN ident ON basic.oid = ident.oidref' : 'basic';
  const distinct = joinsIdentifiers ? 'DISTINCT ' : '';
  return `SELECT ${distinct}TOP ${pageSize + 1} basic.main_id, basic.ra, basic.dec, basic.otype, basic.otype_txt, basic.plx_value, basic.rvz_radvel FROM ${from} WHERE ${filters.join(' AND ')} ORDER BY basic.main_id`;
}

export async function searchSimbadObjects(query: string, group: SimbadObjectGroup, cursor: string | null, pageSize = PAGE_SIZE) {
  const statement = buildSimbadSearchQuery(query, group, cursor, pageSize);
  const rows = await querySimbad(statement);
  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map((row) => toCatalogItem(row, group)).filter((item): item is CatalogSearchItem => Boolean(item));

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items.at(-1)?.name ?? null) : null,
    countEstimate: null,
  };
}

export async function getSimbadObjectByName(name: string, group: SimbadObjectGroup): Promise<CatalogSearchItem | null> {
  const safeName = safeSearchTerm(name);
  if (!safeName) return null;
  const rows = await querySimbad(`SELECT TOP 1 basic.main_id, basic.ra, basic.dec, basic.otype, basic.otype_txt, basic.plx_value, basic.rvz_radvel FROM basic WHERE basic.main_id = '${sqlLiteral(safeName)}'`);
  return rows[0] ? toCatalogItem(rows[0], group) : null;
}
