import type { CelestialBody, CelestialBodyId } from '../model/types';

export const CELESTIAL_BODIES: readonly CelestialBody[] = [
  {
    id: 'mercury', name: 'Меркурий', englishName: 'Mercury', kind: 'terrestrial',
    description: 'Ближайшая к Солнцу планета. Почти лишена плотной атмосферы; поверхность переживает резкие перепады температуры.',
    meanDistanceLabel: '0,387 а.е.', orbitalPeriodLabel: '87,97 дня', radiusEarth: 0.383, sceneRadius: 0.18, color: '#aeb5c4', texture: '/textures/2k_mercury.jpg', jplCommand: '199',
    orbital: { semiMajorAxisAu: 0.3871, eccentricity: 0.2056, inclinationDeg: 7.005, longitudeAscendingNodeDeg: 48.331, argumentOfPeriapsisDeg: 29.125, meanAnomalyAtEpochDeg: 174.796, orbitalPeriodDays: 87.969 },
  },
  {
    id: 'venus', name: 'Венера', englishName: 'Venus', kind: 'terrestrial',
    description: 'Плотная атмосфера из углекислого газа создаёт экстремальный парниковый эффект. По температуре поверхности Венера горячее Меркурия.',
    meanDistanceLabel: '0,723 а.е.', orbitalPeriodLabel: '224,7 дня', radiusEarth: 0.949, sceneRadius: 0.27, color: '#d8a86d', texture: '/textures/2k_venus_surface.jpg', jplCommand: '299',
    orbital: { semiMajorAxisAu: 0.7233, eccentricity: 0.0068, inclinationDeg: 3.3947, longitudeAscendingNodeDeg: 76.68, argumentOfPeriapsisDeg: 54.884, meanAnomalyAtEpochDeg: 50.115, orbitalPeriodDays: 224.701 },
  },
  {
    id: 'earth', name: 'Земля', englishName: 'Earth', kind: 'terrestrial',
    description: 'Единственный известный мир с устойчивой жидкой водой на поверхности и подтверждённой жизнью. Атмосфера и магнитное поле защищают биосферу.',
    meanDistanceLabel: '1 а.е.', orbitalPeriodLabel: '365,256 дня', radiusEarth: 1, sceneRadius: 0.29, color: '#3f92e7', texture: '/textures/2k_earth_daymap.jpg', jplCommand: '399',
    orbital: { semiMajorAxisAu: 1.0000, eccentricity: 0.0167, inclinationDeg: 0.00005, longitudeAscendingNodeDeg: -11.26064, argumentOfPeriapsisDeg: 114.20783, meanAnomalyAtEpochDeg: 357.51716, orbitalPeriodDays: 365.256 },
  },
  {
    id: 'mars', name: 'Марс', englishName: 'Mars', kind: 'terrestrial',
    description: 'Холодный пустынный мир с древними речными долинами, полярными шапками и крупнейшим вулканом Солнечной системы — Олимпом.',
    meanDistanceLabel: '1,524 а.е.', orbitalPeriodLabel: '686,98 дня', radiusEarth: 0.532, sceneRadius: 0.23, color: '#d97853', texture: '/textures/2k_mars.jpg', jplCommand: '499',
    orbital: { semiMajorAxisAu: 1.5237, eccentricity: 0.0934, inclinationDeg: 1.850, longitudeAscendingNodeDeg: 49.558, argumentOfPeriapsisDeg: 286.502, meanAnomalyAtEpochDeg: 19.373, orbitalPeriodDays: 686.980 },
  },
  {
    id: 'jupiter', name: 'Юпитер', englishName: 'Jupiter', kind: 'gas-giant',
    description: 'Самая массивная планета системы. В её атмосфере бушуют гигантские штормы, а спутник Европа скрывает подлёдный океан.',
    meanDistanceLabel: '5,203 а.е.', orbitalPeriodLabel: '11,86 года', radiusEarth: 11.21, sceneRadius: 0.82, color: '#d1a17e', texture: '/textures/2k_jupiter.jpg', jplCommand: '599',
    orbital: { semiMajorAxisAu: 5.2028, eccentricity: 0.0489, inclinationDeg: 1.303, longitudeAscendingNodeDeg: 100.464, argumentOfPeriapsisDeg: 273.867, meanAnomalyAtEpochDeg: 20.020, orbitalPeriodDays: 4332.59 },
  },
  {
    id: 'saturn', name: 'Сатурн', englishName: 'Saturn', kind: 'gas-giant',
    description: 'Газовый гигант с системой колец из частиц льда и камня. На Титане, его крупнейшем спутнике, есть озёра и моря жидких углеводородов.',
    meanDistanceLabel: '9,537 а.е.', orbitalPeriodLabel: '29,45 года', radiusEarth: 9.45, sceneRadius: 0.69, color: '#dfc18e', texture: '/textures/2k_saturn.jpg', jplCommand: '699',
    orbital: { semiMajorAxisAu: 9.5367, eccentricity: 0.0565, inclinationDeg: 2.485, longitudeAscendingNodeDeg: 113.665, argumentOfPeriapsisDeg: 339.392, meanAnomalyAtEpochDeg: 317.020, orbitalPeriodDays: 10759.22 },
  },
  {
    id: 'uranus', name: 'Уран', englishName: 'Uranus', kind: 'ice-giant',
    description: 'Ледяной гигант с необычным наклоном оси вращения. Метан в атмосфере придаёт планете голубовато-зелёный оттенок.',
    meanDistanceLabel: '19,19 а.е.', orbitalPeriodLabel: '84,02 года', radiusEarth: 4.01, sceneRadius: 0.49, color: '#8ad9dc', texture: '/textures/2k_uranus.jpg', jplCommand: '799',
    orbital: { semiMajorAxisAu: 19.189, eccentricity: 0.0463, inclinationDeg: 0.773, longitudeAscendingNodeDeg: 74.006, argumentOfPeriapsisDeg: 96.998857, meanAnomalyAtEpochDeg: 142.2386, orbitalPeriodDays: 30688.5 },
  },
  {
    id: 'neptune', name: 'Нептун', englishName: 'Neptune', kind: 'ice-giant',
    description: 'Самая далёкая от Солнца планета. Холодный мир с динамичной атмосферой и очень быстрыми ветрами.',
    meanDistanceLabel: '30,07 а.е.', orbitalPeriodLabel: '164,8 года', radiusEarth: 3.88, sceneRadius: 0.47, color: '#547ce8', texture: '/textures/2k_neptune.jpg', jplCommand: '899',
    orbital: { semiMajorAxisAu: 30.07, eccentricity: 0.0095, inclinationDeg: 1.770, longitudeAscendingNodeDeg: 131.784, argumentOfPeriapsisDeg: 273.187, meanAnomalyAtEpochDeg: 256.228, orbitalPeriodDays: 60182 },
  },
] as const;

export const CELESTIAL_BODY_BY_ID = Object.fromEntries(
  CELESTIAL_BODIES.map((body) => [body.id, body]),
) as Record<CelestialBodyId, CelestialBody>;

export const SUN_TEXTURE = '/textures/2k_sun.jpg';
export const EARTH_CLOUDS_TEXTURE = '/textures/2k_earth_clouds.jpg';
export const SATURN_RING_TEXTURE = '/textures/2k_saturn_ring_alpha.png';
