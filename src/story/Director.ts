import { SCRIPTS } from '../data/dialogue';
import type { Beat, CmdBeat, IfBeat, LineBeat, Script, SfxId } from '../data/types';
import type { StoryMachine } from '../core/StoryMachine';

/** Output side of script playback (VN layer, hearing layer, or a test double). */
export interface Presenter {
  line(beat: LineBeat): Promise<void>;
  cutin(id: string, caption?: string): Promise<void>;
  title(text: string, sub?: string): Promise<void>;
  evidence(id: string): Promise<void>;
  statement(id: string): void;
  sfx(id: SfxId): void;
  shake(power: number): void;
  bg(kind: 'black' | 'keyart' | 'room' | 'dawn'): void;
  wait(ms: number): Promise<void>;
}

export function isLine(b: Beat): b is LineBeat {
  return (b as LineBeat).who !== undefined;
}
export function isIf(b: Beat): b is IfBeat {
  return (b as IfBeat).if !== undefined;
}

export function getScript(id: string): Script {
  const s = SCRIPTS[id];
  if (!s) throw new Error(`unknown script ${id}`);
  return s;
}

/**
 * Plays scripts. Commands mutate the StoryMachine; presentation is delegated.
 * `advance` only requests the transition — callers react after the script ends.
 */
export class Director {
  running = false;

  constructor(private machine: StoryMachine) {}

  async run(script: Script | string, presenter: Presenter): Promise<void> {
    const beats = typeof script === 'string' ? getScript(script) : script;
    this.running = true;
    try {
      await this.play(beats, presenter);
    } finally {
      this.running = false;
    }
  }

  private async play(beats: Script, p: Presenter): Promise<void> {
    for (const b of beats) {
      if (isLine(b)) {
        await p.line(b);
      } else if (isIf(b)) {
        const branch = this.machine.test(b.if) ? b.then : b.else ?? [];
        await this.play(branch, p);
      } else {
        await this.command(b, p);
      }
    }
  }

  private async command(b: CmdBeat, p: Presenter) {
    switch (b.cmd) {
      case 'flag':
        this.machine.setFlag(b.id);
        break;
      case 'evidence':
        if (this.machine.addEvidence(b.id)) await p.evidence(b.id);
        break;
      case 'statement':
        if (this.machine.addStatement(b.id)) p.statement(b.id);
        break;
      case 'advance':
        this.machine.advance();
        break;
      case 'cutin':
        await p.cutin(b.id, b.caption);
        break;
      case 'title':
        await p.title(b.text, b.sub);
        break;
      case 'sfx':
        p.sfx(b.id);
        break;
      case 'shake':
        p.shake(b.power ?? 1);
        break;
      case 'bg':
        p.bg(b.kind);
        break;
      case 'wait':
        await p.wait(b.ms);
        break;
    }
  }
}
