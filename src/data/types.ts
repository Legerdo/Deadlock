// Shared data types. All story content lives in src/data/* as typed data so the
// case validator (tools/validate-case.ts) and unit tests can check it statically.

export type CharId = 'kai' | 'theo' | 'helena' | 'bas' | 'lumi' | 'oskar' | 'wren';
export type Expr = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'angry' | 'distressed';
export type Speaker = CharId | 'warden' | 'narr';

export type RoomId = 'atrium' | 'canteen' | 'studio_b' | 'archive' | 'vault' | 'workshop' | 'guest_wing' | 'round';

export type StoryStateId =
  | 'PROLOGUE'
  | 'ARRIVAL'
  | 'DINNER'
  | 'EVENING'
  | 'NIGHT'
  | 'INCIDENT'
  | 'INVESTIGATION'
  | 'PRE_HEARING'
  | 'HEARING'
  | 'RECONSTRUCTION'
  | 'VERDICT'
  | 'EPILOGUE'
  | 'CREDITS';

export interface CharacterDef {
  id: CharId;
  name: string;
  nameEn: string;
  role: string;
  heightM: number;
  color: string;
  expressions: Expr[];
  /** pitch of the procedural text blip */
  voice: number;
}

// ---------- dialogue ----------
export interface LineBeat {
  who: Speaker;
  t: string;
  e?: Expr;
  /** speaker heard through a speaker / recording — no portrait, waveform instead */
  radio?: boolean;
}
export type CmdBeat =
  | { cmd: 'flag'; id: string }
  | { cmd: 'evidence'; id: string }
  | { cmd: 'statement'; id: string }
  | { cmd: 'advance' }
  | { cmd: 'cutin'; id: string; caption?: string }
  | { cmd: 'title'; text: string; sub?: string }
  | { cmd: 'sfx'; id: SfxId }
  | { cmd: 'shake'; power?: number }
  | { cmd: 'bg'; kind: 'black' | 'keyart' | 'room' | 'dawn' }
  | { cmd: 'wait'; ms: number };
export interface IfBeat {
  if: string; // flag id, or "ev:<evidenceId>"
  then: Beat[];
  else?: Beat[];
}
export type Beat = LineBeat | CmdBeat | IfBeat;
export type Script = Beat[];

export type SfxId =
  | 'click'
  | 'blip'
  | 'evidence'
  | 'error'
  | 'correct'
  | 'door'
  | 'squeak'
  | 'thump'
  | 'alarm'
  | 'whoosh'
  | 'slam'
  | 'static'
  | 'cut'
  | 'patch'
  | 'tune'
  | 'reveal'
  | 'powerdown';

// ---------- world ----------
export type Wall = 'n' | 's' | 'e' | 'w';

export interface DoorDef {
  id: string;
  wall: Wall;
  /** position along the wall, metres from centre */
  offset: number;
  width?: number;
  height?: number;
  label: string;
  to?: RoomId;
  spawn?: string;
  /** states in which this door is locked, with the text shown */
  locked?: Partial<Record<StoryStateId, string>>;
  /** states in which interacting runs a script instead of moving */
  script?: Partial<Record<StoryStateId, string>>;
  style?: 'plain' | 'double' | 'vault' | 'stair' | 'exit';
}

export type PropKind =
  | 'box'
  | 'cyl'
  | 'table'
  | 'bench'
  | 'shelf'
  | 'console'
  | 'reelDeck'
  | 'generator'
  | 'cylinders'
  | 'releaseStation'
  | 'firePanel'
  | 'plant'
  | 'podium'
  | 'warden'
  | 'dial'
  | 'counter'
  | 'vending'
  | 'glass'
  | 'lamp'
  | 'bed'
  | 'mic'
  | 'chair'
  | 'blanket'
  | 'stairs'
  | 'column';

export interface PropDef {
  kind: PropKind;
  pos: [number, number, number];
  size?: [number, number, number];
  rotY?: number;
  color?: string;
  color2?: string;
  /** blocks the player */
  solid?: boolean;
  /** only present in these states */
  states?: StoryStateId[];
}

export interface DecalDef {
  /** manifest id of generated art, or 'sign:<text>' for a typeset sign */
  art: string;
  wall: Wall;
  offset: number;
  y: number;
  w: number;
  h: number;
  /** optional typeset overlay text (posters) */
  caption?: string;
  kind?: 'poster' | 'window' | 'mural' | 'sign' | 'photo';
  /** swap art in these states */
  artIn?: Partial<Record<StoryStateId, string>>;
}

export interface SpawnDef {
  pos: [number, number];
  yaw: number;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  nameEn: string;
  size: [number, number, number];
  floor: { pattern: 'terrazzo' | 'checker' | 'planks' | 'grate' | 'carpet' | 'concrete'; a: string; b: string };
  wall: { a: string; band: string; pattern?: 'panels' | 'tile' | 'acoustic' | 'concrete' };
  ceiling: string;
  light: string;
  landmark: string;
  doors: DoorDef[];
  spawns: Record<string, SpawnDef>;
  props: PropDef[];
  decals: DecalDef[];
  round?: boolean;
}

// ---------- investigation ----------
export interface EvidenceDef {
  id: string;
  title: string;
  kind: 'object' | 'record' | 'testimony';
  icon: string;
  description: string;
  facts: string[];
  obtainedAt: RoomId;
  required: boolean;
}

export interface StatementDef {
  id: string;
  who: CharId;
  text: string;
}

export interface HotspotDef {
  id: string;
  room: RoomId;
  pos: [number, number, number];
  label: string;
  states: StoryStateId[];
  script: string;
  /** evidence this hotspot's script grants (for validation / hints) */
  grants?: string;
}

// ---------- story ----------
export interface NpcPlacement {
  char: CharId;
  room: RoomId;
  pos: [number, number];
  talk: string;
  /** script after the first talk */
  again?: string;
  expr?: Expr;
  when?: string;
  unless?: string;
}

export type ExitDef =
  | { to: StoryStateId; kind: 'script' }
  | { to: StoryStateId; kind: 'flags'; flags: string[] }
  | { to: StoryStateId; kind: 'evidence' }
  | { to: StoryStateId; kind: 'trial'; group: TrialGroup };

export interface StoryContext {
  flags: Set<string>;
  evidence: Set<string>;
}

export interface StoryStateDef {
  id: StoryStateId;
  chapter: string;
  clock: string;
  mode: 'vn' | 'explore' | 'trial' | 'credits';
  lighting: 'evening' | 'night' | 'morning' | 'noon' | 'dawn';
  rooms: RoomId[];
  start?: { room: RoomId; spawn: string };
  npcs: NpcPlacement[];
  hotspots: string[];
  onEnter?: string;
  objective: (ctx: StoryContext) => string;
  exit: ExitDef | null;
  mandatory: boolean;
}

// ---------- trial ----------
export type TrialGroup = 'hearing' | 'reconstruction' | 'verdict';

export interface TrialStatement {
  id: string;
  who: CharId;
  e?: Expr;
  t: string;
  /** targetable phrase (must be a substring of t) */
  mark?: string;
}

interface RoundBase {
  id: string;
  title: string;
  prompt: string;
  intro?: Script;
  success: Script;
  wrong: LineBeat[];
}

export interface DebateRound extends RoundBase {
  kind: 'cut' | 'patch';
  statements: TrialStatement[];
  answer: { statement: string; evidence: string[] };
  /** near-misses: explained without Focus loss */
  partial?: { statement: string; evidence: string; reply: LineBeat }[];
}

export interface TuneRound extends RoundBase {
  kind: 'tune';
  question: string;
  axis: 'time' | 'place' | 'person' | 'motive' | 'tool';
  options: { id: string; label: string; sub?: string }[];
  answer: string;
}

export interface ReelRound extends RoundBase {
  kind: 'reel';
  panels: { id: string; text: string; time: string }[];
  answerOrder: string[];
  /** initial shuffled order shown to the player */
  initialOrder: string[];
}

export type TrialRound = DebateRound | TuneRound | ReelRound;

export interface TrialStage {
  id: string;
  group: TrialGroup;
  numeral: string;
  title: string;
  titleEn: string;
  intro: Script;
  rounds: TrialRound[];
  outro?: Script;
}
