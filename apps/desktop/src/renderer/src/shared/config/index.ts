// 문구, 시간, 제한값은 여기서만 바꾼다. 말풍선 문구는 docs/spec/screens/01-desktop-collector.md 의 표를 따른다.

// 캐릭터 크기 단계(우주인이 보이는 부분의 높이). Tailwind가 찾을 수 있게 클래스 이름을 통째로 적는다
export const CHARACTER_SIZES = ['h-13', 'h-16', 'h-19', 'h-26', 'h-32', 'h-38'];
export const DEFAULT_CHARACTER_SIZE = 2;

/**
 * 저장 창의 AI 그룹 추천. 방향이 아직 정해지지 않아 여기서 켜고 끈다.
 * - 'off': 추천 없음
 * - 'button': 'AI 추천' 버튼을 눌렀을 때만 추천
 * - 'auto': 저장 창이 열리면 바로 추천 (버튼 없음)
 */
export type AiRecommendMode = 'off' | 'button' | 'auto';
export const AI_RECOMMEND: AiRecommendMode = 'off';

export const POLL_INTERVAL_MS = 3000;
export const POLL_TIMEOUT_MS = 2 * 60 * 1000;

export type BubbleKind =
  | 'uploading'
  | 'queued'
  | 'done'
  | 'unsupported'
  | 'tooLarge'
  | 'tooMany'
  | 'totalTooLarge'
  | 'saveFailed'
  | 'processFailed'
  | 'textDrop'
  | 'emptyClipboard'
  | 'captureUnavailable';

interface BubbleSpec {
  text: string;
  /** null이면 누르거나 닫을 때까지, 또는 다음 말풍선이 뜰 때까지 남는다 */
  hideAfterMs: number | null;
}

export const BUBBLES: Record<BubbleKind, BubbleSpec> = {
  uploading: { text: '받는 중이에요', hideAfterMs: null },
  queued: { text: '받았어요! 저장하고 있어요', hideAfterMs: 2400 },
  done: { text: '저장했어요!', hideAfterMs: 2400 },
  unsupported: {
    text: 'csv, txt, md, jpeg, jpg, png, svg, HTML, PDF 파일만 넣을 수 있어요',
    hideAfterMs: 4500,
  },
  tooLarge: {
    text: '10MB보다 큰 파일은 넣을 수 없어요',
    hideAfterMs: 4500,
  },
  saveFailed: { text: '저장하지 못했어요', hideAfterMs: null },
  processFailed: {
    text: '받았지만 다 저장하지 못했어요. 웹에서 확인해 주세요',
    hideAfterMs: null,
  },
  // 아래는 명세 표에 없는 상황이라 새로 붙인 문구다
  tooMany: {
    text: '파일은 한 번에 10개까지 넣을 수 있어요',
    hideAfterMs: 4500,
  },
  totalTooLarge: {
    text: '파일을 합쳐 50MB까지 넣을 수 있어요',
    hideAfterMs: 4500,
  },
  textDrop: {
    text: '글은 복사한 뒤 메뉴의 클립보드 붙여넣기로 넣어 주세요',
    hideAfterMs: 4500,
  },
  emptyClipboard: { text: '클립보드가 비어 있어요', hideAfterMs: 2500 },
  captureUnavailable: {
    text: '화면을 캡처하지 못했어요. 화면 기록 권한을 확인해 주세요',
    hideAfterMs: 4500,
  },
};

export const TEXT = {
  menu: {
    clipboard: '클립보드 붙여넣기',
    memo: '메모',
    capture: '화면 캡처',
    file: '파일선택',
    web: '웹 열기',
    quit: '앱 종료',
  },
  save: {
    group: '그룹',
    recommend: 'AI 추천',
    recommending: '추천 중…',
    noRecommendation: '추천할 그룹을 찾지 못했어요',
    aiBadge: 'AI 추천',
    newGroup: '새 그룹 이름',
    addGroup: '그룹 만들기',
    sourceUrl: '출처 주소 (선택)',
    submit: '저장하기',
    cancel: '취소',
  },
  memo: { placeholder: '지금 떠오른 생각을 적어 보세요', submit: '기록 넣기' },
  login: {
    guide: 'Spacelog에 로그인해 주세요',
    button: '로그인하러 가기',
    waiting: '브라우저에서 로그인을 마쳐 주세요',
    cancel: '취소',
    timeout: '시간이 지나 로그인을 멈췄어요. 다시 시도해 주세요',
    failed: '로그인하지 못했어요. 다시 시도해 주세요',
  },
  resize: '캐릭터 크기 조절',
  hide: '캐릭터 잠시 내리기',
  show: '캐릭터 다시 보이기',
  retry: '다시 시도',
  close: '닫기',
};
