import Link from "next/link";

export default function Home() {
  return (
    <div className="pt-14">
      <h1 className="text-[28px] font-extrabold leading-snug tracking-tight">
        돌봄 기록,
        <br />
        말하듯 쉽게
      </h1>

      <div className="mt-10 space-y-3">
        <Link
          href="/caregiver"
          className="flex items-center justify-between rounded-3xl bg-white p-6 transition active:scale-[0.98]"
        >
          <div>
            <p className="text-[13px] font-semibold text-blue">
              Người chăm sóc · Caregiver
            </p>
            <p className="mt-1 text-xl font-bold">요양보호사</p>
            <p className="mt-1 text-[14px] text-sub">모국어로 기록 남기기</p>
          </div>
          <span className="text-2xl text-faint">›</span>
        </Link>

        <Link
          href="/staff"
          className="flex items-center justify-between rounded-3xl bg-white p-6 transition active:scale-[0.98]"
        >
          <div>
            <p className="text-[13px] font-semibold text-blue">Care Manager</p>
            <p className="mt-1 text-xl font-bold">담당자</p>
            <p className="mt-1 text-[14px] text-sub">기록 검토하고 확정하기</p>
          </div>
          <span className="text-2xl text-faint">›</span>
        </Link>
      </div>
    </div>
  );
}
