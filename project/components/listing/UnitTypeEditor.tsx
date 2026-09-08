"use client";

export interface UnitTypeRow {
  unitType: string;
  exclusiveArea: string;
  roomCount: string;
}

export function UnitTypeEditor({
  units,
  onChange,
}: {
  units: UnitTypeRow[];
  onChange: (units: UnitTypeRow[]) => void;
}) {
  const addRow = () => {
    onChange([...units, { unitType: "", exclusiveArea: "", roomCount: "" }]);
  };

  const removeRow = (index: number) => {
    onChange(units.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof UnitTypeRow, value: string) => {
    onChange(units.map((u, i) => (i === index ? { ...u, [field]: value } : u)));
  };

  return (
    <div>
      <div className="mb-2.5 grid grid-cols-[1fr_1fr_1fr_32px] gap-2.5 text-[12px] text-gray-500">
        <span>타입명</span>
        <span>전용면적 (㎡)</span>
        <span>방개수</span>
        <span />
      </div>

      {units.length === 0 && (
        <p className="mb-3 text-[12.5px] text-stone">
          예: "84A" / 84.98㎡ / 방 3개처럼, 타입별로 추가해주세요. 없어도 등록 가능합니다.
        </p>
      )}

      {units.map((unit, i) => (
        <div key={i} className="mb-2.5 grid grid-cols-[1fr_1fr_1fr_32px] gap-2.5">
          <input
            value={unit.unitType}
            onChange={(e) => updateRow(i, "unitType", e.target.value)}
            placeholder="예: 84A"
            className="input"
          />
          <input
            value={unit.exclusiveArea}
            onChange={(e) => updateRow(i, "exclusiveArea", e.target.value)}
            type="number"
            step="0.01"
            placeholder="84.98"
            className="input"
          />
          <select value={unit.roomCount} onChange={(e) => updateRow(i, "roomCount", e.target.value)} className="input">
            <option value="">선택</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}개
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="flex h-9 w-8 items-center justify-center rounded border border-line text-gray-400 hover:border-red-300 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 rounded border border-line px-4 py-2 text-[12.5px] text-gray-600 hover:border-gold-deep hover:text-gold-deep"
      >
        + 타입 추가
      </button>
    </div>
  );
}
