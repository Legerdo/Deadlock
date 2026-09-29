import type { CharacterDef, CharId } from './types';

export const CHARACTERS: Record<CharId, CharacterDef> = {
  kai: { id: 'kai', name: '카이', nameEn: 'KAI MORROW', role: '테이프 복원사', heightM: 1.68, color: '#0F7D87', expressions: ['neutral', 'thinking', 'surprised', 'angry'], voice: 330 },
  theo: { id: 'theo', name: '테오', nameEn: 'THEO LINDQVIST', role: '나이트 케스트럴 진행자', heightM: 1.88, color: '#E4F03A', expressions: ['neutral', 'happy', 'thinking'], voice: 150 },
  helena: { id: 'helena', name: '헬레나', nameEn: 'HELENA VOSS', role: '기록보관소장', heightM: 1.78, color: '#6D5C9E', expressions: ['neutral', 'angry', 'surprised', 'distressed'], voice: 260 },
  bas: { id: 'bas', name: '바스', nameEn: 'BASTIAN KORD', role: '엔지니어', heightM: 1.75, color: '#0F7D87', expressions: ['neutral', 'happy', 'surprised', 'distressed'], voice: 120 },
  lumi: { id: 'lumi', name: '루미', nameEn: 'LUMI CASTELL', role: '필드 레코딩 작가', heightM: 1.55, color: '#FF5A48', expressions: ['neutral', 'happy', 'surprised', 'distressed'], voice: 440 },
  oskar: { id: 'oskar', name: '오스카', nameEn: 'OSKAR WENDT', role: '알데인 재단 법률 고문', heightM: 1.82, color: '#F2EADB', expressions: ['neutral', 'happy', 'surprised', 'angry'], voice: 200 },
  wren: { id: 'wren', name: '렌', nameEn: 'WREN HOLLIS', role: '프로듀서', heightM: 1.7, color: '#6D5C9E', expressions: ['neutral', 'thinking', 'surprised', 'distressed'], voice: 290 },
};

export const CHAR_IDS = Object.keys(CHARACTERS) as CharId[];

/** Nearest available expression for a character (e.g. 'thinking' → 'neutral' for Lumi). */
export function resolveExpr(id: CharId, e: string | undefined): string {
  const list = CHARACTERS[id].expressions as string[];
  if (e && list.includes(e)) return e;
  const fallback: Record<string, string[]> = {
    thinking: ['neutral'],
    happy: ['neutral'],
    angry: ['distressed', 'surprised', 'neutral'],
    distressed: ['angry', 'surprised', 'neutral'],
    surprised: ['neutral'],
  };
  for (const alt of fallback[e ?? ''] ?? []) if (list.includes(alt)) return alt;
  return 'neutral';
}
