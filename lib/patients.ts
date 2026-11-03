// 시연용 가상 대상자 — 실제 인물·기관과 무관한 합성 데이터입니다.
export interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  sex: "여" | "남";
  note: string;
  /** 소속 기관 (lib/facilities.ts 의 name 과 일치) */
  facility: string;
}

export const PATIENTS: Patient[] = [
  { id: "p1", name: "김옥분", room: "201호", age: 85, sex: "여", note: "고혈압, 보행 시 지팡이 사용", facility: "하나요양원" },
  { id: "p2", name: "박만수", room: "203호", age: 79, sex: "남", note: "당뇨, 아침 식전 혈당 측정", facility: "하나요양원" },
  { id: "p3", name: "이순정", room: "305호", age: 88, sex: "여", note: "경도 인지저하, 좌측 무릎 관절염", facility: "하나요양원" },
  { id: "p4", name: "최영길", room: "방문 1", age: 82, sex: "남", note: "뇌졸중 후 우측 편마비, 주 3회 방문", facility: "행복재가복지센터" },
  { id: "p5", name: "정분례", room: "방문 2", age: 90, sex: "여", note: "청력 저하, 보청기 사용", facility: "행복재가복지센터" },
  { id: "p6", name: "한복순", room: "102호", age: 86, sex: "여", note: "골다공증, 낙상 주의", facility: "푸른솔요양원" },
  { id: "p7", name: "오병철", room: "104호", age: 81, sex: "남", note: "파킨슨 초기, 연하 곤란 주의", facility: "푸른솔요양원" },
  { id: "p8", name: "서말자", room: "202호", age: 87, sex: "여", note: "중등도 치매, 야간 배회 이력", facility: "은빛사랑요양원" },
  { id: "p9", name: "임점동", room: "301호", age: 84, sex: "남", note: "만성 폐질환, 산소포화도 관찰", facility: "해든노인복지센터" },
  { id: "p10", name: "이복례", room: "실습 1", age: 83, sex: "여", note: "교육 실습용 합성 사례 — 경도 인지저하", facility: "한빛요양보호사교육원" },
  { id: "p11", name: "강판석", room: "실습 2", age: 80, sex: "남", note: "교육 실습용 합성 사례 — 당뇨·고혈압", facility: "한빛요양보호사교육원" },
];

export function getPatient(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id);
}

/** 해당 기관에 등록된 어르신 명부 */
export function patientsOf(facility: string | null | undefined): Patient[] {
  if (!facility) return [];
  return PATIENTS.filter((p) => p.facility === facility);
}
