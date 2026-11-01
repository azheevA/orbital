"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SPACE_OBJECTS } from '@/entities/space-object';
import type { CatalogSearchPage, CatalogSearchSource, SimbadObjectGroup, SpaceObjectCategory } from '@/entities/space-object';
import { useCatalogMedia } from '@/features/catalog-media';

const SOURCES: { id: 'featured' | CatalogSearchSource; label: string; eyebrow: string }[] = [
  { id: 'featured', label: 'Избранное', eyebrow: 'ORBITAL CURATED' },
  { id: 'exoplanets', label: 'Экзопланеты', eyebrow: 'NASA EXOPLANET ARCHIVE' },
  { id: 'asteroids', label: 'Астероиды', eyebrow: 'JPL SMALL-BODY DATABASE' },
  { id: 'comets', label: 'Кометы', eyebrow: 'JPL SMALL-BODY DATABASE' },
  { id: 'simbad', label: 'Глубокий космос', eyebrow: 'CDS SIMBAD' },
];

const FILTERS: { id: 'all' | SpaceObjectCategory; label: string }[] = [
  { id: 'all', label: 'Все объекты' },
  { id: 'star', label: 'Звёзды' },
  { id: 'planet', label: 'Планеты' },
  { id: 'dwarf-planet', label: 'Карликовые' },
  { id: 'moon', label: 'Спутники' },
  { id: 'exoplanet', label: 'Экзопланеты' },
  { id: 'galaxy', label: 'Галактики' },
];

const SIMBAD_GROUPS: { id: SimbadObjectGroup; label: string }[] = [
  { id: 'stars', label: 'Звёзды' },
  { id: 'galaxies', label: 'Галактики' },
  { id: 'nebulae', label: 'Туманности' },
  { id: 'clusters', label: 'Скопления' },
];

async function fetchCatalogPage(source: CatalogSearchSource, query: string, cursor: string | null, group: SimbadObjectGroup): Promise<CatalogSearchPage> {
  const params = new URLSearchParams({ source, q: query, limit: '18' });
  if (cursor) params.set('cursor', cursor);
  if (source === 'simbad') params.set('group', group);

  const response = await fetch(`/api/catalog/search?${params.toString()}`);
  const payload = await response.json() as CatalogSearchPage | { error?: string };
  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Не удалось загрузить научный каталог.');
  }
  return payload as CatalogSearchPage;
}

function getArtworkCategory(category: SpaceObjectCategory): string {
  if (category === 'asteroid' || category === 'comet') return 'small-body';
  if (category === 'nebula' || category === 'cluster' || category === 'quasar') return 'deep-space';
  return category;
}

export function CatalogExplorer() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<(typeof SOURCES)[number]['id']>('featured');
  const [category, setCategory] = useState<(typeof FILTERS)[number]['id']>('all');
  const [simbadGroup, setSimbadGroup] = useState<SimbadObjectGroup>('galaxies');
  const deferredQuery = useDeferredValue(query.trim());
  const { data: mediaData, isPending: isMediaLoading, isError: isMediaError } = useCatalogMedia(undefined, source === 'featured');

  const externalCatalog = useInfiniteQuery({
    queryKey: ['scientific-catalog', source, deferredQuery, simbadGroup],
    queryFn: ({ pageParam }) => fetchCatalogPage(source as CatalogSearchSource, deferredQuery, pageParam, simbadGroup),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: source !== 'featured',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const filteredObjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    return SPACE_OBJECTS.filter((object) => {
      const matchesCategory = category === 'all' || object.category === category;
      const searchIndex = `${object.name} ${object.englishName} ${object.system} ${object.summary} ${object.categoryLabel}`.toLocaleLowerCase('ru-RU');
      return matchesCategory && (!normalizedQuery || searchIndex.includes(normalizedQuery));
    });
  }, [category, query]);

  const externalItems = externalCatalog.data?.pages.flatMap((page) => page.items) ?? [];
  const activeSource = SOURCES.find((item) => item.id === source) ?? SOURCES[0];
  const externalCount = externalCatalog.data?.pages[0]?.countEstimate;

  return (
    <section className="catalog-content" aria-label="Каталог небесных объектов">
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={source === 'featured' ? 'Поиск по названию или системе…' : 'Поиск в научной базе…'} aria-label="Поиск небесных объектов" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
        </label>
        <span className="catalog-count">
          {source === 'featured' ? <><strong>{filteredObjects.length.toString().padStart(2, '0')}</strong> / {SPACE_OBJECTS.length.toString().padStart(2, '0')} ОБЪЕКТОВ</> : <><strong>{externalItems.length.toString().padStart(2, '0')}</strong>{externalCount ? ` / ${externalCount.toLocaleString('ru-RU')}` : ''} ЗАГРУЖЕНО</>}
        </span>
      </div>

      <div className="catalog-source-tabs" role="tablist" aria-label="Научный источник">
        {SOURCES.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={source === item.id} className={source === item.id ? 'catalog-source-tab active' : 'catalog-source-tab'} onClick={() => { setSource(item.id); setCategory('all'); }}>
            <small>{item.eyebrow}</small><span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="catalog-media-source"><span className="source-indicator is-archive" /> НАУЧНЫЕ ПАРАМЕТРЫ: NASA / JPL / CDS SIMBAD · ИЗОБРАЖЕНИЯ: NASA IMAGE AND VIDEO LIBRARY · РЕЗЕРВ: ПРОЦЕДУРНАЯ ИЛЛЮСТРАЦИЯ</div>

      {source === 'featured' ? (
        <>
          <div className="catalog-filters" role="group" aria-label="Фильтр по типу объекта">
            {FILTERS.map((filter) => (
              <button key={filter.id} type="button" className={category === filter.id ? 'catalog-filter active' : 'catalog-filter'} onClick={() => setCategory(filter.id)} aria-pressed={category === filter.id}>
                {filter.label}
              </button>
            ))}
          </div>
          {filteredObjects.length ? (
            <div className="catalog-grid">
              {filteredObjects.map((object, index) => {
                const image = mediaData?.bySlug[object.slug]?.images[0];
                return (
                  <Link className="catalog-card" href={`/catalog/${object.slug}`} key={object.slug}>
                    <div className={`catalog-card-visual art-${object.art}`}>
                      <span className="catalog-card-index">OBJ / {String(index + 1).padStart(2, '0')}</span>
                      {image ? (
                        <>
                          <Image className="catalog-photo" src={image.thumbnailUrl} alt={`${object.name}: ${image.title}`} fill sizes="(max-width: 560px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized />
                          <span className="catalog-photo-credit">NASA ARCHIVE · {image.kind === 'concept' ? 'CONCEPT' : 'IMAGE'}</span>
                        </>
                      ) : (
                        <>
                          <div className="object-orb" />
                          <span className="catalog-photo-credit catalog-photo-fallback">{isMediaLoading ? 'NASA IMAGE SEARCH' : isMediaError ? 'NASA ARCHIVE OFFLINE · ARTWORK' : 'NO MATCHING NASA IMAGE · ARTWORK'}</span>
                        </>
                      )}
                      <span className="catalog-card-open">↗</span>
                      <span className="catalog-card-distance">{object.englishName.toUpperCase()}</span>
                    </div>
                    <div className="catalog-card-copy">
                      <div className="catalog-card-meta"><span>{object.categoryLabel}</span><span>{object.system}</span></div>
                      <h2>{object.name}</h2>
                      <p>{object.summary}</p>
                      <span className="catalog-card-link">ОТКРЫТЬ ДОСЬЕ <b>↗</b></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : <EmptyState onReset={() => { setQuery(''); setCategory('all'); }} />}
        </>
      ) : (
        <>
          {source === 'simbad' && (
            <div className="catalog-filters" role="group" aria-label="Тип объектов SIMBAD">
              {SIMBAD_GROUPS.map((group) => (
                <button key={group.id} type="button" className={simbadGroup === group.id ? 'catalog-filter active' : 'catalog-filter'} onClick={() => setSimbadGroup(group.id)} aria-pressed={simbadGroup === group.id}>{group.label}</button>
              ))}
            </div>
          )}

          <div className="catalog-live-heading">
            <div><span className="live-dot" /><strong>{activeSource.eyebrow}</strong><p>{source === 'exoplanets' ? 'Подтверждённые экзопланеты и параметры их звёзд-хозяев.' : source === 'asteroids' ? 'Орбиты, размеры, классификация и сближения с Землёй.' : source === 'comets' ? 'Кометы, периоды обращения и доступные физические параметры.' : `Записи SIMBAD: ${SIMBAD_GROUPS.find((item) => item.id === simbadGroup)?.label.toLowerCase()}.`}</p></div>
            <span>SCIENTIFIC ARCHIVE</span>
          </div>

          {externalCatalog.isPending ? (
            <div className="catalog-loading"><span className="catalog-loader" /><strong>СВЯЗЬ С НАУЧНЫМ АРХИВОМ</strong><p>Запрашиваем записи научного архива и связанные изображения NASA…</p></div>
          ) : externalCatalog.isError ? (
            <div className="catalog-error"><span>!</span><h2>Архив временно недоступен</h2><p>{externalCatalog.error.message}</p><button type="button" onClick={() => void externalCatalog.refetch()}>ПОВТОРИТЬ ЗАПРОС</button></div>
          ) : externalItems.length ? (
            <>
              <div className="catalog-grid">
                {externalItems.map((object, index) => {
                  const href = `/catalog/data?source=${object.source}&id=${encodeURIComponent(object.id)}${object.source === 'simbad' ? `&group=${simbadGroup}` : ''}`;
                  return (
                    <Link className="catalog-card" href={href} key={`${object.source}:${object.id}`}>
                      <div className={`catalog-card-visual catalog-external-art art-${getArtworkCategory(object.category)}`}>
                        <span className="catalog-card-index">{object.source.toUpperCase()} / {String(index + 1).padStart(2, '0')}</span>
                        {object.image ? (
                          <>
                            <Image className="catalog-photo" src={object.image.thumbnailUrl} alt={`${object.name}: ${object.image.title}`} fill sizes="(max-width: 560px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized />
                            <span className="catalog-photo-credit">NASA · {object.image.kind === 'concept' ? 'CONCEPT' : 'IMAGE'}</span>
                          </>
                        ) : (
                          <>
                            <div className="object-orb" data-category={getArtworkCategory(object.category)} />
                            <span className="catalog-photo-credit catalog-photo-fallback">{object.sourceName.toUpperCase()} · NO IMAGE</span>
                          </>
                        )}
                        <span className="catalog-card-open">↗</span>
                        <span className="catalog-card-distance">{object.objectType?.toUpperCase() ?? object.englishName.toUpperCase()}</span>
                      </div>
                      <div className="catalog-card-copy">
                        <div className="catalog-card-meta"><span>{object.categoryLabel}</span><span>{object.system}</span></div>
                        <h2>{object.name}</h2>
                        <p>{object.summary}</p>
                        <span className="catalog-card-link">НАУЧНОЕ ДОСЬЕ <b>↗</b></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {externalCatalog.hasNextPage && <button className="catalog-load-more" type="button" onClick={() => void externalCatalog.fetchNextPage()} disabled={externalCatalog.isFetchingNextPage}>{externalCatalog.isFetchingNextPage ? 'ЗАГРУЖАЕМ…' : 'ЗАГРУЗИТЬ ЕЩЁ ОБЪЕКТЫ'} <span>↓</span></button>}
              <div className="catalog-live-footnote">Параметры показаны в единицах исходного каталога. Значения, которых нет в записи, не вычисляются и не подставляются автоматически. Получено: {new Date(externalCatalog.data?.pages[0]?.fetchedAt ?? Date.now()).toLocaleString('ru-RU')}; кэш источника — до 6 часов.</div>
            </>
          ) : (
            <EmptyState onReset={() => setQuery('')} text={deferredQuery ? 'Совпадений нет. Попробуй другое обозначение или название.' : 'В этом разделе сейчас нет доступных записей.'} />
          )}
        </>
      )}
    </section>
  );
}

function EmptyState({ onReset, text = 'Измени запрос или выбери другую категорию.' }: { onReset: () => void; text?: string }) {
  return <div className="catalog-empty"><span>∅</span><h2>Объекты не найдены</h2><p>{text}</p><button type="button" onClick={onReset}>СБРОСИТЬ ФИЛЬТРЫ</button></div>;
}
