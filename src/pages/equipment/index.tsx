import { useGameStore } from "@/store/game";

import { Link } from "react-router";

export default function EquipmentPage() {
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

  if (!player) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 flex flex-col items-center justify-center">
        <div className="text-xl mb-4">尚未创建角色</div>
        <NavLink to="/game">返回模拟器创建角色</NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">装备 / 能力</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 当前状态 */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="当前角色">
            <div className="text-lg font-semibold text-emerald-400">{player.name}</div>
            <div className="text-sm mt-2 space-y-1">
              <div>HP: {player.hp}/{player.maxHp} | EP: {player.ep}/{player.maxEp}</div>
              <div>力量{player.attributes.力量} 敏捷{player.attributes.敏捷} 智力{player.attributes.智力} 意志{player.attributes.意志}</div>
              <div>闪避{player.dodge} | 格挡{player.block} | 攻击+{player.attackBonus}</div>
            </div>
          </Card>

          <Card title="已装备">
            <div className="space-y-3 text-sm">
              <div className="bg-neutral-800 p-2 rounded border border-neutral-700/50">
                <div className="text-neutral-400 text-xs">武器</div>
                <div className="font-medium">{player.weapon?.name ?? "未装备"}</div>
                {player.weapon && <button type="button" onClick={unequipWeapon} className="text-xs mt-1 px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white">卸下</button>}
              </div>
              <div className="bg-neutral-800 p-2 rounded border border-neutral-700/50">
                <div className="text-neutral-400 text-xs">护甲</div>
                <div className="font-medium">{player.armor?.name ?? "未装备"}</div>
                {player.armor && <button type="button" onClick={unequipArmor} className="text-xs mt-1 px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white">卸下</button>}
              </div>
              <div className="bg-neutral-800 p-2 rounded border border-neutral-700/50">
                <div className="text-neutral-400 text-xs">血统</div>
                <div className="font-medium">{player.bloodline?.name ?? "无"}</div>
              </div>
              <div className="bg-neutral-800 p-2 rounded border border-neutral-700/50">
                <div className="text-neutral-400 text-xs">职业</div>
                <div className="font-medium">
                  {player.career?.name || "无"}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 可用装备列表 */}
        <div className="lg:col-span-2 space-y-4">
          <Card title={`武器库 (${inventoryWeapons.length})`}>
            {inventoryWeapons.length === 0 && <Empty text="背包中没有武器，去模拟器生成并添加" />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {inventoryWeapons.map((w) => (
                <div key={w.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded border border-neutral-700/50">
                  <div className="text-sm">
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-neutral-400">{w.quality} {w.category} | {w.damageType} | +{w.weaponBonus}</div>
                  </div>
                  <button type="button" onClick={() => equipWeapon(w)} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">装备</button>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`护甲库 (${inventoryArmors.length})`}>
            {inventoryArmors.length === 0 && <Empty text="背包中没有护甲，去模拟器生成并添加" />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {inventoryArmors.map((a) => (
                <div key={a.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded border border-neutral-700/50">
                  <div className="text-sm">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-neutral-400">{a.quality} {a.type} | 闪避{a.dodgeBonus} 格挡{a.blockBonus}</div>
                  </div>
                  <button type="button" onClick={() => equipArmor(a)} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">装备</button>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`血统库 (${ownedBloodlines.length})`}>
            {ownedBloodlines.length === 0 && <Empty text="尚未拥有血统，去模拟器生成并添加" />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {ownedBloodlines.map((b) => (
                <div key={b.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded border border-neutral-700/50">
                  <div className="text-sm">
                    <div className="font-medium">{b.name} <span className="text-amber-400">({b.rarity})</span></div>
                    <div className="text-xs text-neutral-400">抗性: {b.resistances.join(", ") || "无"}</div>
                  </div>
                  <button type="button" onClick={() => equipBloodline(b)} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">融合</button>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`职业库 (${ownedCareers.length})`}>
            {ownedCareers.length === 0 && <Empty text="尚未拥有职业，去模拟器生成并添加" />}
            <div className="space-y-2 max-h-56 overflow-auto">
              {ownedCareers.map((c) => (
                <div key={c.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded border border-neutral-700/50">
                  <div className="text-sm">
                    <div className="font-medium">{c.name} <span className="text-emerald-400">({c.tier})</span></div>
                    <div className="text-xs text-neutral-400">
                      技能: {Object.entries(c.skillModifiers).map(([k, v]) => `${k}+${v}`).join(", ")}
                    </div>
                  </div>
                  <button type="button" onClick={() => equipCareer(c)} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white">就职</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <NavLink to="/game">返回模拟器</NavLink>
        <NavLink to="/inventory">前往背包</NavLink>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800/60 border border-neutral-700 rounded-lg p-4">
      <div className="text-lg font-semibold mb-3 text-neutral-200">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-neutral-500 py-4 text-center">{text}</div>;
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
      {children}
    </Link>
  );
}
