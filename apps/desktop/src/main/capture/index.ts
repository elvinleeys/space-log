import {
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  type NativeImage,
} from 'electron';
import { IPC, type CaptureRect, type CaptureResult } from '../../ipc';

// shortcut: 주 모니터만 캡처한다. 여러 모니터를 지원하려면 모니터마다 덮개 창을 띄워야 한다.

let pending: {
  image: NativeImage;
  scale: number;
  finish: (rect: CaptureRect | null) => void;
} | null = null;

export function registerCaptureIpc() {
  ipcMain.handle(IPC.captureImage, () => pending?.image.toDataURL() ?? null);
  ipcMain.on(IPC.captureSelect, (_e, rect: CaptureRect | null) =>
    pending?.finish(rect),
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 화면을 찍어 덮개 창에 보여 주고, 끌어서 고른 부분만 돌려준다 */
export async function captureRegion(
  owner: BrowserWindow,
  preload: string,
  loadPage: (win: BrowserWindow, hash: string) => void,
): Promise<CaptureResult> {
  if (pending) return { ok: false, reason: 'cancelled' };
  const display = screen.getPrimaryDisplay();
  const scale = display.scaleFactor;

  owner.hide();
  await wait(200); // 캐릭터 창이 화면에서 사라진 뒤에 찍는다
  let shot: NativeImage | undefined;
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(display.size.width * scale),
        height: Math.round(display.size.height * scale),
      },
    });
    shot = (
      sources.find((s) => s.display_id === String(display.id)) ?? sources[0]
    )?.thumbnail;
  } catch {
    shot = undefined;
  }
  if (!shot || shot.isEmpty()) {
    owner.show();
    return { ok: false, reason: 'unavailable' }; // macOS 화면 기록 권한이 없을 때
  }

  const overlay = new BrowserWindow({
    ...display.bounds,
    frame: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    enableLargerThanScreen: true,
    show: false,
    webPreferences: {
      preload,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setBounds(display.bounds);

  return new Promise<CaptureResult>((resolve) => {
    const finish = (rect: CaptureRect | null) => {
      if (!pending) return;
      const { image } = pending;
      pending = null;
      if (!overlay.isDestroyed()) overlay.destroy();
      owner.show();
      if (!rect || rect.width < 4 || rect.height < 4)
        return resolve({ ok: false, reason: 'cancelled' });
      const cropped = image.crop({
        x: Math.round(rect.x * scale),
        y: Math.round(rect.y * scale),
        width: Math.round(rect.width * scale),
        height: Math.round(rect.height * scale),
      });
      resolve({
        ok: true,
        dataUrl: cropped.toDataURL(),
        size: cropped.toPNG().length,
      });
    };

    overlay.once('ready-to-show', () => {
      // 메뉴 막대 때문에 덮개 창이 화면 전체를 못 덮으면, 덮은 부분만 잘라서 보여 준다
      const ob = overlay.getContentBounds();
      const image = shot.crop({
        x: Math.round((ob.x - display.bounds.x) * scale),
        y: Math.round((ob.y - display.bounds.y) * scale),
        width: Math.round(ob.width * scale),
        height: Math.round(ob.height * scale),
      });
      pending = { image, scale, finish };
      overlay.show();
      overlay.focus();
    });
    overlay.once('closed', () => finish(null));
    pending = { image: shot, scale, finish };
    loadPage(overlay, 'capture');
  });
}
