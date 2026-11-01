import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./solar-system-scene.tsx', import.meta.url), 'utf8');

describe('SolarSystemScene DOM lifecycle', () => {
  it('renders in-canvas labels without Drei Html portals', () => {
    expect(source).toContain('Text');
    expect(source).not.toMatch(/<Html\b/);
    expect(source).not.toMatch(/\bHtml\s*,/);
  });
});
