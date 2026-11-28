import { app, BrowserWindow, screen } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IPC, type WindowLayout } from '../../ipc';
import { placeWindow } from './place';

// 캐릭터가 보이는 부분의 오른쪽 아래 모서리를 기준점으로 저장한다. 메뉴나 저장 창이 열려 창이 커져도 캐릭터는 제자리에 있다.
interface Anchor {
  x: number;
  y: number;
}

let anchor: Anchor;
/** renderer가 마지막으로 알려 준 내용 배치 */
let layout: WindowLayout | null = null;
let sentSide = '';

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
function saveAnchorSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(
    () => writeFileSync(anchorFile(), JSON.stringify(anchor)),
    300,
  );
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
  anchor = loadAnchor() ?? {
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

/** 기준점에 맞춰 창을 놓고, 열리는 방향을 renderer에 알린다 */
function place(win: BrowserWindow, alwaysTell: boolean) {
  if (!layout) return;
  const area = screen.getDisplayNearestPoint(anchor).workArea;
  const placed = placeWindow(anchor, layout, area);
  anchor = placed.anchor;
  win.setBounds(placed.bounds);
  const side = JSON.stringify(placed.side);
  if (alwaysTell || side !== sentSide)
    win.webContents.send(IPC.windowSide, placed.side);
  sentSide = side;
}

/** 내용 크기가 바뀌면 창 크기를 맞춘다. 캐릭터는 그대로 둔다 */
export function applyLayout(win: BrowserWindow, next: WindowLayout) {
  layout = next;
  // renderer가 새로 고쳐졌을 수 있으니 방향은 매번 알린다
  place(win, true);
}

export function moveBy(win: BrowserWindow, dx: number, dy: number) {
  anchor = { x: anchor.x + Math.round(dx), y: anchor.y + Math.round(dy) };
  place(win, false);
  saveAnchorSoon();
}
