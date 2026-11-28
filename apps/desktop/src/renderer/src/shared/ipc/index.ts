import type { SpacelogBridge } from '../../../../ipc';

declare global {
  interface Window {
    spacelog: SpacelogBridge;
  }
}

/** preload가 노출한 통로. renderer는 Node.js API 대신 이것만 쓴다 */
export const ipc: SpacelogBridge = window.spacelog;
export type * from '../../../../ipc';
