/**
 * 임시저장 (Draft) - 서버 DB 저장 + localStorage 폴백
 * API: PUT/GET/DELETE /api/v1/drafts/:draftKey/:draftId
 */
import api from './api';

const PREFIX = 'cams_draft_';

/**
 * Draft 저장 (서버 우선, 실패 시 localStorage 폴백)
 */
export async function saveDraft(key, id, data) {
  // localStorage 즉시 캐시
  try {
    localStorage.setItem(`${PREFIX}${key}_${id}`, JSON.stringify({ data, savedAt: new Date().toISOString() }));
  } catch (_) {}

  // 서버 저장
  try {
    const res = await api.put(`/drafts/${key}/${id}`, { data });
    return { success: true, server: true, savedAt: res.data?.data?.saved_at };
  } catch (e) {
    console.warn('[Draft] Server save failed, localStorage only:', e?.message);
    return { success: true, server: false };
  }
}

/**
 * Draft 불러오기 (서버 우선, 실패 시 localStorage 폴백)
 */
export async function loadDraft(key, id) {
  // 서버에서 먼저 시도
  try {
    const res = await api.get(`/drafts/${key}/${id}`);
    if (res.data?.success && res.data?.data) {
      const serverDraft = res.data.data;
      return { data: serverDraft.data, savedAt: serverDraft.saved_at };
    }
  } catch (e) {
    console.warn('[Draft] Server load failed, trying localStorage:', e?.message);
  }

  // localStorage 폴백
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}_${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = new Date(parsed.savedAt);
    if (new Date() - savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${PREFIX}${key}_${id}`);
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Draft 삭제 (서버 + localStorage 모두)
 */
export async function clearDraft(key, id) {
  try { localStorage.removeItem(`${PREFIX}${key}_${id}`); } catch (_) {}
  try { await api.delete(`/drafts/${key}/${id}`); } catch (_) {}
}

/**
 * Draft 존재 여부 확인
 */
export async function hasDraft(key, id) {
  const draft = await loadDraft(key, id);
  return draft !== null;
}
