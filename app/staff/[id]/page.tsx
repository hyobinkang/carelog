"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPatient } from "@/lib/patients";
import { CareRecord, FIELD_KEYS, FIELD_LABELS, LANG_LABELS } from "@/lib/types";
import { fmtTime, ModeTag, StatusTag } from "@/components/badges";
import { StaffLogin, useStaffAuth } from "@/components/staff-auth";

export default function ReviewPage() {
  const auth = useStaffAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [shareScope, setShareScope] = useState<"internal" | "family">(
    "internal",
  );
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
    setShareScope(data.record.shareScope ?? "internal");
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
  // 내용은 작성자만 수정할 수 있다(반려→재제출). 담당자는 검토·반려·확정만.
  const actionable = record.status === "draft";
  const fieldEntries = FIELD_KEYS.map(
    (k) => [k, record.fields[k] ?? ""] as const,
  ).filter(([, v]) => v);

  return (
    <div className={actionable ? "pb-32 pt-2" : "pb-10 pt-2"}>
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

      {record.status === "returned" && (
        <div className="mt-4 rounded-3xl bg-amber-soft p-5">
          <p className="text-[14px] font-bold text-amber">
            반려됨 — 작성자 보완 대기 중
          </p>
          {record.returnNote && (
            <p className="mt-1.5 text-[14px] text-ink">{record.returnNote}</p>
          )}
          {record.returnNoteTranslated && (
            <p className="mt-1.5 border-t border-amber/20 pt-1.5 text-[13px] text-sub">
              <span className="font-semibold">
                {LANG_LABELS[record.lang]} 자동 번역
              </span>{" "}
              · {record.returnNoteTranslated}
            </p>
          )}
        </div>
      )}

      {/* 반려 이력 — 재제출본 재검토 시 "왜 반려했었는지" 바로 확인 */}
      {(record.returnHistory?.length ?? 0) > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="text-[13px] font-semibold text-sub underline-offset-2 hover:underline"
          >
            {historyOpen
              ? "반려 이력 접기 ▴"
              : `지난 반려 사유 보기 (${record.returnHistory!.length}) ▾`}
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-2 rounded-2xl bg-white p-4">
              {[...record.returnHistory!].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                  <span className="shrink-0 font-medium text-faint">
                    {fmtTime(h.at)}
                  </span>
                  <span className="text-ink">{h.note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-faint">한국어 기록</p>
          <span className="text-[11px] font-medium text-faint">
            작성자만 수정 가능 · 보완은 반려로 요청
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">
          {record.translationKo}
        </p>

        {fieldEntries.length > 0 && (
          <div className="mt-4 space-y-2.5 border-t border-line pt-4">
            {fieldEntries.map(([k, v]) => (
              <div key={k} className="flex gap-3 text-[14px]">
                <span
                  className={`w-16 shrink-0 font-semibold ${
                    k === "followUp" ? "text-amber" : "text-sub"
                  }`}
                >
                  {FIELD_LABELS[k]}
                </span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 공유 범위 — 담당자가 확정 시 결정 (가족 리포트는 승인 후에만) */}
      <div className="mt-3 rounded-3xl bg-white p-5">
        <p className="text-[12px] font-semibold text-faint">공유 범위</p>
        {!actionable ? (
          <p className="mt-1.5 text-[14px] font-bold">
            {record.shareScope === "family" ? "가족 공유 허용" : "기관 내부만"}
          </p>
        ) : (
          <div className="mt-2.5 flex rounded-2xl bg-bg p-1 text-[13px] font-semibold">
            {(
              [
                ["internal", "기관 내부만"],
                ["family", "가족 공유 허용"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setShareScope(v)}
                className={`flex-1 rounded-xl py-2 transition ${
                  shareScope === v ? "bg-white text-ink shadow-sm" : "text-sub"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-[12px] text-faint">
          가족 리포트는 담당자가 확정한 기록만 공유돼요
        </p>
      </div>

      {actionable && returnOpen && (
        <div className="mt-3 rounded-3xl bg-white p-5">
          <p className="text-[12px] font-semibold text-faint">
            보완 요청 사유 — 작성자에게 전달돼요
          </p>
          <textarea
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
            rows={2}
            placeholder="예: 점심 식사량과 복약 여부를 확인해 주세요"
            autoFocus
            className="mt-2 w-full resize-none rounded-xl bg-bg p-3.5 text-[14px] leading-relaxed outline-none placeholder:text-faint focus:ring-2 focus:ring-amber"
          />
          <button
            onClick={() =>
              patch({ action: "return", returnNote }, "반려했어요", true)
            }
            disabled={busy}
            className="mt-2.5 w-full rounded-2xl bg-amber-soft py-3.5 text-[15px] font-bold text-amber transition active:scale-[0.98] disabled:opacity-50"
          >
            반려 보내기
          </button>
        </div>
      )}

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

      {actionable && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-6 pt-8">
          <div className="mx-auto max-w-xl">
            {confirmOpen ? (
              <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-line">
                <p className="text-[15px] font-bold">정말 확정할까요?</p>
                <p className="mt-1 text-[13px] leading-relaxed text-sub">
                  확정하면 기관 기록으로 등록되며 더 이상 수정할 수 없어요.
                  보완이 필요하면 확정 대신 반려해 주세요.
                </p>
                <div className="mt-3.5 flex gap-2.5">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    disabled={busy}
                    className="flex-1 rounded-2xl bg-bg py-3.5 text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() =>
                      patch(
                        { shareScope, action: "confirm" },
                        "확정했어요",
                        true,
                      )
                    }
                    disabled={busy}
                    className="flex-[1.4] rounded-2xl bg-blue py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {busy ? "확정 중…" : "확정하기"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setReturnOpen((v) => !v)}
                  disabled={busy}
                  className={`flex-1 rounded-2xl py-4 text-[16px] font-bold transition active:scale-[0.98] disabled:opacity-50 ${
                    returnOpen ? "bg-amber-soft text-amber" : "bg-white text-amber"
                  }`}
                >
                  반려
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy}
                  className="flex-[1.6] rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  기록 확정
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
