import Link from "next/link";
import Image from "next/image";

export interface Listing {
  id: string;
  title: string;
  address: string;
  price_min: number;
  price_max: number;
  status: "분양예정" | "분양중" | "마감";
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
}

function formatPrice(v: number) {
  const eok = v / 100000000;
  return `${eok.toFixed(1)}억`;
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-md border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_18px_40px_rgba(17,17,17,0.10)]"
    >
      <div className="relative h-[180px] overflow-hidden bg-gradient-to-br from-[#EDE7D8] to-[#D9CBA3]">
        <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-white">
          {listing.status}
        </span>
        {listing.thumbnail_url && (
          <Image
            src={listing.thumbnail_url}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <p className="mb-1.5 text-xs text-stone">{listing.address}</p>
        <h3 className="mb-2 text-[15px] font-semibold leading-snug">{listing.title}</h3>
        <p className="mb-2.5 text-[15px] font-bold text-gold-deep">
          {formatPrice(listing.price_min)} ~ {formatPrice(listing.price_max)}
        </p>
        <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs text-stone">
          <div className="flex gap-2.5">
            <span>조회 {listing.view_count.toLocaleString()}</span>
            <span>관심 {listing.like_count.toLocaleString()}</span>
          </div>
          <span className="rounded-full border border-ink px-2.5 py-1 text-ink transition-colors group-hover:bg-ink group-hover:text-white">
            문의
          </span>
        </div>
      </div>
    </Link>
  );
}
