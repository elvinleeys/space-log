import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
// 원본은 docs/design/logo/desktop. icon-mac.png는 icon.icns에서 뽑았다 (Dock은 icns를 읽지 못한다)
import macIcon from '../../resources/icon-mac.png?asset';
import linuxIcon from '../../resources/icon.png?asset';
import winIcon from '../../resources/icon.ico?asset';
import { IPC, type WindowLayout } from '../ipc';
import { cancelLogin, login } from './auth/login';
import { clearTokens, loadTokens } from './auth/token-store';
import { captureRegion, registerCaptureIpc } from './capture';
import { readClipboard } from './clipboard';
import { pickFile, readPickedFile } from './files';
import { createTray } from './tray';
import {
  applyLayout,
  createCharacterWindow,
  moveBy,
} from './window/character-window';

// 웹이 배포되면 그 주소로 바꾼다
const WEB_URL = process.env.SPACELOG_WEB_URL ?? 'http://localhost:3000';
const preload = join(__dirname, '../preload/index.js');

function loadPage(win: BrowserWindow, hash = '') {
  // 놓친 파일이나 링크 때문에 창이 다른 주소로 넘어가지 않게 한다
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devUrl)
    win.loadURL(hash ? `${devUrl}#${hash}` : devUrl);
  else win.loadFile(join(__dirname, '../renderer/index.html'), { hash });
}

app.whenReady().then(() => {
  // macOS는 창 아이콘이 없어 Dock 아이콘으로 지정한다. 설치된 앱은 electron-builder.yml의 icon.icns를 쓴다
  if (process.platform === 'darwin' && !app.isPackaged)
    app.dock?.setIcon(macIcon);
  const win = createCharacterWindow(
    preload,
    process.platform === 'win32' ? winIcon : linuxIcon,
  );

  const openWeb = () => shell.openExternal(WEB_URL);
  const refreshTray = createTray({
    loggedIn: () => loadTokens() !== null,
    // 로그인은 renderer가 맡는다 (기다리는 중·실패 안내가 거기 있다)
    login: () => win.webContents.send(IPC.authRequest),
    openWeb,
    quit: () => app.quit(),
  });

  ipcMain.handle(IPC.authLogin, () => login().finally(refreshTray));
  ipcMain.on(IPC.authCancel, () => cancelLogin());
  ipcMain.handle(IPC.authStatus, () => ({ loggedIn: loadTokens() !== null }));
  ipcMain.handle(IPC.authLogout, () => {
    clearTokens();
    refreshTray();
  });
  ipcMain.handle(IPC.clipboardRead, () => readClipboard());
  ipcMain.handle(IPC.captureStart, () => captureRegion(win, preload, loadPage));
  ipcMain.handle(IPC.filePick, () => pickFile());
  ipcMain.handle(IPC.fileRead, (_e, path: string) => readPickedFile(path));
  ipcMain.on(IPC.webOpen, openWeb);
  ipcMain.on(IPC.appQuit, () => app.quit());
  ipcMain.on(IPC.windowResize, (e, layout: WindowLayout) => {
    if (e.sender === win.webContents) applyLayout(win, layout);
  });
  ipcMain.on(IPC.windowMove, (e, d: { dx: number; dy: number }) => {
    if (e.sender === win.webContents) moveBy(win, d.dx, d.dy);
  });
  registerCaptureIpc();

  loadPage(win);
});

app.on('window-all-closed', () => app.quit());
