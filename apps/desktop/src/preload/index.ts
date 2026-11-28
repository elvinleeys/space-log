import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC, type SpacelogBridge } from '../ipc';

const bridge: SpacelogBridge = {
  login: () => ipcRenderer.invoke(IPC.authLogin),
  cancelLogin: () => ipcRenderer.send(IPC.authCancel),
  authStatus: () => ipcRenderer.invoke(IPC.authStatus),
  logout: () => ipcRenderer.invoke(IPC.authLogout),
  readClipboard: () => ipcRenderer.invoke(IPC.clipboardRead),
  startCapture: () => ipcRenderer.invoke(IPC.captureStart),
  captureImage: () => ipcRenderer.invoke(IPC.captureImage),
  captureSelect: (rect) => ipcRenderer.send(IPC.captureSelect, rect),
  pickFile: () => ipcRenderer.invoke(IPC.filePick),
  openWeb: () => ipcRenderer.send(IPC.webOpen),
  quit: () => ipcRenderer.send(IPC.appQuit),
  resizeWindow: (width, height) =>
    ipcRenderer.send(IPC.windowResize, { width, height }),
  moveWindow: (dx, dy) => ipcRenderer.send(IPC.windowMove, { dx, dy }),
  pathForFile: (file) => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld('spacelog', bridge);
