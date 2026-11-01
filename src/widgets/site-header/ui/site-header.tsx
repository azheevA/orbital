import Link from 'next/link';

interface SiteHeaderProps {
  currentPage?: 'home' | 'catalog';
}

export function SiteHeader({ currentPage = 'home' }: SiteHeaderProps) {
  const mobilePrimaryHref = currentPage === 'catalog' ? '/' : '/catalog';
  const mobilePrimaryLabel = currentPage === 'catalog' ? 'HOME' : 'CATALOG';

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="ORBITAL — главная">
        <span className="brand-glyph"><i /><i /><i /></span>
        <span>ORBITAL</span>
      </Link>
      <nav className="main-nav" aria-label="Основная навигация">
        <Link href="/" aria-current={currentPage === 'home' ? 'page' : undefined}>HOME</Link>
        <Link href="/#explorer">EXPLORER</Link>
        <Link href="/catalog" aria-current={currentPage === 'catalog' ? 'page' : undefined}>CATALOG</Link>
        <Link href="/#data">DATA CENTER</Link>
      </nav>
      <Link className="mobile-primary-link" href={mobilePrimaryHref}>{mobilePrimaryLabel} ↗</Link>
      <span className="system-status"><i /> СИСТЕМА АКТИВНА</span>
    </header>
  );
}
