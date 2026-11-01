"use client";

import { useSimulationStore } from '../model/store';

export function SimulationControls() {
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const speed = useSimulationStore((state) => state.speed);
  const elapsedDays = useSimulationStore((state) => state.elapsedDays);
  const togglePlaying = useSimulationStore((state) => state.togglePlaying);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const reset = useSimulationStore((state) => state.reset);

  return (
    <div className="simulation-controls" aria-label="Управление симуляцией">
      <button className="control-button" type="button" onClick={togglePlaying} aria-pressed={isPlaying}>
        {isPlaying ? 'Ⅱ Пауза' : '▶ Продолжить'}
      </button>
      <button className="control-button" type="button" onClick={reset}>↺ Сброс</button>
      <label className="speed-control">
        Скорость
        <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
          {[1, 10, 50, 200].map((value) => <option key={value} value={value}>{value}×</option>)}
        </select>
      </label>
      <span className="model-clock">МОДЕЛЬНОЕ ВРЕМЯ +{elapsedDays.toFixed(1)} ДНЯ</span>
    </div>
  );
}
