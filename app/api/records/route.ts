import { NextRequest, NextResponse } from "next/server";
import { generateDraft } from "@/lib/ai";
import { getStore } from "@/lib/store";
import { getPatient } from "@/lib/patients";
import {
  AiDraft,
  FIELD_KEYS,
  FieldKey,
  Lang,
  Risk,
  RISK_CATEGORIES,
} from "@/lib/types";


/** GET /api/records?status=draft|confirmed&patientId=p1 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "draft" | "confirmed" | null;
  const patientId = searchParams.get("patientId");
  const records = await getStore().list({
    status: status ?? undefined,
    patientId: patientId ?? undefined,
  });
  return NextResponse.json({ records });
}

/** 클라이언트가 보낸 미리보기 초안을 안전한 형태로 재검증 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function validateDraft(raw: any): AiDraft | null {
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

/**
 * POST /api/records
 * { patientId, lang, text, dryRun: true }  → AI 초안만 생성해 반환 (저장 안 함, 작성자 확인용)
 * { patientId, lang, text, draft }         → 확인 끝난 초안을 draft 상태로 저장
 * { patientId, lang, text }                → 생성+저장 한 번에 (하위 호환)
 */
export async function POST(req: NextRequest) {
  let body: {
    patientId?: string;
    lang?: Lang;
    text?: string;
    dryRun?: boolean;
    draft?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const { patientId, lang, text } = body;
  if (!patientId || !getPatient(patientId)) {
    return NextResponse.json({ error: "대상자를 선택하세요" }, { status: 400 });
  }
  if (!lang || !["vi", "en", "ko"].includes(lang)) {
    return NextResponse.json({ error: "언어를 선택하세요" }, { status: 400 });
  }
  const trimmed = (text ?? "").trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "메모 내용을 입력하세요" }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: "메모는 2,000자 이내로 입력하세요" }, { status: 400 });
  }

  const draft = validateDraft(body.draft) ?? (await generateDraft(trimmed, lang));

  if (body.dryRun) {
    return NextResponse.json({ draft });
  }

  const record = await getStore().create({
    patientId,
    lang,
    originalText: trimmed,
    translationKo: draft.translationKo,
    backTranslation: draft.backTranslation,
    fields: draft.fields,
    risks: draft.risks,
    status: "draft",
    aiMode: draft.aiMode,
  });
  return NextResponse.json({ record }, { status: 201 });
}
