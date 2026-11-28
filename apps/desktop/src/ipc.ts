// IPC 채널 이름과 주고받는 값은 이 파일에서만 정의한다 (main, preload, renderer가 함께 쓴다).

export const IPC = {
  authLogin: 'auth:login',
  authCancel: 'auth:cancel',
  authStatus: 'auth:status',
  authLogout: 'auth:logout',
  clipboardRead: 'clipboard:read',
  captureStart: 'capture:start',
  captureImage: 'capture:image',
  captureSelect: 'capture:select',
  filePick: 'file:pick',
  webOpen: 'web:open',
  appQuit: 'app:quit',
  windowResize: 'window:resize',
  windowMove: 'window:move',
  windowSide: 'window:side',
} as const;

export type LoginResult =
  { ok: true } | { ok: false; reason: 'timeout' | 'cancelled' | 'failed' };

export interface ClipboardContent {
  text?: string;
  image?: { dataUrl: string; size: number };
  /** 크롬 계열 브라우저에서 복사했을 때만 들어온다 */
  sourceUrl?: string;
}

export type CaptureResult =
  | { ok: true; dataUrl: string; size: number }
  | { ok: false; reason: 'cancelled' | 'unavailable' };

/** 덮개 창 안에서 고른 영역 (CSS 픽셀) */
export interface CaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 내용 크기와, 그 안에서 캐릭터 칸(우주인이 보이는 부분)의 오른쪽 아래 모서리 자리·크기 (CSS 픽셀) */
export interface WindowLayout {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  baseWidth: number;
  baseHeight: number;
  /** 내용 둘레의 투명한 여백 */
  pad: number;
}

/** 메뉴·저장 창이 열리는 방향. 캐릭터가 화면 왼쪽·위쪽 절반에 있으면 true */
export interface PanelSide {
  left: boolean;
  top: boolean;
}

export type PickedFile = { name: string; size: number; path: string };

/** preload가 window.spacelog 로 노출하는 것. renderer는 이것만 쓴다 */
export interface SpacelogBridge {
  login(): Promise<LoginResult>;
  cancelLogin(): void;
  authStatus(): Promise<{ loggedIn: boolean }>;
  logout(): Promise<void>;
  readClipboard(): Promise<ClipboardContent>;
  startCapture(): Promise<CaptureResult>;
  captureImage(): Promise<string | null>;
  captureSelect(rect: CaptureRect | null): void;
  /** 고른 파일들. 취소하면 빈 배열 */
  pickFile(): Promise<PickedFile[]>;
  openWeb(): void;
  quit(): void;
  resizeWindow(layout: WindowLayout): void;
  /** 창이 열리는 방향이 정해질 때마다 불린다. 돌려주는 함수로 그만 듣는다 */
  onPanelSide(listener: (side: PanelSide) => void): () => void;
  moveWindow(dx: number, dy: number): void;
  pathForFile(file: File): string;
}
