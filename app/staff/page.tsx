"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPatient, patientsOf } from "@/lib/patients";
import { CareRecord, LANG_LABELS } from "@/lib/types";
import { StaffLogin, useStaffAuth } from "@/components/staff-auth";
import {
  Avatar,
  fmtClock,
  fmtDateLabel,
  ModeTag,
  RiskBadge,
} from "@/components/badges";

type Tab = "draft" | "confirmed";

export default function StaffPage() {
  const auth = useStaffAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("draft");
  const [patientFilter, setPatientFilter] = useState<string>("");
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [draftSel, setDraftSel] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("carelog_staff_patients");
      if (raw) setAssigned(JSON.parse(raw));
    } catch {}
  }, []);

  function openAssign() {
    if (assignOpen) {
      setAssignOpen(false);
      return;
    }
    setDraftSel(assigned);
    setAssignOpen(true);
  }

  function toggleDraft(id: string) {
    setDraftSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function confirmAssign() {
    setAssigned(draftSel);
    try {
      localStorage.setItem("carelog_staff_patients", JSON.stringify(draftSel));
    } catch {}
    if (patientFilter && !draftSel.includes(patientFilter))
      setPatientFilter("");
    setAssignOpen(false);
  }

  const load = useCallback(async () => {
  	setLoading(true);
  	setLoadError(false);
  	try {
    	const qs = new URLSearchParams({ status: tab });
    	if (patientFilter) qs.set("patientId", patientFilter);
    	const res = await fetch(`/api/records?${qs}`);
    	if (!res.ok) throw new Error(String(res.status));
    	const data = await res.json();
    	setRecords(data.records ?? []);
  	} catch {
    	setRecords([]);
    	setLoadError(true);
  	} finally {
    	setLoading(false);
  	}
  }, [tab, patientFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (!auth.ready) return null;
  if (!auth.name) return <StaffLogin onLogin={auth.login} />;

  const facPatients = patientsOf(auth.facility);

  return (
    <div className="pb-10 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="shrink-0 whitespace-nowrap text-[24px] font-extrabold tracking-tight">기록</h1>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-sub">
            {auth.name} · {auth.facility}
          </span>
          <button
            onClick={openAssign}
            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition active:scale-[0.97] ${
              assignOpen ? "bg-ink text-white" : "bg-white text-sub"
            }`}
          >
            담당 배정
          </button>
          <button
            onClick={() => {
              auth.logout();
              router.push("/");
            }}
            className="rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-semibold text-sub transition active:scale-[0.97]"
          >
            로그아웃
          </button>
        </div>
      </div>

      {assignOpen && (
        <div className="mt-3 rounded-3xl bg-white p-4">
          <p className="text-[12px] font-semibold text-faint">
            담당 어르신 — 배정된 어르신의 기록만 검토 큐에 보여요
          </p>
          <ul className="mt-2.5 space-y-2">
            {facPatients.map((p, i) => {
              const on = draftSel.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => toggleDraft(p.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2.5 pr-4 text-left transition active:scale-[0.99] ${
                      on ? "bg-blue-soft ring-2 ring-blue" : "bg-bg"
                    }`}
                  >
                    <Avatar name={p.name} index={i} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold">
                        {p.name}
                      </span>
                      <span className="block text-[12px] text-sub">
                        {p.room} · {p.age}세
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-bold ${
                        on
                          ? "border-blue bg-blue text-white"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            onClick={confirmAssign}
            className="mt-3 w-full rounded-2xl bg-blue py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98]"
          >
            확인
          </button>
        </div>
      )}

      <div className="mt-4 flex rounded-2xl bg-line/50 p-1 text-[13px] font-semibold">
        {(["draft", "confirmed"] as Tab[]).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 rounded-xl py-2 transition ${
              tab === v ? "bg-white text-ink shadow-sm" : "text-sub"
            }`}
          >
            {v === "draft" ? "검토 대기" : "확정"}
          </button>
        ))}
      </div>

      {assigned.length > 0 && (
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => setPatientFilter("")}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold transition ${
            patientFilter === "" ? "bg-ink text-white" : "bg-white text-sub"
          }`}
        >
          전체
        </button>
        {facPatients.filter((p) => assigned.includes(p.id)).map((p) => (
          <button
            key={p.id}
            onClick={() => setPatientFilter(p.id)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold transition ${
              patientFilter === p.id ? "bg-ink text-white" : "bg-white text-sub"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      )}

      {(() => {
        const facIds = new Set(facPatients.map((p) => p.id));
        const visible = records.filter(
          (r) => facIds.has(r.patientId) && assigned.includes(r.patientId),
        );
        return loadError ? (
  			<div className="pt-16 text-center">
    			<p className="text-[15px] font-semibold text-sub">기록을 불러오지 못했어요</p>
    			<button onClick={load} className="mt-3 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-blue transition active:scale-[0.97]">
      				다시 시도
    			</button>
  			</div>
		) : assigned.length === 0 ? (
          <div className="pt-16 text-center">
            <p className="text-[15px] font-semibold text-sub">
              아직 담당 어르신이 없어요
            </p>
            <p className="mt-1.5 text-[13px] text-faint">
              위의 ‘담당 배정’에서 담당할 어르신을 선택해 주세요
            </p>
          </div>
        ) : loading ? (
        <p className="pt-16 text-center text-[14px] text-faint">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <div className="pt-16 text-center">
          <p className="text-[15px] font-semibold text-sub">
            {tab === "draft" ? "검토할 기록이 없어요" : "확정된 기록이 없어요"}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          {visible
            .reduce<{ date: string; items: CareRecord[] }[]>((acc, r) => {
              const date = fmtDateLabel(r.createdAt);
              const last = acc[acc.length - 1];
              if (last && last.date === date) last.items.push(r);
              else acc.push({ date, items: [r] });
              return acc;
            }, [])
            .map((g) => (
              <section key={g.date}>
                <h2 className="mb-2 mt-5 px-1 text-[13px] font-bold text-faint">
                  {g.date}
                  <span className="ml-1.5 font-semibold text-line">·</span>
                  <span className="ml-1.5 font-semibold">
                    {g.items.length}건
                  </span>
                </h2>
                <ul>
                  {g.items.map((r, idx) => {
                    const p = getPatient(r.patientId);
                    const pi = facPatients.findIndex((x) => x.id === r.patientId);
                    const isLast = idx === g.items.length - 1;
                    return (
                      <li key={r.id} className="flex gap-2.5">
                        {/* 시간 레일 */}
                        <span className="w-11 shrink-0 pt-[18px] text-right text-[12px] font-bold tabular-nums text-sub">
                          {fmtClock(r.createdAt)}
                        </span>
                        <div className="flex w-3 shrink-0 flex-col items-center">
                          <span className="mt-[22px] h-2 w-2 shrink-0 rounded-full border-2 border-blue bg-white" />
                          {!isLast && <span className="w-px flex-1 bg-line" />}
                        </div>
                        <Link
                          href={`/staff/${r.id}`}
                          className="mb-2.5 flex min-w-0 flex-1 items-center gap-3 rounded-3xl bg-white p-4 transition active:scale-[0.99]"
                        >
                          <Avatar name={p?.name ?? "?"} index={pi} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="whitespace-nowrap text-[15px] font-bold">
                                {p?.name}
                              </span>
                              <span className="truncate text-[12px] text-faint">
                                {LANG_LABELS[r.lang]}
                              </span>
                              <ModeTag mode={r.aiMode} />
                            </div>
                            {r.risks.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {r.risks.map((risk, i) => (
                                  <RiskBadge key={i} risk={risk} />
                                ))}
                              </div>
                            )}
                            <p className="mt-1 truncate text-[14px] text-sub">
                              {r.translationKo}
                            </p>
                          </div>
                          <span className="text-xl text-faint">›</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      );
      })()}
    </div>
  );
}
