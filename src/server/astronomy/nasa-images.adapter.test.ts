import { describe, expect, it } from 'vitest';
import { classifyNasaImageKind, normalizeNasaImages } from './nasa-images.adapter';

const imageItem = (overrides: Record<string, unknown> = {}) => ({
  data: [{
    nasa_id: 'PIA00001',
    title: 'Jupiter cloud bands from Juno',
    description: 'An image of Jupiter captured by the Juno spacecraft.',
    date_created: '2024-01-12T10:00:00Z',
    center: 'JPL',
    photographer: 'NASA/JPL-Caltech',
  }],
  links: [{ href: 'https://images-assets.nasa.gov/image/PIA00001/PIA00001~thumb.jpg', rel: 'preview' }],
  ...overrides,
});

const payload = (items: unknown[]) => ({ collection: { items } });

describe('classifyNasaImageKind', () => {
  it.each([
    "Artist's impression of an exoplanet",
    'Artist rendering of a Saturn storm',
    'Illustration of a distant galaxy',
    'Computer-generated model of an asteroid',
    'Infographic about Jupiter',
  ])('marks visualizations as concepts: %s', (title) => {
    expect(classifyNasaImageKind(title, '', 'planet')).toBe('concept');
  });

  it('always marks exoplanet imagery as conceptual', () => {
    expect(classifyNasaImageKind('Proxima Centauri b observation', 'Direct telescope data', 'exoplanet')).toBe('concept');
  });

  it('keeps mission photographs classified as photos', () => {
    expect(classifyNasaImageKind('Jupiter cloud bands from Juno', 'Raw camera image from the spacecraft', 'planet')).toBe('photo');
  });
});

describe('normalizeNasaImages', () => {
  it('normalizes NASA preview links and attribution metadata', () => {
    const [image] = normalizeNasaImages(payload([imageItem()]), 'planet');
    expect(image).toMatchObject({
      nasaId: 'PIA00001',
      title: 'Jupiter cloud bands from Juno',
      center: 'JPL',
      photographer: 'NASA/JPL-Caltech',
      kind: 'photo',
      thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA00001/PIA00001~thumb.jpg',
    });
    expect(image?.sourceUrl).toContain('/details/PIA00001');
  });

  it('marks exoplanet results as concepts instead of claiming direct photographs', () => {
    const images = normalizeNasaImages(payload([imageItem()]), 'exoplanet');
    expect(images[0]?.kind).toBe('concept');
  });

  it('detects artist concepts and scientific renderings from metadata', () => {
    const concept = imageItem({
      data: [{ nasa_id: 'PIA00002', title: "Artist's concept of a distant planet", description: 'Illustration of a planetary system.' }],
    });
    const images = normalizeNasaImages(payload([concept]), 'planet');
    expect(images[0]?.kind).toBe('concept');
  });

  it('rejects non-NASA image hosts and de-duplicates nasa ids', () => {
    const unsafe = imageItem({ links: [{ href: 'https://example.com/fake.jpg', rel: 'preview' }] });
    const images = normalizeNasaImages(payload([unsafe, imageItem(), imageItem()]), 'planet');
    expect(images).toHaveLength(1);
    expect(images[0]?.nasaId).toBe('PIA00001');
  });

  it('returns an empty list for invalid or empty API responses', () => {
    expect(normalizeNasaImages({ collection: { items: [] } }, 'moon')).toEqual([]);
    expect(normalizeNasaImages({ invalid: true }, 'moon')).toEqual([]);
  });
});
