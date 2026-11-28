// 기록·그룹·처리 상태 공통 타입. 필드 이름은 docs/database.md와 supabase/migrations를 그대로 따른다.

export const RECORD_TYPES = [
  'memo',
  'highlight',
  'url',
  'video',
  'file',
  'capture',
  'chat',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

/** 수집(POST /api/records)으로 만들 수 있는 형식. chat은 챗봇 '기록으로 저장'으로만 만든다 */
export const COLLECTABLE_RECORD_TYPES: readonly RecordType[] = [
  'memo',
  'highlight',
  'url',
  'video',
  'file',
  'capture',
];

/** 본문(information_content)을 쓰는 형식. 나머지 형식의 화면 '메모'는 original_context */
export const CONTENT_RECORD_TYPES: readonly RecordType[] = [
  'memo',
  'highlight',
];

/** 'AI 분석하기' 버튼이 보이는 형식 */
export const ANALYZABLE_RECORD_TYPES: readonly RecordType[] = [
  'url',
  'video',
  'file',
  'capture',
];

/** AI 분석 상태. status(저장·색인)와 따로 관리한다 */
export const ANALYSIS_STATUSES = [
  'none',
  'analyzing',
  'done',
  'failed',
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const RECORD_STATUSES = [
  'uploading',
  'queued',
  'processing',
  'done',
  'failed',
  'deleting',
] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const COLLECTED_FROM = ['desktop', 'web', 'mcp'] as const;
export type CollectedFrom = (typeof COLLECTED_FROM)[number];

/** 파일 1개 최대 크기: 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 기록 1개에 붙일 수 있는 파일 수 */
export const MAX_FILES_PER_RECORD = 10;

/** 기록 1개의 파일 합계 최대 크기: 50MB */
export const MAX_RECORD_TOTAL_SIZE = 50 * 1024 * 1024;

/** 지원 파일 확장자 → Storage에 올릴 때 쓰는 Content-Type */
export const SUPPORTED_FILE_TYPES = {
  csv: 'text/csv',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
} as const;
export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

/** 화면 캡처로 받을 수 있는 확장자 */
export const CAPTURE_FILE_TYPES: readonly SupportedFileType[] = [
  'png',
  'jpg',
  'jpeg',
];

/** 파일이 있는 기록 형식. 나머지는 생성과 동시에 queued가 된다 */
export const FILE_RECORD_TYPES: readonly RecordType[] = ['file', 'capture'];

export interface RecordGroup {
  group_id: string;
  owner_id: string;
  name: string;
  color: string | null;
  is_default: boolean;
  ai_search_excluded: boolean;
  created_at: string;
}

export interface InformationRecord {
  record_id: string;
  owner_id: string;
  group_id: string;
  suggested_group_id: string | null;
  record_type: RecordType;
  title: string | null;
  /** memo·highlight 본문만 */
  information_content: string | null;
  source_url: string | null;
  /** 화면의 '메모' (memo·highlight는 저장 이유) */
  original_context: string | null;
  /** AI 분석 결과: 한 줄 요약 + 핵심 내용 */
  summary: string | null;
  /** AI 분석 결과 전체 (docs/database.md 'AI 정리글 양식') */
  summary_detail: Record<string, unknown> | null;
  /** 저장·색인(글자 추출 + 원문 조각 벡터) 상태 */
  status: RecordStatus;
  analysis_status: AnalysisStatus;
  analyzed_at: string | null;
  /** 분석할 때의 메모. 지금 메모와 다를 때만 '다시 분석' 가능 */
  analyzed_context: string | null;
  /** '메모에 옮기기'를 누른 시각. 같은 분석은 한 번만 옮긴다 */
  analysis_moved_at: string | null;
  error_message: string | null;
  collected_from: CollectedFrom;
  embedding_model: string | null;
  created_at: string;
}

/** 기록에 붙은 파일 1개 (기록 1개에 0~10개) */
export interface RecordFile {
  file_id: string;
  record_id: string;
  owner_id: string;
  /** 사용자가 넣은 순서 (1부터). 화면 이름 번호 */
  position: number;
  original_name: string;
  file_path: string;
  file_type: SupportedFileType;
  file_size: number;
  created_at: string;
}

/** 화면에 보일 기록 제목. 제목이 비어 있는 파일 기록은 첫 파일 이름(확장자 제외) */
export function displayRecordTitle(
  title: string | null | undefined,
  files: Pick<RecordFile, 'position' | 'original_name'>[],
): string {
  const t = title?.trim();
  if (t) return t;
  const first = [...files].sort((a, b) => a.position - b.position)[0];
  if (!first) return '';
  const dot = first.original_name.lastIndexOf('.');
  return dot <= 0 ? first.original_name : first.original_name.slice(0, dot);
}

/**
 * 화면에 보일 파일 이름.
 * 제목이 있으면 '제목' (파일 1개) 또는 '제목1', '제목2'… (여러 개), 제목이 없으면 각 파일의 원래 이름.
 */
export function displayFileName(
  title: string | null | undefined,
  file: Pick<RecordFile, 'position' | 'original_name'>,
  totalFiles: number,
): string {
  const t = title?.trim();
  if (!t) return file.original_name;
  return totalFiles === 1 ? t : `${t}${file.position}`;
}
