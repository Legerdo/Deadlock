export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, parent?: HTMLElement, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  parent?.appendChild(e);
  return e;
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function nextFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/** Resolve on the first matching key or click on target (or anywhere). */
export function waitForAdvance(opts: { target?: HTMLElement; keys?: string[]; minMs?: number } = {}) {
  const keys = opts.keys ?? ['Space', 'Enter', 'KeyE'];
  const start = performance.now();
  return new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener('keydown', onKey, true);
      (opts.target ?? window).removeEventListener('click', onClick as EventListener);
      resolve();
    };
    const ok = () => performance.now() - start >= (opts.minMs ?? 0);
    const onKey = (e: KeyboardEvent) => {
      if (keys.includes(e.code) && !e.repeat && ok()) {
        e.preventDefault();
        e.stopPropagation();
        done();
      }
    };
    const onClick = () => ok() && done();
    window.addEventListener('keydown', onKey, true);
    (opts.target ?? window).addEventListener('click', onClick as EventListener);
  });
}
