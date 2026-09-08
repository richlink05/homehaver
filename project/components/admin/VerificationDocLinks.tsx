"use client";

import { useState } from "react";

async function openDoc(path: string, setLoading: (v: boolean) => void) {
  setLoading(true);
  try {
    const res = await fetch("/api/verification-doc-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      alert(json.error ?? "서류를 불러오지 못했습니다.");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  } finally {
    setLoading(false);
  }
}

export function VerificationDocLinks({
  workAgreementPath,
  businessCardPath,
}: {
  workAgreementPath: string | null;
  businessCardPath: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!workAgreementPath && !businessCardPath) {
    return <span className="text-[11.5px] text-stone">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {workAgreementPath && (
        <button
          onClick={() => {
            setLoading("work");
            openDoc(workAgreementPath, () => setLoading(null));
          }}
          disabled={loading === "work"}
          className="text-left text-[11.5px] font-semibold text-gold-deep underline decoration-gold-soft underline-offset-2 hover:text-ink disabled:opacity-50"
        >
          {loading === "work" ? "불러오는 중..." : "근무이행각서 보기"}
        </button>
      )}
      {businessCardPath && (
        <button
          onClick={() => {
            setLoading("card");
            openDoc(businessCardPath, () => setLoading(null));
          }}
          disabled={loading === "card"}
          className="text-left text-[11.5px] font-semibold text-gold-deep underline decoration-gold-soft underline-offset-2 hover:text-ink disabled:opacity-50"
        >
          {loading === "card" ? "불러오는 중..." : "명함 보기"}
        </button>
      )}
    </div>
  );
}
