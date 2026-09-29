import { ROOMS } from '../data/locations';
import type { RoomId } from '../data/types';
import type { Interactable } from '../interaction/Interactables';
import { promptVerb } from '../interaction/Interactables';
import { el } from './dom';

export class HUD {
  readonly root: HTMLElement;
  private clock: HTMLElement;
  private chapter: HTMLElement;
  private room: HTMLElement;
  private roomEn: HTMLElement;
  private objective: HTMLElement;
  private prompt: HTMLElement;
  private promptText: HTMLElement;
  private crosshair: HTMLElement;
  private help: HTMLElement;
  private lastObjective = '';

  constructor(parent: HTMLElement) {
    this.root = el('div', 'hud', parent);
    const top = el('div', 'hud-top', this.root);
    const stamp = el('div', 'hud-stamp', top);
    this.clock = el('div', 'hud-clock', stamp);
    this.chapter = el('div', 'hud-chapter', stamp);
    const loc = el('div', 'hud-loc', top);
    this.roomEn = el('div', 'hud-room-en', loc);
    this.room = el('div', 'hud-room', loc);
    this.objective = el('div', 'hud-objective', this.root);
    this.objective.setAttribute('role', 'status');
    this.crosshair = el('div', 'hud-cross', this.root);
    this.prompt = el('div', 'hud-prompt', this.root);
    el('span', 'key', this.prompt, 'E');
    this.promptText = el('span', 'txt', this.prompt);
    this.help = el('div', 'hud-help', this.root, 'WASD 이동 · 마우스/←→ 시점 · E 상호작용 · Tab 증거 · Esc 메뉴');
  }

  show(on: boolean) {
    this.root.classList.toggle('on', on);
  }

  setState(clock: string, chapter: string) {
    this.clock.textContent = clock;
    this.chapter.textContent = chapter;
  }

  setRoom(id: RoomId) {
    const r = ROOMS[id];
    this.room.textContent = r.name;
    this.roomEn.textContent = r.nameEn;
    this.root.classList.remove('room-in');
    void this.root.offsetWidth;
    this.root.classList.add('room-in');
  }

  setObjective(text: string) {
    if (text === this.lastObjective) return;
    this.lastObjective = text;
    this.objective.textContent = text;
    this.objective.classList.toggle('empty', !text);
    this.objective.classList.remove('pulse');
    void this.objective.offsetWidth;
    this.objective.classList.add('pulse');
  }

  setTarget(t: Interactable | null) {
    if (!t) {
      this.prompt.classList.remove('on');
      this.crosshair.classList.remove('hot');
      return;
    }
    this.prompt.classList.add('on');
    this.crosshair.classList.add('hot');
    this.prompt.dataset.kind = t.kind;
    const locked = t.kind === 'door' && t.locked;
    this.promptText.textContent = `${promptVerb(t)} — ${t.label}${locked ? ' (잠김)' : ''}`;
  }

  hint(show: boolean) {
    this.help.classList.toggle('on', show);
  }
}
