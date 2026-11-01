import { beforeEach, describe, expect, it } from 'vitest';
import { useCameraFocusStore } from './store';

beforeEach(() => {
  useCameraFocusStore.setState({ focusedBodyId: null, focusRevision: 0 });
});

describe('useCameraFocusStore', () => {
  it('issues a new focus command for the selected body', () => {
    useCameraFocusStore.getState().focusBody('mars');

    expect(useCameraFocusStore.getState()).toMatchObject({
      focusedBodyId: 'mars',
      focusRevision: 1,
    });
  });

  it('issues a reset command even when no body is focused', () => {
    useCameraFocusStore.getState().resetCamera();
    useCameraFocusStore.getState().resetCamera();

    expect(useCameraFocusStore.getState()).toMatchObject({
      focusedBodyId: null,
      focusRevision: 2,
    });
  });

  it('can focus the Sun as a selectable stellar object', () => {
    useCameraFocusStore.getState().focusBody('sun');

    expect(useCameraFocusStore.getState()).toMatchObject({
      focusedBodyId: 'sun',
      focusRevision: 1,
    });
  });

  it('increments the command revision when switching the focused body', () => {
    useCameraFocusStore.getState().focusBody('earth');
    useCameraFocusStore.getState().focusBody('saturn');

    expect(useCameraFocusStore.getState()).toMatchObject({
      focusedBodyId: 'saturn',
      focusRevision: 2,
    });
  });
});
