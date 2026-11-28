import { useCallback, useEffect, useState } from 'react';
import type { CollectItem, CollectResult } from '@/entities/record';
import { collectFromCapture } from '@/features/capture-screen';
import { collectFromClipboard } from '@/features/collect-clipboard';
import { classifyDrop } from '@/features/collect-drop';
import { collectFromFilePicker } from '@/features/pick-file';
import { saveAndTrack } from '@/features/save-record';
import { MemoInput } from '@/features/write-memo';
import { api } from '@/shared/api';
import { BUBBLES, type BubbleKind } from '@/shared/config';
import { ipc } from '@/shared/ipc';
import { Character } from '@/widgets/character';
import { CollectorMenu, type MenuAction } from '@/widgets/collector-menu';
import { DevPanel } from '@/widgets/dev-panel';
import { SavePanel } from '@/widgets/save-panel';
import { SpeechBubble } from '@/widgets/speech-bubble';

type Panel =
  | { type: 'none' }
  | { type: 'menu' }
  | { type: 'memo' }
  | { type: 'dev' }
  | { type: 'save'; item: CollectItem };
type Bubble = { kind: BubbleKind; onRetry?: () => void };

const CLOSED: Panel = { type: 'none' };

/** 로그인한 뒤의 화면: 캐릭터, 메뉴, 저장 창, 말풍선 */
export function CollectorPage({ onLogout }: { onLogout: () => void }) {
  const [panel, setPanel] = useState<Panel>(CLOSED);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  useEffect(() => {
    const ms = bubble && BUBBLES[bubble.kind].hideAfterMs;
    if (!ms) return;
    const timer = setTimeout(() => setBubble(null), ms);
    return () => clearTimeout(timer);
  }, [bubble]);

  /** 받은 것이 있으면 저장 창을 띄우고, 넣을 수 없으면 말풍선으로 알린다 */
  const receive = useCallback((result: CollectResult) => {
    if (!result) return setPanel(CLOSED);
    if ('error' in result) {
      setPanel(CLOSED);
      return setBubble({ kind: result.error });
    }
    setBubble(null);
    setPanel({ type: 'save', item: result.item });
  }, []);

  const save = useCallback((item: CollectItem, groupId: string) => {
    setPanel(CLOSED);
    saveAndTrack(api, item, groupId, (kind) =>
      setBubble({
        kind,
        onRetry: kind === 'saveFailed' ? () => save(item, groupId) : undefined,
      }),
    );
  }, []);

  const onMenu = async (action: MenuAction) => {
    setPanel(CLOSED);
    if (action === 'clipboard') receive(await collectFromClipboard());
    if (action === 'memo') setPanel({ type: 'memo' });
    if (action === 'capture') receive(await collectFromCapture());
    if (action === 'file') receive(await collectFromFilePicker());
    if (action === 'web') ipc.openWeb();
    if (action === 'quit') ipc.quit();
  };

  return (
    <>
      {panel.type === 'menu' && <CollectorMenu onSelect={onMenu} />}
      {panel.type === 'dev' && (
        <DevPanel onLogout={onLogout} onClose={() => setPanel(CLOSED)} />
      )}
      {panel.type === 'memo' && (
        <MemoInput
          onSubmit={(text) => receive({ item: { kind: 'memo', text } })}
          onCancel={() => setPanel(CLOSED)}
        />
      )}
      {panel.type === 'save' && (
        <SavePanel
          item={panel.item}
          onSave={save}
          onCancel={() => setPanel(CLOSED)}
        />
      )}
      {bubble && panel.type === 'none' && (
        <SpeechBubble
          kind={bubble.kind}
          onRetry={bubble.onRetry}
          onClose={() => setBubble(null)}
        />
      )}
      <Character
        busy={bubble?.kind === 'uploading'}
        onClick={() =>
          setPanel((p) => (p.type === 'none' ? { type: 'menu' } : CLOSED))
        }
        onDropData={(data) => receive(classifyDrop(data))}
        onContextMenu={
          import.meta.env.DEV ? () => setPanel({ type: 'dev' }) : undefined
        }
      />
    </>
  );
}
