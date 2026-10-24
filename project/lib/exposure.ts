// 기간제 노출 결제에서 쓰는 공통 값입니다.
// ⚠️ 하루 요금은 DB 함수 exposure_daily_price()(supabase/schema.sql)와 항상 같아야 합니다.
//    실제 결제 금액은 DB가 계산하며, 여기 값은 화면 표시용입니다.
export const EXPOSURE_DAILY_PRICE = 20000;
export const EXPOSURE_DAY_OPTIONS = [1, 3, 7, 10] as const;
export type ExposureDays = (typeof EXPOSURE_DAY_OPTIONS)[number];

export function exposurePrice(days: number) {
  return days * EXPOSURE_DAILY_PRICE;
}

export function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

// 노출 시각을 "10/25(일) 오전 6시" 형태(한국 시간)로 보여줍니다.
export function formatKst(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    hour12: true,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")}/${get("day")}(${get("weekday")}) ${get("dayPeriod")} ${get("hour")}시`;
}

// 남은 시간을 "2일 5시간" / "5시간" / "30분" 형태로 보여줍니다.
export function formatRemaining(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "-";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "종료";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간`;
  return `${Math.max(1, mins)}분`;
}
