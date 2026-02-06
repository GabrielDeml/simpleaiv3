import { describe, it, expect, beforeEach } from 'vitest';
import { useLinearRegressionStore } from '../useLinearRegressionStore';

describe('useLinearRegressionStore', () => {
  beforeEach(() => {
    useLinearRegressionStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useLinearRegressionStore.getState();
    expect(state.points).toEqual([]);
    expect(state.weight).toBe(0);
    expect(state.bias).toBe(0);
    expect(state.learningRate).toBe(0.1);
    expect(state.loss).toBe(0);
    expect(state.epoch).toBe(0);
    expect(state.isTraining).toBe(false);
  });

  it('addPoint adds to array', () => {
    const { addPoint } = useLinearRegressionStore.getState();
    addPoint({ x: 1, y: 2 });
    addPoint({ x: 3, y: 4 });
    expect(useLinearRegressionStore.getState().points).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it('removePoint removes the correct index', () => {
    const { addPoint } = useLinearRegressionStore.getState();
    addPoint({ x: 1, y: 1 });
    addPoint({ x: 2, y: 2 });
    addPoint({ x: 3, y: 3 });
    useLinearRegressionStore.getState().removePoint(1);
    expect(useLinearRegressionStore.getState().points).toEqual([
      { x: 1, y: 1 },
      { x: 3, y: 3 },
    ]);
  });

  it('updatePoint updates the correct index', () => {
    const { addPoint } = useLinearRegressionStore.getState();
    addPoint({ x: 1, y: 1 });
    addPoint({ x: 2, y: 2 });
    useLinearRegressionStore.getState().updatePoint(0, { x: 10, y: 20 });
    expect(useLinearRegressionStore.getState().points).toEqual([
      { x: 10, y: 20 },
      { x: 2, y: 2 },
    ]);
  });

  it('setLearningRate updates value', () => {
    useLinearRegressionStore.getState().setLearningRate(0.01);
    expect(useLinearRegressionStore.getState().learningRate).toBe(0.01);
  });

  it('trainStep with empty points does nothing', () => {
    useLinearRegressionStore.getState().trainStep();
    const state = useLinearRegressionStore.getState();
    expect(state.epoch).toBe(0);
    expect(state.loss).toBe(0);
    expect(state.weight).toBe(0);
    expect(state.bias).toBe(0);
  });

  it('trainStep with points updates loss and epoch', () => {
    const { addPoint } = useLinearRegressionStore.getState();
    addPoint({ x: 1, y: 2 });
    addPoint({ x: 2, y: 4 });
    addPoint({ x: 3, y: 6 });

    useLinearRegressionStore.getState().trainStep();
    const state = useLinearRegressionStore.getState();
    expect(state.epoch).toBe(1);
    expect(state.loss).toBeGreaterThanOrEqual(0);
    // weight and bias should have changed from zero since data has a clear trend
    expect(state.weight !== 0 || state.bias !== 0).toBe(true);
  });

  it('reset clears everything', () => {
    const s = useLinearRegressionStore.getState();
    s.addPoint({ x: 1, y: 2 });
    s.setLearningRate(0.5);
    s.trainStep();
    // Now state is dirty
    useLinearRegressionStore.getState().reset();
    const state = useLinearRegressionStore.getState();
    expect(state.points).toEqual([]);
    expect(state.weight).toBe(0);
    expect(state.bias).toBe(0);
    expect(state.loss).toBe(0);
    expect(state.epoch).toBe(0);
    expect(state.isTraining).toBe(false);
  });

  it('toggleTraining flips isTraining', () => {
    expect(useLinearRegressionStore.getState().isTraining).toBe(false);
    useLinearRegressionStore.getState().toggleTraining();
    expect(useLinearRegressionStore.getState().isTraining).toBe(true);
    useLinearRegressionStore.getState().toggleTraining();
    expect(useLinearRegressionStore.getState().isTraining).toBe(false);
  });
});
