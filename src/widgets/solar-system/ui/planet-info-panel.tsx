"use client";

import { CELESTIAL_BODY_BY_ID } from '@/entities/celestial-body';
import { useSelectedBodyStore } from '@/features/select-celestial-body';
import { useJplEphemeris } from '@/features/select-celestial-body';
import { useCameraFocusStore } from '@/features/focus-camera';

const KIND_LABELS = {
  terrestrial: 'КАМЕНИСТАЯ ПЛАНЕТА',
  'gas-giant': 'ГАЗОВЫЙ ГИГАНТ',
  'ice-giant': 'ЛЕДЯНОЙ ГИГАНТ',
} as const;

export function PlanetInfoPanel() {
  const bodyId = useSelectedBodyStore((state) => state.selectedBodyId);
  const selectedObjectId = useSelectedBodyStore((state) => state.selectedObjectId);
  const body = CELESTIAL_BODY_BY_ID[bodyId];
  const focusBody = useCameraFocusStore((state) => state.focusBody);
  const isSunSelected = selectedObjectId === 'sun';
  const { data, isFetching, isError } = useJplEphemeris(bodyId, !isSunSelected);

  if (isSunSelected) {
    return (
      <aside className="planet-panel sun-info-panel" aria-live="polite">
        <div className="panel-overline">ЗВЕЗДА ГЛАВНОЙ ПОСЛЕДОВАТЕЛЬНОСТИ / G2V</div>
        <div className="planet-title-row"><h2>Солнце</h2><span className="planet-dot sun-dot" /></div>
        <p className="planet-description">Звезда в центре Солнечной системы. В её ядре происходит термоядерный синтез водорода в гелий, а излучение и солнечный ветер влияют на все планеты и межпланетную среду.</p>
        <div className="planet-stats">
          <div><small>Средний радиус</small><strong>696 340 км</strong></div>
          <div><small>Возраст</small><strong>≈ 4,6 млрд лет</strong></div>
          <div><small>Температура фотосферы</small><strong>≈ 5 500 °C</strong></div>
          <div><small>Тип</small><strong>Звезда G2V</strong></div>
        </div>
        <button className="focus-action" type="button" onClick={() => focusBody('sun')}>СФОКУСИРОВАТЬ КАМЕРУ НА СОЛНЦЕ ↗</button>
        <div className="data-source-row"><span className="source-indicator is-live" /><span>NASA / SOLAR DYNAMICS OBSERVATORY</span></div>
        <a className="sun-source-link" href="https://science.nasa.gov/sun/" target="_blank" rel="noreferrer">НАУЧНОЕ ДОСЬЕ NASA ↗</a>
        <p className="source-caption">Звёздная модель показана условно. Размер Солнца и расстояния до планет не представлены в одном масштабе.</p>
      </aside>
    );
  }

  return (
    <aside className="planet-panel" aria-live="polite">
      <div className="panel-overline">{KIND_LABELS[body.kind]} / {body.id.toUpperCase()}</div>
      <div className="planet-title-row">
        <h2>{body.name}</h2>
        <span className="planet-dot" style={{ background: body.color }} />
      </div>
      <p className="planet-description">{body.description}</p>
      <div className="planet-stats">
        <div><small>Средняя орбита</small><strong>{body.meanDistanceLabel}</strong></div>
        <div><small>Орбитальный период</small><strong>{body.orbitalPeriodLabel}</strong></div>
        <div><small>Радиус</small><strong>{body.radiusEarth.toFixed(2)} R⊕</strong></div>
        <div><small>Эксцентриситет</small><strong>{body.orbital.eccentricity.toFixed(4)}</strong></div>
      </div>
      <button className="focus-action" type="button" onClick={() => focusBody(bodyId)}>СФОКУСИРОВАТЬ КАМЕРУ ↗</button>
      <div className="data-source-row">
        <span className={`source-indicator ${data ? 'is-live' : ''}`} />
        <span>{isFetching ? 'ЗАПРОС JPL HORIZONS…' : data ? `JPL HORIZONS / ${data.date} UTC` : isError ? 'JPL НЕДОСТУПЕН / МОДЕЛЬ КЕПЛЕРА' : 'ОЖИДАНИЕ JPL HORIZONS'}</span>
      </div>
      {data && (
        <div className="ephemeris-box">
          <div><small>Вектор X / AU</small><strong>{data.positionAu.x.toFixed(6)}</strong></div>
          <div><small>Вектор Y / AU</small><strong>{data.positionAu.y.toFixed(6)}</strong></div>
          <div><small>Вектор Z / AU</small><strong>{data.positionAu.z.toFixed(6)}</strong></div>
          <div><small>Расстояние от Солнца</small><strong>{data.distanceAu.toFixed(6)} AU</strong></div>
        </div>
      )}
      <p className="source-caption">Орбитальная анимация использует элементы Кеплера. JPL-данные запрашиваются отдельно и показываются с отметкой источника.</p>
    </aside>
  );
}
