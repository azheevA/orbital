"use client";

import { CELESTIAL_BODY_BY_ID } from '@/entities/celestial-body';
import { useSelectedBodyStore } from '@/features/select-celestial-body';
import { useCameraFocusStore } from '@/features/focus-camera';

export function CameraControls() {
  const selectedBodyId = useSelectedBodyStore((state) => state.selectedBodyId);
  const selectedObjectId = useSelectedBodyStore((state) => state.selectedObjectId);
  const focusBody = useCameraFocusStore((state) => state.focusBody);
  const resetCamera = useCameraFocusStore((state) => state.resetCamera);
  const focusedBodyId = useCameraFocusStore((state) => state.focusedBodyId);
  const selectedName = selectedObjectId === 'sun' ? 'Солнцу' : CELESTIAL_BODY_BY_ID[selectedBodyId].name;

  return (
    <div className="camera-controls">
      <button className="control-button" type="button" onClick={() => focusBody(selectedObjectId)} aria-pressed={focusedBodyId === selectedObjectId}>
        ◎ К {selectedName}
      </button>
      <button className="control-button" type="button" onClick={resetCamera}>⌖ Общий обзор</button>
    </div>
  );
}
