"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { SpaceObject } from '@/entities/space-object';
import { useCatalogMedia } from '@/features/catalog-media';

export function CatalogObjectDetail({ object }: { object: SpaceObject }) {
  const { data: mediaData, isPending: isMediaLoading, isError: isMediaError } = useCatalogMedia([object.slug]);
  const images = mediaData?.bySlug[object.slug]?.images ?? [];
  const heroImage = images[0];

  return (
    <section className="catalog-detail-page">
      <div className="detail-breadcrumb"><Link href="/catalog">← ВЕРНУТЬСЯ В КАТАЛОГ</Link><span> / {object.categoryLabel.toUpperCase()}</span></div>
      <section className="object-detail-hero">
        <div className={`object-detail-visual art-${object.art}`} aria-label={`Изображение: ${object.name}`}>
          <div className="detail-orbit detail-orbit-one" />
          <div className="detail-orbit detail-orbit-two" />
          {heroImage ? (
            <>
              <Image className="object-detail-photo" src={heroImage.thumbnailUrl} alt={`${object.name}: ${heroImage.title}`} fill sizes="(max-width: 820px) 100vw, 50vw" unoptimized priority />
              <span className="detail-photo-credit">NASA · {heroImage.center ?? 'IMAGE LIBRARY'}</span>
              <span className="detail-photo-kind">{heroImage.kind === 'concept' ? 'ХУДОЖЕСТВЕННАЯ ВИЗУАЛИЗАЦИЯ' : 'ИЗОБРАЖЕНИЕ ИЗ АРХИВА'}</span>
            </>
          ) : (
            <>
              <div className="object-orb" />
              {isMediaLoading ? (
                <span className="detail-photo-loading">ЗАПРОС К АРХИВУ NASA…</span>
              ) : (
                <span className="detail-photo-kind detail-photo-fallback">{isMediaError ? 'АРХИВ NASA НЕДОСТУПЕН · ИЛЛЮСТРАЦИЯ' : 'НЕТ ПОДХОДЯЩЕГО СНИМКА · ИЛЛЮСТРАЦИЯ'}</span>
              )}
            </>
          )}
          <span className="detail-visual-coordinates">ORBITAL ARCHIVE / {object.slug.toUpperCase()}</span>
        </div>
        <div className="object-detail-copy">
          <p className="eyebrow"><span /> {object.categoryLabel.toUpperCase()} / {object.system.toUpperCase()}</p>
          <h1>{object.name}</h1>
          <p className="object-detail-english">{object.englishName}</p>
          <p className="object-detail-summary">{object.summary}</p>
          <div className="object-detail-tags"><span>{object.categoryLabel}</span><span>{object.system}</span><span>SCIENTIFIC DOSSIER</span></div>
        </div>
      </section>

      {images.length > 1 && (
        <section className="object-media-gallery" aria-label={`Фотографии объекта ${object.name}`}>
          <div className="object-media-gallery-heading">
            <div><p className="eyebrow">NASA IMAGE AND VIDEO LIBRARY</p><h2>Снимки и наблюдения</h2></div>
            <span>{images.length.toString().padStart(2, '0')} МАТЕРИАЛА</span>
          </div>
          <div className="object-media-grid">
            {images.slice(1, 4).map((image) => (
              <a className="object-media-item" href={image.sourceUrl} target="_blank" rel="noreferrer" key={image.nasaId}>
                <div className="object-media-image">
                  <Image src={image.thumbnailUrl} alt={image.title} fill sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 33vw" unoptimized />
                  <span>{image.kind === 'concept' ? 'CONCEPT' : 'NASA IMAGE'}</span>
                </div>
                <div className="object-media-caption"><strong>{image.title}</strong><small>{[image.center, image.dateCreated?.slice(0, 10)].filter(Boolean).join(' · ') || 'NASA IMAGE LIBRARY'}</small></div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="object-detail-grid">
        <article className="object-detail-card object-detail-overview">
          <p className="eyebrow">01 / OVERVIEW</p>
          <h2>Об объекте</h2>
          <p>{object.description}</p>
          <h3>Научная значимость</h3>
          <p>{object.significance}</p>
        </article>
        <article className="object-detail-card">
          <p className="eyebrow">02 / PARAMETERS</p>
          <h2>Ключевые параметры</h2>
          <div className="detail-stats-grid">
            {object.stats.map((stat) => <div key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong></div>)}
          </div>
          <div className="detail-composition"><small>СОСТАВ И СТРОЕНИЕ</small><p>{object.composition}</p></div>
        </article>
      </section>

      <section className="object-detail-card object-facts-section">
        <div><p className="eyebrow">03 / FIELD NOTES</p><h2>Что важно знать</h2></div>
        <div className="object-facts-list">
          {object.facts.map((fact, index) => <div key={fact}><span>{String(index + 1).padStart(2, '0')}</span><p>{fact}</p></div>)}
        </div>
      </section>

      <div className="object-source-row">
        <div><span className="source-indicator is-live" /><span>СПРАВОЧНАЯ ИНФОРМАЦИЯ / {object.sourceLabel.toUpperCase()}</span></div>
        <a href={object.sourceUrl} target="_blank" rel="noreferrer">ОТКРЫТЬ ПЕРВОИСТОЧНИК ↗</a>
      </div>
      {heroImage && <p className="object-image-attribution">Изображение: {heroImage.title}. {heroImage.photographer ? `Автор: ${heroImage.photographer}. ` : ''}Источник: NASA Image and Video Library. <a href={heroImage.sourceUrl} target="_blank" rel="noreferrer">Карточка оригинала ↗</a></p>}
      <div className="detail-next-link"><Link href="/catalog">ИССЛЕДОВАТЬ ДРУГИЕ ОБЪЕКТЫ <span>↗</span></Link></div>
    </section>
  );
}
