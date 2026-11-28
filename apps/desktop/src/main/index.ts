import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { IPC } from '../ipc';
import { cancelLogin, login } from './auth/login';
import { clearTokens, loadTokens } from './auth/token-store';
import { captureRegion, registerCaptureIpc } from './capture';
import { readClipboard } from './clipboard';
import { pickFile } from './files';
import {
  createCharacterWindow,
  moveBy,
  resizeKeepingAnchor,
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
  const win = createCharacterWindow(preload);

  ipcMain.handle(IPC.authLogin, () => login());
  ipcMain.on(IPC.authCancel, () => cancelLogin());
  ipcMain.handle(IPC.authStatus, () => ({ loggedIn: loadTokens() !== null }));
  ipcMain.handle(IPC.authLogout, () => clearTokens());
  ipcMain.handle(IPC.clipboardRead, () => readClipboard());
  ipcMain.handle(IPC.captureStart, () => captureRegion(win, preload, loadPage));
  ipcMain.handle(IPC.filePick, () => pickFile(win));
  ipcMain.on(IPC.webOpen, () => shell.openExternal(WEB_URL));
  ipcMain.on(IPC.appQuit, () => app.quit());
  ipcMain.on(IPC.windowResize, (e, size: { width: number; height: number }) => {
    if (e.sender === win.webContents)
      resizeKeepingAnchor(win, size.width, size.height);
  });
  ipcMain.on(IPC.windowMove, (e, d: { dx: number; dy: number }) => {
    if (e.sender === win.webContents) moveBy(win, d.dx, d.dy);
  });
  registerCaptureIpc();

  loadPage(win);
});

app.on('window-all-closed', () => app.quit());
