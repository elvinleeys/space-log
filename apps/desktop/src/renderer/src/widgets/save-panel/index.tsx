import { useEffect, useRef, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { GroupDot, type Group } from '@/entities/group';
import { itemLabel, type CollectItem } from '@/entities/record';
import { api } from '@/shared/api';
import { AI_RECOMMEND, TEXT, type AiRecommendMode } from '@/shared/config';
import { Button, Card, FIELD, IconButton, TextInput } from '@/shared/ui';

interface Props {
  item: CollectItem;
  /** AI 그룹 추천 방식. 기본값은 shared/config의 AI_RECOMMEND */
  recommendMode?: AiRecommendMode;
  onSave: (item: CollectItem, groupId: string) => void;
  onCancel: () => void;
}

/** 넣은 것을 어느 그룹에 저장할지 고르는 작은 창 */
export function SavePanel({
  item,
  recommendMode = AI_RECOMMEND,
  onSave,
  onCancel,
}: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState('');
  // 추천으로 고른 그룹에만 배지를 붙인다. 사용자가 다른 그룹을 고르면 배지는 사라진다
  const [recommend, setRecommend] = useState<
    'idle' | 'loading' | 'none' | { groupId: string }
  >('idle');
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
      // 'auto'는 창이 열리면 바로 추천한다. 그사이 사용자가 그룹을 직접 고르면 추천으로 덮어쓰지 않는다
      if (recommendMode === 'auto') askRecommendation(list, () => alive, true);
    });
    return () => {
      alive = false;
    };
    // 창이 열릴 때 한 번만 한다
  }, []);

  const touched = useRef(false);
  const askRecommendation = async (
    list: Group[],
    isAlive: () => boolean = () => true,
    keepUserChoice = false,
  ) => {
    setRecommend('loading');
    const groupId = await api.recommendGroup(item, list).catch(() => null);
    if (!isAlive()) return;
    if (!groupId) return setRecommend('none');
    if (keepUserChoice && touched.current) return setRecommend('idle');
    setSelectedId(groupId);
    setRecommend({ groupId });
  };

  const addGroup = async () => {
    const name = newGroup.trim();
    if (!name) return;
    touched.current = true;
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

  const isAiPick =
    typeof recommend === 'object' && recommend.groupId === selectedId;
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
          {isAiPick && (
            <span className="bg-hover text-ink flex h-6 items-center gap-1 rounded-full px-2">
              <Sparkles className="size-3" aria-hidden="true" />
              {TEXT.save.aiBadge}
            </span>
          )}
          {recommendMode === 'auto' && recommend === 'loading' && (
            <span role="status">{TEXT.save.recommending}</span>
          )}
        </label>
        <div className="flex gap-2">
          <select
            id="save-group"
            value={selectedId}
            onChange={(e) => {
              touched.current = true;
              setSelectedId(e.target.value);
            }}
            className={`${FIELD} h-11 min-w-0 flex-1 font-semibold`}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {recommendMode === 'button' && (
            <Button
              size="lg"
              className="gap-1.5 font-semibold"
              onClick={() => askRecommendation(groups)}
              disabled={recommend === 'loading' || !groups.length}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {recommend === 'loading'
                ? TEXT.save.recommending
                : TEXT.save.recommend}
            </Button>
          )}
        </div>
        {recommend === 'none' && (
          <p className="text-ink-sub text-fine">{TEXT.save.noRecommendation}</p>
        )}
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
