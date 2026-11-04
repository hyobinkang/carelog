// AI 파이프라인: 번역·정제 → 항목 구조화 → 위험 신호 판별
// 공급자 자동 감지: ANTHROPIC_API_KEY → Claude, OPENAI_API_KEY → OpenAI, 둘 다 없으면 모의(Mock) 모드
import {
  AiDraft,
  FIELD_KEYS,
  FIELD_LABELS,
  FieldKey,
  Lang,
  LANG_LABELS,
  Risk,
  RISK_CATEGORIES,
  RiskCategory,
} from "./types";
import { detectRisksByRule, mergeRisks } from "./risk";

const SYSTEM_PROMPT = `당신은 요양 시설의 돌봄 기록 작성을 돕는 전문 보조원입니다.
외국인 요양보호사가 모국어(베트남어·영어) 또는 서툰·축약 한국어로 작성한 관찰 메모를 받아
한국 장기요양 현장에서 쓰는 표준 돌봄 기록 초안으로 변환합니다.

규칙:
1. 번역은 간결한 한국어 기록체로 쓴다. (예: "~하였음", "~호소함") 원문에 없는 사실을 지어내지 않는다.
   실제 현장 기록 문체를 따른다. (예: "식사는 일반식으로 1공기 드심", "배변은 1일 1회 보심",
   "수면장애가 있어 낮에 1시간 정도 주무심", "허리 통증 호소하여 파스 부착함")
   식사량·배변 횟수·수면 상태는 원문에 있는 만큼 구체적으로 남긴다.
1-1. 어르신의 환각·망상 발언(예: "밤에 누가 서 있었다", "손님이 왔다 갔다")은 사실 판단 없이
   "~라고 말씀하심" 형태로 그대로 기록하고, 위험 신호 '환각·망상'으로 표시한다.
2. 항목 구조화: 원문에 해당 내용이 있는 항목만 채우고, 없는 항목은 생략한다.
2-1. 원문에서 확인되지 않은 사실(섭취량·시점·복약 여부 등)은 추정해 채우지 말고,
   followUp('다음 확인') 항목에 "~ 확인 필요" 형태로 짧게 남긴다.
   (예: "점심을 조금 드셨다" → 섭취량·시점 미상이면 followUp에 "식사량·시점 확인 필요")
3. 위험 신호: 주어진 카테고리 목록에서만 고르고, 근거 문구(evidence)는 번역문에서 그대로 인용한다.
   애매하면 포함한다(누락보다 과잉 표시가 안전).
4. 역번역 확인(backTranslation): 완성한 한국어 기록을 입력 언어로 다시 번역해,
   작성자가 자기 모국어로 내용이 맞는지 검증할 수 있게 한다. 입력 언어가 한국어면 빈 문자열.
5. 반드시 아래 JSON 형식으로만 응답한다. JSON 외 다른 텍스트를 쓰지 않는다.`;

function buildUserPrompt(text: string, lang: Lang): string {
  return `[입력 언어] ${LANG_LABELS[lang]}
[관찰 메모 원문]
${text}

[항목 키와 한국어 이름]
${FIELD_KEYS.map((k) => `${k}: ${FIELD_LABELS[k]}`).join(", ")}

[위험 신호 카테고리]
${RISK_CATEGORIES.join(", ")}

다음 JSON으로 응답:
{
  "translationKo": "한국어 기록체 번역·정제문",
  "backTranslation": "한국어 기록을 입력 언어로 되번역한 문장 (입력이 한국어면 \"\")",
  "fields": { "항목키": "해당 내용 요약", ... },
  "risks": [ { "category": "카테고리", "evidence": "근거 문구" }, ... ]
}`;
}

interface RawAiJson {
  translationKo?: string;
  backTranslation?: string;
  fields?: Record<string, string>;
  risks?: { category?: string; evidence?: string }[];
}

function parseAiJson(raw: string): RawAiJson {
  // 코드펜스 제거 후 첫 { ~ 마지막 } 추출
  const stripped = raw.replace(/```(json)?/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI 응답에서 JSON을 찾지 못했습니다");
  return JSON.parse(stripped.slice(start, end + 1));
}

function sanitize(raw: RawAiJson, originalText: string, lang: Lang): Omit<AiDraft, "aiMode"> {
  const translationKo =
    typeof raw.translationKo === "string" && raw.translationKo.trim()
      ? raw.translationKo.trim()
      : originalText;

  const backTranslation =
    lang !== "ko" && typeof raw.backTranslation === "string" && raw.backTranslation.trim()
      ? raw.backTranslation.trim()
      : undefined;

  const fields: Partial<Record<FieldKey, string>> = {};
  if (raw.fields && typeof raw.fields === "object") {
    for (const k of FIELD_KEYS) {
      const v = raw.fields[k];
      if (typeof v === "string" && v.trim()) fields[k] = v.trim();
    }
  }

  const aiRisks: Risk[] = [];
  if (Array.isArray(raw.risks)) {
    for (const r of raw.risks) {
      if (r && (RISK_CATEGORIES as readonly string[]).includes(r.category ?? "")) {
        aiRisks.push({
          category: r.category as RiskCategory,
          evidence: (r.evidence ?? "").slice(0, 120),
          source: "ai",
        });
      }
    }
  }

  const ruleRisks = detectRisksByRule([originalText, translationKo]);
  return { translationKo, backTranslation, fields, risks: mergeRisks(aiRisks, ruleRisks) };
}

// ── 공급자별 호출 ────────────────────────────────────────────────
async function callAnthropic(text: string, lang: Lang): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(text, lang) }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

async function callOpenAI(text: string, lang: Lang): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(text, lang) },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

// ── 모의 모드: 키 없이도 전체 흐름 시연 가능 ─────────────────────
function mockDraft(text: string, lang: Lang): Omit<AiDraft, "aiMode"> {
  const canned: Record<string, Omit<AiDraft, "aiMode">> = {
    "bà ăn": {
      translationKo:
        "대상자는 죽 반 그릇을 섭취하였음. 오후에 무릎 통증을 호소함.",
      backTranslation:
        "Người được chăm sóc đã ăn nửa bát cháo. Buổi chiều kêu đau đầu gối.",
      fields: {
        meal: "죽 1/2 그릇 섭취",
        physical: "오후 무릎 통증 호소",
      },
      risks: [
        { category: "통증", evidence: "무릎 통증을 호소함", source: "ai" },
      ],
    },
  };
  // 준비된 응답은 "정확히 예시 문장"일 때만 사용 — 칩 등 추가 입력이 있으면
  // 전체 텍스트를 그대로 보여주는 일반 경로로 넘어간다 (내용 누락 방지)
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  const SAMPLE_VI = "bà ăn được nửa bát cháo, buổi chiều kêu đau đầu gối.";
  const key = normalized === SAMPLE_VI ? "bà ăn" : undefined;
  if (key) {
    const base = canned[key];
    const ruleRisks = detectRisksByRule([text, base.translationKo]);
    return { ...base, risks: mergeRisks(base.risks, ruleRisks) };
  }
  const translationKo =
    lang === "ko" ? text : `[모의 번역] ${text}`;
  const ruleRisks = detectRisksByRule([text, translationKo]);
  return {
    translationKo,
    backTranslation: lang === "ko" ? undefined : text,
    fields: {},
    risks: ruleRisks,
  };
}

// ── 반려 사유 번역: 담당자의 한국어 메모 → 작성자 언어 ───────────
// 외국인 요양보호사가 반려 사유를 모국어로 이해할 수 있게 한다.
// 번역 실패·모의 모드에서도 한국어 원문은 항상 함께 전달되므로 안전하게 격하된다.
export async function translateNote(
  note: string,
  target: Lang,
): Promise<string | undefined> {
  if (target === "ko" || !note.trim()) return undefined;
  const provider = process.env.ANTHROPIC_API_KEY
    ? "anthropic"
    : process.env.OPENAI_API_KEY
      ? "openai"
      : "mock";
  if (provider === "mock") return `[모의 번역] ${note}`;

  const prompt = `다음은 요양 시설 담당자가 요양보호사에게 보낸 짧은 보완 요청 메모입니다.
${LANG_LABELS[target]}(으)로 자연스럽고 정중하게 번역해 주세요. 번역문만 출력하세요.

${note}`;
  try {
    if (provider === "anthropic") {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });
      const block = res.content.find((b) => b.type === "text");
      const text = block && block.type === "text" ? block.text.trim() : "";
      return text || undefined;
    }
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0]?.message?.content?.trim() || undefined;
  } catch (err) {
    console.error("[ai] 반려 사유 번역 실패, 한국어 원문만 전달:", err);
    return undefined;
  }
}

// ── 공개 진입점 ──────────────────────────────────────────────────
export async function generateDraft(text: string, lang: Lang): Promise<AiDraft> {
  const provider = process.env.ANTHROPIC_API_KEY
    ? "anthropic"
    : process.env.OPENAI_API_KEY
      ? "openai"
      : "mock";

  if (provider === "mock") {
    return { ...mockDraft(text, lang), aiMode: "mock" };
  }
  try {
    const raw =
      provider === "anthropic"
        ? await callAnthropic(text, lang)
        : await callOpenAI(text, lang);
    return { ...sanitize(parseAiJson(raw), text, lang), aiMode: "live" };
  } catch (err) {
    // LLM 실패 시 원문 보존 + 규칙 위험 판별로 격하 (계획서 9.3 예외 시험 대응)
    console.error("[ai] LLM 호출 실패, 규칙 기반으로 격하:", err);
    return { ...mockDraft(text, lang), aiMode: "mock" };
  }
}
