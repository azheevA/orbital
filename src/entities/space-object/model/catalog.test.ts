import { describe, expect, it } from 'vitest';
import { SPACE_OBJECTS, SPACE_OBJECT_BY_SLUG } from './catalog';

const VALID_CATEGORIES = ['star', 'planet', 'dwarf-planet', 'moon', 'exoplanet', 'galaxy'];

describe('space object catalog', () => {
  it('contains unique slugs and complete scientific summaries', () => {
    const slugs = SPACE_OBJECTS.map((object) => object.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const object of SPACE_OBJECTS) {
      expect(object.name.length).toBeGreaterThan(1);
      expect(object.description.length).toBeGreaterThan(80);
      expect(object.stats.length).toBeGreaterThanOrEqual(3);
      expect(object.facts.length).toBeGreaterThanOrEqual(2);
      expect(object.sourceUrl).toMatch(/^https:\/\//);
      expect(VALID_CATEGORIES).toContain(object.category);
    }
  });

  it('resolves every object by its route slug', () => {
    for (const object of SPACE_OBJECTS) {
      expect(SPACE_OBJECT_BY_SLUG[object.slug]).toBe(object);
    }
  });

  it('includes all eight planets, the Sun, and selected research targets', () => {
    const slugs = new Set(SPACE_OBJECTS.map((object) => object.slug));
    expect(['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].every((slug) => slugs.has(slug))).toBe(true);
    expect(['europa', 'titan', 'enceladus', 'proxima-centauri-b', 'andromeda'].every((slug) => slugs.has(slug))).toBe(true);
  });
});
