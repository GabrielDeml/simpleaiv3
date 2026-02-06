export class AnimationLoop {
  private frameId: number | null = null;
  private callback: (dt: number) => void;
  private lastTime = 0;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
  }

  start(): void {
    if (this.frameId !== null) return;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.callback(dt);
      this.frameId = requestAnimationFrame(loop);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  get isRunning(): boolean {
    return this.frameId !== null;
  }
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
