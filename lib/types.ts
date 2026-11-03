// 케어로그 공통 타입 정의
export type Lang = "vi" | "en" | "ko" | "id" | "ne" | "uz";

export const LANG_LABELS: Record<Lang, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어(혼용)",
  id: "Bahasa Indonesia",
  ne: "नेपाली",
  uz: "O'zbekcha",
};

export const FIELD_KEYS = [
  "meal",
  "excretion",
  "sleep",
  "medication",
  "physical",
  "mental",
  "activity",
  "special",
  "followUp",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const FIELD_LABELS: Record<FieldKey, string> = {
  meal: "식사",
  excretion: "배설",
  sleep: "수면",
  medication: "투약",
  physical: "신체 상태",
  mental: "인지·정서",
  activity: "활동",
  special: "특이사항",
  followUp: "다음 확인",
};

export const RISK_CATEGORIES = [
  "낙상",
  "발열",
  "통증",
  "식사 거부",
  "투약 거부",
  "호흡 곤란",
  "의식 변화",
  "환각·망상",
  "피부 손상·욕창",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export interface Risk {
  category: RiskCategory;
  /** 판단 근거가 된 문구 (원문 또는 번역문 인용) */
  evidence: string;
  /** ai = LLM 판별, rule = 키워드 규칙 판별 */
  source: "ai" | "rule";
}

export type RecordStatus = "draft" | "confirmed";

export interface CareRecord {
  id: string;
  patientId: string;
  lang: Lang;
  /** 요양보호사가 입력한 원문 메모 */
  originalText: string;
  /** AI가 생성한 한국어 번역·정제문 */
  translationKo: string;
  /** 한국어 기록을 작성자 언어로 되번역한 확인용 문장 (ko 입력 시 생략) */
  backTranslation?: string;
  /** 항목별 구조화 결과 */
  fields: Partial<Record<FieldKey, string>>;
  risks: Risk[];
  status: RecordStatus;
  createdAt: string;
  confirmedAt?: string;
  /** live = 실제 LLM 호출, mock = 모의 응답 */
  aiMode: "live" | "mock";
  /** 담당자가 확정 시 결정하는 공유 범위 (기본: 기관 내부) */
  shareScope?: "internal" | "family";
}

export interface AiDraft {
  translationKo: string;
  backTranslation?: string;
  fields: Partial<Record<FieldKey, string>>;
  risks: Risk[];
  aiMode: "live" | "mock";
}
