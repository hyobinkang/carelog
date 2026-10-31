"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPatient, PATIENTS, patientsOf } from "@/lib/patients";
import { FACILITY_DB } from "@/lib/facilities";
import {
  CareRecord,
  AiDraft,
  FIELD_LABELS,
  FieldKey,
  Lang,
  LANG_LABELS,
} from "@/lib/types";
import {
  Avatar,
  fmtClock,
  ModeTag,
  RiskBadge,
} from "@/components/badges";
import {
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  CATEGORY_ICONS,
  ChevronIcon,
  GlobeIcon,
  HomeIcon,
  InfoIcon,
  LogoutIcon,
  NoteIcon,
  PencilIcon,
  UserIcon,
} from "@/components/icons";

const T: Record<Lang, Record<string, string>> = {
  vi: {
    heading: "Hôm nay bạn\nchăm sóc ai?",
    placeholder: "Bà ăn được nửa bát cháo, buổi chiều kêu đau đầu gối…",
    submit: "Xem bản nháp",
    previewTitle: "전송 전 확인",
    verifyQ: "Nội dung này có đúng không?",
    confirm: "Đúng, gửi đi",
    back: "Sửa lại",
    sentKo: "담당자에게 전송했어요",
    sent: "Đã gửi cho quản lý",
    newMemo: "Ghi chú mới",
    tabHome: "Trang chủ",
    tabWrite: "Ghi chép",
    tabToday: "Hôm nay",
    tabMy: "Của tôi",
    todoPlaceholder: "Việc cần làm (vd: cho uống thuốc)…",
    add: "Thêm",
    todayEmpty: "Lịch hôm nay và ghi chép đã gửi sẽ hiện ở đây",
    myName: "Tên",
    myLang: "Ngôn ngữ ghi chép",
    greeting: "Xin chào",
    statPending: "Chờ duyệt",
    statConfirmed: "Đã duyệt",
    statTodos: "Việc còn lại",
    ctaWrite: "Ghi chép ngay",
    ctaWriteSub: "Viết bằng tiếng Việt, AI sẽ dịch",
    patients: "Người cao tuổi tại cơ sở",
    myFacility: "Nơi làm việc",
    myJoined: "Tham gia",
    statSent: "Đã gửi",
    statRisk: "Dấu hiệu nguy hiểm",
    rowNotif: "Thông báo",
    notifOn: "Đã bật",
    notifOff: "Chạm để bật",
    rowAbout: "Giới thiệu dịch vụ",
    logout: "Đăng xuất",
    obStep1: "Ngôn ngữ",
    obStep2: "Tên",
    obStepFac: "Cơ sở",
    obStep3: "Hoàn tất",
    obNameTitle: "Tên của bạn là gì?",
    obNamePh: "Nguyễn Thị Hoa",
    obFacTitle: "Bạn làm việc ở đâu?",
    obFacPh: "Tìm cơ sở của bạn",
    obFacEmpty: "Không tìm thấy kết quả",
    obNext: "Tiếp tục",
    obDoneTitle: "Sẵn sàng!",
    obDoneSub: "Hãy ghi chép bằng tiếng Việt,\nAI sẽ chuyển thành hồ sơ tiếng Hàn",
    obStart: "Bắt đầu",
    rowWithdraw: "Xóa tài khoản",
    withdrawNote: "Hồ sơ chăm sóc của các cụ vẫn được lưu tại cơ sở để người chăm sóc tiếp theo xem được.",
    withdrawConfirm: "Xóa tài khoản",
    cancel: "Hủy",
  },
  en: {
    heading: "Who did you\ncare for today?",
    placeholder: "She ate half a bowl of porridge, complained of knee pain…",
    submit: "Preview draft",
    previewTitle: "전송 전 확인",
    verifyQ: "Is this correct?",
    confirm: "Yes, send",
    back: "Edit",
    sentKo: "담당자에게 전송했어요",
    sent: "Sent to the manager",
    newMemo: "New note",
    tabHome: "Home",
    tabWrite: "Write",
    tabToday: "Today",
    tabMy: "My",
    todoPlaceholder: "To-do (e.g. give evening medication)…",
    add: "Add",
    todayEmpty: "Today's schedule and sent notes appear here",
    myName: "Name",
    myLang: "Writing language",
    greeting: "Hello",
    statPending: "Pending",
    statConfirmed: "Confirmed",
    statTodos: "To-dos left",
    ctaWrite: "Write a note",
    ctaWriteSub: "Write in English, AI translates",
    patients: "Residents at my facility",
    myFacility: "Workplace",
    myJoined: "Joined",
    statSent: "Sent",
    statRisk: "Risk flags",
    rowNotif: "Notifications",
    notifOn: "On",
    notifOff: "Tap to enable",
    rowAbout: "About this service",
    logout: "Log out",
    obStep1: "Language",
    obStep2: "Name",
    obStepFac: "Work",
    obStep3: "Done",
    obNameTitle: "What's your name?",
    obNamePh: "Maria Santos",
    obFacTitle: "Where do you work?",
    obFacPh: "Search your workplace",
    obFacEmpty: "No results found",
    obNext: "Continue",
    obDoneTitle: "All set!",
    obDoneSub: "Write care notes in English —\nAI turns them into Korean records",
    obStart: "Get started",
    rowWithdraw: "Delete account",
    withdrawNote: "Residents' care records stay with the facility so the next caregiver can see them.",
    withdrawConfirm: "Delete account",
    cancel: "Cancel",
  },
  ko: {
    heading: "오늘 누구를\n돌보셨나요?",
    placeholder: "아침 반만 먹음, 약 먹음, 기침 조금…",
    submit: "기록 초안 보기",
    previewTitle: "전송 전 확인",
    verifyQ: "이 내용이 사실과 같습니까?",
    confirm: "맞아요, 보내기",
    back: "수정하기",
    sentKo: "담당자에게 전송했어요",
    sent: "",
    newMemo: "새 메모 작성",
    tabHome: "홈",
    tabWrite: "기록",
    tabToday: "오늘",
    tabMy: "마이",
    todoPlaceholder: "할 일 (예: 저녁 약 챙기기)…",
    add: "추가",
    todayEmpty: "오늘 일정과 보낸 기록이 여기에 보여요",
    myName: "이름",
    myLang: "기록 언어",
    greeting: "안녕하세요",
    statPending: "검토 대기",
    statConfirmed: "확정됨",
    statTodos: "남은 할 일",
    ctaWrite: "기록 남기기",
    ctaWriteSub: "말하듯 쓰면 AI가 기록으로 정리해요",
    patients: "우리 기관 어르신",
    myFacility: "소속 기관",
    myJoined: "가입일",
    statSent: "보낸 기록",
    statRisk: "위험 신호",
    rowNotif: "알림",
    notifOn: "켜짐",
    notifOff: "탭해서 켜기",
    rowAbout: "서비스 소개",
    logout: "로그아웃",
    obStep1: "언어",
    obStep2: "이름",
    obStepFac: "기관",
    obStep3: "완료",
    obNameTitle: "이름을 알려주세요",
    obNamePh: "박소연",
    obFacTitle: "어디에서 일하세요?",
    obFacPh: "기관명 또는 지역 검색",
    obFacEmpty: "검색 결과가 없어요",
    obNext: "다음",
    obDoneTitle: "준비 완료!",
    obDoneSub: "말하듯 기록하면\nAI가 돌봄 기록으로 정리해 드려요",
    obStart: "시작하기",
    rowWithdraw: "회원 탈퇴",
    withdrawNote: "탈퇴해도 어르신들의 돌봄 기록은 기관에 남아, 다음 요양보호사가 이어서 볼 수 있어요.",
    withdrawConfirm: "탈퇴하기",
    cancel: "취소",
  },
};

const QUICK: Record<Lang, { label: string; phrases: string[] }[]> = {
  vi: [
    { label: "Ăn uống", phrases: ["Ăn hết suất", "Ăn một nửa", "Ăn khoảng 1/3", "Không chịu ăn", "Khó nuốt"] },
    { label: "Đau", phrases: ["Kêu đau đầu", "Kêu đau lưng", "Kêu đau đầu gối", "Kêu đau bụng", "Kêu đau ngực"] },
    { label: "Thuốc", phrases: ["Uống hết thuốc", "Không chịu uống thuốc", "Chỉ uống một phần thuốc"] },
    { label: "Giấc ngủ", phrases: ["Ngủ ngon", "Ngủ không ngon", "Ngủ trưa nhiều"] },
    { label: "Vệ sinh", phrases: ["Đại tiện bình thường", "Bị táo bón", "Bị tiêu chảy", "Đã thay tã"] },
    { label: "Tâm trạng", phrases: ["Tâm trạng ổn định", "Có vẻ lo lắng", "Đi lang thang", "Dễ cáu gắt"] },
    { label: "Dấu hiệu nguy hiểm", phrases: ["Suýt bị ngã", "Bị ngã", "Sốt nhẹ", "Sốt cao", "Khó thở"] },
  ],
  en: [
    { label: "Meals", phrases: ["Ate full meal", "Ate half", "Ate about 1/3", "Refused to eat", "Difficulty swallowing"] },
    { label: "Pain", phrases: ["Complained of headache", "Back pain", "Knee pain", "Stomach pain", "Chest pain"] },
    { label: "Medication", phrases: ["Took all medication", "Refused medication", "Took only part of medication"] },
    { label: "Sleep", phrases: ["Slept well", "Slept poorly", "Long daytime nap"] },
    { label: "Toileting", phrases: ["Normal bowel movement", "Constipation", "Diarrhea", "Changed diaper"] },
    { label: "Mood", phrases: ["Calm and stable", "Seemed anxious", "Wandering around", "Easily irritated"] },
    { label: "Warning signs", phrases: ["Almost fell", "Fell down", "Slight fever", "High fever", "Difficulty breathing"] },
  ],
  ko: [
    { label: "식사", phrases: ["식사 전부 드심", "절반 드심", "1/3 정도 드심", "식사 거부", "삼키기 어려워하심"] },
    { label: "통증", phrases: ["머리 통증 호소", "허리 통증 호소", "무릎 통증 호소", "배 통증 호소", "가슴 통증 호소"] },
    { label: "투약", phrases: ["약 모두 복용함", "약 복용 거부", "약 일부만 복용"] },
    { label: "수면", phrases: ["잘 주무심", "잠을 설치심", "낮잠을 오래 주무심"] },
    { label: "배설", phrases: ["배변 정상", "변비 증상", "설사 증상", "기저귀 교체함"] },
    { label: "기분·행동", phrases: ["기분 안정적", "불안해하심", "배회하심", "화를 내심"] },
    { label: "위험 신호", phrases: ["넘어질 뻔함", "넘어지심", "미열 있음", "고열 있음", "숨쉬기 힘들어하심"] },
  ],
};

const EXAMPLES: Record<Lang, string> = {
  vi: "Bà ăn được nửa bát cháo, buổi chiều kêu đau đầu gối. Uống thuốc huyết áp lúc 9 giờ sáng.",
  en: "He refused breakfast this morning and felt a bit feverish. Took his diabetes medication at 8am.",
  ko: "아침 반만 먹음, 약 먹음, 기침 조금. 오후에 복도에서 살짝 미끄러질 뻔함",
};

type Step = "edit" | "preview" | "sent";
type View = "home" | "write" | "today" | "my";

// 핵심 커버리지 항목 — 실제 요양 기록일지에서 매일 반복되는 3대 항목
const CORE_KEYS = ["meal", "excretion", "sleep"] as const;
const CORE_LABELS: Record<Lang, Record<(typeof CORE_KEYS)[number], string>> = {
  vi: { meal: "Ăn uống", excretion: "Đại tiểu tiện", sleep: "Giấc ngủ" },
  en: { meal: "Meals", excretion: "Toileting", sleep: "Sleep" },
  ko: { meal: "식사", excretion: "배변", sleep: "수면" },
};
const COVERAGE_T: Record<Lang, string> = {
  vi: "chưa ghi",
  en: "not recorded",
  ko: "기록 안 됨",
};

const DIRECT: Record<Lang, string> = {
  vi: "Tự nhập",
  en: "Type it myself",
  ko: "직접 입력",
};

// 호실·나이 현지화
function fmtRoom(lang: Lang, room: string): string {
  if (room.startsWith("방문")) {
    const n = room.replace("방문", "").trim();
    return lang === "vi" ? `Thăm nhà ${n}` : lang === "en" ? `Visit ${n}` : room;
  }
  if (room.endsWith("호")) {
    const n = room.slice(0, -1);
    return lang === "vi" ? `Phòng ${n}` : lang === "en" ? `Room ${n}` : room;
  }
  return room;
}
function fmtAge(lang: Lang, age: number): string {
  return lang === "vi" ? `${age} tuổi` : lang === "en" ? `Age ${age}` : `${age}세`;
}


export default function CaregiverPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [lang, setLangRaw] = useState<Lang | null>(null);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [obStep, setObStep] = useState<1 | 2 | 3 | 4>(1);
  const [facQ, setFacQ] = useState("");
  const [name, setName] = useState("");
  const [facility, setFacility] = useState("");
  const [joined, setJoined] = useState("");
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("edit");
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("home");
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showKo, setShowKo] = useState(false);
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [todosLeft, setTodosLeft] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("carelog_lang");
      const savedName = localStorage.getItem("carelog_name") ?? "";
      const savedFac = localStorage.getItem("carelog_facility");
      const savedJoined = localStorage.getItem("carelog_joined");
      const flag = localStorage.getItem("carelog_onboarded") === "1";
      if (savedLang === "vi" || savedLang === "en" || savedLang === "ko") {
        setLangRaw(savedLang);
        if (flag || savedName) {
          // 기존 사용자 마이그레이션 포함
          setOnboarded(true);
          if (!flag) localStorage.setItem("carelog_onboarded", "1");
        } else {
          setObStep(2);
        }
      }
      setName(savedName);
      if (savedFac) setFacility(savedFac);
      else if (flag || savedName) setFacility(FACILITY_DB[0].name);
      if (savedJoined) setJoined(savedJoined);
      else {
        const j = new Date().toISOString().slice(0, 10);
        setJoined(j);
        localStorage.setItem("carelog_joined", j);
      }
    } catch {}
    setReady(true);
  }, []);

  const myPatients = patientsOf(facility);

  // 기관이 정해지면 기본 대상자 설정
  useEffect(() => {
    if (!facility) return;
    const list = patientsOf(facility);
    if (list.length && !list.some((p) => p.id === patientId))
      setPatientId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility]);

  // 홈·마이에서 쓰는 기록 통계
  useEffect(() => {
    if (!onboarded) return;
    if (view !== "home" && view !== "my") return;
    fetch("/api/records")
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set(patientsOf(facility).map((p) => p.id));
        setRecords(
          (d.records ?? []).filter((r: CareRecord) => ids.has(r.patientId)),
        );
      })
      .catch(() => {});
    try {
      const all: { date: string; done: boolean }[] = JSON.parse(
        localStorage.getItem("carelog_todos") ?? "[]",
      );
      const today = todayKey();
      setTodosLeft(all.filter((x) => x.date === today && !x.done).length);
    } catch {}
  }, [onboarded, view, step, facility]);

  function pickLang(l: Lang) {
    setLangRaw(l);
    setOpenCat(null);
    try {
      localStorage.setItem("carelog_lang", l);
    } catch {}
  }

  function saveName(v: string) {
    setName(v);
    try {
      localStorage.setItem("carelog_name", v);
    } catch {}
  }

  function finishOnboarding() {
    try {
      localStorage.setItem("carelog_name", name.trim());
      localStorage.setItem("carelog_facility", facility);
      localStorage.setItem("carelog_onboarded", "1");
    } catch {}
    setName(name.trim());
    setOnboarded(true);
    setView("home");
  }

  function logout() {
    try {
      for (const k of [
        "carelog_lang",
        "carelog_name",
        "carelog_facility",
        "carelog_onboarded",
        "carelog_joined",
      ])
        localStorage.removeItem(k);
    } catch {}
    setLangRaw(null);
    setName("");
    setFacility("");
    setOnboarded(false);
    setObStep(1);
    setView("home");
    reset();
    router.push("/");
  }

  function withdraw() {
    try {
      localStorage.removeItem("carelog_todos");
    } catch {}
    logout();
  }

  async function preview() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lang, text, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "초안 생성에 실패했어요");
      setDraft(data.draft);
      setShowKo(false);
      setStep("preview");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "초안 생성에 실패했어요");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!draft) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lang, text, draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송에 실패했어요");
      setStep("sent");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송에 실패했어요");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText("");
    setDraft(null);
    setStep("edit");
    setError("");
    setOpenCat(null);
  }

  if (!ready) return null;

  // ── 온보딩 (가입 흐름) ────────────────────────────────────────
  if (!onboarded) {
    const stepLabels = lang
      ? [T[lang].obStep1, T[lang].obStep2, T[lang].obStepFac, T[lang].obStep3]
      : ["Language", "Name", "Work", "Done"];
    return (
      <div className="pb-36 pt-6">
        {/* 진행 단계 */}
        <div className="flex items-start justify-center">
          {stepLabels.map((label, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div
                  className={`mt-[13px] h-0.5 w-6 ${
                    obStep > i ? "bg-blue" : "bg-line"
                  }`}
                />
              )}
              <div className="flex w-[70px] flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                    obStep > i + 1
                      ? "bg-blue text-white"
                      : obStep === i + 1
                        ? "bg-blue-soft text-blue ring-2 ring-blue"
                        : "bg-line/60 text-faint"
                  }`}
                >
                  {obStep > i + 1 ? "✓" : i + 1}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    obStep === i + 1 ? "text-blue" : "text-faint"
                  }`}
                >
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>

        {obStep === 1 && (
          <>
            <h1 className="mt-10 text-center text-[22px] font-extrabold tracking-tight">
              언어 선택
            </h1>
            <p className="mt-1.5 text-center text-[14px] text-sub">
              Chọn ngôn ngữ · Choose your language
            </p>
            <div className="mt-8 space-y-3">
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    pickLang(l);
                    setObStep(2);
                  }}
                  className="flex w-full items-center justify-between rounded-3xl bg-white p-5 text-left text-[17px] font-bold transition hover:ring-2 hover:ring-blue active:scale-[0.98]"
                >
                  {LANG_LABELS[l]}
                  <span className="text-faint">
                    <ChevronIcon />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {obStep === 2 && lang && (
          <>
            <button
              onClick={() => setObStep(1)}
              className="mt-6 text-[20px] text-sub"
            >
              ‹
            </button>
            <h1 className="mt-1 text-[22px] font-extrabold tracking-tight">
              {T[lang].obNameTitle}
            </h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={T[lang].obNamePh}
              className="mt-5 w-full rounded-3xl bg-white p-5 text-[17px] font-bold outline-none placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-blue"
            />
            <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-6 pt-8">
              <div className="mx-auto max-w-xl">
                <button
                  onClick={() => setObStep(3)}
                  disabled={!name.trim()}
                  className="w-full rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-faint"
                >
                  {T[lang].obNext}
                </button>
              </div>
            </div>
          </>
        )}

        {obStep === 3 && lang && (
          <>
            <button
              onClick={() => setObStep(2)}
              className="mt-6 text-[20px] text-sub"
            >
              ‹
            </button>
            <h1 className="mt-1 text-[22px] font-extrabold tracking-tight">
              {T[lang].obFacTitle}
            </h1>
            <input
              autoFocus
              value={facQ}
              onChange={(e) => setFacQ(e.target.value)}
              placeholder={T[lang].obFacPh}
              className="mt-5 w-full rounded-3xl bg-white p-5 text-[16px] outline-none placeholder:text-faint focus:ring-2 focus:ring-blue"
            />
            {(() => {
              const q = facQ.trim().toLowerCase();
              const hits = FACILITY_DB.filter((f) =>
                (f.name + f.region).toLowerCase().includes(q),
              );
              return hits.length === 0 ? (
                <p className="pt-12 text-center text-[14px] text-faint">
                  {T[lang].obFacEmpty}
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {hits.map((f) => (
                    <li key={f.name}>
                      <button
                        onClick={() => {
                          setFacility(f.name);
                          setObStep(4);
                        }}
                        className={`flex w-full items-center gap-3.5 rounded-3xl p-4 text-left transition hover:ring-2 hover:ring-blue active:scale-[0.99] ${
                          facility === f.name
                            ? "bg-blue-soft ring-2 ring-blue"
                            : "bg-white"
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg text-sub">
                          <BuildingIcon />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold">
                            {f.name}
                          </span>
                          <span className="block text-[12px] text-sub">
                            {f.region}
                          </span>
                        </span>
                        <span className="text-faint">
                          <ChevronIcon />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </>
        )}

        {obStep === 4 && lang && (
          <div className="flex flex-col items-center pt-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-3xl text-green">
              ✓
            </span>
            <h1 className="mt-5 text-[22px] font-extrabold">
              {T[lang].obDoneTitle}
            </h1>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-sub">
              {T[lang].obDoneSub}
            </p>
            <div className="mt-8 flex w-full items-center gap-3.5 rounded-3xl bg-white p-4 text-left">
              <Avatar name={name || "?"} size="lg" />
              <div className="min-w-0">
                <p className="text-[16px] font-bold">{name}</p>
                <p className="mt-0.5 text-[13px] text-sub">
                  {facility} · {LANG_LABELS[lang]}
                </p>
              </div>
            </div>
            <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-6 pt-8">
              <div className="mx-auto max-w-xl">
                <button
                  onClick={finishOnboarding}
                  className="w-full rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98]"
                >
                  {T[lang].obStart}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!lang) return null;
  const t = T[lang];

  // ── 전송 완료 ─────────────────────────────────────────────────
  if (step === "sent") {
    return (
      <div className="flex flex-col items-center pt-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-3xl text-green">
          ✓
        </span>
        <h1 className="mt-5 text-xl font-bold">{t.sentKo}</h1>
        {lang !== "ko" && <p className="mt-1 text-[15px] text-sub">{t.sent}</p>}
        <button
          onClick={reset}
          className="mt-10 w-full rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98]"
        >
          {t.newMemo}
        </button>
        <button
          onClick={() => {
            reset();
            setView("home");
          }}
          className="mt-3 py-2 text-[14px] font-semibold text-sub"
        >
          {t.tabHome} ›
        </button>
      </div>
    );
  }

  // ── 전송 전 확인 ──────────────────────────────────────────────
  if (step === "preview" && draft) {
    const fieldEntries = Object.entries(draft.fields) as [FieldKey, string][];
    return (
      <div className="pb-36 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t.previewTitle}</h1>
          <ModeTag mode={draft.aiMode} />
        </div>

        {draft.risks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {draft.risks.map((r, i) => (
              <RiskBadge key={i} risk={r} />
            ))}
          </div>
        )}

        {lang !== "ko" && draft.backTranslation && (
          <div className="mt-4 rounded-3xl bg-white p-5">
            <p className="text-[12px] font-semibold text-green">
              {LANG_LABELS[lang]}
            </p>
            <p className="mt-2 text-[17px] font-medium leading-relaxed">
              {draft.backTranslation}
            </p>
          </div>
        )}

        <div className="mt-3 overflow-hidden rounded-3xl bg-white">
          {lang !== "ko" ? (
            <button
              onClick={() => setShowKo((v) => !v)}
              className="flex w-full items-center justify-between p-5"
            >
              <span className="text-[14px] font-semibold text-sub">
                한국어 기록 · Korean record
              </span>
              <span
                className={`text-faint transition-transform ${showKo ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>
          ) : (
            <p className="p-5 pb-0 text-[12px] font-semibold text-faint">
              한국어 기록
            </p>
          )}
          {(showKo || lang === "ko") && (
            <div className="p-5 pt-3">
              <p className="text-[15px] leading-relaxed">
                {draft.translationKo}
              </p>
              {fieldEntries.length > 0 && (
                <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                  {fieldEntries.map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-[14px]">
                      <span className="w-16 shrink-0 font-semibold text-sub">
                        {FIELD_LABELS[k]}
                      </span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 핵심 항목 커버리지: 식사·배변·수면 빠뜨림 방지 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CORE_KEYS.map((k) => {
            const covered = Boolean(draft.fields[k]?.trim());
            return covered ? (
              <span
                key={k}
                className="flex items-center gap-1.5 rounded-xl bg-green-soft px-3.5 py-2 text-[13px] font-semibold text-green"
              >
                ✓ {CORE_LABELS[lang][k]}
              </span>
            ) : (
              <button
                key={k}
                onClick={() => {
                  setStep("edit");
                  setTimeout(() => taRef.current?.focus(), 80);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-soft px-3.5 py-2 text-[13px] font-semibold text-amber transition active:scale-[0.97]"
              >
                {CORE_LABELS[lang][k]} · {COVERAGE_T[lang]}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 rounded-2xl bg-red-soft px-4 py-3 text-[14px] font-medium text-red">
            {error}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-6 pt-8">
          <div className="mx-auto max-w-xl">
            <p className="mb-3 text-center text-[15px] font-bold">
              {t.verifyQ}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setStep("edit")}
                disabled={loading}
                className="flex-1 rounded-2xl bg-white py-4 text-[16px] font-bold text-ink transition active:scale-[0.98] disabled:opacity-50"
              >
                {t.back}
              </button>
              <button
                onClick={send}
                disabled={loading}
                className="flex-[1.6] rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "전송 중…" : t.confirm}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 통계 ──
  const pendingN = records.filter((r) => r.status === "draft").length;
  const confirmedN = records.filter((r) => r.status === "confirmed").length;
  const riskN = records.reduce((n, r) => n + r.risks.length, 0);

  return (
    <div className="pb-32 pt-2">
      {/* ── 홈 ── */}
      {view === "home" && (
        <div className="pt-2">
          <h1 className="text-[24px] font-extrabold leading-snug tracking-tight">
            {t.greeting}, {name}
            {lang === "ko" ? "님" : ""} 👋
          </h1>
          <p className="mt-1 text-[13px] text-sub">{facility}</p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { n: pendingN, label: t.statPending, cls: "text-amber" },
              { n: confirmedN, label: t.statConfirmed, cls: "text-green" },
              { n: todosLeft, label: t.statTodos, cls: "text-blue" },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl bg-white p-4">
                <p className={`text-[22px] font-extrabold ${s.cls}`}>{s.n}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-sub">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setView("write")}
            className="mt-3 flex w-full items-center justify-between rounded-3xl bg-blue p-5 text-left text-white transition active:scale-[0.98]"
          >
            <span>
              <span className="block text-[17px] font-bold">{t.ctaWrite}</span>
              <span className="mt-0.5 block text-[13px] text-white/80">
                {t.ctaWriteSub}
              </span>
            </span>
            <span className="text-2xl">›</span>
          </button>

          <p className="mt-7 text-[13px] font-bold text-faint">{t.patients}</p>
          <ul className="mt-2.5 space-y-2.5">
            {myPatients.map((p, i) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setPatientId(p.id);
                    setView("write");
                  }}
                  className="flex w-full items-center gap-3.5 rounded-3xl bg-white p-4 text-left transition hover:ring-2 hover:ring-blue active:scale-[0.99]"
                >
                  <Avatar name={p.name} index={i} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">
                      {p.name}
                    </span>
                    <span className="block text-[12px] text-sub">
                      {fmtRoom(lang, p.room)} · {fmtAge(lang, p.age)}
                    </span>
                  </span>
                  <span className="text-faint">
                    <ChevronIcon />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 오늘 ── */}
      {view === "today" && <TodayView lang={lang} facility={facility} />}

      {/* ── 마이 ── */}
      {view === "my" && (
        <MyView
          lang={lang}
          name={name}
          facility={facility}
          joined={joined}
          records={records}
          riskN={riskN}
          confirmedN={confirmedN}
          saveName={saveName}
          pickLang={pickLang}
          logout={logout}
          withdraw={withdraw}
        />
      )}

      {/* ── 기록 작성 ── */}
      {view === "write" && (
        <>
          <button
            onClick={() => setView("home")}
            className="mt-1 text-[22px] text-sub"
          >
            ‹
          </button>
          <h1 className="mt-1 whitespace-pre-line text-[24px] font-extrabold leading-snug tracking-tight">
            {t.heading}
          </h1>

          {/* 대상자 선택 */}
          <div className="no-scrollbar -mx-5 mt-5 flex gap-2.5 overflow-x-auto px-5 py-1">
            {myPatients.map((p, i) => {
              const active = patientId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPatientId(p.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-2xl py-2.5 pl-2.5 pr-4 transition active:scale-[0.97] ${
                    active ? "bg-blue-soft ring-2 ring-blue" : "bg-white"
                  }`}
                >
                  <Avatar name={p.name} index={i} />
                  <span className="text-left">
                    <span className="block text-[15px] font-bold">
                      {p.name}
                    </span>
                    <span className="block text-[12px] text-sub">
                      {fmtRoom(lang, p.room)} · {fmtAge(lang, p.age)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* 메모 입력 */}
          <div className="relative mt-4">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              rows={5}
              className="w-full rounded-3xl bg-white p-5 text-[16px] leading-relaxed outline-none placeholder:text-faint focus:ring-2 focus:ring-blue"
            />
            <button
              onClick={() => setText(EXAMPLES[lang])}
              className="absolute bottom-4 right-4 rounded-lg bg-bg px-2.5 py-1 text-[12px] font-medium text-sub"
            >
              예시
            </button>
          </div>

          {/* 항목별 빠른 입력: 대분류(아이콘 칩) → 세부 문구(+ 태그) */}
          <div className="mt-5">
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
              {QUICK[lang].map((g, gi) => {
                const active = openCat === g.label;
                return (
                  <button
                    key={g.label}
                    onClick={() => setOpenCat(active ? null : g.label)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[14px] font-bold transition active:scale-[0.97] ${
                      active
                        ? "bg-blue-soft text-blue ring-2 ring-blue"
                        : "bg-white text-ink hover:ring-2 hover:ring-blue"
                    }`}
                  >
                    {(() => {
                      const Icon = CATEGORY_ICONS[gi];
                      return <Icon />;
                    })()}
                    {g.label}
                  </button>
                );
              })}
            </div>
            {openCat && (
              <div className="mt-2.5 rounded-2xl border border-blue/20 bg-white p-3.5">
                <div className="flex flex-wrap gap-2">
                  {QUICK[lang]
                    .find((g) => g.label === openCat)
                    ?.phrases.map((ph) => (
                      <button
                        key={ph}
                        onClick={() =>
                          setText((prev) =>
                            prev.trim()
                              ? `${prev.trim().replace(/\.$/, "")}. ${ph}`
                              : ph,
                          )
                        }
                        className="rounded-full bg-bg px-3.5 py-2 text-[13px] font-medium text-ink transition hover:ring-2 hover:ring-blue active:scale-[0.97]"
                      >
                        <span className="mr-1 font-bold text-blue">+</span>
                        {ph}
                      </button>
                    ))}
                  <button
                    onClick={() => {
                      setOpenCat(null);
                      taRef.current?.focus();
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-dashed border-faint px-3.5 py-2 text-[13px] font-medium text-sub transition hover:border-blue hover:text-blue active:scale-[0.97]"
                  >
                    <PencilIcon />
                    {DIRECT[lang]}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-soft px-4 py-3 text-[14px] font-medium text-red">
              {error}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-[62px] bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-3 pt-10">
            <div className="mx-auto max-w-xl">
              <button
                onClick={preview}
                disabled={loading || !text.trim()}
                className="w-full rounded-2xl bg-blue py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-faint"
              >
                {loading ? "AI 초안 만드는 중…" : t.submit}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 하단 탭 내비게이션 ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white">
        <div className="mx-auto flex max-w-xl">
          {(
            [
              { v: "home", label: t.tabHome, Icon: HomeIcon },
              { v: "write", label: t.tabWrite, Icon: NoteIcon },
              { v: "today", label: t.tabToday, Icon: CalendarIcon },
              { v: "my", label: t.tabMy, Icon: UserIcon },
            ] as const
          ).map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex flex-1 flex-col items-center gap-0.5 pb-2.5 pt-2 text-[11px] font-semibold transition ${
                view === v ? "text-blue" : "text-faint"
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── 마이 페이지 ───────────────────────────────────────────────────
function MyView({
  lang,
  name,
  facility,
  joined,
  records,
  riskN,
  confirmedN,
  saveName,
  pickLang,
  logout,
  withdraw,
}: {
  lang: Lang;
  name: string;
  facility: string;
  joined: string;
  records: CareRecord[];
  riskN: number;
  confirmedN: number;
  saveName: (v: string) => void;
  pickLang: (l: Lang) => void;
  logout: () => void;
  withdraw: () => void;
}) {
  const t = T[lang];
  const [langOpen, setLangOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [notif, setNotif] = useState<string>("default");

  useEffect(() => {
    try {
      setNotif("Notification" in window ? Notification.permission : "unsupported");
    } catch {
      setNotif("unsupported");
    }
  }, []);

  const joinedFmt = joined ? joined.replace(/-/g, ".") : "";

  return (
    <div className="mt-4 space-y-3">
      {/* 프로필 카드 */}
      <div className="rounded-3xl bg-white p-5">
        <div className="flex items-center gap-4">
          <Avatar name={name || "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => saveName(e.target.value)}
              placeholder={t.myName}
              className="w-full bg-transparent text-[18px] font-extrabold outline-none placeholder:text-faint"
            />
            <p className="mt-0.5 text-[13px] text-sub">
              {facility} · {t.myJoined} {joinedFmt}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
          <span className="rounded-lg bg-green-soft px-2 py-1 text-[12px] font-bold text-green">
            ✓ {LANG_LABELS[lang]}
          </span>
          <span className="rounded-lg bg-green-soft px-2 py-1 text-[12px] font-bold text-green">
            ✓ {facility}
          </span>
        </div>
      </div>

      {/* 활동 통계 */}
      <div className="rounded-3xl bg-white p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { n: records.length, label: t.statSent },
            { n: confirmedN, label: t.statConfirmed },
            { n: riskN, label: t.statRisk },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[20px] font-extrabold">{s.n}</p>
              <p className="mt-0.5 text-[12px] font-semibold text-sub">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 설정 리스트 */}
      <div className="overflow-hidden rounded-3xl bg-white">
        <button
          onClick={() => setLangOpen((v) => !v)}
          className="flex w-full items-center gap-3.5 p-4.5 px-5 py-4 transition active:bg-bg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg text-sub">
            <GlobeIcon />
          </span>
          <span className="flex-1 text-left text-[15px] font-semibold">
            {t.myLang}
          </span>
          <span className="text-[13px] font-semibold text-sub">
            {LANG_LABELS[lang]}
          </span>
          <span
            className={`text-faint transition-transform ${langOpen ? "rotate-90" : ""}`}
          >
            <ChevronIcon />
          </span>
        </button>
        {langOpen && (
          <div className="space-y-2 border-t border-line px-5 py-4">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  pickLang(l);
                  setLangOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-[14px] font-bold transition active:scale-[0.98] ${
                  lang === l
                    ? "bg-blue-soft text-blue ring-2 ring-blue"
                    : "bg-bg hover:ring-2 hover:ring-blue"
                }`}
              >
                {LANG_LABELS[l]}
                {lang === l && <span>✓</span>}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            try {
              if ("Notification" in window)
                Notification.requestPermission().then(setNotif);
            } catch {}
          }}
          className="flex w-full items-center gap-3.5 border-t border-line px-5 py-4 transition active:bg-bg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg text-sub">
            <BellIcon />
          </span>
          <span className="flex-1 text-left text-[15px] font-semibold">
            {t.rowNotif}
          </span>
          <span
            className={`text-[13px] font-semibold ${
              notif === "granted" ? "text-green" : "text-sub"
            }`}
          >
            {notif === "granted" ? t.notifOn : t.notifOff}
          </span>
        </button>

        <Link
          href="/"
          className="flex w-full items-center gap-3.5 border-t border-line px-5 py-4 transition active:bg-bg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg text-sub">
            <InfoIcon />
          </span>
          <span className="flex-1 text-left text-[15px] font-semibold">
            {t.rowAbout}
          </span>
          <span className="text-faint">
            <ChevronIcon />
          </span>
        </Link>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 border-t border-line px-5 py-4 transition active:bg-bg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-soft text-red">
            <LogoutIcon />
          </span>
          <span className="flex-1 text-left text-[15px] font-semibold text-red">
            {t.logout}
          </span>
        </button>
      </div>

      {/* 회원 탈퇴 */}
      {confirmOut ? (
        <div className="rounded-3xl bg-white p-5">
          <p className="text-[14px] leading-relaxed text-sub">
            {t.withdrawNote}
          </p>
          <div className="mt-4 flex gap-2.5">
            <button
              onClick={() => setConfirmOut(false)}
              className="flex-1 rounded-2xl bg-bg py-3.5 text-[15px] font-bold transition active:scale-[0.98]"
            >
              {t.cancel}
            </button>
            <button
              onClick={withdraw}
              className="flex-1 rounded-2xl bg-red py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98]"
            >
              {t.withdrawConfirm}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmOut(true)}
          className="w-full py-2 text-center text-[13px] font-medium text-faint underline-offset-2 hover:underline"
        >
          {t.rowWithdraw}
        </button>
      )}
    </div>
  );
}

// ── 오늘 일정 + 보낸 기록 타임라인 ─────────────────────────────────
type Todo = {
  id: string;
  time: string;
  text: string;
  notify: boolean;
  done: boolean;
  date: string;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function loadAllTodos(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem("carelog_todos") ?? "[]");
  } catch {
    return [];
  }
}
function saveAllTodos(all: Todo[]) {
  try {
    localStorage.setItem("carelog_todos", JSON.stringify(all));
  } catch {}
}

function TodayView({ lang, facility }: { lang: Lang; facility: string }) {
  const t = T[lang];
  const [todos, setTodos] = useState<Todo[]>([]);
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [todoText, setTodoText] = useState("");
  const [todoTime, setTodoTime] = useState(() => {
    const d = new Date(Date.now() + 30 * 60000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setTodos(loadAllTodos().filter((x) => x.date === todayKey()));
    fetch("/api/records")
      .then((r) => r.json())
      .then((d) => {
        const today = new Date().toDateString();
        const ids = new Set(patientsOf(facility).map((p) => p.id));
        setRecords(
          (d.records ?? []).filter(
            (r: CareRecord) =>
              ids.has(r.patientId) &&
              new Date(r.createdAt).toDateString() === today,
          ),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility]);

  // 알림 예약 — 페이지가 열려 있는 동안 브라우저 알림
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    todos.forEach((td) => {
      if (!td.notify || td.done) return;
      const [h, m] = td.time.split(":").map(Number);
      const fire = new Date();
      fire.setHours(h, m, 0, 0);
      const delay = fire.getTime() - Date.now();
      if (delay > 0 && delay < 86400000) {
        timers.current.push(
          window.setTimeout(() => {
            try {
              if (Notification.permission === "granted")
                new Notification("케어로그", {
                  body: `${td.time} · ${td.text}`,
                });
            } catch {}
          }, delay),
        );
      }
    });
    const current = timers.current;
    return () => current.forEach(clearTimeout);
  }, [todos]);

  function mutate(next: Todo[]) {
    setTodos(next);
    saveAllTodos([
      ...loadAllTodos().filter((x) => x.date !== todayKey()),
      ...next,
    ]);
  }

  function addTodo() {
    if (!todoText.trim()) return;
    try {
      if ("Notification" in window && Notification.permission === "default")
        Notification.requestPermission();
    } catch {}
    mutate([
      ...todos,
      {
        id: crypto.randomUUID(),
        time: todoTime,
        text: todoText.trim(),
        notify: true,
        done: false,
        date: todayKey(),
      },
    ]);
    setTodoText("");
  }

  const entries = useMemo(() => {
    const e: { time: string; todo?: Todo; rec?: CareRecord }[] = [
      ...todos.map((td) => ({ time: td.time, todo: td })),
      ...records.map((r) => ({ time: fmtClock(r.createdAt), rec: r })),
    ];
    return e.sort((a, b) => a.time.localeCompare(b.time));
  }, [todos, records]);

  return (
    <div className="mt-4">
      {/* 일정 추가 */}
      <div className="flex gap-2">
        <input
          type="time"
          value={todoTime}
          onChange={(e) => setTodoTime(e.target.value)}
          className="w-[136px] shrink-0 rounded-2xl bg-white px-2.5 py-3.5 text-center text-[15px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-blue"
        />
        <input
          value={todoText}
          onChange={(e) => setTodoText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder={t.todoPlaceholder}
          className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3.5 text-[15px] outline-none placeholder:text-faint focus:ring-2 focus:ring-blue"
        />
        <button
          onClick={addTodo}
          disabled={!todoText.trim()}
          className="shrink-0 rounded-2xl bg-blue px-4 text-[14px] font-bold text-white transition active:scale-[0.97] disabled:bg-line disabled:text-faint"
        >
          {t.add}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="pt-16 text-center text-[14px] text-faint">
          {t.todayEmpty}
        </p>
      ) : (
        <ul className="mt-6">
          {entries.map((en, i) => {
            const isLast = i === entries.length - 1;
            return (
              <li key={en.todo?.id ?? en.rec!.id} className="flex gap-2.5">
                <span className="w-11 shrink-0 pt-[16px] text-right text-[12px] font-bold tabular-nums text-sub">
                  {en.time}
                </span>
                <div className="flex w-3 shrink-0 flex-col items-center">
                  <span
                    className={`mt-[20px] h-2 w-2 shrink-0 rounded-full border-2 bg-white ${
                      en.rec ? "border-green" : "border-blue"
                    }`}
                  />
                  {!isLast && <span className="w-px flex-1 bg-line" />}
                </div>
                {en.todo ? (
                  <div className="mb-2.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-3xl bg-white p-4">
                    <button
                      onClick={() =>
                        mutate(
                          todos.map((x) =>
                            x.id === en.todo!.id
                              ? { ...x, done: !x.done }
                              : x,
                          ),
                        )
                      }
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold transition ${
                        en.todo.done
                          ? "border-blue bg-blue text-white"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </button>
                    <span
                      className={`min-w-0 flex-1 text-[15px] ${
                        en.todo.done ? "text-faint line-through" : ""
                      }`}
                    >
                      {en.todo.text}
                    </span>
                    <button
                      onClick={() =>
                        mutate(
                          todos.map((x) =>
                            x.id === en.todo!.id
                              ? { ...x, notify: !x.notify }
                              : x,
                          ),
                        )
                      }
                      className={en.todo.notify ? "text-blue" : "text-faint"}
                    >
                      <BellIcon />
                    </button>
                    <button
                      onClick={() =>
                        mutate(todos.filter((x) => x.id !== en.todo!.id))
                      }
                      className="px-1 text-[18px] leading-none text-faint"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="mb-2.5 min-w-0 flex-1 rounded-3xl bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold">
                        {getPatient(en.rec!.patientId)?.name}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-1 text-[12px] font-bold ${
                          en.rec!.status === "draft"
                            ? "bg-amber-soft text-amber"
                            : "bg-green-soft text-green"
                        }`}
                      >
                        {en.rec!.status === "draft"
                          ? t.statPending
                          : t.statConfirmed}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[14px] text-sub">
                      {lang !== "ko" && en.rec!.backTranslation
                        ? en.rec!.backTranslation
                        : en.rec!.translationKo}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
