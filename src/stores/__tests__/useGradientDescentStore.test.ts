import { describe, it, expect, beforeEach } from 'vitest';
import { useGradientDescentStore } from '../useGradientDescentStore';

describe('useGradientDescentStore', () => {
  beforeEach(() => {
    useGradientDescentStore.getState().reset();
    // Also reset surfaceType and viewMode since reset() doesn't reset those
    useGradientDescentStore.setState({ surfaceType: 'bowl', viewMode: '3d', learningRate: 0.05 });
  });

  it('has correct initial state', () => {
    const state = useGradientDescentStore.getState();
    expect(state.position).toEqual([1.5, 1.5]);
    expect(state.path).toEqual([[1.5, 1.5]]);
    expect(state.learningRate).toBe(0.05);
    expect(state.surfaceType).toBe('bowl');
    expect(state.isPlaying).toBe(false);
    expect(state.stepCount).toBe(0);
    expect(state.viewMode).toBe('3d');
  });

  it('setPosition updates position and resets path', () => {
    useGradientDescentStore.getState().setPosition([2, 3]);
    const state = useGradientDescentStore.getState();
    expect(state.position).toEqual([2, 3]);
    expect(state.path).toEqual([[2, 3]]);
    expect(state.stepCount).toBe(0);
  });

  it('step changes position, grows path, increments stepCount', () => {
    useGradientDescentStore.getState().step();
    const state = useGradientDescentStore.getState();
    // For bowl surface, gradient descent moves position toward origin
    expect(state.position[0]).toBeLessThan(1.5);
    expect(state.position[1]).toBeLessThan(1.5);
    expect(state.path).toHaveLength(2);
    expect(state.stepCount).toBe(1);

    useGradientDescentStore.getState().step();
    const state2 = useGradientDescentStore.getState();
    expect(state2.path).toHaveLength(3);
    expect(state2.stepCount).toBe(2);
  });

  it('reset returns to defaults', () => {
    useGradientDescentStore.getState().step();
    useGradientDescentStore.getState().step();
    useGradientDescentStore.getState().togglePlaying();

    useGradientDescentStore.getState().reset();
    const state = useGradientDescentStore.getState();
    expect(state.position).toEqual([1.5, 1.5]);
    expect(state.path).toEqual([[1.5, 1.5]]);
    expect(state.stepCount).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it('setLearningRate updates value', () => {
    useGradientDescentStore.getState().setLearningRate(0.01);
    expect(useGradientDescentStore.getState().learningRate).toBe(0.01);
  });

  it('setSurfaceType resets position and path', () => {
    useGradientDescentStore.getState().step();
    useGradientDescentStore.getState().setSurfaceType('saddle');
    const state = useGradientDescentStore.getState();
    expect(state.surfaceType).toBe('saddle');
    expect(state.position).toEqual([1.5, 1.5]);
    expect(state.path).toEqual([[1.5, 1.5]]);
    expect(state.stepCount).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it('togglePlaying flips isPlaying', () => {
    expect(useGradientDescentStore.getState().isPlaying).toBe(false);
    useGradientDescentStore.getState().togglePlaying();
    expect(useGradientDescentStore.getState().isPlaying).toBe(true);
    useGradientDescentStore.getState().togglePlaying();
    expect(useGradientDescentStore.getState().isPlaying).toBe(false);
  });

  it('setViewMode updates view mode', () => {
    useGradientDescentStore.getState().setViewMode('contour');
    expect(useGradientDescentStore.getState().viewMode).toBe('contour');
    useGradientDescentStore.getState().setViewMode('3d');
    expect(useGradientDescentStore.getState().viewMode).toBe('3d');
  });
});
