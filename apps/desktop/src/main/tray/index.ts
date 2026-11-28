import { app, Menu, nativeImage, Tray } from 'electron';
// 원본은 docs/design/logo/desktop
import whiteIcon from '../../../resources/tray-white-32.png?asset';
// 레티나 화면은 같은 폴더의 trayTemplate@2x.png를 알아서 골라 쓴다
import macIcon from '../../../resources/trayTemplate.png?asset';

export interface TrayActions {
  loggedIn(): boolean;
  login(): void;
  openWeb(): void;
  quit(): void;
}

// 붙잡아 두지 않으면 정리되면서 아이콘이 사라진다
let tray: Tray | null = null;

/** 트레이 아이콘을 만든다. 돌려주는 함수는 로그인 상태가 바뀌었을 때 메뉴를 다시 그린다 */
export function createTray(actions: TrayActions): () => void {
  const mac = process.platform === 'darwin';
  // shortcut: Windows·Linux는 어두운 작업 표시줄용 흰 아이콘만 쓴다, 밝은 작업 표시줄에서 안 보인다는 말이 나오면 trayTemplate로 가른다
  const image = nativeImage.createFromPath(mac ? macIcon : whiteIcon);
  if (mac) image.setTemplateImage(true);
  tray = new Tray(image);
  tray.setToolTip('Spacelog');

  const refresh = () =>
    tray?.setContextMenu(
      Menu.buildFromTemplate([
        // 로그인은 로그인하지 않았을 때만 보인다
        { label: '로그인', visible: !actions.loggedIn(), click: actions.login },
        { label: '웹 열기', click: actions.openWeb },
        {
          // 개발 모드에서 켜면 빈 Electron이 등록되므로 설치된 앱에서만 누를 수 있다
          label: app.isPackaged
            ? '컴퓨터를 켜면 자동 실행'
            : '컴퓨터를 켜면 자동 실행 (설치한 앱에서만)',
          type: 'checkbox',
          enabled: app.isPackaged,
          // Linux는 Electron이 지원하지 않는다
          visible: process.platform !== 'linux',
          checked: app.getLoginItemSettings().openAtLogin,
          click: (item) =>
            app.setLoginItemSettings({ openAtLogin: item.checked }),
        },
        { type: 'separator' },
        { label: '앱 종료', click: actions.quit },
      ]),
    );
  refresh();
  return refresh;
}
