// 기록 생성 API(POST /api/records)의 요청·응답 약속과 입력 검사.
// 웹 서버가 이 검사로 요청을 거르고, 데스크톱·웹 클라이언트도 보내기 전에 같은 검사를 쓸 수 있다.
import {
  CAPTURE_FILE_TYPES,
  COLLECTABLE_RECORD_TYPES,
  COLLECTED_FROM,
  CONTENT_RECORD_TYPES,
  FILE_RECORD_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_RECORD,
  MAX_RECORD_TOTAL_SIZE,
  SUPPORTED_FILE_TYPES,
  type CollectedFrom,
  type InformationRecord,
  type RecordFile,
  type RecordType,
  type SupportedFileType,
} from '../types/record';

export interface CreateRecordFileInput {
  name: string;
  size: number;
}

export interface CreateRecordRequest {
  record_type: RecordType;
  collected_from: CollectedFrom;
  /** 비우면 첫 파일 이름(확장자 제외), 메모 첫 줄, 주소 순으로 채운다 */
  title?: string;
  /** 메모·하이라이트 본문 전용. 다른 형식에 보내면 INVALID_INPUT */
  information_content?: string;
  source_url?: string;
  /** 화면의 '메모'. 모든 형식에 적을 수 있다 */
  original_context?: string;
  /** 비우면 '분류 안 된 기록' */
  group_id?: string;
  /** file·capture일 때만. 1~10개, 넣은 순서가 화면 번호가 된다 */
  files?: CreateRecordFileInput[];
}

export interface RecordFileUpload {
  file_id: string;
  position: number;
  path: string;
  token: string;
  /** 이 주소로 파일을 PUT하면 된다. 일정 시간 뒤 만료 */
  signedUrl: string;
  /** 업로드할 때 보낼 Content-Type (버킷이 이 형식만 받는다) */
  contentType: string;
}

export interface CreateRecordResponse {
  record: InformationRecord;
  /** 파일 없는 기록이면 빈 배열 */
  files: RecordFile[];
  /** files와 같은 순서. 파일 없는 기록이면 빈 배열 */
  uploads: RecordFileUpload[];
}

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'TOO_MANY_FILES'
  | 'FILE_TOO_LARGE'
  | 'RECORD_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  GROUP_NOT_FOUND: 404,
  TOO_MANY_FILES: 400,
  FILE_TOO_LARGE: 413,
  RECORD_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  INTERNAL_ERROR: 500,
};

export type ValidationResult =
  | { ok: true; value: CreateRecordRequest; fileTypes: SupportedFileType[] }
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
const MB = 1024 * 1024;

/** 파일 이름에서 소문자 확장자를 꺼낸다. 없으면 '' */
export const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** 파일 이름에서 확장자를 뺀다 */
export const fileBaseName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? name : name.slice(0, dot);
};

export function validateCreateRecordRequest(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null)
    return fail('INVALID_INPUT', '요청 본문이 비어 있어요');
  const body = input as Record<string, unknown>;

  const recordType = body.record_type;
  if (!COLLECTABLE_RECORD_TYPES.includes(recordType as RecordType)) {
    return fail(
      'INVALID_INPUT',
      `record_type은 ${COLLECTABLE_RECORD_TYPES.join(', ')} 중 하나여야 해요`,
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
  // 본문은 메모·하이라이트에만. 나머지 형식의 메모는 original_context로 받는다
  if (
    value.information_content &&
    !CONTENT_RECORD_TYPES.includes(value.record_type)
  ) {
    return fail(
      'INVALID_INPUT',
      '메모는 original_context로 보내 주세요 (information_content는 메모·하이라이트 본문 전용)',
    );
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
    if (body.files !== undefined)
      return fail(
        'INVALID_INPUT',
        '파일은 file·capture 기록에만 보낼 수 있어요',
      );
    return { ok: true, value, fileTypes: [] };
  }

  const files = body.files;
  if (!Array.isArray(files) || files.length === 0) {
    return fail(
      'INVALID_INPUT',
      '파일 정보(files: [{ name, size }])가 필요해요',
    );
  }
  if (files.length > MAX_FILES_PER_RECORD) {
    return fail(
      'TOO_MANY_FILES',
      `파일은 한 번에 ${MAX_FILES_PER_RECORD}개까지 넣을 수 있어요`,
    );
  }

  const allowed: readonly string[] =
    value.record_type === 'capture'
      ? CAPTURE_FILE_TYPES
      : Object.keys(SUPPORTED_FILE_TYPES);
  const cleaned: CreateRecordFileInput[] = [];
  const fileTypes: SupportedFileType[] = [];
  let total = 0;

  for (const f of files as { name?: unknown; size?: unknown }[]) {
    if (
      typeof f !== 'object' ||
      f === null ||
      typeof f.name !== 'string' ||
      f.name.trim() === ''
    ) {
      return fail('INVALID_INPUT', '파일마다 이름(name)이 필요해요');
    }
    const name = f.name.trim();
    if (
      typeof f.size !== 'number' ||
      !Number.isInteger(f.size) ||
      f.size <= 0
    ) {
      return fail(
        'INVALID_INPUT',
        `${name}: 크기(size)는 1 이상의 정수여야 해요`,
      );
    }
    if (f.size > MAX_FILE_SIZE)
      return fail('FILE_TOO_LARGE', `${name}: 파일은 10MB까지 올릴 수 있어요`);
    const ext = fileExtension(name);
    if (!allowed.includes(ext)) {
      return fail(
        'UNSUPPORTED_FILE_TYPE',
        `${name}: 지원하는 형식은 ${allowed.join(', ')}예요`,
      );
    }
    total += f.size;
    cleaned.push({ name, size: f.size });
    fileTypes.push(ext as SupportedFileType);
  }

  if (total > MAX_RECORD_TOTAL_SIZE) {
    return fail(
      'RECORD_TOO_LARGE',
      `파일 합계는 ${MAX_RECORD_TOTAL_SIZE / MB}MB까지 올릴 수 있어요`,
    );
  }

  value.files = cleaned;
  return { ok: true, value, fileTypes };
}

const TITLE_MAX = 100; // shortcut: 자동 제목 길이 100자는 임의값, 화면 확정 시 조정

/**
 * DB에 저장할 제목. 비워 보내면 메모·하이라이트는 첫 줄, 링크는 주소로 채운다.
 * 파일 기록은 빈 제목을 저장하지 않는다: 저장하면 파일 이름이 '제목1, 제목2'로 바뀌기 때문.
 * 파일 기록의 화면 제목은 displayRecordTitle로 첫 파일 이름을 보여 준다.
 */
export function defaultTitle(req: CreateRecordRequest): string | undefined {
  if (req.title) return req.title;
  if (req.files?.length) return undefined;
  if (req.information_content)
    return req.information_content.split(/\r?\n/)[0].trim().slice(0, TITLE_MAX);
  return req.source_url;
}
