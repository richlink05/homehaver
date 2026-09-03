import { ListingCard, type Listing } from "./ListingCard";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-24 text-center">
        <p className="mb-1 text-[15px] font-semibold">검색 결과가 없습니다</p>
        <p className="text-[13px] text-stone">다른 지역명이나 분양명으로 다시 검색해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-2 max-[520px]:grid-cols-1">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
