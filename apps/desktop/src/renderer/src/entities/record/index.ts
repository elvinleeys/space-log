import {
  MAX_FILE_SIZE,
  MAX_FILES_PER_RECORD,
  MAX_RECORD_TOTAL_SIZE,
  SUPPORTED_FILE_TYPES,
  fileExtension,
  type CreateRecordRequest,
  type RecordStatus,
} from '@space-log/shared';

export type { RecordStatus };

/** 넣을 파일 하나. path는 내 컴퓨터 파일, dataUrl은 클립보드·캡처 그림, blob은 끌어다 놓은 파일이나 줄인 그림의 내용 */
export interface FileEntry {
  name: string;
  size: number;
  path?: string;
  dataUrl?: string;
  blob?: Blob;
}

/** 수집앱이 받아 저장 창으로 넘기는 것 */
export type CollectItem =
  | { kind: 'file'; files: FileEntry[] }
  | ({ kind: 'capture' } & FileEntry)
  | { kind: 'url'; url: string }
  | { kind: 'video'; url: string }
  | { kind: 'highlight'; text: string; sourceUrl?: string }
  | { kind: 'memo'; text: string };

export type FileError =
  'unsupported' | 'tooLarge' | 'tooMany' | 'totalTooLarge';

export type CollectError =
  FileError | 'textDrop' | 'emptyClipboard' | 'captureUnavailable';

/** 받기에 성공하면 item, 넣을 수 없으면 error, 사용자가 취소했으면 null */
export type CollectResult =
  { item: CollectItem } | { error: CollectError } | null;

export function validateFile(
  name: string,
  size: number,
): 'ok' | 'unsupported' | 'tooLarge' {
  if (!(fileExtension(name) in SUPPORTED_FILE_TYPES)) return 'unsupported';
  return size > MAX_FILE_SIZE ? 'tooLarge' : 'ok';
}

/** 기록 하나에 넣을 파일들: 10개까지, 하나에 10MB, 합쳐서 50MB */
export function validateFiles(
  files: { name: string; size: number }[],
): 'ok' | FileError {
  if (files.length > MAX_FILES_PER_RECORD) return 'tooMany';
  for (const f of files) {
    const check = validateFile(f.name, f.size);
    if (check !== 'ok') return check;
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return total > MAX_RECORD_TOTAL_SIZE ? 'totalTooLarge' : 'ok';
}

// 가공 서버(apps/worker/processors/video.py)가 자막을 가져올 수 있는 곳만 영상 링크로 본다. 나머지는 URL 기록
const VIDEO_HOSTS = ['youtube.com', 'youtu.be'];

/** 주소면 URL 기록(유튜브 등은 영상 링크), 아니면 null */
export function classifyUrl(text: string): CollectItem | null {
  const value = text.trim();
  if (/\s/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^(www|m)\./, '');
  const isVideo = VIDEO_HOSTS.some((v) => host === v || host.endsWith(`.${v}`));
  return { kind: isVideo ? 'video' : 'url', url: url.href };
}

/** 저장 창에 보여 줄 한 줄 */
export function itemLabel(item: CollectItem): string {
  switch (item.kind) {
    case 'file': {
      const [first, ...rest] = item.files;
      return rest.length ? `${first.name} 외 ${rest.length}개` : first.name;
    }
    case 'capture':
      return item.name;
    case 'url':
    case 'video':
      return item.url;
    case 'highlight':
    case 'memo':
      return item.text;
  }
}

/** 기록 생성 API(POST /api/records)에 보낼 형식으로 바꾼다. 본문은 메모·하이라이트에만 넣는다 */
export function toCreateRecordRequest(
  item: CollectItem,
  groupId?: string,
): CreateRecordRequest {
  const base = { collected_from: 'desktop' as const, group_id: groupId };
  switch (item.kind) {
    case 'file':
      return {
        ...base,
        record_type: 'file',
        files: item.files.map(({ name, size }) => ({ name, size })),
      };
    case 'capture':
      return {
        ...base,
        record_type: 'capture',
        files: [{ name: item.name, size: item.size }],
      };
    case 'url':
    case 'video':
      return { ...base, record_type: item.kind, source_url: item.url };
    case 'highlight':
      return {
        ...base,
        record_type: 'highlight',
        information_content: item.text,
        source_url: item.sourceUrl,
      };
    case 'memo':
      return { ...base, record_type: 'memo', information_content: item.text };
  }
}
