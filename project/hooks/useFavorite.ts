"use client";

import { useState } from "react";

export function useFavorite(listingId: string, initialFavorited = false) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const { data } = await res.json();
      if (data) setFavorited(data.favorited);
    } finally {
      setLoading(false);
    }
  };

  return { favorited, loading, toggle };
}
