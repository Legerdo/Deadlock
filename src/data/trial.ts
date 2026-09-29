import type { Script, TrialStage } from './types';

// The Crosswire Account. Verbs: CUT (contradiction), PATCH (support),
// TUNE (critical choice), REEL (timeline reconstruction).
// Every answer below is deducible from evidence obtainable in INVESTIGATION.

export const HEARING_OPENING: Script = [
  { cmd: 'title', text: 'CROSSWIRE ACCOUNT', sub: '교차 보고 심의' },
  { who: 'warden', t: '보고 심의를 개시합니다. 거주자는 한 목소리로 시각, 장소, 방법, 행위자를 확정하십시오.' },
  { who: 'warden', t: '진술 속 모순은 증거로 잘라내십시오 — CUT. 흔들리는 옳은 진술은 증거로 이어 붙이십시오 — PATCH.' },
  { who: 'oskar', e: 'neutral', t: '형식적인 절차군요. 사고라는 걸 확인하고 문이나 엽시다.' },
  { who: 'helena', e: 'neutral', t: '형식이라도, 정확해야 합니다.' },
  { who: 'kai', e: 'neutral', t: '(테오의 빈 자리에 그의 헤드폰을 올려 두었다. 이번엔 내가 들을 차례다.)' },
];

export const TRIAL: TrialStage[] = [
  // ───────────────────────── STAGE I — TIME ─────────────────────────
  {
    id: 'stage_time',
    group: 'hearing',
    numeral: 'I',
    title: '시각',
    titleEn: 'WHEN',
    intro: [{ who: 'wren', e: 'neutral', t: '시각은 간단해요. 다들 들었잖아요. 테오는 00시 45분까지 방송했어요.' }],
    rounds: [
      {
        id: 'r1_live',
        kind: 'cut',
        title: '살아 있는 목소리',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        statements: [
          { id: 's1', who: 'wren', e: 'neutral', t: '테오는 23시 30분부터 00시 45분까지 생방송을 했어요.', mark: '생방송' },
          { id: 's2', who: 'oskar', e: 'neutral', t: '모두 스피커로 그의 목소리를 들었죠. 정전 중에도 방송은 끊기지 않았고요.', mark: '정전 중에도 방송은 끊기지 않았고' },
          { id: 's3', who: 'bas', e: 'neutral', t: '그러니 가스는 방송이 끝난 뒤에 터진 거야. 뭘 찾으러 금고실에 들어갔다가.', mark: '방송이 끝난 뒤' },
          { id: 's4', who: 'lumi', e: 'neutral', t: '하지만 금고실 패널엔 23시 47분이라고 찍혀 있었어요...' },
          { id: 's5', who: 'oskar', e: 'happy', t: '패널은 폭풍 때문에 오작동했겠죠. 오래된 기계니까.', mark: '오작동' },
        ],
        answer: { statement: 's1', evidence: ['autostart_card', 'studio_log'] },
        partial: [
          { statement: 's3', evidence: 'vault_panel', reply: { who: 'oskar', e: 'happy', t: '패널 시각만으론 안 됩니다. 우린 모두 그의 목소리를 들었어요. 그 전제부터 깨 보시죠.' } },
          { statement: 's5', evidence: 'vault_panel', reply: { who: 'oskar', e: 'happy', t: '패널이 옳다는 증거로 패널을 내미시는 겁니까? "생방송"이라는 말을 먼저 무너뜨려 보세요.' } },
        ],
        wrong: [
          { who: 'oskar', e: 'happy', t: '그 증거로 뭘 증명하겠다는 겁니까? 우리 귀를 믿으시죠.' },
          { who: 'wren', e: 'thinking', t: '...그건 방송이 아니었다는 증거가 못 돼요.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '그건 생방송이 아니었어요.' },
          { cmd: 'cutin', id: 'cutin_empty_booth', caption: '23:30 · 빈 부스' },
          { who: 'kai', e: 'neutral', t: '스튜디오 B 릴 머신에 테오의 글씨로 된 카드가 있었어요. "사전 녹음 75분. 자동 시작 23:30."' },
          { who: 'kai', e: 'neutral', t: '그리고 스튜디오 출입 기록. 테오는 23시 14분에 나간 뒤 한 번도 돌아오지 않았어요.' },
          { who: 'wren', e: 'surprised', t: '...사전 녹음? 테오가? 저한테 한 마디도 없이?' },
          { who: 'kai', e: 'thinking', t: '"리허설"이라던 저녁 시간에 방송 전체를 녹음한 거예요. 정전 때 한 마디 언급도 없이 이어진 건, 이미 녹음된 목소리였기 때문이에요.' },
          { who: 'lumi', e: 'surprised', t: '맞아요! 생방송이었으면 테오 씨가 "정전이네요" 한 마디는 했을 거예요!' },
          { who: 'oskar', e: 'angry', t: '그래서요? 녹음이었다 쳐도, 그가 언제 죽었는지는 모르잖습니까.' },
        ],
      },
      {
        id: 'r2_time',
        kind: 'tune',
        title: '죽음의 시각',
        prompt: '다이얼을 돌려 빠진 시각을 맞춰라.',
        question: '테오가 숨진 시각은?',
        axis: 'time',
        options: [
          { id: 't2314', label: '23:14', sub: '스튜디오 퇴실' },
          { id: 't2321', label: '23:21', sub: '금고실 개방' },
          { id: 't2347', label: '23:47', sub: 'CO₂ 방출' },
          { id: 't2352', label: '23:52', sub: '정전' },
          { id: 't0045', label: '00:45', sub: '방송 종료' },
        ],
        answer: 't2347',
        wrong: [{ who: 'helena', e: 'angry', t: '근거 없는 시각은 기록할 수 없습니다. 금고실이 언제 닫혔는지 생각하세요.' }],
        success: [
          { who: 'kai', e: 'neutral', t: '23시 47분. 금고실 패널의 방출 시각이에요. 금고실은 그 순간 잠겼고, 오늘 아침 06시 12분 바스 씨가 열 때까지 아무도 드나들지 못했어요.' },
          { who: 'lumi', e: 'neutral', t: '제 녹음에도 23시 47분에 "쿵" 소리가 있어요. 낮고 깊은 소리.' },
          { who: 'warden', t: '시각 항목을 기록했습니다. 23:47.' },
        ],
      },
    ],
  },

  // ───────────────────────── STAGE II — PLACE ─────────────────────────
  {
    id: 'stage_place',
    group: 'hearing',
    numeral: 'II',
    title: '장소',
    titleEn: 'WHERE',
    intro: [{ who: 'oskar', e: 'happy', t: '좋습니다. 23시 47분, 금고실. 그렇다면 답은 뻔하군요.' }],
    rounds: [
      {
        id: 'r3_code',
        kind: 'cut',
        title: '관장의 코드',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        statements: [
          { id: 's1', who: 'oskar', e: 'happy', t: '금고실 문은 23시 21분에 관장님의 코드로 열렸습니다.', mark: '관장님의 코드' },
          { id: 's2', who: 'oskar', e: 'angry', t: '그 코드는 헬레나 관장만 압니다. 그러니 관장님이 직접 문을 열고 테오를 들인 겁니다.', mark: '관장님이 직접 문을 열고' },
          { id: 's3', who: 'helena', e: 'angry', t: '저는 23시부터 제 방에 있었습니다.', mark: '제 방에 있었습니다' },
          { id: 's4', who: 'oskar', e: 'neutral', t: '어제 저녁 두 분이 싸우는 걸 모두 봤죠. 동기는 충분합니다.', mark: '두 분이 싸우는 걸' },
        ],
        answer: { statement: 's2', evidence: ['helena_note'] },
        partial: [
          { statement: 's1', evidence: 'keypad_log', reply: { who: 'oskar', e: 'happy', t: '보세요, 기록도 제 말이 맞다고 하잖습니까. 관장 코드로 열렸다고.' } },
        ],
        wrong: [
          { who: 'oskar', e: 'happy', t: '그건 관장님 알리바이도, 제 말의 반박도 되지 않는군요.' },
          { who: 'helena', e: 'neutral', t: '...그걸로는 저를 변호할 수 없습니다, 카이 씨.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '코드를 아는 사람은 한 명 더 있었어요. 테오 본인이요.' },
          { who: 'kai', e: 'neutral', t: '테오의 재킷 안주머니에서 이 쪽지가 나왔어요. "선반 D. 4-1-7-2. 오늘 밤, 다들 당신이 방송 중이라고 생각할 때. — H"' },
          { who: 'kai', e: 'thinking', t: '저녁 식사 때 관장님이 던진 "계약서". 테오는 펴 보지도 않고 안주머니에 넣었죠. 펴 볼 필요가 없었던 거예요.' },
          { who: 'helena', e: 'distressed', t: '...그 싸움은 연기였습니다. 벤트 씨가 보는 앞에서, 제가 테오 편이 아니라는 걸 보여 줘야 했으니까.' },
          { who: 'helena', e: 'neutral', t: '저는 D 선반을 폐기하라는 명령을 받았고, 따르지 않기로 했습니다. 방송이 나가는 동안 테오가 릴을 꺼내 가게 할 생각이었죠.' },
          { who: 'oskar', e: 'surprised', t: '관장님, 지금 재단 명령을—' },
          { who: 'helena', e: 'angry', t: '네. 공개적으로 거부하는 겁니다.' },
        ],
      },
      {
        id: 'r4_accident',
        kind: 'cut',
        title: '사고라는 이름',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        intro: [{ who: 'oskar', e: 'angry', t: '좋습니다. 그렇다면 더더욱 사고군요.' }],
        statements: [
          { id: 's1', who: 'oskar', e: 'neutral', t: '테오는 혼자 금고실에 있었습니다. 어둠 속에서 안쪽 방출기를 실수로 건드린 거죠.', mark: '안쪽 방출기를 실수로 건드린' },
          { id: 's2', who: 'helena', e: 'neutral', t: '금고실 문 옆에 안쪽 수동 방출기가 있긴 합니다.', mark: '안쪽 수동 방출기' },
          { id: 's3', who: 'wren', e: 'thinking', t: '어두운 데서 릴을 꺼내다가 팔꿈치로... 그럴 수도 있잖아요.' },
          { id: 's4', who: 'bas', e: 'neutral', t: '안쪽이든 바깥이든, 핀을 뽑아야 레버가 당겨져.', mark: '핀을 뽑아야' },
        ],
        answer: { statement: 's1', evidence: ['inner_release'] },
        wrong: [
          { who: 'oskar', e: 'happy', t: '그 증거가 테오의 팔꿈치를 막아 주기라도 했답니까?' },
          { who: 'bas', e: 'neutral', t: '그건 안쪽 방출기하고는 상관없는 얘기야, 아가씨.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '안쪽 방출기의 봉인 태그는 멀쩡했어요. 안전핀도 제자리였고요.' },
          { who: 'kai', e: 'neutral', t: '팔꿈치로 핀을 뽑을 수는 없어요. 금고실 안에서는 아무도 가스를 방출하지 않았어요.' },
          { who: 'bas', e: 'distressed', t: '...그럼 남은 건 하나뿐이야.' },
        ],
      },
      {
        id: 'r5_place',
        kind: 'tune',
        title: '방출 지점',
        prompt: '다이얼을 돌려 빠진 장소를 맞춰라.',
        question: '가스는 어디에서 방출되었나?',
        axis: 'place',
        options: [
          { id: 'p_inner', label: '금고실 안쪽 방출기', sub: 'VAULT' },
          { id: 'p_gas', label: '작업실 가스실 방출기', sub: 'WORKSHOP' },
          { id: 'p_auto', label: '감지기 자동 방출', sub: 'AUTO' },
          { id: 'p_console', label: '스튜디오 B 콘솔', sub: 'STUDIO B' },
        ],
        answer: 'p_gas',
        wrong: [{ who: 'bas', e: 'neutral', t: '거긴 아니야. 봉인이 끊긴 곳이 어딘지 떠올려 봐.' }],
        success: [
          { who: 'kai', e: 'neutral', t: '작업실 가스실의 수동 방출기. 봉인 태그가 끊겨 있었고, 안전핀은 비뚤게 다시 꽂혀 있었어요.' },
          { who: 'kai', e: 'thinking', t: '새로 칠한 노란 페인트 위엔 무언가 둥근 것에 스친 자국이 남아 있었고요.' },
          { who: 'warden', t: '장소 항목을 기록했습니다. 사망 장소: 금고실. 방출 지점: 작업실 가스실.' },
        ],
      },
    ],
  },

  // ───────────────────────── STAGE III — METHOD ─────────────────────────
  {
    id: 'stage_method',
    group: 'hearing',
    numeral: 'III',
    title: '방법',
    titleEn: 'HOW',
    intro: [{ who: 'wren', e: 'distressed', t: '잠깐만요. 누가 손으로 당겼다고 단정할 수는 없잖아요.' }],
    rounds: [
      {
        id: 'r6_surge',
        kind: 'patch',
        title: '폭풍의 탓',
        prompt: '옳은 진술의 표시된 구절에 증거를 이어 붙여라.',
        statements: [
          { id: 's1', who: 'wren', e: 'distressed', t: '그날 밤 폭풍이 엄청났어요. 전력 서지로 설비가 스스로 작동했을 수도 있어요.', mark: '전력 서지로 설비가 스스로 작동' },
          { id: 's2', who: 'oskar', e: 'neutral', t: '오래된 설비는 폭풍 때 오작동하기 마련이죠.', mark: '폭풍 때 오작동' },
          { id: 's3', who: 'lumi', e: 'neutral', t: '근데... 불은 "쿵" 소리가 나고 한참 뒤에야 나갔어요.', mark: '한참 뒤에야 나갔어요' },
          { id: 's4', who: 'bas', e: 'neutral', t: '자동 방출은 감지기 두 개가 동시에 울려야 돼.', mark: '감지기 두 개가 동시에' },
        ],
        answer: { statement: 's3', evidence: ['generator_log', 'lumi_recording'] },
        partial: [
          { statement: 's4', evidence: 'fire_printout', reply: { who: 'wren', e: 'distressed', t: '찢긴 종이로는 감지기가 안 울렸다는 걸 증명할 수 없잖아요... 시간 순서부터 확인해 줘요.' } },
        ],
        wrong: [
          { who: 'wren', e: 'distressed', t: '그걸로는 폭풍이 아니었다는 게 증명되지 않아요.' },
          { who: 'oskar', e: 'neutral', t: '엉뚱한 진술에 엉뚱한 증거를 붙이시는군요.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '루미 말이 맞아요. 발전기 기록 — 주전원 차단 23시 52분, 발전기 수동 기동 23시 53분.' },
          { who: 'kai', e: 'neutral', t: '가스는 그보다 5분 먼저, 23시 47분에 방출됐어요. 전력 문제는 가스가 나온 뒤에 왔어요. 원인이 결과보다 늦게 올 수는 없죠.' },
          { who: 'kai', e: 'thinking', t: '그리고 화재 패널 프린터. 22시 자가 점검과 23시 52분 정전 사이 한 칸이 찢겨 나가 있었어요. 자동 방출이었다면 누가 그 기록을 숨길 이유가 없어요.' },
          { who: 'bas', e: 'distressed', t: '...누군가 수동 방출 기록을 뜯어 간 거야.' },
          { who: 'warden', t: '방법 항목: 작업실 수동 방출기에 의한 이산화탄소 방출. 기록했습니다.' },
        ],
      },
      {
        id: 'r7_siren',
        kind: 'cut',
        title: '30초의 사이렌',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        intro: [{ who: 'oskar', e: 'angry', t: '하지만 설명이 안 되는 게 있습니다. 사이렌이요.' }],
        statements: [
          { id: 's1', who: 'oskar', e: 'neutral', t: '방출 전에 30초 동안 사이렌이 울린다면서요.', mark: '30초 동안 사이렌' },
          { id: 's2', who: 'bas', e: 'neutral', t: '그 사이렌은 110데시벨이야. 헤드폰을 썼든 말든 들렸을 거야.', mark: '헤드폰을 썼든 말든 들렸을' },
          { id: 's3', who: 'lumi', e: 'distressed', t: '테오 씨는 그 큰 헤드폰을 쓰고 있었어요...', mark: '큰 헤드폰' },
          { id: 's4', who: 'oskar', e: 'happy', t: '그러니 테오는 경고를 무시하고 남은 겁니다. 안타깝지만 본인 선택이죠.', mark: '경고를 무시하고 남은' },
        ],
        answer: { statement: 's2', evidence: ['siren_box'] },
        partial: [
          { statement: 's4', evidence: 'theo_headphones', reply: { who: 'bas', e: 'neutral', t: '헤드폰으로 110데시벨을 막는다고? 턱도 없어. 그 사이렌은 이빨로도 느껴져.' } },
        ],
        wrong: [
          { who: 'bas', e: 'neutral', t: '그게 사이렌하고 무슨 상관이야.' },
          { who: 'oskar', e: 'happy', t: '사이렌은 울렸습니다. 그 증거로는 아무것도 바뀌지 않아요.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '사이렌은 울리지 않았어요.' },
          { who: 'kai', e: 'neutral', t: '금고실 사이렌 단자함의 퓨즈 홀더가 비어 있었어요. 안쪽엔 먼지가 고르게 쌓여 있었고요. 어젯밤 빠진 게 아니에요.' },
          { who: 'bas', e: 'distressed', t: '......내가 뺐어. 2주 전에.' },
          { who: 'bas', e: 'distressed', t: '폭풍 때마다 헛울려서... 철거까지 몇 주 안 남았으니 그냥 빼 두자고. 기록도 안 했어.' },
          { who: 'kai', e: 'thinking', t: '테오는 밀폐형 헤드폰에 볼륨 최대로 D 릴을 듣고 있었어요. 사이렌도 없었고요. 아무것도 들을 수 없었어요.' },
          { who: 'helena', e: 'neutral', t: '숨긴 건 잘못입니다. 하지만 퓨즈를 뺀 사람이 레버를 당긴 사람은 아닙니다.' },
        ],
      },
    ],
  },

  // ───────────────────────── STAGE IV — ALIBI ─────────────────────────
  {
    id: 'stage_alibi',
    group: 'hearing',
    numeral: 'IV',
    title: '알리바이',
    titleEn: 'WHO WAS THERE',
    intro: [{ who: 'oskar', e: 'angry', t: '그럼 레버를 당긴 사람은 누굽니까? 그날 밤 작업실에 있었던 사람은 하나뿐이죠.' }],
    rounds: [
      {
        id: 'r8_bas',
        kind: 'patch',
        title: '계단 문의 노래',
        prompt: '옳은 진술의 표시된 구절에 증거를 이어 붙여라.',
        statements: [
          { id: 's1', who: 'oskar', e: 'angry', t: '저는 바스 씨가 23시 45분에 작업실로 내려가는 소리를 들었습니다.', mark: '23시 45분에 작업실로 내려가는' },
          { id: 's2', who: 'bas', e: 'distressed', t: '난 23시 51분에 내려갔어. 가는 길에 루미한테 인사도 했고.', mark: '23시 51분에 내려갔어' },
          { id: 's3', who: 'oskar', e: 'neutral', t: '발전기를 돌린 것도, 페인트를 칠한 것도 바스 씨입니다.', mark: '페인트를 칠한 것도' },
          { id: 's4', who: 'wren', e: 'thinking', t: '바스 아저씨라면 사이렌이 없다는 것도 알고 있었겠죠...', mark: '사이렌이 없다는 것도' },
        ],
        answer: { statement: 's2', evidence: ['lumi_recording'] },
        partial: [
          { statement: 's2', evidence: 'generator_log', reply: { who: 'oskar', e: 'happy', t: '발전기는 53분에 돌았죠. 그 전에 이미 내려와 있었다면요? 언제 계단을 지났는지가 문제입니다.' } },
        ],
        wrong: [
          { who: 'oskar', e: 'happy', t: '바스 씨의 발걸음을 증명하는 건 그게 아닙니다.' },
          { who: 'bas', e: 'distressed', t: '고맙다만... 그걸론 날 못 건져, 아가씨.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '루미의 녹음에 남아 있어요. 23시 51분, 바스 씨 목소리. "좋은 밤이다, 꼬마. 불이 깜빡거리네." 그 직후 작업실 문이 삐걱이는 소리.' },
          { who: 'kai', e: 'neutral', t: '그런데 작업실 문은 그 전에 두 번 울렸어요. 23시 45분에 한 번, 23시 49분에 한 번.' },
          { who: 'kai', e: 'thinking', t: '누군가 방출 2분 전에 내려갔다가, 2분 뒤에 올라온 거예요.' },
          { who: 'lumi', e: 'neutral', t: '그 사람은 계단을 올라와서 객실동 쪽으로 뛰어갔어요.' },
          { who: 'kai', e: 'neutral', t: '벤트 씨. 23시 45분에 소리를 들었다고 하셨죠. 어디서요?' },
        ],
      },
      {
        id: 'r9_oskar',
        kind: 'cut',
        title: '식당의 불빛',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        statements: [
          { id: 's1', who: 'oskar', e: 'neutral', t: '저는 23시부터 새벽까지 식당에서 서류를 보고 있었습니다.', mark: '식당에서 서류를 보고' },
          { id: 's2', who: 'oskar', e: 'happy', t: '식당 문 너머로 계단 쪽 발소리가 들렸죠.', mark: '계단 쪽 발소리' },
          { id: 's3', who: 'lumi', e: 'neutral', t: '근데 식당은 밤새 캄캄했어요...', mark: '밤새 캄캄했어요' },
          { id: 's4', who: 'oskar', e: 'angry', t: '어두운 데서 일하는 게 취향입니다. 불만 있습니까?', mark: '어두운 데서 일하는 게 취향' },
        ],
        answer: { statement: 's1', evidence: ['oskar_pen', 'kettle'] },
        partial: [
          { statement: 's4', evidence: 'lumi_recording', reply: { who: 'oskar', e: 'angry', t: '불을 안 켠 게 죄입니까? 제가 식당에 없었다는 증거를 대시죠.' } },
        ],
        wrong: [
          { who: 'oskar', e: 'angry', t: '그걸로 제가 식당에 없었다는 게 증명됩니까?' },
          { who: 'oskar', e: 'happy', t: '법정이었다면 기각입니다, 복원사.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '당신 만년필은 식당이 아니라 헬레나 관장님 사무실 책상 밑에 있었어요. 억지로 열린 서랍 바로 아래.' },
          { if: 'ev:kettle', then: [{ who: 'kai', e: 'neutral', t: '식당 주전자는 차갑고 물도 가득했어요. 찻잎 통은 봉인도 안 뜯겼고요. 밤새 거기서 차를 마신 사람은 없어요.' }] },
          { who: 'oskar', e: 'surprised', t: '......' },
          { who: 'oskar', e: 'angry', t: '좋습니다. 그래요. 23시 35분부터 00시 20분까지 관장 사무실에 있었습니다. 직원 복도로 들어갔죠.' },
          { who: 'oskar', e: 'neutral', t: '재단은 관장이 명령을 따를지 확신하지 못했어요. 확인하려 했을 뿐입니다.' },
          { who: 'kai', e: 'neutral', t: '그리고 서랍에서 이걸 보셨겠죠. 재단 명령 88-D. "KST-D 릴 전량 철거 시 폐기. 분류: 1979–1998 민간 전화 감청 녹음."' },
          { who: 'lumi', e: 'surprised', t: '감청...? 이 탑이 사람들 전화를 엿들었다고요?' },
          { who: 'helena', e: 'neutral', t: '케스트럴은 20년 동안 방송국이자, 귀였습니다. 계곡의 모든 통화가 알데인 시그널로 넘어갔죠. D 선반은 공테이프가 아니라 그 증거입니다.' },
          { who: 'oskar', e: 'angry', t: '그건 재단의 법적 문제지, 이 사건과는—' },
          { who: 'kai', e: 'angry', t: '관련 있어요. 그 릴이 밖으로 나가는 걸 막으려던 사람이 있었으니까.' },
          { who: 'oskar', e: 'neutral', t: '...사무실에서 23시 47분쯤 바닥이 울리는 걸 느꼈습니다. 그게 전부예요. 계단은 보지 못했습니다.' },
        ],
      },
      {
        id: 'r10_person',
        kind: 'tune',
        title: '파란 불빛',
        prompt: '다이얼을 돌려 빠진 사람을 맞춰라.',
        intro: [
          { who: 'lumi', e: 'neutral', t: '23시 45분에 계단으로 내려간 사람... 얼굴은 못 봤어요.' },
          { who: 'lumi', e: 'neutral', t: '하지만 머리 높이에서 작은 파란 불빛이 깜빡이고 있었어요.' },
        ],
        question: '23:45, 파란 불빛을 달고 작업실로 내려간 사람은?',
        axis: 'person',
        options: [
          { id: 'helena', label: '헬레나', sub: 'HELENA VOSS' },
          { id: 'bas', label: '바스', sub: 'BASTIAN KORD' },
          { id: 'lumi', label: '루미', sub: 'LUMI CASTELL' },
          { id: 'oskar', label: '오스카', sub: 'OSKAR WENDT' },
          { id: 'wren', label: '렌', sub: 'WREN HOLLIS' },
        ],
        answer: 'wren',
        wrong: [{ who: 'helena', e: 'neutral', t: '그 사람에게는 깜빡이는 파란 불빛이 없습니다. 다시 생각하세요.' }],
        success: [
          { who: 'kai', e: 'angry', t: '렌. 파란 LED가 깜빡이는 헤드셋. 테오의 채널을 찾는 동안엔 계속 깜빡인다고 했죠.' },
          { who: 'wren', e: 'surprised', t: '......' },
          { who: 'kai', e: 'neutral', t: '그리고 그 헤드셋 이어컵엔 노란 페인트가 묻어 있어요. 가스실 방출기 덮개와 같은 색이에요.' },
        ],
      },
    ],
  },

  // ───────────────────────── STAGE V — HIDDEN ACTION ─────────────────────────
  {
    id: 'stage_hidden',
    group: 'hearing',
    numeral: 'V',
    title: '숨겨진 행동',
    titleEn: 'WHAT WAS HIDDEN',
    intro: [{ who: 'wren', e: 'distressed', t: '아니에요. 저는... 저는 아니에요.' }],
    rounds: [
      {
        id: 'r11_paint',
        kind: 'cut',
        title: '마르지 않은 페인트',
        prompt: '거짓 진술의 표시된 구절을 증거로 잘라내라.',
        statements: [
          { id: 's1', who: 'wren', e: 'distressed', t: '저는 밤새 제 방에서 방송을 들었어요.', mark: '밤새 제 방에서' },
          { id: 's2', who: 'wren', e: 'thinking', t: '파란 불빛은 다른 기계일 수도 있잖아요. 비상등이라든가.', mark: '다른 기계일 수도' },
          { id: 's3', who: 'wren', e: 'distressed', t: '페인트는 어제 오후에 바스 아저씨를 도와드리다가 묻은 거예요!', mark: '어제 오후에 바스 아저씨를 도와드리다가' },
          { id: 's4', who: 'bas', e: 'distressed', t: '렌...' },
        ],
        answer: { statement: 's3', evidence: ['wet_paint_tag'] },
        partial: [
          { statement: 's1', evidence: 'lumi_recording', reply: { who: 'wren', e: 'distressed', t: '발소리는 누구 것이든 될 수 있어요. 그게 저라는 증거는 없잖아요!' } },
          { statement: 's3', evidence: 'wren_headset', reply: { who: 'wren', e: 'distressed', t: '얼룩이 있다는 건 저도 인정했어요. 오후에 묻었다고요!' } },
        ],
        wrong: [
          { who: 'wren', e: 'distressed', t: '그게... 그게 무슨 상관이에요?' },
          { who: 'oskar', e: 'neutral', t: '그 증거로는 부족합니다.' },
        ],
        success: [
          { who: 'kai', e: 'angry', t: '그 덮개는 오후에 칠해진 게 아니에요.' },
          { who: 'kai', e: 'neutral', t: '페인트 태그: "칠 주의 — 21:10 — B.K." 바스 씨는 어젯밤 9시 10분에 혼자 칠했어요. 아침까지 마르지 않는 페인트로.' },
          { who: 'bas', e: 'distressed', t: '...그래. 도와준 사람은 없었어.' },
          { who: 'kai', e: 'thinking', t: '그 페인트가 헤드셋에 묻을 수 있는 건 21시 10분 이후. 그 뒤로 가스실에 간 사람은 23시 45분의 그 사람뿐이에요.' },
          { cmd: 'cutin', id: 'cutin_lever', caption: '23:47 · 가스실' },
          { who: 'wren', e: 'distressed', t: '......그는 스튜디오에 있었어요.' },
          { who: 'wren', e: 'distressed', t: '들었어요. 테오 목소리를. 스피커로. 그러니까 금고실은 비어 있어야 했어요!' },
          { who: 'wren', e: 'distressed', t: '테오 책상에서 금고실 도면을 봤어요. D 선반에 동그라미, "오늘 밤". 방송 끝나면 가겠구나, 생각했어요.' },
          { who: 'wren', e: 'distressed', t: '그 릴을 꺼내서 방송하면 테오는 전부 잃어요. 고발당하고, 감옥에 갈 수도 있었어요. 벤트 씨가 보낸 편지를 봤거든요.' },
          { who: 'wren', e: 'distressed', t: '가스가 한 번 나오면 72시간 동안 잠긴다는 걸 알았어요. 그럼 테오는 못 들어가요. 운반팀이 오기 전까지.' },
          { who: 'wren', e: 'distressed', t: '사이렌이 울릴 줄 알았어요. 만약 누가 있어도, 30초면... 30초면 나올 수 있다고...' },
          { who: 'narr', t: '렌은 헤드셋을 벗었다. 파란 불빛은 계속 깜빡였다. 대답하지 않는 채널을 찾으며.' },
        ],
      },
    ],
  },

  // ───────────────────────── RECONSTRUCTION — REEL ─────────────────────────
  {
    id: 'stage_reel',
    group: 'reconstruction',
    numeral: 'VI',
    title: '재구성',
    titleEn: 'RECONSTRUCTION',
    intro: [
      { who: 'warden', t: '보고를 조립하십시오. 사건의 순서를 확정하십시오.' },
      { who: 'kai', e: 'thinking', t: '(테이프를 자르고 붙이는 건 내 일이다. 그날 밤을, 처음부터 끝까지.)' },
    ],
    rounds: [
      {
        id: 'r12_reel',
        kind: 'reel',
        title: '그날 밤의 릴',
        prompt: '테이프 조각을 일어난 순서대로 이어 붙여라.',
        panels: [
          { id: 'p_paint', time: '21:10', text: '바스가 가스실 방출기 덮개를 새로 칠한다.' },
          { id: 'p_leave', time: '23:14', text: '테오가 사전 녹음한 방송을 자동 재생으로 걸어 두고 스튜디오를 나선다.' },
          { id: 'p_vault', time: '23:21', text: '테오가 헬레나의 코드로 금고실에 들어가 헤드폰을 쓴다.' },
          { id: 'p_air', time: '23:30', text: '"생방송"이 스피커로 흐른다. 모두가 테오는 스튜디오에 있다고 믿는다.' },
          { id: 'p_down', time: '23:45', text: '렌이 방송을 듣고, 파란 불빛과 함께 작업실 계단을 내려간다.' },
          { id: 'p_pull', time: '23:47', text: '렌이 방출 레버를 당긴다. 사이렌은 울리지 않고, 금고실에 가스가 찬다.' },
          { id: 'p_up', time: '23:49', text: '렌이 방출 기록을 찢어 내고 객실동으로 돌아간다.' },
          { id: 'p_power', time: '23:52', text: '주전원이 끊기고, 바스가 발전기를 돌린다. 방송은 멈추지 않는다.' },
        ],
        answerOrder: ['p_paint', 'p_leave', 'p_vault', 'p_air', 'p_down', 'p_pull', 'p_up', 'p_power'],
        initialOrder: ['p_air', 'p_pull', 'p_paint', 'p_power', 'p_vault', 'p_up', 'p_leave', 'p_down'],
        wrong: [{ who: 'warden', t: '순서가 센서 기록과 일치하지 않습니다.' }],
        success: [
          { cmd: 'title', text: '23:47', sub: '아무도 서로의 소리를 듣지 못한 밤' },
          { who: 'kai', e: 'neutral', t: '테오는 녹음된 자신의 목소리 뒤에 숨었고, 렌은 그 목소리를 믿었어요.' },
          { who: 'kai', e: 'thinking', t: '사이렌엔 퓨즈가 없었고, 테오는 헤드폰 속에 있었죠. 그날 밤, 아무도 서로의 소리를 듣지 못했어요.' },
        ],
      },
    ],
  },

  // ───────────────────────── VERDICT — MOTIVE ─────────────────────────
  {
    id: 'stage_verdict',
    group: 'verdict',
    numeral: 'VII',
    title: '보고',
    titleEn: 'THE ACCOUNT',
    intro: [{ who: 'warden', t: '마지막 항목. 행위의 목적을 확정하십시오. 보고는 "왜"를 포함해야 합니다.' }],
    rounds: [
      {
        id: 'r13_motive',
        kind: 'tune',
        title: '왜',
        prompt: '다이얼을 돌려 행위의 목적을 맞춰라.',
        question: '렌이 레버를 당긴 이유는?',
        axis: 'motive',
        options: [
          { id: 'm_kill', label: '테오를 죽이려고', sub: 'MURDER' },
          { id: 'm_destroy', label: 'D 릴을 파괴하려고', sub: 'DESTROY' },
          { id: 'm_lock', label: '금고실을 잠가 테오를 막으려고', sub: 'LOCK' },
          { id: 'm_frame', label: '헬레나에게 누명을 씌우려고', sub: 'FRAME' },
        ],
        answer: 'm_lock',
        wrong: [{ who: 'bas', e: 'distressed', t: '아니야... 이산화탄소는 테이프를 망가뜨리지도 않고, 렌은 테오가 스튜디오에 있다고 믿었어.' }],
        success: [
          { who: 'kai', e: 'neutral', t: '렌은 테오를 죽이려던 게 아니에요. 지키려고 했어요. 금고실을 잠가서, 그가 D 릴을 들고 나가 인생을 걸지 못하게.' },
          { who: 'kai', e: 'angry', t: '보고합니다. 23시 47분, 금고실. 작업실 가스실 수동 방출기에 의한 이산화탄소 방출. 행위자, 렌 홀리스. 목적, 금고실 봉쇄. 사망은 의도하지 않았음.' },
          { who: 'kai', e: 'neutral', t: '경보 사이렌은 바스 코르드가 2주 전 제거한 퓨즈로 인해 작동하지 않았음. 피해자는 사전 녹음 방송으로 부재를 숨기고 금고실에 있었음.' },
          { who: 'warden', t: '보고를 센서 기록과 대조합니다.' },
          { cmd: 'sfx', id: 'tune' },
          { who: 'warden', t: '시각: 일치. 장소: 일치. 방법: 일치. 행위자: 일치.' },
          { who: 'warden', t: '보고가 승인되었습니다. 절차에 따라 보고 전문을 97.3MHz로 송출합니다.' },
          { who: 'oskar', e: 'surprised', t: '송출...? 밖으로요? 방금 한 말이 전부?' },
          { who: 'warden', t: '첨부 기록 1건. 작성자: 절차 보유자 T. 린드크비스트. 3일 전 등록.' },
          { cmd: 'cutin', id: 'cutin_message', caption: '3일 전 · 스튜디오 B' },
          { who: 'theo', radio: true, t: '이게 재생되고 있다면, 워든이 제 일을 한 거고 나는... 뭐, 데드 에어가 된 거겠지.' },
          { who: 'theo', radio: true, t: '워든을 다시 켠 건 나야. 재단이 날 조용히 치우려 할지도 몰라서. 이 탑에서 누가 죽으면, 진실이 말해질 때까지 아무도 못 나가게.' },
          { who: 'theo', radio: true, t: '워든의 보고는 옛 송신기로 나가. 97.3, 계곡 전체로. 그러니까 방금 여러분이 말한 모든 것 — D 선반까지 — 다 들렸을 거야.' },
          { who: 'theo', radio: true, t: '헬레나, 고마워. 바스, 사이렌 좀 고쳐. 렌... 말 안 해서 미안하다. 말했으면 넌 날 말렸을 거야. 네가 옳았을지도 모르고.' },
          { who: 'theo', radio: true, t: '복원사가 와 있다면 부탁 하나만 할게. 이 목소리들을, 제대로 들리게 해 줘.' },
          { who: 'wren', e: 'distressed', t: '......테오.' },
          { who: 'warden', t: '봉인을 해제합니다. 케스트럴 워든, 운용을 종료합니다. 좋은 밤이었습니다.' },
        ],
      },
    ],
  },
];

export const STAGES_BY_GROUP = (group: TrialStage['group']) => TRIAL.filter((s) => s.group === group);
export const ALL_ROUNDS = TRIAL.flatMap((s) => s.rounds.map((r) => ({ stage: s, round: r })));
