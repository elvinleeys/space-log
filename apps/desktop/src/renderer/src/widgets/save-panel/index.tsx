import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { GroupDot, type Group } from '@/entities/group';
import { itemLabel, type CollectItem } from '@/entities/record';
import { api } from '@/shared/api';
import { TEXT } from '@/shared/config';
import { Button, Card, FIELD, IconButton, TextInput } from '@/shared/ui';

interface Props {
  item: CollectItem;
  onSave: (item: CollectItem, groupId: string) => void;
  onCancel: () => void;
}

/** 넣은 것을 어느 그룹에 저장할지 고르는 작은 창 */
export function SavePanel({ item, onSave, onCancel }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [sourceUrl, setSourceUrl] = useState(
    item.kind === 'highlight' ? (item.sourceUrl ?? '') : '',
  );

  useEffect(() => {
    let alive = true;
    api.listGroups().then((list) => {
      if (!alive) return;
      setGroups(list);
      setSelectedId((list.find((g) => g.isDefault) ?? list[0])?.id ?? '');
    });
    return () => {
      alive = false;
    };
    // 창이 열릴 때 한 번만 한다
  }, []);

  const addGroup = async () => {
    const name = newGroup.trim();
    if (!name) return;
    const group = await api.createGroup(name);
    setGroups((list) => [...list, group]);
    setSelectedId(group.id);
    setNewGroup('');
  };

  const submit = () => {
    const url = sourceUrl.trim();
    onSave(
      item.kind === 'highlight'
        ? { ...item, sourceUrl: url || undefined }
        : item,
      selectedId,
    );
  };

  const selected = groups.find((g) => g.id === selectedId);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="line-clamp-2 leading-[1.29] font-semibold break-all">
        {itemLabel(item)}
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="save-group"
          className="text-ink-sub text-fine flex items-center gap-1.5"
        >
          <GroupDot color={selected?.color} />
          {TEXT.save.group}
        </label>
        <div className="flex gap-2">
          <select
            id="save-group"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={`${FIELD} h-11 min-w-0 flex-1 font-semibold`}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <TextInput
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGroup()}
          placeholder={TEXT.save.newGroup}
          aria-label={TEXT.save.newGroup}
        />
        <IconButton
          onClick={addGroup}
          disabled={!newGroup.trim()}
          aria-label={TEXT.save.addGroup}
          className="border-line-button hover:bg-hover size-11 border disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </IconButton>
      </div>

      {item.kind === 'highlight' && (
        <TextInput
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder={TEXT.save.sourceUrl}
          aria-label={TEXT.save.sourceUrl}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>{TEXT.save.cancel}</Button>
        <Button variant="primary" onClick={submit} disabled={!selectedId}>
          {TEXT.save.submit}
        </Button>
      </div>
    </Card>
  );
}
