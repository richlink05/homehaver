import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingStatusActions } from "@/components/listing/ListingStatusActions";
import { ExposureActionButton } from "@/components/exposure/ExposureActionButton";
import { MypageShell } from "@/components/mypage/MypageShell";
import { formatKst, formatRemaining } from "@/lib/exposure";

export const dynamic = "force-dynamic";

// 종료 며칠 전부터 "연장하세요" 안내를 띄울지
const EXTEND_NOTICE_HOURS = 48;

export default async function ManagingListingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single<{ name: string | null; role: "user" | "agency" | "admin" }>();

  type ManagingRow = {
    id: string;
    title: string;
    status: string;
    tenure_start: string | null;
    exposure_ends_at: string | null;
  };

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, tenure_start, exposure_ends_at")
    .eq("agency_id", user.id)
    .order("tenure_start", { ascending: false })
    .returns<ManagingRow[]>();

  // 결제 대기중인 연장 건이 있는지 (있으면 중복으로 연장 신청하지 않도록 안내)
  const { data: pendingOrders } = await supabase
    .from("exposure_orders")
    .select("listing_id, pay_deadline")
    .eq("user_id", user.id)
    .eq("status", "결제대기")
    .returns<{ listing_id: string; pay_deadline: string | null }[]>();
  const pendingByListing = new Map((pendingOrders ?? []).map((o) => [o.listing_id, o]));

  const now = Date.now();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/listings/managing">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">내가 담당중인 현장</h1>
        <p className="text-[13.5px] text-stone">
          결제한 기간 동안 노출중인 현장입니다. 노출은 매일 오전 6시에 시작·종료되며, 한 번에 하나의 현장만 담당할 수
          있습니다.
        </p>
      </div>

      <div className="space-y-4">
        {(listings ?? []).map((l) => {
          const endsMs = l.exposure_ends_at ? new Date(l.exposure_ends_at).getTime() : null;
          const hoursLeft = endsMs ? (endsMs - now) / 3600000 : null;
          const pending = pendingByListing.get(l.id);
          const soon = hoursLeft !== null && hoursLeft <= EXTEND_NOTICE_HOURS;
          return (
            <div key={l.id} className="rounded-lg border border-line bg-white p-5">
              {soon && !pending && (
                <p className="mb-3.5 rounded bg-gold/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-gold-deep">
                  노출 종료까지 {formatRemaining(l.exposure_ends_at, now)} 남았습니다. 연장하지 않으면{" "}
                  {formatKst(l.exposure_ends_at)}에 종료되고 다음 순번 담당자에게 넘어갑니다.
                </p>
              )}
              {pending && (
                <p className="mb-3.5 rounded bg-mist px-3.5 py-2.5 text-[12.5px] text-gray-600">
                  연장 결제 대기중입니다. {formatKst(pending.pay_deadline)}까지{" "}
                  <Link href="/mypage/payments" className="font-semibold text-gold-deep underline">
                    결제내역
                  </Link>
                  에서 확인해주세요.
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/listing/${l.id}`}
                    target="_blank"
                    className="text-[15px] font-semibold hover:text-gold-deep"
                  >
                    {l.title}
                  </Link>
                  <p className="mt-1 text-[12.5px] text-stone">
                    분양상태 {l.status} · 노출 시작 {formatKst(l.tenure_start)}
                  </p>
                  <p className="mt-0.5 text-[13px]">
                    노출 종료 <b>{formatKst(l.exposure_ends_at)}</b>{" "}
                    <span className="text-gold-deep">({formatRemaining(l.exposure_ends_at, now)} 남음)</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/listings/${l.id}/edit`}
                    className="rounded border border-line px-3.5 py-1.5 text-xs text-gray-600 transition-colors hover:border-gold-deep hover:text-gold-deep"
                  >
                    수정
                  </Link>
                  {!pending && <ExposureActionButton listingId={l.id} mode="extend" />}
                  <ListingStatusActions listingId={l.id} action="stop_managing" />
                </div>
              </div>
            </div>
          );
        })}
        {(listings ?? []).length === 0 && (
          <div className="rounded-lg border border-line bg-white px-5 py-16 text-center text-stone">
            현재 담당하고 있는 현장이 없습니다.
          </div>
        )}
      </div>
    </MypageShell>
  );
}
