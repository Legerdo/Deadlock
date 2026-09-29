import type { CharId, RoomId } from './types';

// Case Truth Graph — the ground truth the whole story is derived from.
// tools/validate-case.ts checks movement feasibility, evidence references and
// that every contradiction is resolved by a hearing round.

export interface TruthEvent {
  id: string;
  time: string; // HH:MM, night rolls over after 23:59 (00:xx = next day)
  actor: CharId | 'system';
  room: RoomId;
  what: string;
  traces: string[]; // evidence ids left by the event
}

export interface Whereabouts {
  char: CharId;
  from: string;
  to: string;
  room: RoomId;
}

export interface Contradiction {
  id: string;
  claim: string;
  heldBy: CharId | 'everyone';
  brokenBy: string[]; // evidence ids
  round: string; // trial round id where it is resolved
}

export const CASE = {
  victim: 'theo' as CharId,
  culprit: 'wren' as CharId,
  timeOfDeath: '23:47',
  deathRoom: 'vault' as RoomId,
  actionRoom: 'workshop' as RoomId,
  method: '작업실 가스실 수동 방출기로 금고실에 CO₂ 방출',
  motive: '금고실을 72시간 잠가 테오가 KST-D 릴을 꺼내지 못하게 하려 함 (살해 의도 없음)',

  events: [
    { id: 'e_dinner', time: '19:30', actor: 'helena', room: 'canteen', what: '연출된 말다툼 중 금고실 코드 쪽지를 테오에게 던짐', traces: ['helena_note'] },
    { id: 'e_record', time: '20:15', actor: 'theo', room: 'studio_b', what: '"리허설" 명목으로 75분 방송을 사전 녹음', traces: ['autostart_card'] },
    { id: 'e_paint', time: '21:10', actor: 'bas', room: 'workshop', what: '가스실 방출기 덮개 도색, 칠 주의 태그', traces: ['wet_paint_tag'] },
    { id: 'e_selftest', time: '22:00', actor: 'system', room: 'workshop', what: '화재 패널 자가 점검 출력', traces: ['fire_printout'] },
    { id: 'e_leave', time: '23:14', actor: 'theo', room: 'studio_b', what: '자동 시작 23:30 설정 후 퇴실', traces: ['studio_log', 'autostart_card'] },
    { id: 'e_vault', time: '23:21', actor: 'theo', room: 'vault', what: '관장 코드로 금고실 개방, 밀폐형 헤드폰으로 D 릴 청취', traces: ['keypad_log', 'theo_headphones'] },
    { id: 'e_lumi', time: '23:25', actor: 'lumi', room: 'atrium', what: '아트리움 녹음 시작', traces: ['lumi_recording'] },
    { id: 'e_air', time: '23:30', actor: 'system', room: 'studio_b', what: '사전 녹음 방송 자동 재생', traces: ['autostart_card'] },
    { id: 'e_oskar', time: '23:35', actor: 'oskar', room: 'archive', what: '직원 복도로 헬레나 사무실 잠입, 서랍 강제 개방, 만년필 분실', traces: ['oskar_pen', 'order_88d'] },
    { id: 'e_down', time: '23:45', actor: 'wren', room: 'workshop', what: '아트리움을 지나 작업실로 내려감 (헤드셋 LED 깜빡임)', traces: ['lumi_recording', 'wren_headset'] },
    { id: 'e_pull', time: '23:47', actor: 'wren', room: 'workshop', what: '수동 방출. 사이렌 무음(퓨즈 없음). 금고실 72시간 잠금. 헤드셋이 젖은 페인트에 닿음', traces: ['vault_panel', 'release_station', 'siren_box', 'wren_headset'] },
    { id: 'e_death', time: '23:47', actor: 'theo', room: 'vault', what: 'CO₂ 질식 (헤드폰으로 아무것도 듣지 못함)', traces: ['vault_panel', 'theo_headphones'] },
    { id: 'e_tear', time: '23:48', actor: 'wren', room: 'workshop', what: '"MANUAL RELEASE" 출력 부분을 찢어 감', traces: ['fire_printout'] },
    { id: 'e_up', time: '23:49', actor: 'wren', room: 'guest_wing', what: '아트리움을 지나 객실동으로 돌아감', traces: ['lumi_recording'] },
    { id: 'e_bas', time: '23:51', actor: 'bas', room: 'workshop', what: '루미에게 인사하고 작업실로', traces: ['lumi_recording'] },
    { id: 'e_power', time: '23:52', actor: 'system', room: 'workshop', what: '주전원 차단, 23:53 발전기 수동 기동', traces: ['generator_log'] },
    { id: 'e_end', time: '00:45', actor: 'system', room: 'studio_b', what: '테이프 종료, 데드 에어', traces: ['autostart_card'] },
    { id: 'e_open', time: '06:12', actor: 'bas', room: 'vault', what: '엔지니어 키로 금고실 개방, 시신 발견', traces: ['vault_panel', 'keypad_log'] },
  ] satisfies TruthEvent[],

  // Where everyone actually was during the critical window (23:00–00:45).
  whereabouts: [
    { char: 'theo', from: '23:00', to: '23:14', room: 'studio_b' },
    { char: 'theo', from: '23:21', to: '23:47', room: 'vault' },
    { char: 'helena', from: '23:00', to: '00:45', room: 'guest_wing' },
    { char: 'bas', from: '23:00', to: '23:50', room: 'guest_wing' },
    { char: 'bas', from: '23:51', to: '23:51', room: 'atrium' },
    { char: 'bas', from: '23:52', to: '00:10', room: 'workshop' },
    { char: 'lumi', from: '23:25', to: '00:05', room: 'atrium' },
    { char: 'oskar', from: '23:00', to: '23:34', room: 'guest_wing' },
    { char: 'oskar', from: '23:35', to: '00:20', room: 'archive' },
    { char: 'wren', from: '23:00', to: '23:44', room: 'guest_wing' },
    { char: 'wren', from: '23:45', to: '23:45', room: 'atrium' },
    { char: 'wren', from: '23:46', to: '23:48', room: 'workshop' },
    { char: 'wren', from: '23:49', to: '23:49', room: 'atrium' },
    { char: 'wren', from: '23:50', to: '00:45', room: 'guest_wing' },
    { char: 'kai', from: '22:30', to: '06:00', room: 'guest_wing' },
  ] satisfies Whereabouts[],

  // What people wrongly believe or say, and what breaks it.
  contradictions: [
    { id: 'c_live', claim: '테오는 00:45까지 생방송 중이었다', heldBy: 'everyone', brokenBy: ['autostart_card', 'studio_log'], round: 'r1_live' },
    { id: 'c_helena', claim: '헬레나가 금고실을 열고 테오를 들였다', heldBy: 'oskar', brokenBy: ['helena_note'], round: 'r3_code' },
    { id: 'c_accident', claim: '테오가 안쪽 방출기를 실수로 당겼다', heldBy: 'oskar', brokenBy: ['inner_release'], round: 'r4_accident' },
    { id: 'c_surge', claim: '폭풍의 전력 서지가 설비를 작동시켰다', heldBy: 'wren', brokenBy: ['generator_log', 'lumi_recording'], round: 'r6_surge' },
    { id: 'c_siren', claim: '사이렌이 울렸다', heldBy: 'bas', brokenBy: ['siren_box'], round: 'r7_siren' },
    { id: 'c_bas', claim: '바스가 23:45에 작업실로 내려갔다', heldBy: 'oskar', brokenBy: ['lumi_recording'], round: 'r8_bas' },
    { id: 'c_oskar', claim: '오스카는 밤새 식당에 있었다', heldBy: 'oskar', brokenBy: ['oskar_pen', 'kettle'], round: 'r9_oskar' },
    { id: 'c_paint', claim: '렌의 페인트는 오후에 묻었다', heldBy: 'wren', brokenBy: ['wet_paint_tag'], round: 'r11_paint' },
  ] satisfies Contradiction[],

  hiddenFacts: [
    { who: 'bas' as CharId, fact: '2주 전 사이렌 퓨즈를 제거하고 기록하지 않음', revealedIn: 'r7_siren' },
    { who: 'oskar' as CharId, fact: '헬레나 사무실을 뒤지고 서랍을 강제로 엶', revealedIn: 'r9_oskar' },
    { who: 'helena' as CharId, fact: '저녁 말다툼은 연출, 테오에게 코드를 넘김', revealedIn: 'r3_code' },
    { who: 'lumi' as CharId, fact: '허락 없이 사람들을 녹음해 옴', revealedIn: 'lumi_invest' },
    { who: 'wren' as CharId, fact: '방출 레버를 당기고 출력지를 찢음', revealedIn: 'r11_paint' },
    { who: 'theo' as CharId, fact: '워든을 재가동하고 보고를 97.3으로 송출되게 함', revealedIn: 'r13_motive' },
  ],

  facilitySecret: '1979–1998 케스트럴 타워는 계곡의 민간 전화를 감청·녹음해 알데인 시그널에 넘겼다. KST-D 릴이 그 녹음이며, 재단 명령 88-D는 이를 탑과 함께 폐기하려 했다.',
};

/** Minutes from 18:00 so the night can be compared across midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const hours = h < 12 ? h + 24 : h;
  return (hours - 18) * 60 + m;
}
