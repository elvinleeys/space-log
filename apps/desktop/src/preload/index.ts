import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC, type PanelSide, type SpacelogBridge } from '../ipc';

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
  readPickedFile: (path) => ipcRenderer.invoke(IPC.fileRead, path),
  openWeb: () => ipcRenderer.send(IPC.webOpen),
  quit: () => ipcRenderer.send(IPC.appQuit),
  resizeWindow: (layout) => ipcRenderer.send(IPC.windowResize, layout),
  onPanelSide: (listener) => {
    const handler = (_e: unknown, side: PanelSide) => listener(side);
    ipcRenderer.on(IPC.windowSide, handler);
    return () => ipcRenderer.removeListener(IPC.windowSide, handler);
  },
  moveWindow: (dx, dy) => ipcRenderer.send(IPC.windowMove, { dx, dy }),
  pathForFile: (file) => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld('spacelog', bridge);
