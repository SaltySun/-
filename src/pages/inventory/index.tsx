import { useGameStore } from "@/store/game";

import { Link } from "react-router/dom";

export default function InventoryPage() {
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
  } = useGameStore();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">背包 / 仓库</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={`武器 (${inventoryWeapons.length})`}>
          {inventoryWeapons.length === 0 && <Empty />}
          <div className="space-y-2 max-h-64 overflow-auto">
            {inventoryWeapons.map((item) => (
              <ItemRow key={item.id} onRemove={() => removeWeapon(item.id)}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-neutral-400">{item.quality} {item.category} | {item.damageType} | +{item.weaponBonus}</div>
              </ItemRow>
            ))}
          </div>
        </Card>

        <Card title={`护甲 (${inventoryArmors.length})`}>
          {inventoryArmors.length === 0 && <Empty />}
          <div className="space-y-2 max-h-64 overflow-auto">
            {inventoryArmors.map((item) => (
              <ItemRow key={item.id} onRemove={() => removeArmor(item.id)}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-neutral-400">{item.quality} {item.type} | 闪避{item.dodgeBonus} 格挡{item.blockBonus}</div>
              </ItemRow>
            ))}
          </div>
        </Card>

        <Card title={`消耗品 (${inventoryConsumables.length})`}>
          {inventoryConsumables.length === 0 && <Empty />}
          <div className="space-y-2 max-h-64 overflow-auto">
            {inventoryConsumables.map((item) => (
              <ItemRow key={item.id} onRemove={() => removeConsumable(item.id)}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-neutral-400">次数: {item.uses} | {item.effect}</div>
              </ItemRow>
            ))}
          </div>
        </Card>

        <Card title={`血统 (${ownedBloodlines.length})`}>
          {ownedBloodlines.length === 0 && <Empty />}
          <div className="space-y-2 max-h-64 overflow-auto">
            {ownedBloodlines.map((item) => (
              <ItemRow key={item.id} onRemove={() => removeBloodline(item.id)}>
                <div className="font-medium">{item.name} <span className="text-amber-400">({item.rarity})</span></div>
                <div className="text-xs text-neutral-400">抗性: {item.resistances.join(", ") || "无"}</div>
              </ItemRow>
            ))}
          </div>
        </Card>

        <Card title={`职业 (${ownedCareers.length})`} mdColSpan={2}>
          {ownedCareers.length === 0 && <Empty />}
          <div className="space-y-2 max-h-64 overflow-auto">
            {ownedCareers.map((item) => (
              <ItemRow key={item.id} onRemove={() => removeCareer(item.id)}>
                <div className="font-medium">{item.name} <span className="text-emerald-400">({item.tier})</span></div>
                <div className="text-xs text-neutral-400">
                  技能: {Object.entries(item.skillModifiers).map(([k, v]) => `${k}+${v}`).join(", ")}
                </div>
              </ItemRow>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <NavLink to="/game">返回模拟器</NavLink>
        <NavLink to="/equipment">前往装备页</NavLink>
      </div>
    </div>
  );
}

function Card({ title, children, mdColSpan = 1 }: { title: string; children: React.ReactNode; mdColSpan?: 1 | 2 }) {
  return (
    <div className={`bg-neutral-800/60 border border-neutral-700 rounded-lg p-4 ${mdColSpan === 2 ? "md:col-span-2" : ""}`}>
      <div className="text-lg font-semibold mb-3 text-neutral-200">{title}</div>
      {children}
    </div>
  );
}

function ItemRow({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="flex justify-between items-center bg-neutral-800 p-2 rounded border border-neutral-700/50">
      <div className="text-sm">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
      >
        丢弃
      </button>
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-neutral-500 py-4 text-center">空空如也</div>;
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
      {children}
    </Link>
  );
}
