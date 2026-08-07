import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingGallery } from "@/components/listing/ListingGallery";
import { ListingInfoRow } from "@/components/listing/ListingInfoRow";
import { ListingTabs } from "@/components/listing/ListingTabs";
import { ManagerContact } from "@/components/listing/ManagerContact";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { KakaoMap } from "@/components/map/KakaoMap";

export const dynamic = "force-dynamic";


export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  (supabase.rpc as any)("process_daily_deductions").then();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerRole: string | null = null;
  if (user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    viewerRole = viewerProfile?.role ?? null;
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "*, listing_images(*), listing_units(*), builders(name, brand_name), regions(sido, sigungu, dong), manager:profiles!listings_agency_id_fkey(name, phone), listing_waitlist(id)"
    )
    .eq("id", params.id)
    .single<Record<string, any>>();

  if (!listing) notFound();

  // ⚠️ rpc() 인자 타입 추론 문제 우회 (insert/update와 동일한 이유)
  await (supabase.rpc as any)("increment_view_count", { listing_id: params.id });

  const address = [listing.regions?.sido, listing.regions?.sigungu, listing.regions?.dong]
    .filter(Boolean)
    .join(" ") || listing.address;

  const areaRange = listing.listing_units?.length
    ? `${Math.min(...listing.listing_units.map((u: any) => u.exclusive_area))}㎡ ~ ${Math.max(
        ...listing.listing_units.map((u: any) => u.exclusive_area)
      )}㎡`
    : listing.area_min && listing.area_max
    ? `${listing.area_min}㎡ ~ ${listing.area_max}㎡`
    : "-";

  // 입주예정은 연/월까지만 등록하므로(일자는 항상 1일로 저장됨) 화면에도 연/월까지만 표시합니다.
  const moveInDateLabel = listing.move_in_date
    ? `${listing.move_in_date.slice(0, 4)}년 ${Number(listing.move_in_date.slice(5, 7))}월`
    : "미정";

  const allImages: { id: string; image_url: string; category: string | null }[] = listing.listing_images ?? [];
  const thumbnailImages = allImages.filter((img) => img.category === "썸네일");
  const planImages = allImages.filter((img) => img.category === "평면도");
  const infraImages = allImages.filter((img) => img.category === "인프라");
  // 상단 갤러리는 썸네일을 우선 보여주고, 썸네일이 없으면 등록된 다른 이미지라도 보여줍니다.
  const galleryImages = thumbnailImages.length > 0 ? thumbnailImages : allImages;

  return (
    <section>
      <ListingGallery
        images={galleryImages}
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
            moveInDate={moveInDateLabel}
            builderName={listing.builders?.name ?? "-"}
          />

          <h5 className="mb-3.5 text-[15px] font-semibold">단지 개요</h5>
          <div className="mb-9 grid grid-cols-2 gap-4">
            <InfoCard label="시공사" value={listing.builders?.name ?? "-"} />
            <InfoCard label="브랜드" value={listing.builders?.brand_name ?? "-"} />
            <InfoCard label="총 세대수" value={listing.unit_count ? `${listing.unit_count}세대` : "-"} />
            <InfoCard label="총 동수" value={listing.building_count ? `${listing.building_count}개동` : "-"} />
            <InfoCard label="최고 층수" value={listing.top_floor ? `${listing.top_floor}층` : "-"} />
          </div>

          <ListingTabs
            tabs={[
              {
                key: "desc",
                label: "상세설명",
                content: <p>{listing.description}</p>,
              },
              {
                key: "plan",
                label: "평면도 · 단지배치도",
                content: <ImageTabGrid images={planImages} emptyText="등록된 평면도 · 단지배치도 이미지가 없습니다." />,
              },
              {
                key: "life",
                label: "교통 · 학군 · 인프라",
                content: <ImageTabGrid images={infraImages} emptyText="등록된 교통 · 학군 · 인프라 이미지가 없습니다." />,
              },
              {
                key: "map",
                label: "지도",
                content: <KakaoMap lat={listing.lat} lng={listing.lng} title={listing.title} />,
              },
            ]}
          />

          <ManagerContact
            listingId={listing.id}
            managerName={listing.manager?.name ?? null}
            managerPhone={listing.manager?.phone ?? null}
            hasManager={!!listing.agency_id}
            isAgencyViewer={viewerRole === "agency"}
          />
        </div>

        <div id="consult">
          <ConsultForm listingId={listing.id} listingTitle={listing.title} />
        </div>
      </div>
    </section>
  );
}

function ImageTabGrid({
  images,
  emptyText,
}: {
  images: { id: string; image_url: string }[];
  emptyText: string;
}) {
  if (images.length === 0) {
    return <p className="text-[13.5px] text-stone">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((img) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={img.id} src={img.image_url} alt="" className="w-full rounded-md border border-line object-cover" />
      ))}
    </div>
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
