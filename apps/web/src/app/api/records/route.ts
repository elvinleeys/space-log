// POST /api/records — 기록 생성 (수집 흐름 1단계)
// 파일 기록(file·capture): uploading으로 만들고 파일(1~10개)마다 서명 업로드 주소를 돌려준다.
//   모든 파일이 올라간 뒤 완료 알림 API로 queued가 된다
// 파일 없는 기록(memo·highlight·url·video): 바로 queued로 만들고 가공 서버에 요청한다
import {
  API_ERROR_STATUS,
  FILE_RECORD_TYPES,
  SUPPORTED_FILE_TYPES,
  defaultTitle,
  validateCreateRecordRequest,
  type ApiErrorBody,
  type ApiErrorCode,
  type CreateRecordResponse,
  type InformationRecord,
  type RecordFile,
  type RecordFileUpload,
} from '@space-log/shared';
import {
  RECORDS_BUCKET,
  createAdminClient,
  getAuthedClient,
} from '@/lib/supabase/server';
import { requestProcessing } from '@/lib/worker';

const errorResponse = (code: ApiErrorCode, message: string) =>
  Response.json({ error: { code, message } } satisfies ApiErrorBody, {
    status: API_ERROR_STATUS[code],
  });

export async function POST(request: Request) {
  const authed = await getAuthedClient(request);
  if (!authed) return errorResponse('UNAUTHORIZED', '로그인이 필요해요');
  const { supabase, user } = authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_INPUT', '요청 본문이 JSON이 아니에요');
  }

  const checked = validateCreateRecordRequest(body);
  if (!checked.ok) return errorResponse(checked.code, checked.message);
  const req = checked.value;

  // 그룹: 안 보내면 '분류 안 된 기록'. RLS 때문에 남의 그룹은 조회되지 않아 '없음'과 같게 404
  const groupQuery = supabase.from('record_group').select('group_id');
  const { data: group, error: groupError } = await (
    req.group_id
      ? groupQuery.eq('group_id', req.group_id)
      : groupQuery.eq('is_default', true)
  ).maybeSingle();
  if (groupError) return internalError('그룹 조회', groupError);
  if (!group) return errorResponse('GROUP_NOT_FOUND', '그룹을 찾을 수 없어요');

  const hasFile = FILE_RECORD_TYPES.includes(req.record_type);
  const recordId = crypto.randomUUID();

  const { data: record, error: insertError } = await supabase
    .from('information_record')
    .insert({
      record_id: recordId,
      owner_id: user.id,
      group_id: group.group_id,
      record_type: req.record_type,
      title: defaultTitle(req) ?? null,
      information_content: req.information_content ?? null,
      source_url: req.source_url ?? null,
      original_context: req.original_context ?? null,
      status: hasFile ? 'uploading' : 'queued',
      collected_from: req.collected_from,
    })
    .select()
    .single<InformationRecord>();
  if (insertError) return internalError('기록 생성', insertError);

  if (!hasFile) {
    requestProcessing(recordId);
    return Response.json(
      { record, files: [], uploads: [] } satisfies CreateRecordResponse,
      { status: 201 },
    );
  }

  // 업로드할 수 없는 기록이 uploading으로 남지 않게 지운다 (record_file은 함께 지워짐)
  const rollback = () =>
    supabase.from('information_record').delete().eq('record_id', recordId);

  // 파일마다 행을 만든다. 넣은 순서가 화면 번호(position)가 된다
  const fileRows = req.files!.map((f, i) => {
    const fileId = crypto.randomUUID();
    const fileType = checked.fileTypes[i];
    return {
      file_id: fileId,
      record_id: recordId,
      owner_id: user.id,
      position: i + 1,
      original_name: f.name,
      file_path: `${user.id}/${recordId}/${fileId}.${fileType}`,
      file_type: fileType,
      file_size: f.size,
    };
  });
  const { data: files, error: filesError } = await supabase
    .from('record_file')
    .insert(fileRows)
    .select()
    .order('position')
    .returns<RecordFile[]>();
  if (filesError || !files) {
    await rollback();
    return internalError('파일 정보 저장', filesError);
  }

  // 정해진 경로에만 올릴 수 있는 일회용 주소. 버킷에도 10MB·형식 제한이 걸려 있다
  const storage = createAdminClient().storage.from(RECORDS_BUCKET);
  const signedList = await Promise.all(
    files.map((f) => storage.createSignedUploadUrl(f.file_path)),
  );
  const failed = signedList.find((s) => s.error || !s.data);
  if (failed) {
    await rollback();
    return internalError('업로드 주소 발급', failed.error);
  }

  const uploads: RecordFileUpload[] = files.map((f, i) => {
    const signed = signedList[i].data!;
    return {
      file_id: f.file_id,
      position: f.position,
      path: signed.path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      contentType: SUPPORTED_FILE_TYPES[f.file_type],
    };
  });

  return Response.json(
    { record, files, uploads } satisfies CreateRecordResponse,
    { status: 201 },
  );
}

function internalError(step: string, error: unknown) {
  console.error(`[POST /api/records] ${step} 실패:`, error);
  return errorResponse(
    'INTERNAL_ERROR',
    '저장하지 못했어요. 잠시 후 다시 시도해 주세요',
  );
}
