import { app, BrowserWindow, screen } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 창의 오른쪽 아래 모서리를 기준점으로 저장한다. 메뉴나 저장 창이 열려 창이 커져도 캐릭터는 제자리에 있다.
interface Anchor {
  x: number;
  y: number;
}

const anchorFile = () => join(app.getPath('userData'), 'window.json');

function loadAnchor(): Anchor | null {
  try {
    const saved = JSON.parse(readFileSync(anchorFile(), 'utf8'));
    return typeof saved.x === 'number' && typeof saved.y === 'number'
      ? saved
      : null;
  } catch {
    return null;
  }
}

let saveTimer: NodeJS.Timeout | undefined;
function saveAnchorSoon(win: BrowserWindow) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (win.isDestroyed()) return;
    const b = win.getBounds();
    writeFileSync(
      anchorFile(),
      JSON.stringify({ x: b.x + b.width, y: b.y + b.height }),
    );
  }, 300);
}

/** 모니터 구성이 바뀌어도 창이 화면 밖으로 나가지 않게 한다 */
function clampToScreen(b: Electron.Rectangle): Electron.Rectangle {
  const area = screen.getDisplayMatching(b).workArea;
  const x = Math.min(Math.max(b.x, area.x), area.x + area.width - b.width);
  const y = Math.min(Math.max(b.y, area.y), area.y + area.height - b.height);
  return { ...b, x: Math.round(x), y: Math.round(y) };
}

export function createCharacterWindow(preload: string): BrowserWindow {
  const size = { width: 120, height: 120 };
  const area = screen.getPrimaryDisplay().workArea;
  const anchor = loadAnchor() ?? {
    x: area.x + area.width - 40,
    y: area.y + area.height - 40,
  };

  const win = new BrowserWindow({
    ...clampToScreen({
      x: anchor.x - size.width,
      y: anchor.y - size.height,
      ...size,
    }),
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    webPreferences: {
      preload,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.once('ready-to-show', () => win.show());
  return win;
}

/** 내용 크기에 맞춰 창 크기를 바꾼다. 오른쪽 아래 모서리는 그대로 둔다 */
export function resizeKeepingAnchor(
  win: BrowserWindow,
  width: number,
  height: number,
) {
  const b = win.getBounds();
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  win.setBounds(
    clampToScreen({
      x: b.x + b.width - w,
      y: b.y + b.height - h,
      width: w,
      height: h,
    }),
  );
}

export function moveBy(win: BrowserWindow, dx: number, dy: number) {
  const b = win.getBounds();
  win.setBounds(
    clampToScreen({ ...b, x: b.x + Math.round(dx), y: b.y + Math.round(dy) }),
  );
  saveAnchorSoon(win);
}
