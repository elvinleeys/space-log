// 기록 생성 API(POST /api/records)의 요청·응답 약속과 입력 검사.
// 웹 서버가 이 검사로 요청을 거르고, 데스크톱·웹 클라이언트도 보내기 전에 같은 검사를 쓸 수 있다.
import {
  CAPTURE_FILE_TYPES,
  COLLECTED_FROM,
  FILE_RECORD_TYPES,
  MAX_FILE_SIZE,
  RECORD_TYPES,
  SUPPORTED_FILE_TYPES,
  type CollectedFrom,
  type InformationRecord,
  type RecordType,
  type SupportedFileType,
} from '../types/record';

export interface CreateRecordRequest {
  record_type: RecordType;
  collected_from: CollectedFrom;
  title?: string;
  information_content?: string;
  source_url?: string;
  original_context?: string;
  /** 비우면 '분류 안 된 기록' */
  group_id?: string;
  /** file·capture일 때만 */
  file?: { name: string; size: number };
}

export interface CreateRecordResponse {
  record: InformationRecord;
  /** file·capture일 때 서명 업로드 정보. 나머지는 null */
  upload: {
    path: string;
    token: string;
    /** 이 주소로 파일을 PUT하면 된다. 일정 시간 뒤 만료 */
    signedUrl: string;
    /** 업로드할 때 보낼 Content-Type (버킷이 이 형식만 받는다) */
    contentType: string;
  } | null;
}

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  GROUP_NOT_FOUND: 404,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  INTERNAL_ERROR: 500,
};

export type ValidationResult =
  | { ok: true; value: CreateRecordRequest; fileType: SupportedFileType | null }
  | { ok: false; code: ApiErrorCode; message: string };

const fail = (code: ApiErrorCode, message: string): ValidationResult => ({
  ok: false,
  code,
  message,
});

const optionalText = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
};

const isHttpUrl = (v: string): boolean => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 파일 이름에서 소문자 확장자를 꺼낸다. 없으면 '' */
export const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
};

export function validateCreateRecordRequest(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null)
    return fail('INVALID_INPUT', '요청 본문이 비어 있어요');
  const body = input as Record<string, unknown>;

  const recordType = body.record_type;
  if (!RECORD_TYPES.includes(recordType as RecordType)) {
    return fail(
      'INVALID_INPUT',
      `record_type은 ${RECORD_TYPES.join(', ')} 중 하나여야 해요`,
    );
  }
  const collectedFrom = body.collected_from;
  if (!COLLECTED_FROM.includes(collectedFrom as CollectedFrom)) {
    return fail(
      'INVALID_INPUT',
      `collected_from은 ${COLLECTED_FROM.join(', ')} 중 하나여야 해요`,
    );
  }

  const value: CreateRecordRequest = {
    record_type: recordType as RecordType,
    collected_from: collectedFrom as CollectedFrom,
    title: optionalText(body.title),
    information_content: optionalText(body.information_content),
    source_url: optionalText(body.source_url),
    original_context: optionalText(body.original_context),
    group_id: optionalText(body.group_id),
  };

  if (value.group_id && !UUID.test(value.group_id))
    return fail('GROUP_NOT_FOUND', '그룹을 찾을 수 없어요');
  if (value.source_url && !isHttpUrl(value.source_url)) {
    return fail('INVALID_INPUT', '출처 주소는 http 또는 https 주소여야 해요');
  }

  switch (value.record_type) {
    case 'memo':
    case 'highlight':
      if (!value.information_content)
        return fail('INVALID_INPUT', '저장할 글이 비어 있어요');
      break;
    case 'url':
    case 'video':
      if (!value.source_url)
        return fail('INVALID_INPUT', '주소(source_url)가 필요해요');
      break;
  }

  if (!FILE_RECORD_TYPES.includes(value.record_type)) {
    if (body.file !== undefined)
      return fail(
        'INVALID_INPUT',
        '파일은 file·capture 기록에만 보낼 수 있어요',
      );
    return { ok: true, value, fileType: null };
  }

  const file = body.file as { name?: unknown; size?: unknown } | undefined;
  if (
    typeof file !== 'object' ||
    file === null ||
    typeof file.name !== 'string' ||
    file.name.trim() === ''
  ) {
    return fail('INVALID_INPUT', '파일 정보(file.name, file.size)가 필요해요');
  }
  if (
    typeof file.size !== 'number' ||
    !Number.isInteger(file.size) ||
    file.size <= 0
  ) {
    return fail(
      'INVALID_INPUT',
      '파일 크기(file.size)는 1 이상의 정수여야 해요',
    );
  }
  if (file.size > MAX_FILE_SIZE)
    return fail('FILE_TOO_LARGE', '파일은 10MB까지 올릴 수 있어요');

  const ext = fileExtension(file.name);
  const allowed: readonly string[] =
    value.record_type === 'capture'
      ? CAPTURE_FILE_TYPES
      : Object.keys(SUPPORTED_FILE_TYPES);
  if (!allowed.includes(ext)) {
    return fail(
      'UNSUPPORTED_FILE_TYPE',
      `지원하는 형식: ${allowed.join(', ')}`,
    );
  }

  value.file = { name: file.name.trim(), size: file.size };
  return { ok: true, value, fileType: ext as SupportedFileType };
}

const TITLE_MAX = 100; // shortcut: 자동 제목 길이 100자는 임의값, 화면 확정 시 조정

/** 제목을 비워 보냈을 때 채울 값: 메모·하이라이트는 첫 줄, 파일은 파일 이름, 링크는 주소 */
export function defaultTitle(req: CreateRecordRequest): string | undefined {
  if (req.title) return req.title;
  if (req.file) return req.file.name;
  if (req.information_content)
    return req.information_content.split(/\r?\n/)[0].trim().slice(0, TITLE_MAX);
  return req.source_url;
}
