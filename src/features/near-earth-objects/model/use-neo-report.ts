import { useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api';

export interface NearEarthObjectSummary {
  id: string;
  name: string;
  hazardous: boolean;
  diameterMeters: number;
  missDistanceKm: number | null;
}

export interface NearEarthObjectReport {
  date: string;
  count: number;
  hazardousCount: number;
  objects: NearEarthObjectSummary[];
}

async function fetchNeoReport(): Promise<NearEarthObjectReport> {
  return requestJson<NearEarthObjectReport>('/api/astronomy/neo');
}

export function useNearEarthObjectReport() {
  return useQuery({
    queryKey: ['nasa-neos-today'],
    queryFn: fetchNeoReport,
    staleTime: 6 * 60 * 60 * 1000,
  });
}
