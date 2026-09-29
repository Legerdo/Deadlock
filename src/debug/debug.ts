import type { Game } from '../core/Game';

declare global {
  interface Window {
    __AFTERSIGNAL__?: { view: () => ReturnType<Game['debugView']> };
  }
}

/**
 * Read-only view of the running game for Playwright and performance checks.
 * It exposes no setters: tests drive the game only through real keyboard/mouse input.
 */
export function installDebugView(game: Game) {
  window.__AFTERSIGNAL__ = Object.freeze({ view: () => game.debugView() });
}
