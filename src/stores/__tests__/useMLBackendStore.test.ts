import { describe, it, expect, beforeEach } from 'vitest';
import { useMLBackendStore } from '../useMLBackendStore';

describe('useMLBackendStore', () => {
  beforeEach(() => {
    useMLBackendStore.setState({ backend: null, isInitializing: true, error: null });
  });

  it('has correct initial state', () => {
    const state = useMLBackendStore.getState();
    expect(state.backend).toBeNull();
    expect(state.isInitializing).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setBackend updates backend', () => {
    useMLBackendStore.getState().setBackend('webgpu');
    expect(useMLBackendStore.getState().backend).toBe('webgpu');

    useMLBackendStore.getState().setBackend('cpu');
    expect(useMLBackendStore.getState().backend).toBe('cpu');
  });

  it('setInitializing updates isInitializing', () => {
    useMLBackendStore.getState().setInitializing(false);
    expect(useMLBackendStore.getState().isInitializing).toBe(false);

    useMLBackendStore.getState().setInitializing(true);
    expect(useMLBackendStore.getState().isInitializing).toBe(true);
  });

  it('setError updates error', () => {
    useMLBackendStore.getState().setError('WebGPU not supported');
    expect(useMLBackendStore.getState().error).toBe('WebGPU not supported');

    useMLBackendStore.getState().setError(null);
    expect(useMLBackendStore.getState().error).toBeNull();
  });
});
