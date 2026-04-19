import { useGameStore } from "@/store/game";

export default function InventoryPanel({ onClose }: { onClose: () => void }) {
  const {
    inventoryWeapons,
    inventoryArmors,
    inventoryConsumables,
    ownedBloodlines,
    ownedCareers,
    removeWeapon,
    removeArmor,
    removeConsumable,
    removeBloodline,
    removeCareer,
    useConsumable,
  } = useGameStore();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[85vh] overflow-auto rounded-xl border border-neutral-600 bg-neutral-900 p-5 text-neutral-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">背包 / 仓库</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-neutral-700 px-3 py-1 text-sm hover:bg-neutral-600"
          >
            关闭
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title={`武器 (${inventoryWeapons.length})`}>
            {inventoryWeapons.length === 0 && <Empty />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {inventoryWeapons.map((item) => (
                <ItemRow key={item.id} onRemove={() => removeWeapon(item.id)}>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-neutral-400">
                    {item.quality} {item.category} | {item.damageType} | +{item.weaponBonus}
                  </div>
                </ItemRow>
              ))}
            </div>
          </Card>

          <Card title={`护甲 (${inventoryArmors.length})`}>
            {inventoryArmors.length === 0 && <Empty />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {inventoryArmors.map((item) => (
                <ItemRow key={item.id} onRemove={() => removeArmor(item.id)}>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-neutral-400">
                    {item.quality} {item.type} | 闪避{item.dodgeBonus} 格挡{item.blockBonus}
                  </div>
                </ItemRow>
              ))}
            </div>
          </Card>

          <Card title={`消耗品 (${inventoryConsumables.length})`}>
            {inventoryConsumables.length === 0 && <Empty />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {inventoryConsumables.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
                  <div className="text-sm">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-neutral-400">次数: {item.uses} | {item.effect}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { const log = useConsumable(item.id); if (log) alert(log); }}
                      className="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600"
                    >
                      使用
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConsumable(item.id)}
                      className="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-600"
                    >
                      丢弃
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`血统 (${ownedBloodlines.length})`}>
            {ownedBloodlines.length === 0 && <Empty />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {ownedBloodlines.map((item) => (
                <ItemRow key={item.id} onRemove={() => removeBloodline(item.id)}>
                  <div className="font-medium">
                    {item.name} <span className="text-amber-400">({item.rarity})</span>
                  </div>
                  <div className="text-xs text-neutral-400">抗性: {item.resistances.join(", ") || "无"}</div>
                </ItemRow>
              ))}
            </div>
          </Card>

          <Card title={`职业 (${ownedCareers.length})`} mdColSpan={2}>
            {ownedCareers.length === 0 && <Empty />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {ownedCareers.map((item) => (
                <ItemRow key={item.id} onRemove={() => removeCareer(item.id)}>
                  <div className="font-medium">
                    {item.name} <span className="text-emerald-400">({item.tier})</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    技能: {Object.entries(item.skillModifiers).map(([k, v]) => `${k}+${v}`).join(", ")}
                  </div>
                </ItemRow>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, mdColSpan = 1 }: { title: string; children: React.ReactNode; mdColSpan?: 1 | 2 }) {
  return (
    <div className={`rounded-lg border border-neutral-700 bg-neutral-800/60 p-3 ${mdColSpan === 2 ? "md:col-span-2" : ""}`}>
      <div className="mb-2 font-semibold text-neutral-200">{title}</div>
      {children}
    </div>
  );
}

function ItemRow({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
      <div className="text-sm">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-600"
      >
        丢弃
      </button>
    </div>
  );
}

function Empty() {
  return <div className="py-4 text-center text-sm text-neutral-500">空空如也</div>;
}
