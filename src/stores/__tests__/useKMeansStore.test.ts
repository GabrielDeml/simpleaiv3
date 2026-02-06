import { describe, it, expect, beforeEach } from 'vitest';
import { useKMeansStore } from '../useKMeansStore';

describe('useKMeansStore', () => {
  beforeEach(() => {
    useKMeansStore.getState().setK(3);
    useKMeansStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useKMeansStore.getState();
    expect(state.k).toBe(3);
    expect(state.points).toEqual([]);
    expect(state.centroids).toEqual([]);
    expect(state.assignments).toEqual([]);
    expect(state.stepCount).toBe(0);
    expect(state.converged).toBe(false);
    expect(state.isPlaying).toBe(false);
  });

  it('addPoint adds to array', () => {
    useKMeansStore.getState().addPoint({ x: 1, y: 2 });
    useKMeansStore.getState().addPoint({ x: 3, y: 4 });
    expect(useKMeansStore.getState().points).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it('setK resets centroids and assignments', () => {
    // Add points and initialize first
    const s = useKMeansStore.getState();
    s.addPoint({ x: 0, y: 0 });
    s.addPoint({ x: 1, y: 1 });
    s.addPoint({ x: 2, y: 2 });
    useKMeansStore.getState().initialize();

    useKMeansStore.getState().setK(5);
    const state = useKMeansStore.getState();
    expect(state.k).toBe(5);
    expect(state.centroids).toEqual([]);
    expect(state.assignments).toEqual([]);
    expect(state.stepCount).toBe(0);
    expect(state.converged).toBe(false);
  });

  it('initialize sets centroids and assignments when enough points', () => {
    const s = useKMeansStore.getState();
    s.addPoint({ x: 0, y: 0 });
    s.addPoint({ x: 5, y: 5 });
    s.addPoint({ x: 10, y: 10 });

    useKMeansStore.getState().initialize();
    const state = useKMeansStore.getState();
    expect(state.centroids).toHaveLength(3);
    expect(state.assignments).toHaveLength(3);
    expect(state.stepCount).toBe(0);
    expect(state.converged).toBe(false);
  });

  it('initialize does nothing when not enough points', () => {
    useKMeansStore.getState().addPoint({ x: 0, y: 0 });
    useKMeansStore.getState().initialize();
    const state = useKMeansStore.getState();
    expect(state.centroids).toEqual([]);
    expect(state.assignments).toEqual([]);
  });

  it('step increments stepCount and updates centroids', () => {
    const s = useKMeansStore.getState();
    s.addPoint({ x: 0, y: 0 });
    s.addPoint({ x: 5, y: 5 });
    s.addPoint({ x: 10, y: 10 });
    useKMeansStore.getState().initialize();

    useKMeansStore.getState().step();
    const state = useKMeansStore.getState();
    expect(state.stepCount).toBe(1);
    expect(state.centroids.length).toBeGreaterThan(0);
    expect(state.assignments.length).toBe(3);
  });

  it('step does nothing when no points', () => {
    useKMeansStore.getState().step();
    expect(useKMeansStore.getState().stepCount).toBe(0);
  });

  it('reset clears everything', () => {
    const s = useKMeansStore.getState();
    s.addPoint({ x: 0, y: 0 });
    s.addPoint({ x: 5, y: 5 });
    s.addPoint({ x: 10, y: 10 });
    useKMeansStore.getState().initialize();
    useKMeansStore.getState().step();

    useKMeansStore.getState().reset();
    const state = useKMeansStore.getState();
    expect(state.points).toEqual([]);
    expect(state.centroids).toEqual([]);
    expect(state.assignments).toEqual([]);
    expect(state.stepCount).toBe(0);
    expect(state.converged).toBe(false);
    expect(state.isPlaying).toBe(false);
  });

  it('togglePlaying flips isPlaying', () => {
    expect(useKMeansStore.getState().isPlaying).toBe(false);
    useKMeansStore.getState().togglePlaying();
    expect(useKMeansStore.getState().isPlaying).toBe(true);
    useKMeansStore.getState().togglePlaying();
    expect(useKMeansStore.getState().isPlaying).toBe(false);
  });
});
