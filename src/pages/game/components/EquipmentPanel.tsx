import { useGameStore } from "@/store/game";

export default function EquipmentPanel({ onClose }: { onClose: () => void }) {
  const {
    player,
    inventoryWeapons,
    inventoryArmors,
    ownedBloodlines,
    ownedCareers,
    equipWeapon,
    equipArmor,
    equipBloodline,
    equipCareer,
    unequipWeapon,
    unequipArmor,
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
          <h2 className="text-xl font-bold">装备 / 能力</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-neutral-700 px-3 py-1 text-sm hover:bg-neutral-600"
          >
            关闭
          </button>
        </div>

        {!player && (
          <div className="py-8 text-center text-neutral-400">尚未创建角色，请先创建角色</div>
        )}

        {player && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <Card title="当前角色">
                <div className="text-lg font-semibold text-emerald-400">{player.name}</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>HP: {player.hp}/{player.maxHp} | EP: {player.ep}/{player.maxEp}</div>
                  <div>力量{player.attributes.力量} 敏捷{player.attributes.敏捷} 智力{player.attributes.智力} 意志{player.attributes.意志}</div>
                  <div>闪避{player.dodge} | 格挡{player.block} | 攻击+{player.attackBonus}</div>
                </div>
              </Card>

              <Card title="已装备">
                <div className="space-y-3 text-sm">
                  <EquipSlot label="武器" name={player.weapon?.name} onUnequip={unequipWeapon} />
                  <EquipSlot label="护甲" name={player.armor?.name} onUnequip={unequipArmor} />
                  <div className="rounded border border-neutral-700/50 bg-neutral-800 p-2">
                    <div className="text-xs text-neutral-400">血统</div>
                    <div className="font-medium">{player.bloodline?.name ?? "无"}</div>
                  </div>
                  <div className="rounded border border-neutral-700/50 bg-neutral-800 p-2">
                    <div className="text-xs text-neutral-400">职业</div>
                    <div className="font-medium">
                      {player.career?.name || "无"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card title={`武器库 (${inventoryWeapons.length})`}>
                {inventoryWeapons.length === 0 && <Empty text="背包中没有武器" />}
                <div className="space-y-2 max-h-56 overflow-auto">
                  {inventoryWeapons.map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
                      <div className="text-sm">
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-neutral-400">{w.quality} {w.category} | {w.damageType} | +{w.weaponBonus}</div>
                      </div>
                      <button type="button" onClick={() => equipWeapon(w)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500">装备</button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title={`护甲库 (${inventoryArmors.length})`}>
                {inventoryArmors.length === 0 && <Empty text="背包中没有护甲" />}
                <div className="space-y-2 max-h-56 overflow-auto">
                  {inventoryArmors.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
                      <div className="text-sm">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-neutral-400">{a.quality} {a.type} | 闪避{a.dodgeBonus} 格挡{a.blockBonus}</div>
                      </div>
                      <button type="button" onClick={() => equipArmor(a)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500">装备</button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title={`血统库 (${ownedBloodlines.length})`}>
                {ownedBloodlines.length === 0 && <Empty text="尚未拥有血统" />}
                <div className="space-y-2 max-h-56 overflow-auto">
                  {ownedBloodlines.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
                      <div className="text-sm">
                        <div className="font-medium">{b.name} <span className="text-amber-400">({b.rarity})</span></div>
                        <div className="text-xs text-neutral-400">抗性: {b.resistances.join(", ") || "无"}</div>
                      </div>
                      <button type="button" onClick={() => equipBloodline(b)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500">融合</button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title={`职业库 (${ownedCareers.length})`}>
                {ownedCareers.length === 0 && <Empty text="尚未拥有职业" />}
                <div className="space-y-2 max-h-56 overflow-auto">
                  {ownedCareers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded border border-neutral-700/50 bg-neutral-800 p-2">
                      <div className="text-sm">
                        <div className="font-medium">{c.name} <span className="text-emerald-400">({c.tier})</span></div>
                        <div className="text-xs text-neutral-400">
                          技能: {Object.entries(c.skillModifiers).map(([k, v]) => `${k}+${v}`).join(", ")}
                        </div>
                      </div>
                      <button type="button" onClick={() => equipCareer(c)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500">就职</button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EquipSlot({ label, name, onUnequip }: { label: string; name?: string; onUnequip: () => void }) {
  return (
    <div className="rounded border border-neutral-700/50 bg-neutral-800 p-2">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-medium">{name ?? "未装备"}</div>
      {name && (
        <button
          type="button"
          onClick={onUnequip}
          className="mt-1 rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
        >
          卸下
        </button>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800/60 p-3">
      <div className="mb-2 font-semibold text-neutral-200">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-4 text-center text-sm text-neutral-500">{text}</div>;
}
