// 위험 신호 키워드 규칙 — LLM 판별과 이중 구조(재현율 우선)
// 계획서 5.2 위험 2(위험 신호 누락) 대응: LLM이 놓쳐도 규칙이 잡아낸다.
import { Risk, RiskCategory } from "./types";

const RULES: Record<RiskCategory, string[]> = {
  낙상: ["넘어", "낙상", "쓰러", "미끄러", "ngã", "té ngã", "fall", "fell", "slipped"],
  발열: ["열이", "발열", "뜨겁", "미열", "고열", "sốt", "fever", "feverish"],
  통증: ["아프", "아파", "통증", "쑤시", "저리", "đau", "nhức", "pain", "ache", "hurts", "hurting", "sore "],
  "식사 거부": ["식사 거부", "안 드셨", "안 먹", "드시지 않", "bỏ ăn", "không chịu ăn", "không ăn", "refused to eat", "refuse food", "refusing food", "won't eat"],
  "투약 거부": ["약 거부", "약을 거부", "약 안 드", "복용 거부", "không uống thuốc", "từ chối uống thuốc", "refused medication", "refused meds", "refuse medication"],
  "호흡 곤란": ["숨이 차", "숨쉬기", "호흡 곤란", "호흡이 가쁘", "khó thở", "thở gấp", "short of breath", "breathing difficult", "trouble breathing", "wheezing"],
  "의식 변화": ["의식이", "못 알아보", "반응이 없", "멍하", "헛소리", "lơ mơ", "không tỉnh", "unresponsive", "unconscious", "confused", "disoriented"],
  "환각·망상": ["헛것", "환각", "망상", "누가 서", "사람이 서있", "서있었다고", "손님이 왔", "누가 부르", "무섭다고 하", "무서웠다고", "ảo giác", "hoang tưởng", "nhìn thấy người", "có người đứng", "hallucinat", "delusion", "seeing things", "saw someone standing", "someone standing", "someone was there", "were standing", "standing by her bed", "standing by his bed", "men standing", "man standing"],
  "피부 손상·욕창": ["욕창", "상처", "멍이", "피부가 붉", "까졌", "loét", "lở loét", "vết thương", "bầm tím", "bedsore", "pressure sore", "wound", "bruise", "skin redness"],
};

/** 원문+번역문을 함께 검사해 규칙 기반 위험 신호를 반환 */
export function detectRisksByRule(texts: string[]): Risk[] {
  const joined = texts.join("\n").toLowerCase();
  const risks: Risk[] = [];
  for (const [category, keywords] of Object.entries(RULES) as [RiskCategory, string[]][]) {
    for (const kw of keywords) {
      const idx = joined.indexOf(kw.toLowerCase());
      if (idx >= 0) {
        // 근거: 매칭 지점 주변 원문 발췌
        const raw = texts.join("\n");
        const start = Math.max(0, idx - 12);
        const evidence = raw.slice(start, idx + kw.length + 12).trim();
        risks.push({ category, evidence: `…${evidence}…`, source: "rule" });
        break; // 카테고리당 1건
      }
    }
  }
  return risks;
}

/** AI 판별 + 규칙 판별 병합 (카테고리 기준 중복 제거, AI 근거 우선) */
export function mergeRisks(ai: Risk[], rule: Risk[]): Risk[] {
  const seen = new Set(ai.map((r) => r.category));
  return [...ai, ...rule.filter((r) => !seen.has(r.category))];
}
