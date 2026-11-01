import { create } from 'zustand';

interface SimulationState {
  isPlaying: boolean;
  speed: number;
  elapsedDays: number;
  togglePlaying: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: number) => void;
  advanceDays: (days: number) => void;
  reset: () => void;
}

const ALLOWED_SPEEDS = [1, 10, 50, 200] as const;

export const useSimulationStore = create<SimulationState>((set) => ({
  isPlaying: true,
  speed: 10,
  elapsedDays: 0,
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => set({ speed: ALLOWED_SPEEDS.includes(speed as (typeof ALLOWED_SPEEDS)[number]) ? speed : 10 }),
  advanceDays: (days) => set((state) => ({ elapsedDays: state.elapsedDays + (Number.isFinite(days) ? Math.max(0, days) : 0) })),
  reset: () => set({ elapsedDays: 0 }),
}));
