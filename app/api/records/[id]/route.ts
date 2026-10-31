import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { CareRecord, FIELD_KEYS, FieldKey } from "@/lib/types";


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
    fields?: Record<string, string>;
    translationKo?: string;
    action?: "confirm";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const patch: Partial<CareRecord> = {};
  if (body.fields && typeof body.fields === "object") {
    const fields: Partial<Record<FieldKey, string>> = {};
    for (const k of FIELD_KEYS) {
      const v = body.fields[k];
      if (typeof v === "string" && v.trim()) fields[k] = v.trim();
    }
    patch.fields = fields;
  }
  if (typeof body.translationKo === "string" && body.translationKo.trim()) {
    patch.translationKo = body.translationKo.trim();
  }
  if (body.action === "confirm") {
    if (existing.status === "confirmed") {
      return NextResponse.json({ error: "이미 확정된 기록입니다" }, { status: 409 });
    }
    patch.status = "confirmed";
    patch.confirmedAt = new Date().toISOString();
  }

  const updated = await store.update(id, patch);
  return NextResponse.json({ record: updated });
}
