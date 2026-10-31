"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPatient } from "@/lib/patients";
import {
  CareRecord,
  FIELD_KEYS,
  FIELD_LABELS,
  FieldKey,
  LANG_LABELS,
} from "@/lib/types";
import { fmtTime, ModeTag, StatusTag } from "@/components/badges";
import { StaffLogin, useStaffAuth } from "@/components/staff-auth";

export default function ReviewPage() {
  const auth = useStaffAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [translationKo, setTranslationKo] = useState("");
  const [fields, setFields] = useState<Partial<Record<FieldKey, string>>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/records/${id}`);
    if (!res.ok) {
      setError("기록을 찾을 수 없어요");
      return;
    }
    const data = await res.json();
    setRecord(data.record);
    setTranslationKo(data.record.translationKo);
    setFields(data.record.fields ?? {});
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: object, successMsg: string, goBack = false) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했어요");
      setRecord(data.record);
      setNotice(successMsg);
      if (goBack) setTimeout(() => router.push("/staff"), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요");
    } finally {
      setBusy(false);
    }
  }

  if (!auth.ready) return null;
  if (!auth.name) return <StaffLogin onLogin={auth.login} />;

  if (error && !record) {
    return (
      <p className="pt-16 text-center text-[14px] text-sub">
        {error} ·{" "}
        <Link href="/staff" className="font-semibold text-blue">
          목록으로
        </Link>
      </p>
    );
  }
  if (!record) {
    return (
      <p className="pt-16 text-center text-[14px] text-faint">불러오는 중…</p>
    );
  }

  const p = getPatient(record.patientId);
  const readOnly = record.status === "confirmed";

  return (
    <div className={readOnly ? "pb-10 pt-2" : "pb-32 pt-2"}>
      <Link href="/staff" className="text-[20px] text-sub">
        ‹
      </Link>

      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">
          {p?.name}
          <span className="ml-2 text-[13px] font-medium text-faint">
            {p?.room} · {fmtTime(record.createdAt)}
          </span>
        </h1>
        <div className="flex items-center gap-1.5">
          <ModeTag mode={record.aiMode} />
          <StatusTag status={record.status} />
        </div>
      </div>

      {record.risks.length > 0 && (
        <div className="mt-4 rounded-3xl bg-red-soft p-5">
          <p className="text-[14px] font-bold text-red">
            위험 신호 {record.risks.length}건
          </p>
          <ul className="mt-2 space-y-1">
            {record.risks.map((r, i) => (
              <li key={i} className="text-[14px] text-ink">
                <span className="font-bold text-red">{r.category}</span>
                <span className="text-sub"> · {r.evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.lang !== "ko" && (
      <div className="mt-3 rounded-3xl bg-white p-5">
        <p className="text-[12px] font-semibold text-faint">
          원문 · {LANG_LABELS[record.lang]}
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">
          {record.originalText}
        </p>
      </div>
      )}

      <div className="mt-3 rounded-3xl bg-white p-5">
        <p className="text-[12px] font-semibold text-faint">한국어 기록</p>
        {readOnly ? (
          <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">
            {translationKo}
          </p>
        ) : (
          <textarea
            value={translationKo}
            onChange={(e) => setTranslationKo(e.target.value)}
            rows={4}
            className="mt-1.5 w-full resize-none rounded-xl bg-bg p-3.5 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-blue"
          />
        )}

        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {FIELD_KEYS.map((k) => {
            const v = fields[k] ?? "";
            if (readOnly && !v) return null;
            return (
              <div key={k} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[13px] font-semibold text-sub">
                  {FIELD_LABELS[k]}
                </span>
                {readOnly ? (
                  <span className="text-[14px]">{v}</span>
                ) : (
                  <input
                    value={v}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, [k]: e.target.value }))
                    }
                    placeholder="기록 없음 · 직접 입력"
                    className="w-full rounded-xl bg-bg px-3.5 py-2.5 text-[14px] outline-none placeholder:text-faint focus:ring-2 focus:ring-blue"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl bg-red-soft px-4 py-3 text-[14px] font-medium text-red">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-2xl bg-green-soft px-4 py-3 text-[14px] font-medium text-green">
          {notice}
        </p>
      )}

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-6 pt-8">
          <div className="mx-auto flex max-w-xl gap-2.5">
            <button
              onClick={() => patch({ translationKo, fields }, "저장했어요")}
              disabled={busy}
              className="flex-1 rounded-2xl bg-white py-4 text-[16px] font-bold transition active:scale-[0.98] disabled:opacity-50"
            >
              임시 저장
            </button>
            <button
              onClick={() =>
                patch(
                  { translationKo, fields, action: "confirm" },
                  "확정했어요",
                  true,
                )
              }
              disabled={busy}
              className="flex-[1.6] rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              기록 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
