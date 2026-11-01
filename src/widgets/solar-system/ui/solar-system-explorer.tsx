"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CELESTIAL_BODIES } from '@/entities/celestial-body';
import { FeaturedObjects } from '@/widgets/object-catalog';
import { SiteHeader } from '@/widgets/site-header';
import { PlanetInfoPanel } from './planet-info-panel';
import { useSelectedBodyStore } from '@/features/select-celestial-body';
import { SimulationControls } from '@/features/control-time';
import { CameraControls } from './camera-controls';
import { useCameraFocusStore } from '@/features/focus-camera';
import { useNearEarthObjectReport } from '@/features/near-earth-objects';

const SolarSystemCanvas = dynamic(() => import('./solar-system-canvas'), {
  ssr: false,
  loading: () => <div className="scene-loading"><span className="loader-orbit" />ЗАГРУЗКА 3D-СЦЕНЫ</div>,
});

export function SolarSystemExplorer() {
  const selectedObjectId = useSelectedBodyStore((state) => state.selectedObjectId);
  const selectBody = useSelectedBodyStore((state) => state.selectBody);
  const selectSun = useSelectedBodyStore((state) => state.selectSun);
  const resetCamera = useCameraFocusStore((state) => state.resetCamera);
  const { data: neoReport, isLoading: neoLoading, isError: neoError } = useNearEarthObjectReport();

  return (
    <main className="app-shell">
      <SiteHeader currentPage="home" />

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> DIGITAL OBSERVATORY / 01</p>
          <h1>За пределами<br /><span>известного.</span></h1>
          <p className="hero-description">Исследуй планеты, наблюдай орбиты и приближайся к далёким мирам. Научные данные встречаются с интерактивной 3D-визуализацией.</p>
          <div className="hero-actions">
            <a className="primary-action" href="#explorer">НАЧАТЬ ИССЛЕДОВАНИЕ <span>↗</span></a>
            <Link className="hero-catalog-link" href="/catalog">ОТКРЫТЬ КАТАЛОГ <span>↗</span></Link>
            <span className="hero-meta">8 ПЛАНЕТ <b>·</b> 1 ЗВЕЗДА <b>·</b> ∞ ОТКРЫТИЙ</span>
          </div>
          <div className="hero-facts">
            <div><strong>149.6 млн км</strong><small>Среднее расстояние Земли от Солнца</small></div>
            <div><strong>13.8 млрд лет</strong><small>Возраст Вселенной</small></div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
          <div className="hero-planet"><div /></div>
          <span className="hero-coordinate coordinate-a">RA 19h 54m 36s<br />DEC +43° 57′ 18″</span>
          <span className="hero-coordinate coordinate-b">KEPLER SYSTEM<br />OBJECT / 001</span>
        </div>
        <div className="hero-bottom-line"><span>SCIENTIA / CURIOSITAS / EXPLORATIO</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="explorer-section" id="explorer">
        <div className="section-heading">
          <div><p className="eyebrow">02 / INTERACTIVE SOLAR SYSTEM</p><h2>Одна звезда.<br /><span>Восемь миров.</span></h2></div>
          <p>Нажми на Солнце или планету, чтобы открыть досье. Вращай камеру, приближай объекты и следи за их движением во времени.</p>
        </div>
        <div className="explorer-grid">
          <div className="scene-column">
            <div className="scene-frame">
              <div className="scene-overlay scene-overlay-top"><span>HELIOCENTRIC VIEW / ECLIPTIC</span><span>REAL-TIME RENDER</span></div>
              <SolarSystemCanvas />
              <div className="scene-overlay scene-overlay-bottom"><span>DRAG — ORBIT CAMERA</span><span>SCROLL — ZOOM</span><span>CLICK — SELECT / DOUBLE CLICK — FOCUS</span></div>
            </div>
            <p className="scene-disclaimer">МОДЕЛЬ ОТ ЭПОХИ J2000.0 · РАССТОЯНИЯ СЖАТЫ ЛОГАРИФМИЧЕСКИ · РАЗМЕРЫ ПЛАНЕТ УСЛОВНЫ</p>
            <div className="scene-toolbar"><SimulationControls /><CameraControls /></div>
            <div className="body-selector" aria-label="Выбрать небесное тело">
              <button type="button" className={selectedObjectId === 'sun' ? 'body-chip active sun-chip' : 'body-chip sun-chip'} onClick={() => { selectSun(); resetCamera(); }} aria-pressed={selectedObjectId === 'sun'}>
                <i /> <span>00</span> Солнце
              </button>
              {CELESTIAL_BODIES.map((body, index) => (
                <button key={body.id} type="button" className={selectedObjectId === body.id ? 'body-chip active' : 'body-chip'} onClick={() => { selectBody(body.id); resetCamera(); }} aria-pressed={selectedObjectId === body.id}>
                  <i style={{ background: body.color }} /> <span>{String(index + 1).padStart(2, '0')}</span> {body.name}
                </button>
              ))}
            </div>
          </div>
          <PlanetInfoPanel />
        </div>
      </section>

      <section className="data-section" id="data">
        <div className="section-heading compact-heading">
          <div><p className="eyebrow">03 / SCIENCE DATA</p><h2>Данные из <span>космоса.</span></h2></div>
          <p>Справочные сведения и реальные наблюдения. Источники NASA и JPL отделены от учебной орбитальной модели.</p>
        </div>
        <div className="data-grid">
          <article className="data-card">
            <div className="data-card-top"><span>JPL / HORIZONS</span><span className="live-pill">EPHEMERIS</span></div>
            <h3>Положение планет</h3>
            <p>Гелиоцентрические векторы X / Y / Z в астрономических единицах. Данные доступны в панели выбранной планеты.</p>
            <a href="https://ssd-api.jpl.nasa.gov/doc/horizons.html" target="_blank" rel="noreferrer">ДОКУМЕНТАЦИЯ JPL ↗</a>
          </article>
          <article className="data-card neo-card">
            <div className="data-card-top"><span>NASA / NEO</span><span className="live-pill">{neoLoading ? 'SYNC' : neoError ? 'OFFLINE' : 'CONNECTED'}</span></div>
            <h3>Околоземные объекты</h3>
            <p>{neoLoading ? 'Запрашиваем ежедневный каталог NASA…' : neoError ? 'Сервис временно недоступен. Проверь NASA_API_KEY и лимиты API.' : `За ${neoReport?.date ?? 'сегодня'} найдено ${neoReport?.count ?? 0} объектов, потенциально опасных: ${neoReport?.hazardousCount ?? 0}.`}</p>
            {neoReport?.objects.length ? (
              <ul className="neo-object-list" aria-label="Ближайшие объекты из каталога NASA">
                {neoReport.objects.slice(0, 3).map((object) => (
                  <li key={object.id}>
                    <span>{object.name}{object.hazardous && <em>PHA</em>}</span>
                    <small>{object.missDistanceKm === null ? 'Дистанция неизвестна' : `${Math.round(object.missDistanceKm).toLocaleString('ru-RU')} км`} · Ø {Math.round(object.diameterMeters)} м</small>
                  </li>
                ))}
              </ul>
            ) : null}
            <a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA OPEN APIs ↗</a>
          </article>
          <article className="data-card">
            <div className="data-card-top"><span>ORBITAL / MODEL</span><span className="live-pill">KEPLER</span></div>
            <h3>Орбитальная механика</h3>
            <p>Эллиптические орбиты рассчитываются через решение уравнения Кеплера и набор орбитальных элементов.</p>
            <a href="https://science.nasa.gov/solar-system/solar-system-facts/" target="_blank" rel="noreferrer">ФАКТЫ О СОЛНЕЧНОЙ СИСТЕМЕ ↗</a>
          </article>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading compact-heading">
          <div><p className="eyebrow">04 / EXPEDITION TARGETS</p><h2>Миры, которые <span>ждут открытия.</span></h2></div>
          <p>Спутники с подлёдными океанами и далёкие экзопланеты — лишь несколько объектов из большой коллекции ORBITAL.</p>
        </div>
        <FeaturedObjects />
        <div className="catalog-view-all"><span>В КАТАЛОГЕ: ЗВЁЗДЫ · ПЛАНЕТЫ · СПУТНИКИ · ЭКЗОПЛАНЕТЫ · ГАЛАКТИКИ</span><Link className="primary-action" href="/catalog">ПЕРЕЙТИ В КАТАЛОГ <span>↗</span></Link></div>
      </section>

      <footer className="footer"><a className="brand" href="/"><span className="brand-glyph"><i /><i /><i /></span><span>ORBITAL</span></a><span>EXPLORE · UNDERSTAND · DISCOVER</span><span>© 2026 ORBITAL EXPLORER</span></footer>
    </main>
  );
}
