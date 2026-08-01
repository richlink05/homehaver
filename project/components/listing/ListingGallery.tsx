"use client";

import { useState } from "react";
import Image from "next/image";

export interface GalleryImage {
  id: string;
  image_url: string;
}

export function ListingGallery({
  images,
  title,
  status,
  address,
}: {
  images: GalleryImage[];
  title: string;
  status: string;
  address: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <>
      <div className="relative flex h-[440px] items-end bg-gradient-to-br from-[#E9E0C6] to-gold">
        {current && (
          <Image src={current.image_url} alt={title} fill priority className="object-cover" />
        )}
        <div className="relative w-full bg-gradient-to-t from-ink/65 to-transparent px-8 py-8 text-white">
          <div className="mx-auto max-w-[1240px]">
            <span className="mb-3.5 inline-block rounded-full bg-gold px-3 py-1.5 text-[11px] font-semibold">
              {status}
            </span>
            <h1 className="mb-2 font-serif text-[34px] font-semibold">{title}</h1>
            <p className="text-sm opacity-90">{address}</p>
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div className="mx-auto flex max-w-[1240px] gap-2 px-8 pt-3.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative h-11 w-16 overflow-hidden rounded-[3px] transition-opacity ${
                i === active ? "opacity-100 outline outline-2 outline-gold" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.image_url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
