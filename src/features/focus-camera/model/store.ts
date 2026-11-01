import { create } from 'zustand';
import type { CelestialBodyId } from '@/entities/celestial-body';

export type FocusableObjectId = CelestialBodyId | 'sun';

interface CameraFocusState {
  focusedBodyId: FocusableObjectId | null;
  focusRevision: number;
  focusBody: (bodyId: FocusableObjectId) => void;
  resetCamera: () => void;
}

export const useCameraFocusStore = create<CameraFocusState>((set) => ({
  focusedBodyId: null,
  focusRevision: 0,
  focusBody: (focusedBodyId) => set((state) => ({
    focusedBodyId,
    focusRevision: state.focusRevision + 1,
  })),
  resetCamera: () => set((state) => ({
    focusedBodyId: null,
    focusRevision: state.focusRevision + 1,
  })),
}));
