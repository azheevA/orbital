import { create } from 'zustand';
import type { CelestialBodyId } from '@/entities/celestial-body';

export type SelectedObjectId = CelestialBodyId | 'sun';

interface SelectedBodyState {
  selectedBodyId: CelestialBodyId;
  selectedObjectId: SelectedObjectId;
  selectBody: (bodyId: CelestialBodyId) => void;
  selectSun: () => void;
}

export const useSelectedBodyStore = create<SelectedBodyState>((set) => ({
  selectedBodyId: 'earth',
  selectedObjectId: 'earth',
  selectBody: (selectedBodyId) => set({ selectedBodyId, selectedObjectId: selectedBodyId }),
  selectSun: () => set({ selectedObjectId: 'sun' }),
}));
