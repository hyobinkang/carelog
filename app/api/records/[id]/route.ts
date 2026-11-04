import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { CareRecord, Lang } from "@/lib/types";
import { validateDraft } from "@/lib/validate";
import { translateNote } from "@/lib/ai";


type Ctx = { params: Promise<{ id: string }> };

/** GET /api/records/:id */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const record = await getStore().get(id);
  if (!record) return NextResponse.json({ error: "기록을 찾을 수 없음" }, { status: 404 });
  return NextResponse.json({ record });
}

/** PATCH /api/records/:id  { fields?, translationKo?, action?: "confirm" } */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = getStore();
  const existing = await store.get(id);
  if (!existing) return NextResponse.json({ error: "기록을 찾을 수 없음" }, { status: 404 });

  let body: {
    action?: "confirm" | "return" | "resubmit";
    shareScope?: "internal" | "family";
    returnNote?: string;
    originalText?: string;
    lang?: Lang;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    draft?: any;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  // 기록 내용(원문·번역·항목)은 작성자의 재제출(resubmit)로만 바뀐다.
  // 담당자는 공유 범위 결정과 반려/확정만 할 수 있다(기록 무결성 보장).
  const patch: Partial<CareRecord> = {};
  if (body.shareScope === "internal" || body.shareScope === "family") {
    patch.shareScope = body.shareScope;
  }
  if (body.action === "confirm") {
    if (existing.status === "confirmed") {
      return NextResponse.json({ error: "이미 확정된 기록입니다" }, { status: 409 });
    }
    patch.status = "confirmed";
    patch.confirmedAt = new Date().toISOString();
    patch.returnNote = undefined;
    patch.returnNoteTranslated = undefined;
  }

  // 반려: 담당자가 보완 요청 사유와 함께 작성자에게 되돌림
  if (body.action === "return") {
    if (existing.status === "confirmed") {
      return NextResponse.json({ error: "확정된 기록은 반려할 수 없습니다" }, { status: 409 });
    }
    patch.status = "returned";
    patch.returnNote =
      typeof body.returnNote === "string" && body.returnNote.trim()
        ? body.returnNote.trim().slice(0, 300)
        : "보완이 필요한 항목이 있습니다";
    // 담당자 메모는 보통 한국어 → 작성자 언어로 AI 번역해 함께 전달
    patch.returnNoteTranslated = await translateNote(
      patch.returnNote,
      existing.lang,
    );
    // 반려 이력에 누적 — 재제출본 재검토 시 과거 사유를 돌아볼 수 있게
    patch.returnHistory = [
      ...(existing.returnHistory ?? []),
      { note: patch.returnNote, at: new Date().toISOString() },
    ];
  }

  // 재제출: 작성자가 보완한 원문+검증된 초안으로 같은 기록을 갱신
  if (body.action === "resubmit") {
    if (existing.status !== "returned") {
      return NextResponse.json({ error: "반려 상태의 기록만 재제출할 수 있습니다" }, { status: 409 });
    }
    const draft = validateDraft(body.draft);
    if (!draft || typeof body.originalText !== "string" || !body.originalText.trim()) {
      return NextResponse.json({ error: "재제출 내용이 올바르지 않습니다" }, { status: 400 });
    }
    patch.originalText = body.originalText.trim();
    if (body.lang) patch.lang = body.lang;
    patch.translationKo = draft.translationKo;
    patch.backTranslation = draft.backTranslation;
    patch.fields = draft.fields;
    patch.risks = draft.risks;
    patch.aiMode = draft.aiMode;
    patch.status = "draft";
    patch.returnNote = undefined;
    patch.returnNoteTranslated = undefined;
  }

  const updated = await store.update(id, patch);
  return NextResponse.json({ record: updated });
}
