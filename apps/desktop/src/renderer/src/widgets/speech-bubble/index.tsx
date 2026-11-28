import { X } from 'lucide-react';
import { BUBBLES, TEXT, type BubbleKind } from '@/shared/config';
import { Button, IconButton } from '@/shared/ui';

interface Props {
  kind: BubbleKind;
  onRetry?: () => void;
  onClose: () => void;
}

/** 캐릭터 옆에 뜨는 저장 결과 안내. 프로토타입의 안내 말풍선 모양(밝은 면, 어두운 글자)을 쓴다 */
export function SpeechBubble({ kind, onRetry, onClose }: Props) {
  const spec = BUBBLES[kind];
  return (
    <div
      role="status"
      className="bg-toast text-toast-ink shadow-float max-w-panel rounded-bubble text-tip flex items-center gap-1 py-1 pr-1 pl-3 font-semibold"
    >
      <span className="py-1.5 pr-2">{spec.text}</span>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          {TEXT.retry}
        </Button>
      )}
      {spec.hideAfterMs === null && kind !== 'uploading' && (
        <IconButton
          aria-label={TEXT.close}
          onClick={onClose}
          className="size-8 hover:bg-black/5"
        >
          <X className="size-3.5" aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}
