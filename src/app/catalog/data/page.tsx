import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getScientificCatalogObject } from '@/server/astronomy/catalog.service';
import { CatalogDataDetail } from '@/widgets/object-catalog';
import { SiteHeader } from '@/widgets/site-header';

export const metadata: Metadata = {
  title: 'Научное досье — ORBITAL',
  description: 'Данные научных астрономических каталогов NASA, JPL и CDS SIMBAD.',
};

interface CatalogDataPageProps {
  searchParams: Promise<{ source?: string; id?: string; group?: string }>;
}

const paramsSchema = z.object({
  source: z.enum(['exoplanets', 'asteroids', 'comets', 'simbad']),
  id: z.string().min(1).max(120),
  group: z.enum(['stars', 'galaxies', 'nebulae', 'clusters']).default('galaxies'),
});

export default async function CatalogDataPage({ searchParams }: CatalogDataPageProps) {
  const raw = await searchParams;
  const parsed = paramsSchema.safeParse({
    source: raw.source,
    id: raw.id,
    group: raw.group ?? 'galaxies',
  });
  if (!parsed.success) notFound();

  const object = await getScientificCatalogObject(parsed.data.source, parsed.data.id, parsed.data.group);
  if (!object) notFound();

  return (
    <main className="app-shell object-page-shell">
      <SiteHeader currentPage="catalog" />
      <CatalogDataDetail object={object} />
      <footer className="footer"><a className="brand" href="/"><span className="brand-glyph"><i /><i /><i /></span><span>ORBITAL</span></a><span>EXPLORE · UNDERSTAND · DISCOVER</span><span>© 2026 ORBITAL EXPLORER</span></footer>
    </main>
  );
}
