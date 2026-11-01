interface TapColumn {
  name?: string;
  ID?: string;
}

type TapRow = Record<string, unknown>;

export function parseTapRows(payload: unknown): TapRow[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((row): TapRow[] =>
      row && typeof row === 'object' && !Array.isArray(row) ? [row as TapRow] : [],
    );
  }
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as { metadata?: unknown; data?: unknown; error?: unknown };
  if (!Array.isArray(record.data)) {
    const error = typeof record.error === 'string' ? record.error : 'TAP service returned an unexpected payload.';
    throw new Error(error);
  }

  const columns = Array.isArray(record.metadata)
    ? record.metadata.map((column) => {
        if (!column || typeof column !== 'object') return '';
        const item = column as TapColumn;
        return item.name ?? item.ID ?? '';
      })
    : [];

  return record.data.flatMap((row): TapRow[] => {
    if (Array.isArray(row)) {
      const entries: [string, unknown][] = columns.flatMap((column, index) =>
        column ? [[column, row[index]] as [string, unknown]] : [],
      );
      return [Object.fromEntries(entries)];
    }
    return row && typeof row === 'object' ? [row as TapRow] : [];
  });
}

export async function fetchTapJson(endpoint: string, query: string, revalidate = 21_600): Promise<unknown> {
  const url = new URL(endpoint);
  url.searchParams.set('request', 'doQuery');
  url.searchParams.set('lang', 'adql');
  url.searchParams.set('format', 'json');
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Астрономический TAP-сервис вернул HTTP ${response.status}.`);
  }

  return response.json();
}

export function sqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

export function readText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatNumber(value: number | null, maximumFractionDigits = 3): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits }).format(value);
}
