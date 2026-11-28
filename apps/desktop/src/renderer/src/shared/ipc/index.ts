import type { SpacelogBridge } from '../../../../ipc';

declare global {
  interface Window {
    spacelog: SpacelogBridge;
  }
}

/** preload가 붙인 브릿지. 모듈 로드 시점이 아니라 호출 시점에 읽는다 */
export const ipc: SpacelogBridge = new Proxy({} as SpacelogBridge, {
  get(_target, prop, _receiver) {
    const bridge = window.spacelog;
    if (!bridge) {
      throw new Error('spacelog bridge is not available');
    }
    const value = bridge[prop as keyof SpacelogBridge];
    return typeof value === 'function' ? value.bind(bridge) : value;
  },
});

export type * from '../../../../ipc';
