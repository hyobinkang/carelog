// 저장소 계층: Supabase(배포) / 로컬 JSON 파일(개발) 이중 드라이버
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY가 있으면 Supabase, 없으면 파일.
import { CareRecord } from "./types";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";

export interface RecordFilter {
  status?: "draft" | "confirmed";
  patientId?: string;
}

interface Store {
  list(filter?: RecordFilter): Promise<CareRecord[]>;
  get(id: string): Promise<CareRecord | null>;
  create(rec: Omit<CareRecord, "id" | "createdAt">): Promise<CareRecord>;
  update(id: string, patch: Partial<CareRecord>): Promise<CareRecord | null>;
}

// ── 파일 드라이버 (로컬 개발용) ─────────────────────────────────
const DATA_FILE = path.join(process.cwd(), ".data", "records.json");

async function readFileDb(): Promise<CareRecord[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}
async function writeFileDb(records: CareRecord[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
}

const fileStore: Store = {
  async list(filter) {
    let rs = await readFileDb();
    if (filter?.status) rs = rs.filter((r) => r.status === filter.status);
    if (filter?.patientId) rs = rs.filter((r) => r.patientId === filter.patientId);
    return rs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async get(id) {
    return (await readFileDb()).find((r) => r.id === id) ?? null;
  },
  async create(rec) {
    const records = await readFileDb();
    const full: CareRecord = {
      ...rec,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    records.push(full);
    await writeFileDb(records);
    return full;
  },
  async update(id, patch) {
    const records = await readFileDb();
    const i = records.findIndex((r) => r.id === id);
    if (i < 0) return null;
    records[i] = { ...records[i], ...patch, id };
    await writeFileDb(records);
    return records[i];
  },
};

// ── Supabase 드라이버 (배포용) ──────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function toRow(r: Partial<CareRecord>) {
  const row: Record<string, unknown> = {};
  if (r.patientId !== undefined) row.patient_id = r.patientId;
  if (r.lang !== undefined) row.lang = r.lang;
  if (r.originalText !== undefined) row.original_text = r.originalText;
  if (r.translationKo !== undefined) row.translation_ko = r.translationKo;
  if (r.backTranslation !== undefined) row.back_translation = r.backTranslation;
  if (r.fields !== undefined) row.fields = r.fields;
  if (r.risks !== undefined) row.risks = r.risks;
  if (r.status !== undefined) row.status = r.status;
  if (r.confirmedAt !== undefined) row.confirmed_at = r.confirmedAt;
  if (r.aiMode !== undefined) row.ai_mode = r.aiMode;
  if (r.shareScope !== undefined) row.share_scope = r.shareScope;
  return row;
}
function fromRow(row: any): CareRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    lang: row.lang,
    originalText: row.original_text,
    translationKo: row.translation_ko,
    backTranslation: row.back_translation ?? undefined,
    fields: row.fields ?? {},
    risks: row.risks ?? [],
    status: row.status,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at ?? undefined,
    aiMode: row.ai_mode ?? "live",
    shareScope: row.share_scope ?? "internal",
  };
}

async function supabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const supabaseStore: Store = {
  async list(filter) {
    const sb = await supabaseClient();
    let q = sb.from("care_records").select("*").order("created_at", { ascending: false });
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.patientId) q = q.eq("patient_id", filter.patientId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(fromRow);
  },
  async get(id) {
    const sb = await supabaseClient();
    const { data, error } = await sb.from("care_records").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  },
  async create(rec) {
    const sb = await supabaseClient();
    const { data, error } = await sb.from("care_records").insert(toRow(rec)).select().single();
    if (error) throw error;
    return fromRow(data);
  },
  async update(id, patch) {
    const sb = await supabaseClient();
    const { data, error } = await sb
      .from("care_records")
      .update(toRow(patch))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  },
};

export function getStore(): Store {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? supabaseStore
    : fileStore;
}
