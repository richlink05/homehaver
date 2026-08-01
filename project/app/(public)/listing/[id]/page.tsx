import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingGallery } from "@/components/listing/ListingGallery";
import { ListingInfoRow } from "@/components/listing/ListingInfoRow";
import { ListingTabs } from "@/components/listing/ListingTabs";
import { ManagerContact } from "@/components/listing/ManagerContact";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { KakaoMap } from "@/components/map/KakaoMap";

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "*, listing_images(*), listing_units(*), builders(name, brand_name), regions(sido, sigungu, dong)"
    )
    .eq("id", params.id)
    .single();

  if (!listing) notFound();

  await supabase.rpc("increment_view_count", { listing_id: params.id });

  const address = [listing.regions?.sido, listing.regions?.sigungu, listing.regions?.dong]
    .filter(Boolean)
    .join(" ") || listing.address;

  const areaRange = listing.listing_units?.length
    ? `${Math.min(...listing.listing_units.map((u: any) => u.exclusive_area))}㎡ ~ ${Math.max(
        ...listing.listing_units.map((u: any) => u.exclusive_area)
      )}㎡`
    : "-";

  return (
    <section>
      <ListingGallery
        images={listing.listing_images ?? []}
        title={listing.title}
        status={listing.status}
        address={address}
      />

      <div className="mx-auto grid max-w-[1240px] grid-cols-[1fr_340px] gap-14 px-8 py-12 max-[860px]:grid-cols-1">
        <div>
          <ListingInfoRow
            area={areaRange}
            priceMin={listing.price_min}
            priceMax={listing.price_max}
            moveInDate={listing.move_in_date ?? "미정"}
            builderName={listing.builders?.name ?? "-"}
          />

          <ListingTabs
            tabs={[
              {
                key: "desc",
                label: "상세설명",
                content: (
                  <>
                    <p>{listing.description}</p>
                    <h5 className="mb-2 mt-5 text-[15px] font-semibold">단지 개요</h5>
                    <div className="mt-3.5 grid grid-cols-2 gap-4">
                      <InfoCard label="시공사" value={listing.builders?.name ?? "-"} />
                      <InfoCard label="브랜드" value={listing.builders?.brand_name ?? "-"} />
                    </div>
                  </>
                ),
              },
              {
                key: "plan",
                label: "평면도 · 단지배치도",
                content: (
                  <div className="grid grid-cols-2 gap-4">
                    {(listing.listing_units ?? []).map((unit: any) => (
                      <InfoCard
                        key={unit.id}
                        label={`${unit.unit_type} 타입`}
                        value={`전용 ${unit.exclusive_area}㎡`}
                      />
                    ))}
                  </div>
                ),
              },
              {
                key: "life",
                label: "교통 · 학군 · 인프라",
                content: <p>교통, 학군, 생활 인프라 정보가 이곳에 표시됩니다.</p>,
              },
              {
                key: "map",
                label: "지도",
                content: <KakaoMap lat={listing.lat} lng={listing.lng} title={listing.title} />,
              },
            ]}
          />

          <ManagerContact managerName={listing.manager_name} managerPhone={listing.manager_phone} />
        </div>

        <div id="consult">
          <ConsultForm listingId={listing.id} listingTitle={listing.title} />
        </div>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist p-4.5">
      <p className="mb-1 text-xs text-stone">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
