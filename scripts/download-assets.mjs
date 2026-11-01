import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDirectory = join(process.cwd(), 'public', 'textures');
const baseUrl = 'https://play.solarsystemscope.com/textures/download/';
const assets = [
  '2k_sun.jpg',
  '2k_mercury.jpg',
  '2k_venus_surface.jpg',
  '2k_earth_daymap.jpg',
  '2k_earth_clouds.jpg',
  '2k_mars.jpg',
  '2k_jupiter.jpg',
  '2k_saturn.jpg',
  '2k_saturn_ring_alpha.png',
  '2k_uranus.jpg',
  '2k_neptune.jpg',
];

await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  const destination = join(outputDirectory, asset);
  const response = await fetch(new URL(asset, baseUrl), { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) {
    throw new Error(`Не удалось скачать ${asset}: HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image/')) {
    throw new Error(`Источник вернул не изображение для ${asset}: ${contentType || 'content-type отсутствует'}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) {
    throw new Error(`Файл ${asset} выглядит неполным (${bytes.length} bytes)`);
  }
  await writeFile(destination, bytes);
  process.stdout.write(`✓ ${asset} (${(bytes.length / 1024).toFixed(0)} KB)\n`);
}

process.stdout.write('\nТекстуры установлены. Источник и лицензия: public/textures/README.md\n');
