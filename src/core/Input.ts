/** Keyboard + mouse state with pointer-lock look. Arrow keys turn for keyboard-only play. */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  pointerLocked = false;
  wheel = 0;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (e.code === 'Space' && e.target === document.body) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.lookDX += e.movementX;
      this.lookDY += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });
    window.addEventListener('wheel', (e) => (this.wheel += Math.sign(e.deltaY)), { passive: true });
  }

  requestLock() {
    if (this.pointerLocked) return;
    try {
      const p = this.canvas.requestPointerLock?.() as unknown as Promise<void> | undefined;
      p?.catch?.(() => undefined);
    } catch {
      /* pointer lock unavailable (e.g. automation) — keyboard turning still works */
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  isDown(code: string) {
    return this.down.has(code);
  }

  /** True once per physical press. */
  consume(code: string) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  endFrame() {
    this.pressed.clear();
    this.lookDX = 0;
    this.lookDY = 0;
    this.wheel = 0;
  }

  clear() {
    this.down.clear();
    this.pressed.clear();
  }
}
