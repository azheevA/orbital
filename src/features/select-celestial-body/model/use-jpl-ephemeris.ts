import { useQuery } from '@tanstack/react-query';
import type { CelestialBodyId, JplEphemeris } from '@/entities/celestial-body';
import { requestJson } from '@/shared/api';

async function fetchEphemeris(bodyId: CelestialBodyId): Promise<JplEphemeris> {
  return requestJson<JplEphemeris>(`/api/astronomy/ephemeris?body=${bodyId}`);
}

export function useJplEphemeris(bodyId: CelestialBodyId, enabled = true) {
  return useQuery({
    queryKey: ['jpl-ephemeris', bodyId],
    enabled,
    queryFn: () => fetchEphemeris(bodyId),
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });
}
