import 'server-only';
import type { CatalogSearchItem, SpaceObjectStat } from '@/entities/space-object';
import { formatNumber, readNumber, readText } from './tap-json';

const SBDB_QUERY_ENDPOINT = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api';
const SBDB_OBJECT_ENDPOINT = 'https://ssd-api.jpl.nasa.gov/sbdb.api';
const PAGE_SIZE = 18;
const QUERY_FIELDS = 'spkid,full_name,pdes,name,kind,neo,pha,class,a,e,q,i,per,moid,diameter,H';

type ApiRecord = Record<string, unknown>;

type SmallBodyKind = 'asteroid' | 'comet';

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : null;
}

function getSearchUrl(endpoint: string, parameters: Record<string, string>): URL {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  return url;
}

async function requestJpl(url: URL): Promise<ApiRecord> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 21_600 },
  });
  const payload = asRecord(await response.json());
  if (!response.ok) {
    const message = readText(payload?.message) ?? `JPL SBDB вернул HTTP ${response.status}.`;
    throw new Error(message);
  }
  if (!payload) throw new Error('JPL SBDB вернул некорректный JSON.');
  if (payload.code && Number(payload.code) >= 400) throw new Error(readText(payload.message) ?? 'JPL SBDB не смог выполнить запрос.');
  return payload;
}

function getKind(raw: unknown, fallback: SmallBodyKind): SmallBodyKind {
  const kind = readText(raw)?.toLowerCase();
  return kind?.startsWith('c') ? 'comet' : kind?.startsWith('a') ? 'asteroid' : fallback;
}

function readOrbitValue(orbit: ApiRecord | null, key: string): { value: number | null; units: string | null } {
  const elements = Array.isArray(orbit?.elements) ? orbit.elements : [];
  const element = elements.map(asRecord).find((item) => readText(item?.name) === key);
  return {
    value: readNumber(element?.value),
    units: readText(element?.units),
  };
}

function readPhysicalValue(payload: ApiRecord, key: string): number | null {
  const parameters = Array.isArray(payload.phys_par) ? payload.phys_par : [];
  const parameter = parameters.map(asRecord).find((item) => readText(item?.name) === key);
  return readNumber(parameter?.value);
}

function makeStatsFromFields(row: ApiRecord): SpaceObjectStat[] {
  const stats: SpaceObjectStat[] = [];
  const fields: [string, string, string, number?][] = [
    ['Большая полуось', 'a', 'а.е.', 5],
    ['Эксцентриситет', 'e', '', 5],
    ['Перигелий', 'q', 'а.е.', 5],
    ['Наклонение орбиты', 'i', '°', 3],
    ['Орбитальный период', 'per', 'дней', 2],
    ['Минимальное пересечение с орбитой Земли', 'moid', 'а.е.', 5],
    ['Диаметр', 'diameter', 'км', 3],
    ['Абсолютная звёздная величина', 'H', 'mag', 2],
  ];

  for (const [label, field, unit, precision = 3] of fields) {
    const value = formatNumber(readNumber(row[field]), precision);
    if (value) stats.push({ label, value: unit ? `${value} ${unit}` : value });
  }
  return stats;
}

function itemFromQueryRow(row: ApiRecord, fallbackKind: SmallBodyKind): CatalogSearchItem | null {
  const name = readText(row.full_name) ?? readText(row.name) ?? readText(row.pdes);
  const id = readText(row.spkid) ?? readText(row.pdes) ?? name;
  if (!name || !id) return null;

  const kind = getKind(row.kind, fallbackKind);
  const orbitClass = readText(row.class);
  const isNeo = row.neo === true || String(row.neo).toUpperCase() === 'Y';
  const isPha = row.pha === true || String(row.pha).toUpperCase() === 'Y';
  const categoryLabel = kind === 'comet' ? 'Комета' : 'Астероид';
  const descriptors = [orbitClass ? `класс орбиты ${orbitClass}` : null, isNeo ? 'околоземный объект' : null, isPha ? 'потенциально опасный объект' : null].filter(Boolean);

  return {
    id,
    source: kind === 'comet' ? 'comets' : 'asteroids',
    name,
    englishName: name,
    category: kind,
    categoryLabel,
    system: 'Солнечная система',
    summary: descriptors.length ? `${categoryLabel}. ${descriptors.join('; ')}.` : `${categoryLabel} из базы малых тел NASA/JPL.`,
    description: `${name} зарегистрирован в Small-Body Database лаборатории NASA/JPL. Каталог содержит орбитальные решения, наблюдательную историю и доступные физические параметры. Численные значения приведены только там, где они присутствуют в записи.`,
    stats: makeStatsFromFields(row),
    sourceName: 'NASA/JPL · Small-Body Database',
    sourceUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(readText(row.pdes) ?? name)}`,
  };
}

function itemFromObjectPayload(payload: ApiRecord, fallbackKind: SmallBodyKind): CatalogSearchItem | null {
  const object = asRecord(payload.object);
  if (!object) return null;
  const orbit = asRecord(payload.orbit);
  const name = readText(object.fullname) ?? readText(object.shortname) ?? readText(object.des);
  const id = readText(object.spkid) ?? readText(object.des) ?? name;
  if (!name || !id) return null;

  const kind = getKind(object.kind, fallbackKind);
  const orbitClassRecord = asRecord(object.orbit_class);
  const orbitClass = readText(orbitClassRecord?.name) ?? readText(orbitClassRecord?.code);
  const isNeo = object.neo === true;
  const isPha = object.pha === true;
  const stats: SpaceObjectStat[] = [];
  const orbitParameters: [string, string, number?][] = [
    ['a', 'Большая полуось', 5],
    ['e', 'Эксцентриситет', 5],
    ['q', 'Перигелий', 5],
    ['i', 'Наклонение орбиты', 3],
    ['per', 'Орбитальный период', 2],
    ['moid', 'Минимальное пересечение с орбитой Земли', 5],
  ];
  for (const [key, label, precision = 3] of orbitParameters) {
    const { value, units } = readOrbitValue(orbit, key);
    const formatted = formatNumber(value, precision);
    if (formatted) stats.push({ label, value: `${formatted}${units ? ` ${units}` : ''}` });
  }
  const diameter = formatNumber(readPhysicalValue(payload, 'diameter'), 3);
  if (diameter) stats.push({ label: 'Диаметр', value: `${diameter} км` });
  const absoluteMagnitude = formatNumber(readPhysicalValue(payload, 'H'), 2);
  if (absoluteMagnitude) stats.push({ label: 'Абсолютная звёздная величина', value: `${absoluteMagnitude} mag` });
  const rotationPeriod = formatNumber(readPhysicalValue(payload, 'rot_per'), 3);
  if (rotationPeriod) stats.push({ label: 'Период вращения', value: `${rotationPeriod} ч` });
  const albedo = formatNumber(readPhysicalValue(payload, 'albedo'), 4);
  if (albedo) stats.push({ label: 'Геометрическое альбедо', value: albedo });
  const orbitEpoch = formatNumber(readNumber(orbit?.epoch), 2);
  if (orbitEpoch) stats.push({ label: 'Эпоха орбитального решения', value: `JD ${orbitEpoch} TDB` });
  const observationCount = formatNumber(readNumber(orbit?.n_obs_used), 0);
  if (observationCount) stats.push({ label: 'Использовано наблюдений', value: observationCount });
  const solutionDate = readText(orbit?.soln_date);
  if (solutionDate) stats.push({ label: 'Дата решения орбиты', value: solutionDate });

  const categoryLabel = kind === 'comet' ? 'Комета' : 'Астероид';
  const descriptors = [orbitClass ? `класс орбиты ${orbitClass}` : null, isNeo ? 'околоземный объект' : null, isPha ? 'потенциально опасный объект' : null].filter(Boolean);

  return {
    id,
    source: kind === 'comet' ? 'comets' : 'asteroids',
    name,
    englishName: name,
    category: kind,
    categoryLabel,
    system: 'Солнечная система',
    summary: descriptors.length ? `${categoryLabel}. ${descriptors.join('; ')}.` : `${categoryLabel} из базы малых тел NASA/JPL.`,
    description: `${name} — объект из NASA/JPL Small-Body Database. Орбитальные элементы относятся к указанной в каталоге эпохе решения и могут обновляться по мере поступления новых наблюдений. Параметры, отсутствующие в записи, не подменяются оценками приложения.`,
    stats,
    sourceName: 'NASA/JPL · Small-Body Database',
    sourceUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(readText(object.des) ?? name)}`,
  };
}

function rowsFromQueryPayload(payload: ApiRecord): ApiRecord[] {
  if (!Array.isArray(payload.fields) || !Array.isArray(payload.data)) return [];
  const fields = payload.fields.map((field) => typeof field === 'string' ? field : readText(asRecord(field)?.name) ?? '');
  return payload.data.flatMap((row): ApiRecord[] => {
    if (!Array.isArray(row)) return [];
    return [Object.fromEntries(fields.map((field, index) => [field, row[index]]).filter(([field]) => Boolean(field)))];
  });
}

function safeOffset(cursor: string | null): number {
  if (!cursor || !/^\d+$/.test(cursor)) return 0;
  return Math.min(Number(cursor), 1_000_000);
}

export async function searchSmallBodies(query: string, kind: SmallBodyKind, cursor: string | null, pageSize = PAGE_SIZE) {
  const term = query.trim().slice(0, 80);
  if (term) {
    const payload = await requestJpl(getSearchUrl(SBDB_OBJECT_ENDPOINT, { sstr: term, 'alt-des': '1', 'phys-par': '1' }));
    const unique = itemFromObjectPayload(payload, kind);
    if (unique) return { items: [unique], hasMore: false, nextCursor: null, countEstimate: 1 };

    const matches = Array.isArray(payload.list) ? payload.list : [];
    const items = matches.map((value) => itemFromQueryRow(asRecord(value) ?? {}, kind)).filter((item): item is CatalogSearchItem => Boolean(item));
    return { items, hasMore: false, nextCursor: null, countEstimate: items.length };
  }

  const offset = safeOffset(cursor);
  const url = getSearchUrl(SBDB_QUERY_ENDPOINT, {
    fields: QUERY_FIELDS,
    limit: String(pageSize + 1),
    'limit-from': String(offset),
    'sb-kind': kind === 'comet' ? 'c' : 'a',
    sort: 'full_name',
  });
  const payload = await requestJpl(url);
  const rows = rowsFromQueryPayload(payload);
  const pageRows = rows.slice(0, pageSize);
  const hasExtraRow = rows.length > pageSize;
  const items = pageRows.map((row) => itemFromQueryRow(row, kind)).filter((item): item is CatalogSearchItem => Boolean(item));
  const count = readNumber(payload.count);
  const nextOffset = offset + pageRows.length;
  const hasMore = count === null ? hasExtraRow : nextOffset < count;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? String(nextOffset) : null,
    countEstimate: count,
  };
}

export async function getSmallBodyByIdentifier(identifier: string, expectedKind: SmallBodyKind): Promise<CatalogSearchItem | null> {
  const term = identifier.trim().slice(0, 100);
  if (!term) return null;
  const lookup: Record<string, string> = /^\d{6,}$/.test(term)
    ? { spk: term }
    : { sstr: term };
  const payload = await requestJpl(getSearchUrl(SBDB_OBJECT_ENDPOINT, {
    ...lookup,
    'alt-des': '1',
    'phys-par': '1',
    'full-prec': '1',
  }));
  return itemFromObjectPayload(payload, expectedKind);
}
