"use client";

import { useEffect, useState } from "react";
import { FACILITY_DB } from "@/lib/facilities";
import { BuildingIcon } from "@/components/icons";

/** 담당자(기관 관리자) 데모 로그인 — 기관 단위 검토 큐 접근 */
export function useStaffAuth() {
  const [name, setName] = useState<string | null>(null);
  const [facility, setFacility] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem("carelog_staff"));
      setFacility(localStorage.getItem("carelog_staff_fac"));
    } catch {}
    setReady(true);
  }, []);

  function login(n: string, f: string) {
    try {
      localStorage.setItem("carelog_staff", n);
      localStorage.setItem("carelog_staff_fac", f);
    } catch {}
    setName(n);
    setFacility(f);
  }

  function logout() {
    try {
      localStorage.removeItem("carelog_staff");
      localStorage.removeItem("carelog_staff_fac");
      localStorage.removeItem("carelog_staff_patients");
    } catch {}
    setName(null);
    setFacility(null);
  }

  return { name, facility, ready, login, logout };
}

export function StaffLogin({
  onLogin,
}: {
  onLogin: (n: string, f: string) => void;
}) {
  const [v, setV] = useState("");
  const [fac, setFac] = useState("");
  const [q, setQ] = useState("");
  const hits = FACILITY_DB.filter((f) =>
    (f.name + f.region).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const canSubmit = v.trim() && fac;

  return (
    <div className="pb-10 pt-12">
      <h1 className="text-[24px] font-extrabold tracking-tight">
        담당자 로그인
      </h1>
      <p className="mt-1.5 text-[14px] text-sub">
        소속 기관의 검토 대기 기록을 확인하고 확정해요
      </p>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="이름"
        autoFocus
        className="mt-6 w-full rounded-3xl bg-white p-5 text-[16px] font-bold outline-none placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-blue"
      />
      <p className="mt-5 text-[13px] font-bold text-faint">소속 기관</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="기관명 또는 지역 검색"
        className="mt-2 w-full rounded-3xl bg-white p-4 text-[15px] outline-none placeholder:text-faint focus:ring-2 focus:ring-blue"
      />
      <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto p-1">
        {hits.map((f) => (
          <li key={f.name}>
            <button
              onClick={() => setFac(f.name)}
              className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.99] ${
                fac === f.name
                  ? "bg-blue-soft ring-2 ring-blue"
                  : "bg-white hover:ring-2 hover:ring-blue"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg text-sub">
                <BuildingIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold">{f.name}</span>
                <span className="block text-[12px] text-sub">{f.region}</span>
              </span>
              {fac === f.name && (
                <span className="text-[14px] font-bold text-blue">✓</span>
              )}
            </button>
          </li>
        ))}
        {hits.length === 0 && (
          <p className="pt-6 text-center text-[13px] text-faint">
            검색 결과가 없어요
          </p>
        )}
      </ul>
      <button
        onClick={() => canSubmit && onLogin(v.trim(), fac)}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-faint"
      >
        로그인
      </button>
      <p className="mt-4 text-center text-[12px] text-faint">
        데모 서비스 · 실서비스에서는 기관 관리자 승인을 거칩니다
      </p>
    </div>
  );
}
