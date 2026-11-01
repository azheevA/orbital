import Image from 'next/image';
import Link from 'next/link';
import type { CatalogSearchItem, SpaceObjectImage, SpaceObjectStat } from '@/entities/space-object';

export function CatalogDataDetail({ object }: { object: CatalogSearchItem }) {
  const images = object.images?.length ? object.images : object.image ? [object.image] : [];
  const heroImage = images[0];

  return (
    <section className="catalog-detail-page catalog-data-detail">
      <div className="detail-breadcrumb"><Link href="/catalog">← ВЕРНУТЬСЯ В КАТАЛОГ</Link><span> / {object.categoryLabel.toUpperCase()}</span></div>
      <section className="object-detail-hero">
        <div className={`object-detail-visual catalog-external-art art-${object.category}`}>
          {heroImage ? (
            <>
              <Image className="object-detail-photo" src={heroImage.thumbnailUrl} alt={`${object.name}: ${heroImage.title}`} fill sizes="(max-width: 820px) 100vw, 50vw" unoptimized priority />
              <span className="detail-photo-credit">NASA · {heroImage.center ?? 'IMAGE LIBRARY'}</span>
              <span className="detail-photo-kind">{heroImage.kind === 'concept' ? 'ХУДОЖЕСТВЕННАЯ ВИЗУАЛИЗАЦИЯ' : 'ИЗОБРАЖЕНИЕ ИЗ АРХИВА'}</span>
            </>
          ) : (
            <>
              <div className="object-orb" data-category={object.category} />
              <span className="detail-photo-kind detail-photo-fallback">НЕТ ПОДХОДЯЩЕГО СНИМКА · ИЛЛЮСТРАЦИЯ</span>
            </>
          )}
          <span className="detail-visual-coordinates">SCIENTIFIC ARCHIVE / {object.source.toUpperCase()}</span>
        </div>
        <div className="object-detail-copy">
          <p className="eyebrow"><span /> {object.categoryLabel.toUpperCase()} / {object.sourceName.toUpperCase()}</p>
          <h1>{object.name}</h1>
          <p className="object-detail-english">{object.englishName}</p>
          <p className="object-detail-summary">{object.summary}</p>
          <div className="object-detail-tags"><span>{object.categoryLabel}</span><span>{object.system}</span><span>SCIENTIFIC ARCHIVE RECORD</span></div>
        </div>
      </section>

      <section className="object-detail-grid">
        <article className="object-detail-card object-detail-overview">
          <p className="eyebrow">01 / SCIENTIFIC RECORD</p>
          <h2>Об объекте</h2>
          <p>{object.description}</p>
          {object.objectType && <div className="detail-composition"><small>ТИП В КАТАЛОГЕ ИСТОЧНИКА</small><p>{object.objectType}</p></div>}
        </article>
        <article className="object-detail-card">
          <p className="eyebrow">02 / MEASUREMENTS</p>
          <h2>Измеренные параметры</h2>
          {object.stats.length ? (
            <div className="detail-stats-grid">{object.stats.map((stat: SpaceObjectStat) => <div key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong></div>)}</div>
          ) : <p>Для этой записи выбранный набор измеренных параметров недоступен.</p>}
        </article>
      </section>

      <div className="object-source-row">
        <div><span className="source-indicator is-archive" /><span>ПЕРВОИСТОЧНИК / {object.sourceName.toUpperCase()}</span></div>
        <a href={object.sourceUrl} target="_blank" rel="noreferrer">ОТКРЫТЬ ЗАПИСЬ В АРХИВЕ ↗</a>
      </div>
      {images.length > 1 && (
        <section className="object-media-gallery" aria-label="Изображения объекта из архива NASA">
          <div className="object-media-gallery-heading">
            <div><p className="eyebrow">03 / NASA IMAGE ARCHIVE</p><h2>Изображения объекта</h2></div>
            <span>{images.length.toString().padStart(2, '0')} МАТЕРИАЛА</span>
          </div>
          <div className="object-media-grid">
            {images.map((image: SpaceObjectImage) => (
              <a className="object-media-item" href={image.sourceUrl} target="_blank" rel="noreferrer" key={image.nasaId}>
                <div className="object-media-image">
                  <Image src={image.thumbnailUrl} alt={`${object.name}: ${image.title}`} fill sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 33vw" unoptimized />
                  <span>{image.kind === 'concept' ? 'CONCEPT' : 'ARCHIVE IMAGE'}</span>
                </div>
                <div className="object-media-caption"><strong>{image.title}</strong><small>{image.center ?? 'NASA IMAGE AND VIDEO LIBRARY'}{image.dateCreated ? ` · ${image.dateCreated.slice(0, 10)}` : ''}</small></div>
              </a>
            ))}
          </div>
        </section>
      )}
      {heroImage && <p className="object-image-attribution">Изображение: {heroImage.title}. {heroImage.photographer ? `Автор: ${heroImage.photographer}. ` : ''}Источник: NASA Image and Video Library. <a href={heroImage.sourceUrl} target="_blank" rel="noreferrer">Карточка оригинала ↗</a></p>}
      <div className="catalog-live-footnote">Данные получены из внешней научной базы и могут кэшироваться до 6 часов. Орбитальные и физические параметры могут обновляться в первоисточнике; отсутствие значения не означает нулевое значение.</div>
      <div className="detail-next-link"><Link href="/catalog">ИССЛЕДОВАТЬ ДРУГИЕ ОБЪЕКТЫ <span>↗</span></Link></div>
    </section>
  );
}
