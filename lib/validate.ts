// 클라이언트가 보낸 초안을 서버에서 재검증하는 공용 유틸
import { AiDraft, FIELD_KEYS, FieldKey, Risk, RISK_CATEGORIES } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function validateDraft(raw: any): AiDraft | null {
  if (!raw || typeof raw.translationKo !== "string" || !raw.translationKo.trim())
    return null;
  const fields: Partial<Record<FieldKey, string>> = {};
  if (raw.fields && typeof raw.fields === "object") {
    for (const k of FIELD_KEYS) {
      const v = raw.fields[k];
      if (typeof v === "string" && v.trim()) fields[k] = v.trim().slice(0, 500);
    }
  }
  const risks: Risk[] = [];
  if (Array.isArray(raw.risks)) {
    for (const r of raw.risks) {
      if (
        r &&
        (RISK_CATEGORIES as readonly string[]).includes(r.category) &&
        (r.source === "ai" || r.source === "rule")
      ) {
        risks.push({
          category: r.category,
          evidence: String(r.evidence ?? "").slice(0, 120),
          source: r.source,
        });
      }
    }
  }
  return {
    translationKo: raw.translationKo.trim().slice(0, 3000),
    backTranslation:
      typeof raw.backTranslation === "string" && raw.backTranslation.trim()
        ? raw.backTranslation.trim().slice(0, 3000)
        : undefined,
    fields,
    risks,
    aiMode: raw.aiMode === "mock" ? "mock" : "live",
  };
}
