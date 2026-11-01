import Image from 'next/image';
import Link from 'next/link';
import { SPACE_OBJECT_BY_SLUG } from '@/entities/space-object';
import { useCatalogMedia } from '@/features/catalog-media';

const FEATURED = ['europa', 'titan', 'kepler-186f'] as const;

export function FeaturedObjects() {
  const { data: mediaData } = useCatalogMedia(FEATURED);

  return (
    <div className="target-grid">
      {FEATURED.map((slug) => {
        const object = SPACE_OBJECT_BY_SLUG[slug];
        return (
          <Link className="target-card" href={`/catalog/${object.slug}`} key={object.slug}>
            <div className={`target-globe art-${object.art}`}>
              {mediaData?.bySlug[object.slug]?.images[0] ? (
                <Image className="target-real-photo" src={mediaData.bySlug[object.slug].images[0].thumbnailUrl} alt={object.name} fill sizes="180px" unoptimized />
              ) : <div className="object-orb" />}
            </div>
            <span>{object.system.toUpperCase()} / {object.categoryLabel.toUpperCase()}</span>
            <h3>{object.name}</h3>
            <p>{object.summary}</p>
            <b className="target-card-arrow">ОТКРЫТЬ ДОСЬЕ ↗</b>
          </Link>
        );
      })}
    </div>
  );
}
