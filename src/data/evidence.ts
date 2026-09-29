import type { EvidenceDef, HotspotDef, StatementDef } from './types';

// ---------------------------------------------------------------------------
// Evidence. `facts` are only what the item itself establishes — no conclusions.
// ---------------------------------------------------------------------------
export const EVIDENCE: EvidenceDef[] = [
  {
    id: 'vault_panel',
    title: '금고실 방출 패널',
    kind: 'record',
    icon: 'panel',
    description: '금고실 문 옆 소화 설비 패널. 붉은 램프가 켜져 있다.',
    facts: ['CO₂ 방출: 23:47', '방출과 동시에 금고실 72시간 자동 잠금', '잠금 해제: 06:12 (엔지니어 키)'],
    obtainedAt: 'archive',
    required: true,
  },
  {
    id: 'keypad_log',
    title: '금고실 키패드 기록',
    kind: 'record',
    icon: 'keypad',
    description: '금고실 문 키패드의 출입 기록 화면.',
    facts: ['23:21 개방 — 관장 코드', '그 뒤 06:12 엔지니어 키 개방 전까지 기록 없음'],
    obtainedAt: 'archive',
    required: true,
  },
  {
    id: 'theo_headphones',
    title: '테오의 헤드폰과 데크',
    kind: 'object',
    icon: 'headphones',
    description: '테오가 쓰고 있던 밀폐형 스튜디오 헤드폰과 휴대용 릴 데크. 데크엔 D 선반의 릴이 걸려 있다.',
    facts: ['외부 소음을 차단하는 밀폐형 헤드폰', '데크 볼륨 노브가 최대 위치', '데크 배터리는 방전되어 정지'],
    obtainedAt: 'vault',
    required: true,
  },
  {
    id: 'helena_note',
    title: '접힌 쪽지',
    kind: 'object',
    icon: 'note',
    description: '테오의 재킷 안주머니에서 나온 쪽지. 어제 저녁 식사 때 헬레나가 테오에게 던진 "계약서"와 같은 종이다.',
    facts: ['"선반 D. 4-1-7-2. 오늘 밤, 다들 당신이 방송 중이라고 생각할 때. — H"', '헬레나의 필체', '적힌 숫자는 금고실 코드 자릿수와 같다'],
    obtainedAt: 'vault',
    required: true,
  },
  {
    id: 'inner_release',
    title: '금고실 안쪽 방출기',
    kind: 'object',
    icon: 'lever',
    description: '금고실 문 안쪽 벽의 수동 방출기.',
    facts: ['봉인 태그 온전함', '안전핀 제자리', '이 방출기는 사용되지 않았다'],
    obtainedAt: 'vault',
    required: true,
  },
  {
    id: 'siren_box',
    title: '사이렌 단자함',
    kind: 'object',
    icon: 'fuse',
    description: '금고실 경보 사이렌의 단자함. 뚜껑 나사가 풀려 있다.',
    facts: ['사이렌 퓨즈 홀더가 비어 있다', '홀더 안쪽에 먼지가 고르게 쌓여 있다', '퓨즈 없이는 방출 전 사이렌이 울리지 않는다'],
    obtainedAt: 'vault',
    required: true,
  },
  {
    id: 'oskar_pen',
    title: '이니셜 만년필',
    kind: 'object',
    icon: 'pen',
    description: '헬레나 사무실 책상 밑에 떨어져 있던 검은 만년필. 금색 클립.',
    facts: ['몸통에 "O.W." 각인', '바로 위 책상 서랍은 억지로 열려 있다', '사무실엔 직원 복도(객실동) 문이 있다'],
    obtainedAt: 'archive',
    required: true,
  },
  {
    id: 'order_88d',
    title: '재단 명령 88-D',
    kind: 'record',
    icon: 'order',
    description: '억지로 열린 헬레나의 서랍 속 알데인 재단 문서.',
    facts: ['KST-D 릴 전량을 철거 시 폐기할 것', '내용 분류: 1979–1998 민간 전화 감청 녹음', 'D 릴 외부 반출·공개 시 형사 고발'],
    obtainedAt: 'archive',
    required: true,
  },
  {
    id: 'autostart_card',
    title: '스튜디오 B 자동 재생 카드',
    kind: 'object',
    icon: 'reel',
    description: '스튜디오 B 릴 머신에 끼워진 카드. 테오의 필체. 테이프는 끝까지 감겨 있다.',
    facts: ['"나이트 케스트럴 — 최종 — 사전 녹음 75:00"', '"자동 시작 23:30"', '75분 = 23:30부터 00:45까지'],
    obtainedAt: 'studio_b',
    required: true,
  },
  {
    id: 'studio_log',
    title: '스튜디오 B 출입 기록',
    kind: 'record',
    icon: 'badge',
    description: '스튜디오 B 문 배지 리더의 기록.',
    facts: ['테오 린드크비스트 — 퇴실 23:14', '이후 06:20(렌)까지 출입 없음'],
    obtainedAt: 'studio_b',
    required: true,
  },
  {
    id: 'generator_log',
    title: '발전기 기록',
    kind: 'record',
    icon: 'generator',
    description: '발전기 제어반의 이벤트 기록.',
    facts: ['주전원 차단 23:52', '발전기 수동 기동 23:53 — B. 코르드', '방송용 전원은 무정전 장치로 유지'],
    obtainedAt: 'workshop',
    required: true,
  },
  {
    id: 'fire_printout',
    title: '찢긴 화재 패널 출력지',
    kind: 'record',
    icon: 'printout',
    description: '가스실 화재 패널의 도트 프린터 용지. 모든 설비 이벤트가 찍힌다.',
    facts: ['22:00 자가 점검 이상 없음', '— 그 아래 한 칸이 찢겨 나감 —', '23:52 주전원 차단'],
    obtainedAt: 'workshop',
    required: true,
  },
  {
    id: 'release_station',
    title: '가스실 수동 방출기',
    kind: 'object',
    icon: 'lever',
    description: '작업실 가스실 벽의 금고실 구역 수동 방출기. 덮개는 노란 안전 페인트로 새로 칠해졌다.',
    facts: ['봉인 태그가 끊겨 있다', '안전핀이 비뚤게 다시 꽂혀 있다', '덜 마른 페인트에 긁힌 자국'],
    obtainedAt: 'workshop',
    required: true,
  },
  {
    id: 'wet_paint_tag',
    title: '칠 주의 태그',
    kind: 'object',
    icon: 'tag',
    description: '방출기 옆에 걸린 종이 태그. 바스의 글씨.',
    facts: ['"칠 주의 — 21:10 — B.K."', '"아침까지 만지지 말 것"'],
    obtainedAt: 'workshop',
    required: true,
  },
  {
    id: 'lumi_recording',
    title: '루미의 야간 녹음',
    kind: 'testimony',
    icon: 'recorder',
    description: '루미가 아트리움에서 23:25–00:05에 녹음한 소리와 그녀의 타임코드 메모.',
    facts: [
      '23:30 아트리움 스피커로 방송 시작',
      '23:45 발소리 · 작업실 계단 문 삐걱',
      '23:47 낮고 깊은 "쿵"',
      '23:49 작업실 문 삐걱 · 빠른 발소리가 객실동 쪽으로',
      '23:51 바스: "좋은 밤이다, 꼬마. 불이 깜빡거리네." · 작업실 문 삐걱',
      '23:52 정전 — 방송은 계속',
      '루미 목격: 23:45 머리 높이의 작은 파란 불빛이 깜빡이며 계단으로',
      '루미 목격: 식당은 밤새 불이 꺼져 있었다',
    ],
    obtainedAt: 'atrium',
    required: true,
  },
  {
    id: 'wren_headset',
    title: '렌의 헤드셋',
    kind: 'testimony',
    icon: 'headset',
    description: '렌이 늘 쓰는 한쪽 귀 인터컴 헤드셋.',
    facts: ['테오 채널을 찾는 동안 파란 LED가 깜빡인다', '이어컵에 노란 페인트 얼룩', '렌의 설명: "어제 오후 바스를 돕다가 묻었다"'],
    obtainedAt: 'guest_wing',
    required: true,
  },
  {
    id: 'kettle',
    title: '식은 주전자',
    kind: 'object',
    icon: 'kettle',
    description: '식당 카운터의 전기 주전자.',
    facts: ['완전히 식어 있다', '수위 눈금이 가득', '찻잎 통의 봉인이 뜯기지 않았다'],
    obtainedAt: 'canteen',
    required: false,
  },
  {
    id: 'd_reel',
    title: 'KST-D 릴',
    kind: 'object',
    icon: 'reel',
    description: 'D 선반의 릴. 라벨 "KST-D-1983-114". 데크에 걸어 잠깐 들어 보았다.',
    facts: ['교환원 신호음 뒤 두 사람의 사적인 전화 통화', '공테이프가 아니다'],
    obtainedAt: 'vault',
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Statements recorded during investigation (claims — true or not).
// ---------------------------------------------------------------------------
export const STATEMENTS: StatementDef[] = [
  { id: 'st_helena_room', who: 'helena', text: '23시부터 내 방에서 혼자 방송을 들었다.' },
  { id: 'st_helena_code', who: 'helena', text: '금고실 코드는 나만 안다.' },
  { id: 'st_bas_timeline', who: 'bas', text: '23:51쯤 불이 깜빡여 작업실로 내려갔다. 00:10까지 발전기실에 있었다.' },
  { id: 'st_bas_siren', who: 'bas', text: '사이렌은 울렸을 것이다. 110데시벨이다.' },
  { id: 'st_bas_paint', who: 'bas', text: '방출기 덮개는 어젯밤 21:10에 혼자 칠했다.' },
  { id: 'st_oskar_canteen', who: 'oskar', text: '23시부터 새벽까지 식당에서 서류를 봤다. 아무도 못 봤다.' },
  { id: 'st_wren_room', who: 'wren', text: '밤새 내 방에서 방송을 처음부터 끝까지 들었다.' },
  { id: 'st_wren_paint', who: 'wren', text: '헤드셋 페인트는 어제 오후 바스를 돕다가 묻었다.' },
  { id: 'st_lumi_atrium', who: 'lumi', text: '23:25부터 00:05까지 아트리움에서 녹음했다.' },
];

// ---------------------------------------------------------------------------
// Hotspots. Positions are room-local metres (see locations.ts).
// ---------------------------------------------------------------------------
const INV = ['INVESTIGATION', 'PRE_HEARING'] as const;

export const HOTSPOTS: HotspotDef[] = [
  // vault — crime scene
  { id: 'hs_body', room: 'vault', pos: [0.6, 0.55, -2.9], label: '테오', states: [...INV], script: 'hs_body', grants: 'theo_headphones' },
  { id: 'hs_pocket', room: 'vault', pos: [-0.2, 0.45, -2.4], label: '테오의 재킷 안주머니', states: [...INV], script: 'hs_pocket', grants: 'helena_note' },
  { id: 'hs_inner_release', room: 'vault', pos: [2.8, 1.3, 3.2], label: '안쪽 수동 방출기', states: [...INV], script: 'hs_inner_release', grants: 'inner_release' },
  { id: 'hs_siren_box', room: 'vault', pos: [-2.8, 2.1, 3.2], label: '사이렌 단자함', states: [...INV], script: 'hs_siren_box', grants: 'siren_box' },
  { id: 'hs_d_shelf', room: 'vault', pos: [-1.2, 1.4, -3.7], label: 'D 선반', states: [...INV], script: 'hs_d_shelf', grants: 'd_reel' },
  // archive
  { id: 'hs_vault_panel', room: 'archive', pos: [4.7, 1.5, -5.8], label: '금고실 방출 패널', states: [...INV], script: 'hs_vault_panel', grants: 'vault_panel' },
  { id: 'hs_keypad', room: 'archive', pos: [1.3, 1.35, -5.8], label: '금고실 키패드', states: [...INV], script: 'hs_keypad', grants: 'keypad_log' },
  { id: 'hs_office_desk', room: 'archive', pos: [-5.4, 0.95, 4.2], label: '헬레나의 책상 서랍', states: [...INV], script: 'hs_office_desk', grants: 'order_88d' },
  { id: 'hs_office_floor', room: 'archive', pos: [-4.4, 0.15, 3.7], label: '책상 밑', states: [...INV], script: 'hs_office_floor', grants: 'oskar_pen' },
  { id: 'hs_photo', room: 'archive', pos: [6.9, 2.0, 2.5], label: '1979년 직원 사진', states: ['ARRIVAL', 'DINNER', 'EVENING', ...INV], script: 'hs_photo' },
  // studio b
  { id: 'hs_reel_machine', room: 'studio_b', pos: [-4.1, 1.35, 1.8], label: '릴 머신', states: [...INV], script: 'hs_reel_machine', grants: 'autostart_card' },
  { id: 'hs_door_reader', room: 'studio_b', pos: [1.3, 1.3, 4.85], label: '배지 리더', states: [...INV], script: 'hs_door_reader', grants: 'studio_log' },
  { id: 'hs_booth', room: 'studio_b', pos: [0, 1.0, -3.2], label: '부스 마이크', states: [...INV], script: 'hs_booth' },
  // workshop
  { id: 'hs_generator', room: 'workshop', pos: [-3.6, 1.35, 3.1], label: '발전기 제어반', states: [...INV], script: 'hs_generator', grants: 'generator_log' },
  { id: 'hs_fire_panel', room: 'workshop', pos: [3.0, 1.45, -5.8], label: '화재 패널 프린터', states: [...INV], script: 'hs_fire_panel', grants: 'fire_printout' },
  { id: 'hs_release_station', room: 'workshop', pos: [4.3, 1.3, -5.8], label: '금고실 구역 수동 방출기', states: [...INV], script: 'hs_release_station', grants: 'release_station' },
  { id: 'hs_paint_tag', room: 'workshop', pos: [5.1, 0.95, -5.8], label: '종이 태그', states: [...INV], script: 'hs_paint_tag', grants: 'wet_paint_tag' },
  { id: 'hs_station_evening', room: 'workshop', pos: [4.3, 1.3, -5.8], label: '방출기 덮개', states: ['EVENING'], script: 'hs_station_evening' },
  // canteen
  { id: 'hs_kettle', room: 'canteen', pos: [5.0, 1.15, 1.5], label: '전기 주전자', states: [...INV], script: 'hs_kettle', grants: 'kettle' },
  { id: 'hs_dinner', room: 'canteen', pos: [-1.0, 0.95, -1.8], label: '저녁 식탁', states: ['DINNER'], script: 'dinner' },
  // atrium
  { id: 'hs_dial', room: 'atrium', pos: [0, 1.0, 0], label: '헤일로 다이얼', states: ['ARRIVAL', 'DINNER', 'EVENING', ...INV, 'EPILOGUE'], script: 'hs_dial' },
  { id: 'hs_mural', room: 'atrium', pos: [0, 2.2, -7.8], label: '벽화', states: ['ARRIVAL', 'EVENING'], script: 'hs_mural' },
];

export const EVIDENCE_BY_ID = new Map(EVIDENCE.map((e) => [e.id, e]));
export const REQUIRED_EVIDENCE = EVIDENCE.filter((e) => e.required).map((e) => e.id);
export const HOTSPOT_BY_ID = new Map(HOTSPOTS.map((h) => [h.id, h]));
export const STATEMENT_BY_ID = new Map(STATEMENTS.map((s) => [s.id, s]));
