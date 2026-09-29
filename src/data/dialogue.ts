import type { Script } from './types';

// All exploration / VN scripts. Hearing scripts live in trial.ts.
// Lines: { who, e, t } · commands: { cmd } · branches: { if, then, else }.

export const SCRIPTS: Record<string, Script> = {
  // ───────────────────────────── PROLOGUE ─────────────────────────────
  prologue: [
    { cmd: 'bg', kind: 'keyart' },
    { cmd: 'title', text: 'AFTERSIGNAL', sub: '케스트럴 타워의 마지막 밤' },
    { who: 'narr', t: '철거까지 이틀. 케스트럴 타워는 42년 동안 이 계곡에 목소리를 흘려보냈다.' },
    { who: 'narr', t: '나는 그 목소리들을 옮겨 담으러 왔다. 테이프 복원사, 카이 모로.' },
    { who: 'bas', e: 'neutral', t: '마지막 케이블카야, 아가씨. 폭풍이 오면 내일 아침까진 아무도 못 내려가.' },
    { who: 'kai', t: '괜찮아요. 테이프는 도망 안 가니까요.' },
    { who: 'bas', e: 'happy', t: '하! 테오가 좋아하겠구먼. 난 바스. 여기 엔지니어고, 이 탑의 나사 하나까지 다 알지.' },
    { who: 'bas', e: 'neutral', t: '오늘 밤이 "나이트 케스트럴" 마지막 방송이야. 23시 30분, 타워 전체 스피커로 나가.' },
    { who: 'bas', e: 'neutral', t: '짐 풀기 전에 한 바퀴 돌면서 다들 인사나 해. 난 아래 작업실에 있을게. 보여 줄 게 있어.' },
    { who: 'narr', t: '케이블카가 흔들리며 구름 속을 올라갔다. 탑 꼭대기의 붉은 경고등이 빗속에서 깜빡였다.' },
    { cmd: 'advance' },
  ],

  // ───────────────────────────── ARRIVAL ─────────────────────────────
  lumi_arrival: [
    { who: 'lumi', e: 'happy', t: '앗, 새 목소리다! 잠깐만요, 그대로 한 마디만 더 해 주실래요?' },
    { who: 'kai', t: '...안녕하세요?' },
    { who: 'lumi', e: 'happy', t: '완벽해요! "안녕하세요, 폭풍 속에서." 녹음됐어요. 저는 루미, 필드 레코딩 작가예요.' },
    { who: 'lumi', e: 'neutral', t: '이 탑이 사라지기 전에 소리를 전부 모으고 있어요. 환기구, 엘리베이터, 발소리까지.' },
    { who: 'lumi', e: 'happy', t: '제일 좋은 건 작업실 계단 문이에요. 열릴 때마다 "끼이이익—" 하고 울어요. 이 건물의 가수죠.' },
    { who: 'kai', t: '그 털 달린 마이크는요?' },
    { who: 'lumi', e: 'neutral', t: '바람막이예요. 오늘 밤엔 여기 아트리움에서 폭풍을 녹음할 거예요. 여기 울림이 최고거든요.' },
    { cmd: 'flag', id: 'met_lumi' },
  ],
  lumi_arrival_again: [{ who: 'lumi', e: 'happy', t: '쉿— 지금 천장 환기구가 노래하는 중이에요. 들려요?' }],

  oskar_arrival: [
    { who: 'oskar', e: 'neutral', t: '복원사 분이시군요. 알데인 재단 법률 고문, 오스카 벤트입니다.' },
    { who: 'oskar', e: 'neutral', t: '재단은 이번 디지털화 작업에 큰 기대를 걸고 있습니다. 물론, 목록에 있는 테이프에 한해서요.' },
    { who: 'kai', t: '목록에 없는 테이프도 있나요?' },
    { who: 'oskar', e: 'happy', t: 'D 선반은 공테이프뿐입니다. 방송 용어로 "데드 에어"죠. 탑과 함께 폐기됩니다.' },
    { who: 'oskar', e: 'neutral', t: '철거반은 모레 아침에 옵니다. 그 전까지, 모두 무사히 계시길.' },
    { cmd: 'flag', id: 'met_oskar' },
  ],
  oskar_arrival_again: [{ who: 'oskar', e: 'neutral', t: '작업 목록은 A부터 C까지입니다. 기억하시죠?' }],

  theo_arrival: [
    { who: 'theo', e: 'happy', t: '오, 복원사! 목소리를 되살리는 사람. 우리 쪽 사람이네.' },
    { who: 'theo', e: 'neutral', t: '테오 린드크비스트. 이 탑에서 22년 동안 밤을 떠들었지.' },
    { who: 'kai', t: '"나이트 케스트럴". 어릴 때 라디오로 들었어요.' },
    { who: 'theo', e: 'happy', t: '그럼 오늘이 마지막 회야. 23시 30분. 타워 스피커 전체로 나가.' },
    { who: 'theo', e: 'thinking', t: '하나 물어보자, 복원사. 녹음된 목소리랑 살아 있는 목소리, 구분할 수 있어?' },
    { who: 'kai', t: '대부분은요. 녹음은 그 순간에 반응하지 못하니까요.' },
    { who: 'theo', e: 'thinking', t: '"대부분은", 이라. 좋은 대답이야.' },
    { who: 'theo', e: 'neutral', t: '저녁 먹고 나선 리허설이야. 스튜디오엔 아무도 안 들일 거야. 렌도.' },
    { cmd: 'flag', id: 'met_theo' },
  ],
  theo_arrival_again: [{ who: 'theo', e: 'thinking', t: '마지막 방송 첫 마디를 고르는 중이야. 이게 제일 어렵거든.' }],

  wren_arrival: [
    { who: 'wren', e: 'neutral', t: '...아, 안녕하세요. 렌 홀리스예요. 테오의 프로듀서.' },
    { who: 'kai', t: '헤드셋 불빛이 깜빡이네요.' },
    { who: 'wren', e: 'thinking', t: '항상 깜빡여요. 파란불이 깜빡이면 테오 채널을 찾는 중이라는 뜻이에요. 테오가 토크백을 잡으면 멈추고요.' },
    { who: 'wren', e: 'neutral', t: '6년 동안 이걸 벗어 본 적이 거의 없어요. 테오 시계가 제 시계라서.' },
    { who: 'wren', e: 'thinking', t: '오늘은 마지막 방송이라... 테오가 무리하지 않았으면 좋겠어요.' },
    { who: 'kai', t: '무리요?' },
    { who: 'wren', e: 'neutral', t: '아니에요. 그냥 프로듀서 걱정이에요.' },
    { cmd: 'flag', id: 'met_wren' },
  ],
  wren_arrival_again: [{ who: 'wren', e: 'thinking', t: '큐시트가 세 번이나 바뀌었어요. 테오는 늘 마지막 순간에 바꿔요.' }],

  helena_arrival: [
    { who: 'helena', e: 'neutral', t: '카이 모로 씨. 기록보관소장 헬레나 보스입니다. 장갑부터 끼세요. 여기 테이프들은 당신보다 나이가 많습니다.' },
    { who: 'kai', t: '저 둥근 문이 금고실인가요?' },
    { who: 'helena', e: 'neutral', t: '네. 이산화탄소 소화 설비가 있어 허가 없이는 들어갈 수 없습니다. 코드는 저만 압니다.' },
    { who: 'helena', e: 'neutral', t: '당신 작업 목록은 A에서 C 선반까지. D 선반은 해당 없습니다.' },
    { who: 'kai', t: '공테이프라고 들었어요.' },
    { who: 'helena', e: 'angry', t: '...그렇게 들으셨다면, 그런 겁니다.' },
    { who: 'helena', e: 'neutral', t: '제 사무실은 이 안쪽입니다. 사무실 뒷문이 직원 복도로 객실동과 바로 이어져 있죠.' },
    { cmd: 'flag', id: 'met_helena' },
  ],
  helena_arrival_again: [{ who: 'helena', e: 'neutral', t: '장갑. 그리고 D 선반은 해당 없습니다.' }],

  bas_arrival: [
    { who: 'bas', e: 'happy', t: '왔구먼. 여기가 작업실이야. 발전기, 배전반, 소화 설비가 전부 여기서 돌아가.' },
    { who: 'bas', e: 'neutral', t: '저 벽의 상자 보이지? 금고실 구역 수동 방출기야. 핀 뽑고 레버를 당기면 금고실에 이산화탄소가 쏟아져.' },
    { who: 'bas', e: 'neutral', t: '사람한텐 치명적이지만 테이프는 멀쩡해. 그래서 기록보관소에 쓰는 거고.' },
    { who: 'kai', t: '안에 사람이 있으면요?' },
    { who: 'bas', e: 'neutral', t: '방출 전에 30초 동안 사이렌이 울려. 귀청 떨어질 만큼. 그 사이에 나오면 돼.' },
    { who: 'bas', e: 'neutral', t: '한 번 방출되면 금고실 문은 72시간 동안 스스로 잠겨. 내 엔지니어 키로만 열 수 있지.' },
    { who: 'bas', e: 'neutral', t: '자동으로도 터져. 금고실 감지기 두 개가 동시에 불이나 연기를 잡으면.' },
    { who: 'bas', e: 'happy', t: '그리고 저 화재 패널 프린터. 설비에 무슨 일이 생기면 전부 종이에 찍혀. 아날로그가 제일 정직하지.' },
    { who: 'bas', e: 'neutral', t: '저녁 먹고 나면 저 방출기 덮개를 새로 칠할 거야. 녹이 슬어서 말이야.' },
    { cmd: 'flag', id: 'met_bas' },
  ],
  bas_arrival_again: [{ who: 'bas', e: 'neutral', t: '핀, 레버, 30초, 72시간. 이 네 개만 기억하면 이 방에서 안 죽어.' }],

  // ───────────────────────────── DINNER ─────────────────────────────
  dinner_call: [
    { who: 'narr', t: '천장 스피커가 지직거렸다.' },
    { who: 'bas', radio: true, t: '(구내 방송) 저녁 다 됐다! 식당으로 모여. 식으면 안 데워 준다.' },
  ],
  dinner_wait: [{ who: 'narr', t: '다들 식탁에 앉아 있다. 빈자리는 하나뿐이다.' }],
  dinner: [
    { cmd: 'title', text: '19:30', sub: '마지막 만찬' },
    { who: 'narr', t: '식당. 창밖으로 빗줄기가 옆으로 날렸다.' },
    { who: 'theo', e: 'happy', t: '마지막 만찬이군. 탑이 사라지기 전 마지막 밤을 위해.' },
    { who: 'oskar', e: 'happy', t: '그리고 순조로운 인계를 위해. 재단은 여러분의 협조에 감사드립니다.' },
    { who: 'theo', e: 'thinking', t: '재단은 늘 감사하지. 감사하면서 불태우고.' },
    { who: 'helena', e: 'angry', t: '테오. 그만.' },
    { who: 'theo', e: 'neutral', t: 'D 선반 얘기야, 헬레나. 공테이프라며? 공테이프를 왜 굳이 태우지?' },
    { who: 'helena', e: 'angry', t: '당신 계약서입니다. 서명하고, 방송하고, 조용히 떠나세요.' },
    { who: 'narr', t: '헬레나가 접힌 종이를 테오 쪽으로 던졌다. 종이는 그의 접시 옆에 떨어졌다.' },
    { who: 'narr', t: '테오는 그것을 펴 보지도 않고 재킷 안주머니에 넣었다.' },
    { who: 'lumi', e: 'surprised', t: '와... 방송 전에 원래 이렇게 싸워요?' },
    { who: 'bas', e: 'neutral', t: '22년째 이래. 신경 쓰지 마, 꼬마.' },
    { who: 'wren', e: 'thinking', t: '테오, 리허설 들어가기 전에 큐시트 한 번만—' },
    { who: 'theo', e: 'neutral', t: '오늘은 혼자 할게, 렌. 마지막이잖아. 스튜디오 문 잠그고, 나 혼자 마이크랑.' },
    { who: 'wren', e: 'surprised', t: '...혼자요? 한 번도 그런 적—' },
    { who: 'theo', e: 'happy', t: '그러니까 마지막이지. 23시 30분에 스피커로 들어. 넌 푹 자고.' },
    { who: 'oskar', e: 'neutral', t: '참고로, 재단 운반팀이 내일 오전 D 선반을 수거합니다. 금고실은 오늘 밤 그대로 두시죠.' },
    { who: 'helena', e: 'neutral', t: '금고실 코드는 저만 압니다. 걱정 마시죠, 벤트 씨.' },
    { who: 'narr', t: '식사가 끝날 때까지 아무도 D 선반 이야기를 다시 꺼내지 않았다.' },
    { cmd: 'flag', id: 'dinner_done' },
    { cmd: 'advance' },
  ],

  // ───────────────────────────── EVENING ─────────────────────────────
  evening_enter: [
    { cmd: 'title', text: '21:10', sub: '자유 시간' },
    { who: 'narr', t: '테오는 스튜디오 B로 들어가 문을 잠갔다. 문 위의 램프에 "리허설 중"이 켜졌다.' },
    { who: 'narr', t: '방송까지 두 시간 남짓. 둘러보다가, 준비가 되면 객실동 내 방에서 쉬자.' },
  ],
  wren_evening: [
    { who: 'wren', e: 'thinking', t: '테오가 저를 내보낸 건 처음이에요. 방음문이라 안에서 뭘 하는지 들리지도 않아요.' },
    { who: 'wren', e: 'thinking', t: '요즘 이상해요. 오래된 보안 매뉴얼을 읽어요. "워든"이라나. 냉전 때 이 탑을 지키던 기계래요.' },
    { who: 'wren', e: 'neutral', t: '...테오가 무슨 일을 벌이든, 제가 막을 수 있으면 좋겠어요.' },
    { cmd: 'flag', id: 'ev_wren' },
  ],
  wren_evening_again: [{ who: 'wren', e: 'neutral', t: '헤드셋이 계속 깜빡여요. 테오가 채널을 닫아 버려서.' }],

  helena_evening: [
    { who: 'helena', e: 'neutral', t: 'D 선반에 대해 묻고 싶은 얼굴이군요. 묻지 마세요.' },
    { who: 'helena', e: 'neutral', t: '11시가 지나면 저는 제 방에 있을 겁니다. 오늘 밤은 방송이나 들으세요. 마지막이니까.' },
    { cmd: 'flag', id: 'ev_helena' },
  ],
  helena_evening_again: [{ who: 'helena', e: 'neutral', t: '기록은 사람보다 오래 삽니다. 대체로는.' }],

  bas_evening: [
    { who: 'bas', e: 'happy', t: '어이, 조심해. 방출기 덮개 방금 칠했어. 9시 10분. 아침까진 안 말라.' },
    { who: 'bas', e: 'neutral', t: '태그도 걸어 놨지. 여기 만지는 사람은 노란 손이 될 거야.' },
    { who: 'kai', t: '금고실 사이렌은 괜찮아요? 오래된 설비 같던데.' },
    { who: 'bas', e: 'distressed', t: '사이렌? 음... 폭풍 때마다 좀 말썽이긴 했지. 뭐, 괜찮아. 괜찮을 거야.' },
    { cmd: 'flag', id: 'ev_bas' },
  ],
  bas_evening_again: [{ who: 'bas', e: 'neutral', t: '페인트 냄새 좋지? 이 탑의 마지막 칠이야.' }],

  lumi_evening: [
    { who: 'lumi', e: 'happy', t: '과자 드실래요? 방송 들으면서 먹으려고 챙겼어요.' },
    { who: 'lumi', e: 'neutral', t: '저는 11시 25분부터 아트리움에서 녹음해요. 폭풍이랑, 스피커로 나오는 방송이랑 같이요.' },
    { who: 'lumi', e: 'neutral', t: '사람 목소리도 좋아해요. 음... 그건 비밀.' },
    { cmd: 'flag', id: 'ev_lumi' },
  ],
  lumi_evening_again: [{ who: 'lumi', e: 'happy', t: '창문에 빗방울 부딪히는 소리, 녹음기로 들으면 박수 소리 같아요.' }],

  oskar_evening: [
    { who: 'oskar', e: 'neutral', t: '이 탑에 정이 드셨나요? 저는 아닙니다. 모레면 끝이죠.' },
    { who: 'oskar', e: 'happy', t: '관장님의 기록 사랑은 존경스럽습니다. 명령만 잘 따르신다면요.' },
    { cmd: 'flag', id: 'ev_oskar' },
  ],
  oskar_evening_again: [{ who: 'oskar', e: 'neutral', t: '객실이 춥군요. 이 건물은 사람을 위해 지은 게 아닌가 봅니다.' }],

  hs_station_evening: [
    { who: 'narr', t: '방출기 덮개가 노란 페인트로 번들거린다. 옆에 걸린 종이 태그: "칠 주의 — 21:10 — B.K."' },
  ],

  retire: [
    { who: 'narr', t: '방송은 23시 30분. 이제 쉬어도 될까?' },
    { cmd: 'advance' },
  ],

  // ───────────────────────────── NIGHT ─────────────────────────────
  night: [
    { cmd: 'bg', kind: 'black' },
    { cmd: 'title', text: '23:30', sub: '나이트 케스트럴 — 마지막 방송' },
    { who: 'narr', t: '객실 천장 스피커에서 익숙한 시그널 음악이 흘러나왔다.' },
    { who: 'theo', radio: true, t: '안녕하세요, 케스트럴의 밤입니다. 지금 비가 오고 있다면, 창문을 조금만 열어 두세요.' },
    { who: 'theo', radio: true, t: '22년 동안 저는 이 탑에서 여러분의 밤을 빌렸습니다. 오늘은 그 빚을 갚는 밤이에요.' },
    { who: 'narr', t: '좋은 목소리였다. 너무 매끄러울 만큼.' },
    { cmd: 'sfx', id: 'thump' },
    { cmd: 'shake', power: 0.4 },
    { who: 'narr', t: '23시 47분쯤. 건물 깊은 곳에서 둔한 "쿵" 소리가 울렸다. 침대가 잠깐 떨렸다.' },
    { who: 'narr', t: '천둥이겠지. 나는 이불을 끌어올렸다.' },
    { cmd: 'sfx', id: 'powerdown' },
    { who: 'narr', t: '23시 52분. 전등이 꺼졌다가, 멀리서 발전기가 돌아가는 소리와 함께 다시 들어왔다.' },
    { who: 'narr', t: '방송은 끊기지 않았다. 테오는 정전에 대해 한 마디도 하지 않았다. 그냥, 계속 이야기했다.' },
    { cmd: 'wait', ms: 600 },
    { cmd: 'title', text: '00:45', sub: 'DEAD AIR' },
    { cmd: 'sfx', id: 'static' },
    { who: 'narr', t: '목소리가 멈췄다. 음악도, 인사도 없이. 스피커에서는 "쉬—" 하는 잡음만 흘러나왔다.' },
    { who: 'narr', t: '데드 에어. 방송에서 가장 무서운 소리.' },
    { cmd: 'advance' },
  ],

  // ───────────────────────────── INCIDENT ─────────────────────────────
  incident_alarm: [
    { cmd: 'bg', kind: 'black' },
    { cmd: 'sfx', id: 'alarm' },
    { cmd: 'title', text: '06:00', sub: 'SEAL / ACCOUNT' },
    { who: 'warden', t: '공지. 공지. 케스트럴 보안 관리 체계, 워든입니다.' },
    { who: 'warden', t: '생체 감시 센서가 거주자 1명의 사망을 기록했습니다.' },
    { who: 'warden', t: '봉인·보고 절차를 개시합니다. 모든 외부 출입구와 케이블카가 잠겼습니다.' },
    { who: 'warden', t: '생존 거주자는 사건의 시각, 장소, 방법, 행위자를 담은 "보고"를 제출하십시오. 보고는 센서 기록과 대조하여 검증됩니다.' },
    { who: 'warden', t: '보고가 기록과 일치할 때까지 봉인은 해제되지 않습니다.' },
    { who: 'narr', t: '워든. 렌이 말했던, 오래된 매뉴얼 속 기계의 이름.' },
    { cmd: 'bg', kind: 'room' },
  ],
  incident_gather: [
    { who: 'bas', e: 'distressed', t: '저건 냉전 때 설비야. 삼십 년 동안 꺼져 있었다고! 누가 저걸 켰어?' },
    { who: 'oskar', e: 'angry', t: '장난입니까? 외부 연락도, 케이블카도 막혔습니다.' },
    { who: 'helena', e: 'neutral', t: '인원부터 확인하죠. ...테오가 없습니다.' },
    { who: 'wren', e: 'surprised', t: '테오는 스튜디오에 있을 거예요. 방송 끝나면 거기서 자곤 하니까...' },
    { cmd: 'sfx', id: 'door' },
    { who: 'narr', t: '렌이 스튜디오 B 문을 열었다. 부스는 비어 있었다. 릴 머신 하나만, 다 감긴 테이프를 헛돌리고 있었다.' },
    { who: 'wren', e: 'distressed', t: '...테오? 테오!' },
    { who: 'bas', e: 'surprised', t: '잠깐. 기록보관소 금고실 패널에 붉은 램프가 켜져 있었어. 새벽에 발전기 보러 갈 땐 못 봤는데—' },
    { who: 'bas', e: 'distressed', t: '다들 기록보관소로. 금고실을 열어야 해.' },
    { cmd: 'flag', id: 'gathered' },
  ],
  incident_wait: [{ who: 'narr', t: '다들 기록보관소 금고실 앞으로 향했다.' }],
  vault_door_incident: [
    {
      if: 'gathered',
      then: [
        { who: 'narr', t: '바스가 엔지니어 키를 돌렸다. 환기팬이 몇 분 동안 울부짖었고, 06시 12분, 둥근 문이 열렸다.' },
        { cmd: 'sfx', id: 'reveal' },
        { cmd: 'cutin', id: 'cutin_discovery', caption: '06:12 · 금고실' },
        { who: 'narr', t: '테오는 D 선반에 기대 앉아 있었다. 커다란 헤드폰을 쓴 채로. 휴대용 릴 데크는 멈춰 있었다.' },
        { who: 'lumi', e: 'distressed', t: '테오 씨...?' },
        { who: 'bas', e: 'distressed', t: '이산화탄소야... 사이렌이 30초나 울렸을 텐데. 나올 수 있었을 텐데.' },
        { who: 'wren', e: 'distressed', t: '말도 안 돼요. 테오는 방송 중이었어요. 00시 45분까지, 다 같이 들었잖아요!' },
        { who: 'helena', e: 'distressed', t: '...아무것도 만지지 마세요. 제가 덮어 두겠습니다.' },
        { who: 'warden', t: '통보. 정오에 A 스튜디오 "더 라운드"에서 보고 심의가 열립니다. 그 전까지 거주자의 조사를 허용합니다.' },
        { who: 'narr', t: '테오는 방송 중이었다. 모두가 그렇게 믿고 있다. 나도 그랬다.' },
        { who: 'narr', t: '...정말 그랬을까. 들은 것과 일어난 것을, 하나씩 맞춰 봐야 한다.' },
        { cmd: 'advance' },
      ],
      else: [{ who: 'narr', t: '금고실 패널에 붉은 램프가 켜져 있다. 혼자서는 열 수 없다. 먼저 다른 사람들을 찾자.' }],
    },
  ],

  investigation_enter: [
    { cmd: 'title', text: '07:00', sub: '조사' },
    { who: 'narr', t: '정오까지 다섯 시간. 탑 전체가 사건 현장이 되었다.' },
    { who: 'narr', t: '가까이 가면 조사할 수 있는 곳이 표시된다. 모은 증거와 진술은 [Tab]으로 확인할 수 있다.' },
  ],

  // ───────────────────────────── INVESTIGATION — hotspots ─────────────────────────────
  hs_body: [
    { who: 'narr', t: '헬레나가 덮은 회색 담요 아래, 테오의 머리에는 아직 헤드폰이 씌워져 있다.' },
    { who: 'narr', t: '밀폐형 스튜디오 모니터. 바깥 소리를 거의 완전히 막는 종류다. 연결된 휴대용 데크의 볼륨 노브는 끝까지 돌아가 있다.' },
    { who: 'kai', t: '최대 볼륨... 테오, 뭘 그렇게 열심히 듣고 있었어요?' },
    { cmd: 'evidence', id: 'theo_headphones' },
  ],
  hs_pocket: [
    { who: 'narr', t: '가죽 재킷 안주머니에 접힌 종이가 있다. 어제 저녁, 헬레나가 던진 그 "계약서"다.' },
    { who: 'narr', t: '"선반 D. 4-1-7-2. 오늘 밤, 다들 당신이 방송 중이라고 생각할 때. — H"' },
    { who: 'kai', t: '계약서가 아니었어. 금고실 코드다.' },
    { cmd: 'evidence', id: 'helena_note' },
  ],
  hs_inner_release: [
    { who: 'narr', t: '금고실 문 안쪽 벽의 붉은 수동 방출기. 금속 봉인 태그가 그대로 감겨 있고, 안전핀도 꽂혀 있다.' },
    { who: 'kai', t: '안에서 누가 당긴 건 아니다.' },
    { cmd: 'evidence', id: 'inner_release' },
  ],
  hs_siren_box: [
    { who: 'narr', t: '벽 높은 곳의 사이렌 단자함. 뚜껑 나사가 느슨하다. 열어 보니 퓨즈 홀더가 텅 비어 있다.' },
    { who: 'narr', t: '홀더 안쪽에는 먼지가 고르게 앉아 있다. 어젯밤 빠진 게 아니라, 꽤 오래 비어 있었다.' },
    { cmd: 'evidence', id: 'siren_box' },
  ],
  hs_d_shelf: [
    { who: 'narr', t: 'D 선반. 라벨마다 날짜와 번호. "KST-D-1983-114"를 데크에 걸어 잠깐 들어 보았다.' },
    { who: 'narr', t: '교환원의 신호음. 그리고 두 사람의 목소리. 아이의 병원비 이야기, 이혼 이야기. 아주 사적인 전화 통화.' },
    { who: 'kai', t: '...공테이프가 아니야.' },
    { cmd: 'evidence', id: 'd_reel' },
  ],
  hs_vault_panel: [
    { who: 'narr', t: '금고실 문 옆 소화 설비 패널. 붉은 램프 아래 작은 화면.' },
    { who: 'narr', t: '"CO₂ 방출 23:47 · 구역 잠금 72H · 해제 06:12 (ENG KEY)"' },
    { who: 'kai', t: '23시 47분. 방송은 그때 한창이었는데.' },
    { cmd: 'evidence', id: 'vault_panel' },
  ],
  hs_keypad: [
    { who: 'narr', t: '키패드의 출입 기록. "23:21 OPEN — DIRECTOR CODE". 그 다음 기록은 06:12 엔지니어 키.' },
    { who: 'kai', t: '관장 코드로 한 번 열리고, 가스가 나온 뒤엔 아침까지 아무도 드나들지 못했다.' },
    { cmd: 'evidence', id: 'keypad_log' },
  ],
  hs_office_desk: [
    { who: 'narr', t: '헬레나의 책상. 맨 위 서랍 자물쇠가 비틀려 있다. 누군가 억지로 연 흔적.' },
    { who: 'narr', t: '서랍 안의 서류. 알데인 재단 명령 88-D. "KST-D 릴 전량 철거 시 폐기. 분류: 1979–1998 민간 전화 감청 녹음."' },
    { who: 'kai', t: '감청... 데드 에어라는 건, 이걸 말한 거였어.' },
    { cmd: 'evidence', id: 'order_88d' },
  ],
  hs_office_floor: [
    { who: 'narr', t: '책상 밑, 의자 바퀴 옆에 검은 만년필이 굴러떨어져 있다. 금색 클립. 몸통에 "O.W."' },
    { who: 'kai', t: '사무실 뒷문은 직원 복도, 객실동으로 이어진다. 아트리움을 거치지 않고도 올 수 있다.' },
    { cmd: 'evidence', id: 'oskar_pen' },
  ],
  hs_photo: [
    { who: 'narr', t: '1979년 직원 사진. 방송국 사람들인데, 모두 교환원 헤드셋을 쓰고 있다. 뒤편엔 방송 장비가 아니라 전화 교환기 같은 설비.' },
    { who: 'narr', t: '가운데 정장 차림의 남자. 사진 아래 작은 명판: "V. 알데인".' },
  ],
  hs_reel_machine: [
    { who: 'narr', t: '릴 머신에는 다 감긴 테이프. 테이크업 릴이 가득 찼다. 머신 옆에 테오의 필체로 된 카드가 끼워져 있다.' },
    { who: 'narr', t: '"나이트 케스트럴 — 최종 — 사전 녹음 75:00 — 자동 시작 23:30"' },
    { who: 'kai', t: '75분이면 23시 30분부터 00시 45분까지. 딱 방송이 끝난 시각이다.' },
    { who: 'kai', t: '"리허설"이라던 그 시간에, 방송 전체를 녹음한 거야.' },
    { cmd: 'evidence', id: 'autostart_card' },
  ],
  hs_door_reader: [
    { who: 'narr', t: '스튜디오 문 안쪽 배지 리더의 기록. "T. LINDQVIST — OUT 23:14". 그 다음은 "W. HOLLIS — IN 06:20".' },
    { cmd: 'evidence', id: 'studio_log' },
  ],
  hs_booth: [
    { who: 'narr', t: '부스의 마이크와 의자. 의자는 차갑고, 테오가 늘 두던 물컵은 마른 채 엎어져 있다.' },
    { who: 'kai', t: '어젯밤 이 자리에는 아무도 앉지 않았다.' },
  ],
  hs_generator: [
    { who: 'narr', t: '발전기 제어반의 이벤트 기록.' },
    { who: 'narr', t: '"23:52 MAINS FAIL · 23:53 GEN START (MANUAL) — B.KORD · 방송 계통 UPS 유지"' },
    { cmd: 'evidence', id: 'generator_log' },
  ],
  hs_fire_panel: [
    { who: 'narr', t: '화재 패널의 도트 프린터. 연속 용지가 길게 늘어져 있다.' },
    { who: 'narr', t: '"22:00 SELF-TEST OK" — 그 바로 아래 한 칸이 거칠게 찢겨 나갔다 — "23:52 MAINS FAIL"' },
    { who: 'kai', t: '22시와 23시 52분 사이에 찍힌 무언가를, 누군가 가져갔다.' },
    { cmd: 'evidence', id: 'fire_printout' },
  ],
  hs_release_station: [
    { who: 'narr', t: '금고실 구역 수동 방출기. 끊긴 봉인 태그가 바닥에 떨어져 있고, 안전핀은 비뚤게 다시 꽂혀 있다.' },
    { who: 'narr', t: '덜 마른 노란 페인트 위에, 무언가 둥근 것에 스친 듯한 자국.' },
    { who: 'kai', t: '누군가 여기서 핀을 뽑고 레버를 당겼다. 그리고 핀을 도로 꽂아 두었다.' },
    { cmd: 'evidence', id: 'release_station' },
  ],
  hs_paint_tag: [
    { who: 'narr', t: '방출기 옆에 걸린 종이 태그. 바스의 투박한 글씨. "칠 주의 — 21:10 — B.K. 아침까지 만지지 말 것."' },
    { cmd: 'evidence', id: 'wet_paint_tag' },
  ],
  hs_kettle: [
    { who: 'narr', t: '식당 카운터의 전기 주전자. 완전히 식었고 물은 가득하다. 옆의 찻잎 통은 봉인조차 뜯기지 않았다.' },
    { cmd: 'evidence', id: 'kettle' },
  ],
  hs_dial: [
    { who: 'narr', t: '아트리움 천장에 매달린 거대한 튜닝 다이얼. 바늘은 97.3에 멈춰 있다. 이 탑의 옛 송신 주파수.' },
  ],
  hs_mural: [{ who: 'narr', t: '전파로 된 날개를 편 황조롱이 벽화. 1962년 개국 기념. 칠이 군데군데 벗겨졌다.' }],

  // ───────────────────────────── INVESTIGATION — testimony ─────────────────────────────
  lumi_invest: [
    { who: 'lumi', e: 'distressed', t: '카이 언니... 저, 말 안 한 게 있어요.' },
    { who: 'lumi', e: 'distressed', t: '어젯밤 여기 아트리움에서 녹음했어요. 23시 25분부터 00시 05분까지. 폭풍이랑, 방송이랑... 사람들 소리도.' },
    { who: 'lumi', e: 'distressed', t: '사실 저, 사람들 목소리를 허락 없이 녹음해 왔어요. 작품 제목이 "엿들은 것들"이에요. 부끄러워서 말 못 했어요.' },
    { who: 'kai', t: '지금은 그게 제일 정직한 증인일지도 몰라. 들려줄래?' },
    { who: 'lumi', e: 'neutral', t: '...네. 제가 타임코드를 적어 뒀어요.' },
    { who: 'narr', t: '[23:30] 스피커에서 방송 시작. [23:45] 발소리, 작업실 계단 문 "끼이익". [23:47] 낮고 깊은 "쿵".' },
    { who: 'narr', t: '[23:49] 다시 "끼이익". 빠른 발소리가 올라와 객실동 쪽으로. [23:51] 바스: "좋은 밤이다, 꼬마. 불이 깜빡거리네." 그리고 "끼이익".' },
    { who: 'narr', t: '[23:52] 정전. 방송은 끊기지 않고 계속.' },
    { who: 'lumi', e: 'neutral', t: '23시 45분엔 창밖 번개를 보고 있어서 얼굴은 못 봤어요. 근데 눈 끝에... 작은 파란 불빛이 깜빡이면서 계단 쪽으로 내려갔어요. 머리 높이쯤에서.' },
    { who: 'lumi', e: 'neutral', t: '아, 그리고 식당은 밤새 캄캄했어요. 유리벽이라 불 켜지면 바로 보이거든요.' },
    { cmd: 'evidence', id: 'lumi_recording' },
    { cmd: 'statement', id: 'st_lumi_atrium' },
  ],
  lumi_invest_again: [{ who: 'lumi', e: 'distressed', t: '녹음기 속 "쿵" 소리를 계속 다시 들어요. 그게 그 순간이었다니.' }],

  wren_invest: [
    { who: 'wren', e: 'distressed', t: '...테오가 스튜디오에 없었다니. 저는 방에서 방송을 다 들었어요. 처음부터 끝까지.' },
    { who: 'narr', t: '렌의 헤드셋 이어컵 가장자리에, 노란 얼룩이 묻어 있다.' },
    { who: 'kai', t: '렌, 헤드셋에 묻은 거 페인트예요?' },
    { who: 'wren', e: 'surprised', t: '아... 이거요? 어제 오후에 바스 아저씨 칠하는 거 도와드리다가 묻었어요.' },
    { who: 'narr', t: '헤드셋의 파란 LED가 여전히 깜빡이고 있다. 대답 없는 테오의 채널을 찾으며.' },
    { who: 'wren', e: 'thinking', t: '테오는 요즘 금고실 도면을 보고 있었어요. 전 그냥... 방송 소재인 줄 알았어요.' },
    { cmd: 'evidence', id: 'wren_headset' },
    { cmd: 'statement', id: 'st_wren_room' },
    { cmd: 'statement', id: 'st_wren_paint' },
  ],
  wren_invest_again: [{ who: 'wren', e: 'distressed', t: '테오 시계가 제 시계였는데. 이제 몇 시인지도 모르겠어요.' }],

  bas_invest: [
    { who: 'bas', e: 'distressed', t: '내 탑에서... 내 설비로 사람이 죽었어.' },
    { who: 'bas', e: 'neutral', t: '자동 방출은 금고실 감지기 두 개가 동시에 울려야 돼. 둘 다 깨끗해. 누군가 손으로 당긴 거야.' },
    { who: 'bas', e: 'neutral', t: '난 23시 51분쯤 내려왔어. 불이 깜빡거려서. 52분에 전기가 나갔고, 53분에 발전기를 돌렸지. 00시 10분까지 발전기실에 붙어 있었어.' },
    { who: 'bas', e: 'neutral', t: '발전기실은 저 반대쪽 구석이라 가스실은 쳐다보지도 않았어.' },
    { who: 'kai', t: '사이렌은요?' },
    { who: 'bas', e: 'distressed', t: '...울렸겠지. 110데시벨이야. 죽은 사람도 깨울걸.' },
    { who: 'kai', t: '방출기 덮개는 언제 칠하셨어요?' },
    { who: 'bas', e: 'neutral', t: '어젯밤 9시 10분. 저녁 먹고 나 혼자. 도와준 사람은 없어.' },
    { cmd: 'statement', id: 'st_bas_timeline' },
    { cmd: 'statement', id: 'st_bas_siren' },
    { cmd: 'statement', id: 'st_bas_paint' },
    { cmd: 'flag', id: 'talked_bas_invest' },
  ],
  bas_invest_again: [{ who: 'bas', e: 'distressed', t: '핀, 레버, 30초, 72시간... 30초라고 했었지. 내가.' }],

  helena_invest: [
    { who: 'helena', e: 'distressed', t: '저는 23시부터 제 방에 있었습니다. 방송을 들었죠. 혼자서.' },
    { who: 'helena', e: 'angry', t: '금고실 코드는 저만 압니다. 당신이 무슨 생각을 할지 압니다, 카이 씨.' },
    {
      if: 'ev:order_88d',
      then: [
        { who: 'kai', t: '사무실 서랍이 억지로 열려 있었어요. 재단 명령 88-D도 봤고요.' },
        { who: 'helena', e: 'surprised', t: '...제 서랍이? 어젯밤 잠그고 나왔습니다. 누가—' },
        { who: 'helena', e: 'neutral', t: '그 문서에 대해선 심의에서 말하겠습니다. 여기서가 아니라.' },
      ],
      else: [{ who: 'helena', e: 'neutral', t: '제 사무실은 조사하셔도 좋습니다. 숨길 게 있다면 이미 태웠겠죠.' }],
    },
    { cmd: 'statement', id: 'st_helena_room' },
    { cmd: 'statement', id: 'st_helena_code' },
    { cmd: 'flag', id: 'talked_helena_invest' },
  ],
  helena_invest_again: [{ who: 'helena', e: 'distressed', t: '담요는 제가 덮었습니다. 그 사람은 추위를 싫어했거든요.' }],

  oskar_invest: [
    { who: 'oskar', e: 'neutral', t: '사고입니다. 오래된 설비, 폭풍, 정전. 누구의 잘못도 아니죠.' },
    { who: 'oskar', e: 'neutral', t: '저는 23시부터 새벽까지 여기 식당에서 서류를 봤습니다. 아무도 못 봤고요.' },
    { who: 'oskar', e: 'happy', t: '재단은 이 비극이 조용히 정리되길 바랍니다. 워든인지 뭔지가 뭐라고 하든.' },
    {
      if: 'ev:oskar_pen',
      then: [
        { who: 'kai', t: '늘 가슴 주머니에 꽂고 다니던 만년필, 오늘은 없네요.' },
        { who: 'oskar', e: 'surprised', t: '...어딘가 두고 왔나 보군요. 그게 사건과 무슨 상관입니까?' },
      ],
    },
    { cmd: 'statement', id: 'st_oskar_canteen' },
    { cmd: 'flag', id: 'talked_oskar_invest' },
  ],
  oskar_invest_again: [{ who: 'oskar', e: 'neutral', t: '정오까지만 참으면 됩니다. 절차는 절차니까요.' }],

  investigation_done: [
    { cmd: 'sfx', id: 'reveal' },
    { who: 'narr', t: '필요한 조각은 모두 모였다. 아직 하나의 그림은 아니지만.' },
    { cmd: 'title', text: '12:00', sub: '심의실 개방' },
    { who: 'warden', t: '통보. 정오입니다. 보고 심의실 "더 라운드"를 개방합니다. 생존 거주자는 입장하십시오.' },
    { who: 'narr', t: '증거를 다시 확인하려면 [Tab]. 준비되면 아트리움 북쪽의 "더 라운드"로.' },
  ],
  enter_round: [
    { who: 'narr', t: '이 문을 지나면 심의가 시작된다. 모은 것만으로 말해야 한다.' },
    { cmd: 'advance' },
  ],

  // ───────────────────────────── EPILOGUE ─────────────────────────────
  epilogue: [
    { cmd: 'bg', kind: 'dawn' },
    { cmd: 'title', text: '05:50', sub: '다음 날 새벽' },
    { cmd: 'cutin', id: 'cutin_dawn', caption: '폭풍이 지나간 뒤' },
    { who: 'narr', t: '폭풍은 새벽에 그쳤다. 첫 케이블카가 경찰과 함께 올라왔다.' },
    { who: 'narr', t: '97.3MHz로 나간 보고는 밤새 계곡의 라디오들에서 반복 재생되었다고 했다.' },
    { cmd: 'bg', kind: 'room' },
  ],
  helena_epilogue: [
    { who: 'helena', e: 'neutral', t: 'D 선반은 제가 직접 조사위원회에 넘기겠습니다. 이번엔 기록대로.' },
    { who: 'helena', e: 'distressed', t: '테오가 원하던 방식은 아니겠지만. ...아니, 어쩌면 정확히 이걸 원했겠죠.' },
  ],
  bas_epilogue: [
    { who: 'bas', e: 'distressed', t: '사이렌 퓨즈를 뺀 건 나야. 그것도 보고서에 넣었어. 전부.' },
    { who: 'bas', e: 'neutral', t: '탑은 모레 무너져. 그때까진 내가 지킬 거야. 이번엔 제대로.' },
  ],
  lumi_epilogue: [
    { who: 'lumi', e: 'distressed', t: '허락 없이 녹음한 건 전부 지웠어요. 어젯밤 녹음 하나만 빼고요. 그건 경찰에 넘겼어요.' },
    { who: 'lumi', e: 'happy', t: '작품 제목도 바꿨어요. "애프터시그널". 방송이 끝난 뒤에도 남는 소리.' },
  ],
  oskar_epilogue: [
    { who: 'oskar', e: 'neutral', t: '재단은 저를 버리겠죠. 그 전에 증언할 생각입니다. 제 서류 가방도 꽤 두껍거든요.' },
    { who: 'oskar', e: 'surprised', t: '...이런 말을 하게 될 줄은 몰랐군요. 감사합니다, 복원사.' },
  ],
  wren_epilogue: [
    { who: 'wren', e: 'distressed', t: '카이 씨. 테오의 마지막 테이프... 복원해 줄래요? 정전에도 한 마디 없던 그 방송.' },
    { who: 'wren', e: 'distressed', t: '그 사람이 진짜로 하고 싶었던 말이 거기 있을 거예요. 저는 그걸 듣지 못했으니까.' },
    { who: 'kai', t: '약속할게요. 제대로 들리게.' },
    { who: 'narr', t: '렌의 헤드셋은 꺼져 있었다. 더는 찾을 채널이 없었다.' },
  ],
  leave_tower: [
    { who: 'narr', t: '셔터가 올라간 정문 너머로, 비에 씻긴 아침 햇살이 쏟아졌다.' },
    { who: 'narr', t: '케이블카가 내려가기 시작했다. 탑 꼭대기의 경고등이 마지막으로 한 번 깜빡였다.' },
    { who: 'narr', t: '어떤 목소리는 녹음되고, 어떤 목소리는 사라진다. 나는 그 차이를 듣는 사람이다.' },
    { cmd: 'advance' },
  ],
};
