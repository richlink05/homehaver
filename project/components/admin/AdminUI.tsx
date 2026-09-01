export function AdminPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-7">
      <h1 className="mb-1.5 font-serif text-[22px] font-semibold">{title}</h1>
      {description && <p className="text-[13px] text-stone">{description}</p>}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  대기: "bg-mist text-gray-600",
  응답완료: "bg-gold/15 text-gold-deep",
  분양예정: "bg-mist text-gray-600",
  분양중: "bg-gold text-white",
  마감: "bg-gray-200 text-gray-500",
  user: "bg-mist text-gray-600",
  agency: "bg-gold/15 text-gold-deep",
  admin: "bg-ink text-white",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${BADGE_STYLES[value] ?? "bg-mist text-gray-600"}`}>
      {label ?? value}
    </span>
  );
}
