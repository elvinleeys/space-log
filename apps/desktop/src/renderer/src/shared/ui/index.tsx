import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: keyof typeof SIZES;
};

// 높이는 32(말풍선 안)·40(기본)·44px(입력칸과 나란히)
const SIZES = { sm: 'h-8 px-3.5', md: 'h-10 px-3.5', lg: 'h-11 px-4' };

/** 알약 모양 버튼. 주 버튼은 강조색 면, 보조 버튼은 테두리만 */
export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const look =
    variant === 'primary'
      ? 'bg-accent text-white'
      : 'border-line-button text-ink hover:bg-hover border';
  return (
    <button
      type="button"
      className={`ease-press text-caption inline-flex shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap transition-transform duration-200 active:scale-95 disabled:opacity-40 ${SIZES[size]} ${look} ${className}`}
      {...props}
    />
  );
}

/** 테두리만 있는 원형 아이콘 버튼 */
export function IconButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`ease-press flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-95 ${className}`}
      {...props}
    />
  );
}

const FIELD_BASE =
  'text-ink placeholder:text-ink-off focus:border-accent-bright w-full bg-transparent px-3.5 text-caption outline-none';

/** 한 줄 입력칸·선택칸: 실선 테두리, 높이는 쓰는 곳에서 44px(h-11) */
export const FIELD = `${FIELD_BASE} border-line-button rounded-field border`;

export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD} h-11 ${className}`} {...props} />;
}

/** 여러 줄 메모 칸: 점선 테두리, 포커스하면 실선 */
export function TextArea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${FIELD_BASE} border-line-dashed rounded-memo resize-none border-[1.5px] border-dashed py-3 leading-normal focus:border-solid ${className}`}
      {...props}
    />
  );
}

/** 메뉴, 저장 창, 로그인 안내가 함께 쓰는 창 */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-panel border-line rounded-window shadow-float text-ink w-panel text-caption border ${className}`}
    >
      {children}
    </div>
  );
}
