import 'server-only';
import type { CatalogSearchItem, SpaceObjectStat } from '@/entities/space-object';
import { formatNumber, parseTapRows, readNumber, readText, sqlLiteral } from './tap-json';

const EXOPLANET_TAP = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const PAGE_SIZE = 18;
const COLUMNS = 'pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_bmasse,pl_orbper,pl_orbsmax,pl_orbeccen,pl_orbincl,pl_dens,pl_insol,sy_dist,pl_eqt,sy_snum,sy_pnum,st_spectype,st_teff,st_rad,st_mass,st_age';

type DataRow = Record<string, unknown>;

function makeStats(row: DataRow): SpaceObjectStat[] {
  const stats: SpaceObjectStat[] = [];
  const fields: [string, string, string, number?][] = [
    ['Радиус планеты', 'pl_rade', 'R⊕', 3],
    ['Масса планеты', 'pl_bmasse', 'M⊕', 3],
    ['Орбитальный период', 'pl_orbper', 'дней', 3],
    ['Большая полуось', 'pl_orbsmax', 'а.е.', 4],
    ['Эксцентриситет орбиты', 'pl_orbeccen', '', 4],
    ['Наклонение орбиты', 'pl_orbincl', '°', 3],
    ['Средняя плотность', 'pl_dens', 'г/см³', 3],
    ['Поток излучения', 'pl_insol', 'S⊕', 3],
    ['Расстояние до системы', 'sy_dist', 'пк', 2],
    ['Равновесная температура', 'pl_eqt', 'K', 0],
    ['Температура звезды', 'st_teff', 'K', 0],
    ['Радиус звезды', 'st_rad', 'R☉', 3],
    ['Масса звезды', 'st_mass', 'M☉', 3],
    ['Возраст звезды', 'st_age', 'млрд лет', 2],
    ['Звёзд в системе', 'sy_snum', '', 0],
    ['Известных планет в системе', 'sy_pnum', '', 0],
  ];

  for (const [label, field, unit, precision = 3] of fields) {
    const value = formatNumber(readNumber(row[field]), precision);
    if (value) stats.push({ label, value: unit ? `${value} ${unit}` : value });
  }
  const spectralType = readText(row.st_spectype);
  if (spectralType) stats.push({ label: 'Спектральный класс звезды', value: spectralType });

  return stats;
}

function toCatalogItem(row: DataRow): CatalogSearchItem | null {
  const name = readText(row.pl_name);
  if (!name) return null;

  const host = readText(row.hostname) ?? 'Звезда-хозяин не указана';
  const discoveryMethod = readText(row.discoverymethod);
  const discoveryYear = readNumber(row.disc_year);
  const details = [discoveryMethod, discoveryYear ? `открыта в ${Math.round(discoveryYear)} году` : null].filter(Boolean).join(', ');
  const stats = makeStats(row);

  return {
    id: name,
    source: 'exoplanets',
    name,
    englishName: name,
    category: 'exoplanet',
    categoryLabel: 'Экзопланета',
    system: host,
    summary: details ? `Экзопланета системы ${host}; ${details}.` : `Подтверждённая экзопланета системы ${host}.`,
    description: `Запись NASA Exoplanet Archive для ${name}. Архив объединяет опубликованные измерения планеты и её звезды-хозяина. Значения приведены в единицах, указанных рядом с каждым параметром; отсутствие параметра означает, что в выбранной записи архива он не задан.`,
    stats,
    sourceName: 'NASA Exoplanet Archive · PSCompPars',
    sourceUrl: `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(name)}`,
  };
}

async function queryRows(query: string): Promise<DataRow[]> {
  const url = new URL(EXOPLANET_TAP);
  url.searchParams.set('query', query);
  url.searchParams.set('format', 'json');
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 21_600 },
  });
  if (!response.ok) throw new Error(`NASA Exoplanet Archive вернул HTTP ${response.status}.`);
  return parseTapRows(await response.json());
}

function safeSearchTerm(query: string): string {
  return query.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s.+_'-]/gu, '');
}

export async function searchExoplanets(query: string, cursor: string | null, pageSize = PAGE_SIZE) {
  const filters = ['pl_name IS NOT NULL'];
  const term = safeSearchTerm(query);
  if (term) filters.push(`UPPER(pl_name) LIKE '%${sqlLiteral(term.toUpperCase())}%'`);
  if (cursor) filters.push(`pl_name > '${sqlLiteral(safeSearchTerm(cursor))}'`);

  const statement = `SELECT TOP ${pageSize + 1} ${COLUMNS} FROM pscomppars WHERE ${filters.join(' AND ')} ORDER BY pl_name`;
  const rows = await queryRows(statement);
  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map(toCatalogItem).filter((item): item is CatalogSearchItem => Boolean(item));

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items.at(-1)?.name ?? null) : null,
    countEstimate: null,
  };
}

export async function getExoplanetByName(name: string): Promise<CatalogSearchItem | null> {
  const safeName = safeSearchTerm(name);
  if (!safeName) return null;
  const rows = await queryRows(`SELECT TOP 1 ${COLUMNS} FROM pscomppars WHERE pl_name = '${sqlLiteral(safeName)}'`);
  return rows[0] ? toCatalogItem(rows[0]) : null;
}
