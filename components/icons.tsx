// 토스풍 미니멀 선 아이콘 — currentColor를 따라가므로 칩 상태 색과 자동 연동
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

export function MealIcon() {
  return (
    <Svg>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" {...S} />
      <path d="M9 7.5V5.5M14 7.5V4.5" {...S} />
    </Svg>
  );
}

export function PainIcon() {
  return (
    <Svg>
      <path d="M13 3 5.5 13.5H11l-1.5 7.5L17 10.5h-5.5L13 3Z" {...S} />
    </Svg>
  );
}

export function MedIcon() {
  return (
    <Svg>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" {...S} />
      <path d="M12 8.5v7" {...S} />
    </Svg>
  );
}

export function SleepIcon() {
  return (
    <Svg>
      <path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z" {...S} />
    </Svg>
  );
}

export function ToiletIcon() {
  return (
    <Svg>
      <path d="M12 4s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" {...S} />
    </Svg>
  );
}

export function MoodIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...S} />
      <path d="M9 10h.01M15 10h.01" {...S} strokeWidth={2.4} />
      <path d="M8.8 14a4.3 4.3 0 0 0 6.4 0" {...S} />
    </Svg>
  );
}

export function WarnIcon() {
  return (
    <Svg>
      <path d="M12 4.5 20.5 19h-17L12 4.5Z" {...S} />
      <path d="M12 10.5v3.5M12 16.8v.01" {...S} strokeWidth={2.2} />
    </Svg>
  );
}

export function BellIcon() {
  return (
    <Svg>
      <path d="M6.5 16v-5.5a5.5 5.5 0 0 1 11 0V16l1.5 2.5h-14L6.5 16Z" {...S} />
      <path d="M10.2 21a2 2 0 0 0 3.6 0" {...S} />
    </Svg>
  );
}

export function PencilIcon() {
  return (
    <Svg>
      <path
        d="M14.5 6.2l3.3 3.3M4.5 19.5l1.2-4.2L16.2 4.8a2.1 2.1 0 0 1 3 3L8.7 18.3l-4.2 1.2Z"
        {...S}
      />
    </Svg>
  );
}

// QUICK 배열 순서와 동일: 식사·통증·투약·수면·배설·기분·위험
export const CATEGORY_ICONS = [
  MealIcon,
  PainIcon,
  MedIcon,
  SleepIcon,
  ToiletIcon,
  MoodIcon,
  WarnIcon,
];

// ── 내비게이션·마이페이지 아이콘 ──
export function HomeIcon() {
  return (
    <Svg>
      <path d="M4.5 11.5 12 4.5l7.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-5v5.5H6A1.5 1.5 0 0 1 4.5 19v-7.5Z" {...S} />
    </Svg>
  );
}

export function NoteIcon() {
  return (
    <Svg>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" {...S} />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" {...S} />
    </Svg>
  );
}

export function CalendarIcon() {
  return (
    <Svg>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" {...S} />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" {...S} />
    </Svg>
  );
}

export function UserIcon() {
  return (
    <Svg>
      <circle cx="12" cy="8.5" r="3.5" {...S} />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" {...S} />
    </Svg>
  );
}

export function ChevronIcon() {
  return (
    <Svg>
      <path d="m10 7 5 5-5 5" {...S} />
    </Svg>
  );
}

export function GlobeIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...S} />
      <path d="M4 12h16M12 4c2.4 2.6 2.4 13.4 0 16M12 4c-2.4 2.6-2.4 13.4 0 16" {...S} />
    </Svg>
  );
}

export function BuildingIcon() {
  return (
    <Svg>
      <path d="M6 20.5V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15.5" {...S} />
      <path d="M4 20.5h16M9.5 8h1.6M13 8h1.6M9.5 11.5h1.6M13 11.5h1.6M11 20.5v-3.5h2v3.5" {...S} />
    </Svg>
  );
}

export function LogoutIcon() {
  return (
    <Svg>
      <path d="M13.5 4.5H7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6.5" {...S} />
      <path d="M10.5 12H20m0 0-3-3m3 3-3 3" {...S} />
    </Svg>
  );
}

export function InfoIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...S} />
      <path d="M12 11.5V16M12 8.2v.01" {...S} strokeWidth={2.2} />
    </Svg>
  );
}
