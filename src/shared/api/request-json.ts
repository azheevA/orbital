export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`Сервер вернул некорректный JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? String(payload.error)
      : `Запрос завершился с HTTP ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}
