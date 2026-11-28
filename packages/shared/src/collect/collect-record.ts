// 수집 흐름 1~3단계를 한 번에 한다: 기록 생성 → 파일 업로드 → 업로드 완료 알림.
// 데스크톱 앱과 웹이 함께 쓴다. 앱마다 업로드 코드를 따로 쓰지 않는다.
import type { InformationRecord } from '../types/record';
import {
  validateCreateRecordRequest,
  type ApiErrorBody,
  type ApiErrorCode,
  type CreateRecordRequest,
  type CreateRecordResponse,
} from './create-record';

export type CollectErrorCode = ApiErrorCode | 'UPLOAD_FAILED' | 'NETWORK_ERROR';

/** 수집이 끝나지 못한 이유. code로 안내 문구를 고른다 */
export class CollectError extends Error {
  constructor(
    readonly code: CollectErrorCode,
    message: string,
    /** 기록이 만들어진 뒤에 실패했으면 그 기록 (uploading으로 남아 있다) */
    readonly recordId?: string,
  ) {
    super(message);
    this.name = 'CollectError';
  }
}

export interface CollectOptions {
  /** 웹 서버 주소. 예) https://spacelog.example */
  baseUrl: string;
  /** 데스크톱 앱의 로그인 토큰. 웹은 쿠키 세션을 쓰므로 비운다 */
  accessToken?: string;
  /** 테스트에서 가짜로 바꾼다 */
  fetch?: typeof fetch;
}

/** 업로드 완료 알림 주소. shortcut: 웹 API가 아직 없어 잠정 약속이다, 웹 서버 경로가 정해지면 맞춘다 */
export const uploadedPath = (recordId: string) =>
  `/api/records/${recordId}/uploaded`;

/**
 * 기록 하나를 저장한다. files는 request.files와 같은 순서의 파일 내용.
 * 파일 없는 기록(메모·하이라이트·URL·영상 링크)은 생성 요청 한 번으로 끝난다.
 */
export async function collectRecord(
  request: CreateRecordRequest,
  files: Blob[],
  options: CollectOptions,
): Promise<InformationRecord> {
  // 서버가 거를 요청은 보내기 전에 거른다
  const checked = validateCreateRecordRequest(request);
  if (!checked.ok) throw new CollectError(checked.code, checked.message);
  if (files.length !== (checked.value.files?.length ?? 0))
    throw new CollectError('INVALID_INPUT', '파일 정보와 파일 개수가 달라요');

  const send = options.fetch ?? fetch;
  const api = async <T>(path: string, body?: unknown, recordId?: string) => {
    const response = await send(new URL(path, options.baseUrl), {
      method: 'POST',
      // 웹은 쿠키 세션으로 로그인한다
      credentials: 'include',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => {
      throw new CollectError(
        'NETWORK_ERROR',
        '서버에 연결하지 못했어요',
        recordId,
      );
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const error = (json as ApiErrorBody | null)?.error;
      throw new CollectError(
        error?.code ?? 'INTERNAL_ERROR',
        error?.message ?? '저장하지 못했어요',
        recordId,
      );
    }
    return json as T;
  };

  const created = await api<CreateRecordResponse>(
    '/api/records',
    checked.value,
  );
  if (created.uploads.length === 0) return created.record;

  const recordId = created.record.record_id;
  // Supabase Storage의 서명 주소. 주소의 토큰이 권한이라 로그인 정보를 붙이지 않는다
  await Promise.all(
    created.uploads.map(async (upload, i) => {
      const response = await send(upload.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': upload.contentType },
        body: files[i],
      }).catch(() => null);
      if (!response?.ok)
        throw new CollectError(
          'UPLOAD_FAILED',
          '파일을 올리지 못했어요',
          recordId,
        );
    }),
  );

  const done = await api<{ record: InformationRecord }>(
    uploadedPath(recordId),
    undefined,
    recordId,
  );
  return done.record;
}
