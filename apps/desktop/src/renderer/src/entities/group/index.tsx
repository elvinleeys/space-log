export interface Group {
  id: string;
  name: string;
  /** 그룹 색 (다크 모드에서 점과 글자에 쓰는 밝은 단계) */
  color?: string;
  /** 사용자마다 하나 있는 기본 그룹 '분류 안 된 기록' */
  isDefault?: boolean;
}

/** 그룹 이름 앞에 붙는 색 점 */
export function GroupDot({ color }: { color?: string }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-2 shrink-0">
      <circle cx="4" cy="4" r="4" fill={color ?? '#cfd6e6'} />
    </svg>
  );
}
