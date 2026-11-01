"use client";

import { useQuery } from '@tanstack/react-query';
import type { SpaceObjectMediaResponse } from '@/entities/space-object';

async function requestCatalogMedia(slugs?: readonly string[]): Promise<SpaceObjectMediaResponse> {
  const query = slugs?.length ? `?slugs=${encodeURIComponent([...slugs].sort().join(','))}` : '';
  const response = await fetch(`/api/catalog/media${query}`);
  if (!response.ok) throw new Error('Не удалось получить изображения из архива NASA.');
  return response.json() as Promise<SpaceObjectMediaResponse>;
}

export function useCatalogMedia(slugs?: readonly string[], enabled = true) {
  const slugKey = slugs?.length ? [...slugs].sort().join(',') : 'all';

  return useQuery({
    queryKey: ['catalog-media', slugKey],
    queryFn: () => requestCatalogMedia(slugs),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
