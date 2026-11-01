import type { Metadata } from 'next';
import { CatalogExplorer } from '@/widgets/object-catalog';
import { SiteHeader } from '@/widgets/site-header';

export const metadata: Metadata = {
  title: 'Каталог объектов Вселенной — ORBITAL',
  description: 'Каталог объектов Вселенной с поиском по научным базам NASA Exoplanet Archive, JPL SBDB и CDS SIMBAD.',
};

export default function CatalogPage() {
  return (
    <main className="app-shell catalog-page-shell">
      <SiteHeader currentPage="catalog" />
      <section className="catalog-page-hero">
        <div>
          <p className="eyebrow"><span /> ORBITAL ARCHIVE / 02</p>
          <h1>Каталог<br /><span>Вселенной.</span></h1>
          <p className="catalog-page-description">От ближайшей звезды до далёких галактик. Выбирай объект, изучай характеристики и открывай научное досье.</p>
        </div>
        <div className="catalog-page-orbit-art" aria-hidden="true"><div className="catalog-page-orbit orbit-one" /><div className="catalog-page-orbit orbit-two" /><div className="catalog-page-sun" /><span>KNOWN UNIVERSE / INDEX</span></div>
        <div className="catalog-page-footerline"><span>STELLAR OBJECTS / PLANETARY SYSTEMS / DEEP SPACE</span><span>DATABASE / 001—019</span></div>
      </section>
      <CatalogExplorer />
      <footer className="footer"><a className="brand" href="/"><span className="brand-glyph"><i /><i /><i /></span><span>ORBITAL</span></a><span>EXPLORE · UNDERSTAND · DISCOVER</span><span>© 2026 ORBITAL EXPLORER</span></footer>
    </main>
  );
}
