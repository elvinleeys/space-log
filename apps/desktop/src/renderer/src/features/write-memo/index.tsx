import { useState } from 'react';
import { TEXT } from '@/shared/config';
import { Button, Card, TextArea } from '@/shared/ui';

export function MemoInput(props: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const value = text.trim();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <TextArea
        autoFocus
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={TEXT.memo.placeholder}
        aria-label={TEXT.menu.memo}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={props.onCancel}>{TEXT.save.cancel}</Button>
        <Button
          variant="primary"
          disabled={!value}
          onClick={() => props.onSubmit(value)}
        >
          {TEXT.memo.submit}
        </Button>
      </div>
    </Card>
  );
}
