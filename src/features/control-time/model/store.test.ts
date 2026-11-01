import { beforeEach, describe, expect, it } from 'vitest';
import { useSimulationStore } from './store';

beforeEach(() => {
  useSimulationStore.setState({ isPlaying: true, speed: 10, elapsedDays: 0 });
});

describe('useSimulationStore', () => {
  it('toggles playback state', () => {
    useSimulationStore.getState().togglePlaying();
    expect(useSimulationStore.getState().isPlaying).toBe(false);

    useSimulationStore.getState().togglePlaying();
    expect(useSimulationStore.getState().isPlaying).toBe(true);
  });

  it('accepts only supported simulation speeds', () => {
    useSimulationStore.getState().setSpeed(50);
    expect(useSimulationStore.getState().speed).toBe(50);

    useSimulationStore.getState().setSpeed(7);
    expect(useSimulationStore.getState().speed).toBe(10);
  });

  it('advances model time and ignores negative or non-finite deltas', () => {
    const store = useSimulationStore.getState();
    store.advanceDays(12.5);
    store.advanceDays(-2);
    store.advanceDays(Number.NaN);
    store.advanceDays(Number.POSITIVE_INFINITY);

    expect(useSimulationStore.getState().elapsedDays).toBe(12.5);
  });

  it('resets elapsed model time without changing playback settings', () => {
    useSimulationStore.getState().setPlaying(false);
    useSimulationStore.getState().setSpeed(200);
    useSimulationStore.getState().advanceDays(120);
    useSimulationStore.getState().reset();

    expect(useSimulationStore.getState()).toMatchObject({
      isPlaying: false,
      speed: 200,
      elapsedDays: 0,
    });
  });
});
