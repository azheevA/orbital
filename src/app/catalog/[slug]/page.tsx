import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SPACE_OBJECTS, SPACE_OBJECT_BY_SLUG } from '@/entities/space-object';
import { CatalogObjectDetail } from '@/widgets/object-catalog';
import { SiteHeader } from '@/widgets/site-header';

interface ObjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SPACE_OBJECTS.map((object) => ({ slug: object.slug }));
}

export async function generateMetadata({ params }: ObjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const object = SPACE_OBJECT_BY_SLUG[slug];
  if (!object) return { title: 'Объект не найден — ORBITAL' };
  return {
    title: `${object.name} — ORBITAL`,
    description: object.summary,
  };
}

export default async function CatalogObjectPage({ params }: ObjectPageProps) {
  const { slug } = await params;
  const object = SPACE_OBJECT_BY_SLUG[slug];
  if (!object) notFound();

  return (
    <main className="app-shell object-page-shell">
      <SiteHeader currentPage="catalog" />
      <CatalogObjectDetail object={object} />
      <footer className="footer"><a className="brand" href="/"><span className="brand-glyph"><i /><i /><i /></span><span>ORBITAL</span></a><span>EXPLORE · UNDERSTAND · DISCOVER</span><span>© 2026 ORBITAL EXPLORER</span></footer>
    </main>
  );
}
