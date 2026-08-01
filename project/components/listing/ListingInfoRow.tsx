export function ListingInfoRow({
  area,
  priceMin,
  priceMax,
  moveInDate,
  builderName,
}: {
  area: string;
  priceMin: number;
  priceMax: number;
  moveInDate: string;
  builderName: string;
}) {
  const items = [
    { label: "공급면적", value: area },
    { label: "분양가", value: `${(priceMin / 100000000).toFixed(1)}억 ~ ${(priceMax / 100000000).toFixed(1)}억`, gold: true },
    { label: "입주예정", value: moveInDate },
    { label: "시공사", value: builderName },
  ];

  return (
    <div className="mb-8 grid grid-cols-4 gap-5 border-b border-line py-6 max-[860px]:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <p className="mb-1.5 text-xs text-stone">{item.label}</p>
          <p className={`text-[15px] font-semibold ${item.gold ? "text-gold-deep" : ""}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
