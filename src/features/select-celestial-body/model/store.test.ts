import { beforeEach, describe, expect, it } from 'vitest';
import { useSelectedBodyStore } from './store';

beforeEach(() => {
  useSelectedBodyStore.setState({ selectedBodyId: 'earth', selectedObjectId: 'earth' });
});

describe('useSelectedBodyStore', () => {
  it('selects a planet as both the selected object and selected planet', () => {
    useSelectedBodyStore.getState().selectBody('saturn');

    expect(useSelectedBodyStore.getState()).toMatchObject({
      selectedBodyId: 'saturn',
      selectedObjectId: 'saturn',
    });
  });

  it('selects the Sun without losing the last selected planet', () => {
    useSelectedBodyStore.getState().selectBody('mars');
    useSelectedBodyStore.getState().selectSun();

    expect(useSelectedBodyStore.getState()).toMatchObject({
      selectedBodyId: 'mars',
      selectedObjectId: 'sun',
    });
  });
});
