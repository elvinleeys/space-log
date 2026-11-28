import {
  ClipboardPaste,
  Crop,
  Globe,
  Paperclip,
  PencilLine,
  Power,
  type LucideIcon,
} from 'lucide-react';
import { TEXT } from '@/shared/config';
import { Card } from '@/shared/ui';

export type MenuAction = keyof typeof TEXT.menu;

// 넣는 기능과 앱 기능을 구분선으로 나눈다
const GROUPS: { action: MenuAction; icon: LucideIcon }[][] = [
  [
    { action: 'clipboard', icon: ClipboardPaste },
    { action: 'memo', icon: PencilLine },
    { action: 'capture', icon: Crop },
    { action: 'file', icon: Paperclip },
  ],
  [
    { action: 'web', icon: Globe },
    { action: 'quit', icon: Power },
  ],
];

/** 캐릭터를 누르면 열리는 메뉴. 행은 프로토타입 메뉴처럼 높이 36px, 모서리 둥근 호버 */
export function CollectorMenu({
  onSelect,
}: {
  onSelect: (action: MenuAction) => void;
}) {
  return (
    <Card>
      <div role="menu" className="divide-divider divide-y">
        {GROUPS.map((items) => (
          <ul
            key={items[0].action}
            role="group"
            className="flex flex-col gap-0.5 p-1.5"
          >
            {items.map(({ action, icon: Icon }) => (
              <li key={action} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onSelect(action)}
                  className="hover:bg-hover rounded-row flex h-9 w-full items-center gap-2 px-2.5 text-left -outline-offset-2"
                >
                  <Icon className="size-3.5 opacity-80" aria-hidden="true" />
                  {TEXT.menu[action]}
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Card>
  );
}
