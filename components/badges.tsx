import { Risk } from "@/lib/types";

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-red-soft px-2 py-1 text-[12px] font-bold text-red">
      {risk.category}
    </span>
  );
}

export function StatusTag({
  status,
}: {
  status: "draft" | "confirmed" | "returned";
}) {
  if (status === "returned")
    return (
      <span className="rounded-lg bg-red-soft px-2 py-1 text-[12px] font-bold text-red">
        반려
      </span>
    );
  return status === "draft" ? (
    <span className="rounded-lg bg-amber-soft px-2 py-1 text-[12px] font-bold text-amber">
      검토 대기
    </span>
  ) : (
    <span className="rounded-lg bg-green-soft px-2 py-1 text-[12px] font-bold text-green">
      확정
    </span>
  );
}

export function ModeTag({ mode }: { mode: "live" | "mock" }) {
  if (mode === "live") return null;
  return (
    <span className="whitespace-nowrap rounded-lg bg-line/60 px-2 py-1 text-[11px] font-medium text-sub">
      데모 AI
    </span>
  );
}

const AVATAR_STYLES = [
  "bg-blue-soft text-blue",
  "bg-[#fff0e0] text-[#d9730d]",
  "bg-[#f1ecff] text-[#7b5cd6]",
];

export function Avatar({
  name,
  index = 0,
  size = "md",
}: {
  name: string;
  index?: number;
  size?: "md" | "lg";
}) {
  const cls = AVATAR_STYLES[index % AVATAR_STYLES.length];
  const dim = size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-[15px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dim} ${cls}`}
    >
      {name.charAt(0)}
    </span>
  );
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yd = new Date(now);
  yd.setDate(now.getDate() - 1);
  const base = d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  if (d.toDateString() === now.toDateString()) return `오늘 · ${base}`;
  if (d.toDateString() === yd.toDateString()) return `어제 · ${base}`;
  return base;
}
