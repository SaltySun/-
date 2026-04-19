import { useState, useMemo, useCallback, useEffect } from "react";
import type { Weapon, Armor, Bloodline, Career, Attribute, CombatLog, Companion } from "@/game/types";
import { generateWeapon, generateArmor, generateBloodline, generateCareer, generateMonster, generateCompanion } from "@/game/generator";
import { createCharacter, recalculateCharacter } from "@/game/character";
import { initCombat, getCurrentUnit, doNormalAttack, doFullDefense, executeAbility, aiAutoAction, companionAutoAction, nextTurn } from "@/game/combat";
import { useGameStore, type HubLocation, listSaves } from "@/store/game";
import { WeaponIcon, ArmorIcon, BloodlineIcon, CareerIcon, UIIcon } from "@/components/GameIcon";
import WikiPanel from "@/pages/wiki";

// ------------------------------------------------------------------
// 通用 UI 组件（全局，供所有局部组件使用）
// ------------------------------------------------------------------
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-2 border-stone bg-parchment-dark p-6 shadow-sm ${className}`}>{children}</div>;
}

function TabBtn({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold uppercase tracking-widest transition ${active ? "border-b-2 border-gold text-gold" : "text-ink-light hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90 disabled:border-stone disabled:bg-stone disabled:text-parchment disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 border-2 border-ink-light px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-ink transition hover:border-ink hover:bg-parchment">
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold/10">
      {children}
    </button>
  );
}

// ------------------------------------------------------------------
// CreationStep1（局部组件，包含名字输入与属性分配）
// ------------------------------------------------------------------
function CreationStep1({ onConfirm }: { onConfirm: (name: string, attrs: Record<Attribute, number>) => void }) {
  const [nameInput, setNameInput] = useState("轮回者");
  const [allocated, setAllocated] = useState<Record<Attribute, number>>({ 力量: 1, 敏捷: 1, 智力: 1, 意志: 1 });
  const remainingPoints = useMemo(() => 5 - (allocated.力量 + allocated.敏捷 + allocated.智力 + allocated.意志 - 4), [allocated]);

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-ink-light">代号</label>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full border-2 border-stone bg-parchment px-4 py-3 text-lg outline-none transition focus:border-gold"
          placeholder="输入角色名"
        />
      </div>

      <div className="border-2 border-stone bg-parchment-dark p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold uppercase tracking-widest text-ink">属性分配</span>
          <span className={`font-display text-lg ${remainingPoints === 0 ? "text-gold" : "text-blood"}`}>剩余点数 {remainingPoints}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["力量", "敏捷", "智力", "意志"] as Attribute[]).map((attr) => (
            <div key={attr} className="flex items-center justify-between border-b border-stone pb-3">
              <span className="w-12 font-display text-sm tracking-widest">{attr}</span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="h-10 w-10 border-2 border-ink-light text-ink transition hover:bg-ink hover:text-parchment"
                  onClick={() => setAllocated((s) => ({ ...s, [attr]: Math.max(1, s[attr] - 1) }))}
                >-</button>
                <span className="w-6 text-center font-display text-xl">{allocated[attr]}</span>
                <button
                  type="button"
                  className="h-10 w-10 border-2 border-gold text-gold transition hover:bg-gold hover:text-parchment"
                  onClick={() => setAllocated((s) => (remainingPoints > 0 ? { ...s, [attr]: s[attr] + 1 } : s))}
                >+</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs italic text-ink-light">基础属性总值 5 点。自由分配至力量、敏捷、智力、意志。</p>
      </div>

      <button
        type="button"
        disabled={remainingPoints !== 0}
        onClick={() => onConfirm(nameInput || "轮回者", allocated)}
        className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90 disabled:border-stone disabled:bg-stone disabled:text-parchment disabled:opacity-60"
      >
        下一步：选择职业
      </button>
    </div>
  );
}

// ------------------------------------------------------------------
// CareerSelector（局部组件，避免选择职业时重绘整个页面）
// ------------------------------------------------------------------
function CareerSelector({ careers, onConfirm, onBack }: { careers: Career[]; onConfirm: (career: Career) => void; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-ink-light">选择一个基础职业。职业决定你的成长方向与初始能力。</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {careers.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`relative border-2 p-5 text-left transition ${selectedId === c.id ? "border-gold bg-parchment" : "border-stone bg-parchment-dark hover:border-gold-dim"}`}
          >
            <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest">
              <CareerIcon tier={c.tier} size={16} />
              {c.name}
            </div>
            <div className="text-xs text-ink-light">
              {Object.entries(c.skillModifiers).map(([k, v]) => `${k}+${v}`).join(" / ") || "无技能加成"}
            </div>
            <div className="mt-3 text-xs italic text-ink-light">
              {c.passiveAbilities.map((p) => p.name).join(" / ")}
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <SecondaryBtn onClick={onBack}>返回</SecondaryBtn>
        <PrimaryBtn disabled={!selectedId} onClick={() => {
          const c = careers.find((x) => x.id === selectedId);
          if (c) onConfirm(c);
        }}>进入主神空间</PrimaryBtn>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// ShopPanel
// ------------------------------------------------------------------
type ShopItem = Weapon | Armor | Bloodline | Career | Consumable | Companion;

function ShopPanel({ onBuyItem, companionsCount }: { onBuyItem: (type: "weapon" | "armor" | "bloodline" | "career" | "consumable" | "companion", item: ShopItem) => void; companionsCount: number }) {
  const [shopStock, setShopStock] = useState(() => generateShopStock());
  const [shopTab, setShopTab] = useState<"weapon" | "armor" | "bloodline" | "career" | "consumable" | "companion">("weapon");
  const [detailItem, setDetailItem] = useState<ShopItem | null>(null);

  const tabs = [
    { key: "weapon" as const, label: "武器", count: shopStock.weapons.length },
    { key: "armor" as const, label: "护甲", count: shopStock.armors.length },
    { key: "bloodline" as const, label: "血统", count: shopStock.bloodlines.length },
    { key: "career" as const, label: "职业", count: shopStock.careers.length },
    { key: "consumable" as const, label: "消耗品", count: shopStock.consumables.length },
    { key: "companion" as const, label: "随从契约", count: shopStock.companions.length },
  ];

  function handleBuy() {
    if (!detailItem) return;
    if ("damageType" in detailItem && "category" in detailItem) onBuyItem("weapon", detailItem as Weapon);
    else if ("stealthModifier" in detailItem) onBuyItem("armor", detailItem as Armor);
    else if ("rarity" in detailItem) onBuyItem("bloodline", detailItem as Bloodline);
    else if ("tier" in detailItem && "skillModifiers" in detailItem) onBuyItem("career", detailItem as Career);
    else if ("gameEffect" in detailItem) onBuyItem("consumable", detailItem as Consumable);
    else onBuyItem("companion", detailItem as Companion);
    setDetailItem(null);
  }

  return (
    <Card className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headstone text-xl font-bold text-ink">兑换区商店</h3>
        <SecondaryBtn onClick={() => { setShopStock(generateShopStock()); setShopTab("weapon"); }}>刷新货物</SecondaryBtn>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b-2 border-stone pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setShopTab(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
              shopTab === t.key ? "border-2 border-gold bg-parchment text-gold" : "border-2 border-stone bg-parchment-dark text-ink-light hover:border-gold-dim"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-[420px] overflow-auto pr-1">
        {shopTab === "weapon" && shopStock.weapons.map((w) => (
          <div key={w.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <WeaponIcon category={w.category} size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(w)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {w.name}
              </button>
              <div className="text-xs text-ink-light truncate">{w.quality} · {w.damageType} · +{w.weaponBonus}</div>
            </div>
            <GhostBtn onClick={() => onBuyItem("weapon", w)}>获取</GhostBtn>
          </div>
        ))}
        {shopTab === "armor" && shopStock.armors.map((a) => (
          <div key={a.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <ArmorIcon type={a.type} size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(a)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {a.name}
              </button>
              <div className="text-xs text-ink-light truncate">{a.quality} · 闪避{a.dodgeBonus} 格挡{a.blockBonus}</div>
            </div>
            <GhostBtn onClick={() => onBuyItem("armor", a)}>获取</GhostBtn>
          </div>
        ))}
        {shopTab === "bloodline" && shopStock.bloodlines.map((b) => (
          <div key={b.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <BloodlineIcon rarity={b.rarity} size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(b)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {b.name}
              </button>
              <div className="text-xs text-ink-light truncate">{b.rarity}</div>
            </div>
            <GhostBtn onClick={() => onBuyItem("bloodline", b)}>获取</GhostBtn>
          </div>
        ))}
        {shopTab === "career" && shopStock.careers.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <CareerIcon tier={c.tier} size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(c)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {c.name}
              </button>
              <div className="text-xs text-ink-light truncate">{c.tier}</div>
            </div>
            <GhostBtn onClick={() => onBuyItem("career", c)}>获取</GhostBtn>
          </div>
        ))}
        {shopTab === "consumable" && shopStock.consumables.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <UIIcon icon="potion" size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(item)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {item.name}
              </button>
              <div className="text-xs text-ink-light truncate">{item.effect}</div>
            </div>
            <GhostBtn onClick={() => onBuyItem("consumable", item)}>获取</GhostBtn>
          </div>
        ))}
        {shopTab === "companion" && shopStock.companions.map((comp) => (
          <div key={comp.id} className="flex items-center gap-3 border border-stone bg-parchment p-3">
            <UIIcon icon="ally" size={18} />
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setDetailItem(comp)} className="block truncate text-left font-display text-sm font-bold tracking-wide text-ink hover:text-gold">
                {comp.name}
              </button>
              <div className="text-xs text-ink-light truncate">HP {comp.maxHp} · EP {comp.maxEp} · {comp.weapon?.damageType ?? "物理"}</div>
            </div>
            <GhostBtn disabled={companionsCount >= 2} onClick={() => { if (companionsCount < 2) onBuyItem("companion", comp); }}>招募</GhostBtn>
          </div>
        ))}
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null); }}>
          <div className="w-full max-w-md border-2 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b-2 border-stone pb-3">
              <div className="headstone text-lg font-bold text-ink">{detailItem.name}</div>
              <button type="button" onClick={() => setDetailItem(null)} className="text-xs font-semibold uppercase tracking-widest text-ink-light hover:text-ink">关闭</button>
            </div>

            <div className="space-y-3 text-sm">
              {"quality" in detailItem && "damageType" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">品质</span><span>{(detailItem as Weapon).quality}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">类型</span><span>{(detailItem as Weapon).category}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">检定属性</span><span>{(detailItem as Weapon).checkAttribute}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">伤害类型</span><span>{(detailItem as Weapon).damageType}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">武器加值</span><span>+{(detailItem as Weapon).weaponBonus}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">被动</span><span>{(detailItem as Weapon).passiveAbilities.map((p) => p.name).join(" / ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">主动</span><span>{(detailItem as Weapon).activeAbilities.map((a) => a.name).join(" / ") || "无"}</span></div>
                </>
              )}
              {"quality" in detailItem && "stealthModifier" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">品质</span><span>{(detailItem as Armor).quality}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">类型</span><span>{(detailItem as Armor).type}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">闪避</span><span>{(detailItem as Armor).dodgeBonus}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">格挡</span><span>{(detailItem as Armor).blockBonus}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">隐秘</span><span>{(detailItem as Armor).stealthModifier}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">运动</span><span>{(detailItem as Armor).athleticsModifier}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">先攻</span><span>{(detailItem as Armor).initiativeModifier}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">被动</span><span>{(detailItem as Armor).passiveAbilities.map((p) => p.name).join(" / ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">主动</span><span>{(detailItem as Armor).activeAbilities.map((a) => a.name).join(" / ") || "无"}</span></div>
                </>
              )}
              {"rarity" in detailItem && "attributeAdjustments" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">稀有度</span><span>{(detailItem as Bloodline).rarity}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">抗性</span><span>{(detailItem as Bloodline).resistances.join(", ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">易伤</span><span>{(detailItem as Bloodline).vulnerabilities.join(", ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">属性调整</span><span>{Object.entries((detailItem as Bloodline).attributeAdjustments).map(([k, v]) => `${k}${v}`).join(", ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">被动</span><span>{(detailItem as Bloodline).passiveAbilities.map((p) => p.name).join(" / ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">主动</span><span>{(detailItem as Bloodline).activeAbilities.map((a) => a.name).join(" / ") || "无"}</span></div>
                </>
              )}
              {"tier" in detailItem && "skillModifiers" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">等级</span><span>{(detailItem as Career).tier}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">技能加成</span><span>{Object.entries((detailItem as Career).skillModifiers).map(([k, v]) => `${k}+${v}`).join(", ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">被动</span><span>{(detailItem as Career).passiveAbilities.map((p) => p.name).join(" / ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">主动</span><span>{(detailItem as Career).activeAbilities.map((a) => a.name).join(" / ") || "无"}</span></div>
                </>
              )}
              {"effect" in detailItem && "uses" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">效果</span><span>{(detailItem as Consumable).effect}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">使用次数</span><span>{(detailItem as Consumable).uses}</span></div>
                </>
              )}
              {"maxHp" in detailItem && "activeAbilities" in detailItem && "weapon" in detailItem && (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-light">生命值</span><span>{(detailItem as Companion).maxHp}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">能量值</span><span>{(detailItem as Companion).maxEp}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">闪避</span><span>{(detailItem as Companion).dodge}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">格挡</span><span>{(detailItem as Companion).block}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">攻击加值</span><span>{(detailItem as Companion).attackBonus}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">武器</span><span>{(detailItem as Companion).weapon?.name ?? "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">护甲</span><span>{(detailItem as Companion).armor?.name ?? "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">主动技能</span><span>{(detailItem as Companion).activeAbilities.map((a) => a.name).join(" / ") || "无"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-ink-light">被动技能</span><span>{(detailItem as Companion).passiveAbilities.map((p) => p.name).join(" / ") || "无"}</span></div>
                </>
              )}
              {"description" in detailItem && (
                <div className="border-t border-stone pt-2 text-xs italic text-ink-light">{(detailItem as Weapon | Armor | Bloodline | Career).description}</div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <PrimaryBtn onClick={handleBuy}>获取</PrimaryBtn>
              <SecondaryBtn onClick={() => setDetailItem(null)}>取消</SecondaryBtn>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------
// GamePage
// ------------------------------------------------------------------
export default function GamePage() {
  const store = useGameStore();
  const { player, phase, setPhase, setPlayer, hubLocation, setHubLocation, actionPoints, spendActionPoint, restoreActionPoints, nextCycle, cycleCount, companions, addCompanion, removeCompanion, equipCompanionWeapon, equipCompanionArmor, unequipCompanionWeapon, unequipCompanionArmor, trainSkill } = store;

  // ------------------- 创建角色 -------------------
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [creationName, setCreationName] = useState("轮回者");
  const [creationAttrs, setCreationAttrs] = useState<Record<Attribute, number>>({ 力量: 1, 敏捷: 1, 智力: 1, 意志: 1 });
  const creationCareers = useMemo(() => Array.from({ length: 3 }, () => generateCareer("基础")), []);

  const finishCreation = (career?: Career) => {
    const p = createCharacter(creationName, { ...creationAttrs }, career);
    setPlayer(p);
    setPhase("hub");
    setHubLocation("广场");
    restoreActionPoints();
  };

  // ------------------- 主神空间状态 -------------------
  const [trainingCombat, setTrainingCombat] = useState<ReturnType<typeof initCombat> | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [logLines, setLogLines] = useState<string[]>([]);

  // 战斗 UI 状态
  type CombatMenu = "main" | "target" | "dice" | "ability_select" | "ritual" | "item";
  const [combatMenu, setCombatMenu] = useState<CombatMenu>("main");
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
  const [pendingDiceLogs, setPendingDiceLogs] = useState<CombatLog[]>([]);
  const [pendingDraftState, setPendingDraftState] = useState<ReturnType<typeof initCombat> | null>(null);
  const [currentDiceIndex, setCurrentDiceIndex] = useState(0);
  const [ritualLog, setRitualLog] = useState<CombatLog | null>(null);
  // 敌人动画状态
  const [enemyMenu, setEnemyMenu] = useState<"idle" | "dice" | "ritual">("idle");
  const [enemyDiceLogs, setEnemyDiceLogs] = useState<CombatLog[]>([]);
  const [enemyDiceIndex, setEnemyDiceIndex] = useState(0);
  const [enemyRitualLog, setEnemyRitualLog] = useState<CombatLog | null>(null);
  // Wiki 面板
  const [wikiOpen, setWikiOpen] = useState(false);
  const [wikiHighlight, setWikiHighlight] = useState<{ name: string; type: "active" | "passive" } | undefined>(undefined);
  const [savePanelOpen, setSavePanelOpen] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogLines((prev) => [...prev.slice(-59), msg]);
  }, []);

  const restAtHub = () => {
    if (!player) return;
    if (!spendActionPoint(1)) return;
    player.hp = player.maxHp;
    player.ep = player.maxEp;
    setPlayer({ ...player });
    // 复活并恢复所有随从
    if (companions.length > 0) {
      const revived = companions.map((c) => ({ ...c, hp: c.maxHp, ep: c.maxEp }));
      useGameStore.setState({ companions: revived });
      addLog("随从们也在营地中恢复如初。");
    }
    addLog("在休息区恢复至最佳状态。HP 与 EP 已回满。");
  };

  const startTraining = () => {
    if (!player) return;
    if (!spendActionPoint(1)) return;
    const m1 = generateMonster("普通级");
    const m2 = generateMonster("普通级");
    // 只让存活的随从参战
    const aliveCompanions = companions.filter((c) => c.hp > 0);
    let state = initCombat([player], [m1, m2], aliveCompanions);
    const companionNames = aliveCompanions.map((c) => c.name).join("、");
    state.logs.push({
      round: 1,
      actor: "系统",
      action: "开始",
      message: companionNames
        ? `训练开始。${companionNames} 与你并肩作战。`
        : "训练开始。击倒所有模拟敌人。",
    });
    setTrainingCombat(state);
    resetPlayerMenu();
    resetEnemyMenu();
    processNextUnit(state);
  };

  const syncFromCombat = (state: ReturnType<typeof initCombat>) => {
    if (!player) return;
    // 同步主角
    const pc = state.units.find((u) => u.id === player.id);
    if (pc) {
      player.hp = pc.hp;
      player.ep = pc.ep;
      setPlayer({ ...player });
    }
    // 同步随从
    if (companions.length > 0) {
      const updated = companions.map((c) => {
        const unit = state.units.find((u) => u.id === c.id);
        if (unit) {
          return { ...c, hp: unit.hp, ep: unit.ep };
        }
        return c;
      });
      useGameStore.setState({ companions: updated });
    }
  };

  // ------------------- 战斗交互重构（JRPG + 骰子） -------------------
  function finishCombat(state: ReturnType<typeof initCombat>) {
    setTrainingCombat(state);
    syncFromCombat(state);
    resetPlayerMenu();
    resetEnemyMenu();
    addLog(state.logs[state.logs.length - 1]?.message || "训练结束");
    setTimeout(() => {
      setTrainingCombat(null);
      setCombatMenu("main");
    }, 1400);
  }

  function processNextUnit(state: ReturnType<typeof initCombat>) {
    if (state.finished) {
      finishCombat(state);
      return;
    }
    const unit = getCurrentUnit(state);
    if (!unit) {
      processNextUnit(nextTurn(state));
      return;
    }
    if (unit.isPlayer && unit.id === player?.id) {
      // 主角回合：玩家控制
      setTrainingCombat(state);
      syncFromCombat(state);
      resetPlayerMenu();
      resetEnemyMenu();
      return;
    }
    if (unit.isPlayer && unit.id !== player?.id) {
      // 随从回合：AI 控制
      const logs = companionAutoAction(state, unit);
      const nextState = { ...state, logs: [...state.logs, ...logs] };
      const afterTurn = nextTurn(nextState);
      if (afterTurn.finished) {
        finishCombat(afterTurn);
        return;
      }
      const diceLogs = logs.filter((l) => typeof l.roll === "number");
      if (diceLogs.length > 0) {
        setTrainingCombat(afterTurn);
        syncFromCombat(afterTurn);
        setEnemyDiceLogs(diceLogs);
        setEnemyDiceIndex(0);
        setEnemyMenu("dice");
      } else {
        const nonDice = logs.find((l) => l.action !== "被动") || logs[0];
        if (nonDice) {
          setTrainingCombat(afterTurn);
          syncFromCombat(afterTurn);
          setEnemyRitualLog(nonDice);
          setEnemyMenu("ritual");
        } else {
          processNextUnit(afterTurn);
        }
      }
      return;
    }
    // 敌人 AI 行动
    const logs = aiAutoAction(state, unit);
    const nextState = { ...state, logs: [...state.logs, ...logs] };
    const afterTurn = nextTurn(nextState);
    if (afterTurn.finished) {
      finishCombat(afterTurn);
      return;
    }
    const diceLogs = logs.filter((l) => typeof l.roll === "number");
    if (diceLogs.length > 0) {
      setTrainingCombat(afterTurn);
      syncFromCombat(afterTurn);
      setEnemyDiceLogs(diceLogs);
      setEnemyDiceIndex(0);
      setEnemyMenu("dice");
    } else {
      const nonDice = logs.find((l) => l.action !== "被动") || logs[0];
      if (nonDice) {
        setTrainingCombat(afterTurn);
        syncFromCombat(afterTurn);
        setEnemyRitualLog(nonDice);
        setEnemyMenu("ritual");
      } else {
        processNextUnit(afterTurn);
      }
    }
  }

  function resumeAfterPlayerAction(draftWithPlayerAction: ReturnType<typeof initCombat>) {
    const afterTurn = nextTurn(draftWithPlayerAction);
    if (afterTurn.finished) {
      finishCombat(afterTurn);
      return;
    }
    processNextUnit(afterTurn);
  }

  function resetPlayerMenu() {
    setCombatMenu("main");
    setSelectedTargetId("");
    setSelectedAbilityIndex(null);
    setPendingDiceLogs([]);
    setPendingDraftState(null);
    setCurrentDiceIndex(0);
    setRitualLog(null);
  }

  function resetEnemyMenu() {
    setEnemyMenu("idle");
    setEnemyDiceLogs([]);
    setEnemyDiceIndex(0);
    setEnemyRitualLog(null);
  }

  function resolveAbilityTargets(ability: ActiveAbility, unit: ReturnType<typeof getCurrentUnit>, state: ReturnType<typeof initCombat>, explicitTargetId?: string): string[] {
    const enemies = state.units.filter((u) => !u.isPlayer && u.hp > 0);
    const allies = state.units.filter((u) => u.isPlayer && u.hp > 0);
    if (ability.target.includes("所有敌对单位")) return enemies.map((u) => u.id);
    if (ability.target.includes("所有友方单位")) return allies.map((u) => u.id);
    if (ability.target === "自己") return [unit!.id];
    const tid = explicitTargetId || selectedTargetId;
    if (ability.target.includes("敌对单位") || ability.target.includes("友方单位")) {
      return tid ? [tid] : [];
    }
    return [];
  }

  function preExecuteAction(type: "attack" | "ability" | "defend", opts?: { abilityIdx?: number; targetId?: string }) {
    if (!trainingCombat) return;
    const unit = getCurrentUnit(trainingCombat);
    if (!unit || !unit.isPlayer) return;

    const draft: ReturnType<typeof initCombat> = JSON.parse(JSON.stringify(trainingCombat));
    const draftUnit = draft.units.find((u) => u.id === unit.id)!;
    let logs: CombatLog[] = [];

    if (type === "defend") {
      logs = doFullDefense(draft, draftUnit);
      draft.logs.push(...logs);
      resumeAfterPlayerAction(draft);
      return;
    }

    if (type === "attack") {
      const tid = opts?.targetId || selectedTargetId;
      if (!tid) { setCombatMenu("target"); return; }
      logs = doNormalAttack(draft, draftUnit, tid);
    }

    if (type === "ability" && opts?.abilityIdx !== undefined) {
      const ability = draftUnit.activeAbilities[opts.abilityIdx];
      if (!ability) return;
      if (ability.costType === "能量值" && draftUnit.ep < ability.cost) return alert("能量不足");
      if (ability.costType === "生命值" && draftUnit.hp < ability.cost) return alert("生命值不足");
      const targets = resolveAbilityTargets(ability, draftUnit, draft, opts.targetId || selectedTargetId);
      if (targets.length === 0 && (ability.target.includes("敌对单位") || ability.target.includes("友方单位"))) {
        setSelectedAbilityIndex(opts.abilityIdx);
        setCombatMenu("target");
        return;
      }
      logs = executeAbility(draft, draftUnit, ability, targets);
    }

    draft.logs.push(...logs);
    const diceLogs = logs.filter((l) => typeof l.roll === "number");
    if (diceLogs.length > 0) {
      setPendingDiceLogs(diceLogs);
      setPendingDraftState(draft);
      setCurrentDiceIndex(0);
      setCombatMenu("dice");
    } else {
      // 治疗/Buff：先展示仪式覆盖层，再推进
      const nonDiceLog = logs.find((l) => l.action !== "被动") || logs[0];
      if (nonDiceLog) {
        setRitualLog(nonDiceLog);
        setPendingDraftState(draft);
        setCombatMenu("ritual");
      } else {
        resumeAfterPlayerAction(draft);
      }
    }
  }

  function onAttackClick() {
    setSelectedAbilityIndex(null);
    setSelectedTargetId("");
    setCombatMenu("target");
  }

  function onAbilityClick(idx: number) {
    setSelectedAbilityIndex(idx);
    setSelectedTargetId("");
    preExecuteAction("ability", { abilityIdx: idx });
  }

  function onDefendClick() {
    preExecuteAction("defend");
  }

  function onUseItem(item: Consumable) {
    if (!trainingCombat) return;
    const unit = getCurrentUnit(trainingCombat);
    if (!unit || !unit.isPlayer) return;

    const draft: ReturnType<typeof initCombat> = JSON.parse(JSON.stringify(trainingCombat));
    const draftUnit = draft.units.find((u) => u.id === unit.id)!;

    let logMsg = "";
    if (item.gameEffect.type === "heal_hp") {
      const before = draftUnit.hp;
      draftUnit.hp = Math.min(draftUnit.maxHp, draftUnit.hp + item.gameEffect.value);
      const healed = draftUnit.hp - before;
      logMsg = `${unit.name} 使用 ${item.name}，恢复 ${healed} 点生命值`;
      if (player) {
        player.hp = draftUnit.hp;
        setPlayer({ ...player });
      }
    } else if (item.gameEffect.type === "heal_ep") {
      const before = draftUnit.ep;
      draftUnit.ep = Math.min(draftUnit.maxEp, draftUnit.ep + item.gameEffect.value);
      const healed = draftUnit.ep - before;
      logMsg = `${unit.name} 使用 ${item.name}，恢复 ${healed} 点能量值`;
      if (player) {
        player.ep = draftUnit.ep;
        setPlayer({ ...player });
      }
    }

    store.removeConsumable(item.id);

    const log: CombatLog = {
      round: draft.round,
      actor: unit.name,
      action: "使用物品",
      message: logMsg,
    };

    draft.logs.push(log);
    setRitualLog(log);
    setPendingDraftState(draft);
    setCombatMenu("ritual");
  }

  function onTargetClick(targetId: string) {
    setSelectedTargetId(targetId);
    if (combatMenu === "target") {
      if (selectedAbilityIndex === null) {
        preExecuteAction("attack", { targetId });
      } else {
        preExecuteAction("ability", { abilityIdx: selectedAbilityIndex, targetId });
      }
    }
  }

  function onDiceAnimationComplete() {
    if (pendingDraftState) {
      resumeAfterPlayerAction(pendingDraftState);
    }
    setPendingDiceLogs([]);
    setPendingDraftState(null);
    setCurrentDiceIndex(0);
  }

  function onRitualComplete() {
    if (pendingDraftState) {
      resumeAfterPlayerAction(pendingDraftState);
    }
    setRitualLog(null);
    setPendingDraftState(null);
  }

  function onEnemyDiceNext() {
    setEnemyDiceIndex((i) => i + 1);
  }

  function onEnemyDiceComplete() {
    resetEnemyMenu();
    if (trainingCombat) {
      processNextUnit(trainingCombat);
    }
  }

  function onEnemyRitualComplete() {
    resetEnemyMenu();
    if (trainingCombat) {
      processNextUnit(trainingCombat);
    }
  }

  function onCancelTarget() {
    setCombatMenu("main");
    setSelectedTargetId("");
    setSelectedAbilityIndex(null);
    setRitualLog(null);
    setPendingDraftState(null);
  }

  const handleBuyItem = (type: "weapon" | "armor" | "bloodline" | "career" | "consumable" | "companion", item: any) => {
    if (type === "weapon") store.addWeapon(item);
    if (type === "armor") store.addArmor(item);
    if (type === "bloodline") store.addBloodline(item);
    if (type === "career") store.addCareer(item);
    if (type === "consumable") store.addConsumable(item);
    if (type === "companion") store.addCompanion(item);
    addLog(`获得了 ${item.name}`);
  };

  const enterPortal = () => {
    if (!player) return;
    setPhase("explore_result");
    addLog("踏入传送门，前往未知的副本世界……");
  };

  const returnToHub = () => {
    nextCycle();
    setPhase("hub");
    setHubLocation("广场");
    setTrainingCombat(null);
    if (player) {
      player.hp = player.maxHp;
      player.ep = player.maxEp;
      setPlayer({ ...player });
    }
    addLog("回到主神空间。行动点已恢复。");
  };

  // ------------------- 渲染 -------------------
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <Header />

      <main className="mx-auto grid max-w-7xl gap-6 p-5 md:grid-cols-[1fr_22rem] md:p-8">
        <section className="space-y-5">
          {phase === "creation" && (
            <Card className="animate-fade-in">
              <h2 className="headstone mb-6 text-2xl font-bold text-ink">创建轮回者</h2>
              {creationStep === 1 ? (
                <CreationStep1 onConfirm={(name, attrs) => { setCreationName(name); setCreationAttrs(attrs); setCreationStep(2); }} />
              ) : (
                <CareerSelector
                  careers={creationCareers}
                  onConfirm={(career) => finishCreation(career)}
                  onBack={() => setCreationStep(1)}
                />
              )}
            </Card>
          )}

          {phase === "hub" && (
            <>
              <nav className="flex flex-wrap gap-2 border-b-2 border-stone pb-3">
                {(["广场", "商店", "休息区", "训练场", "传送门"] as HubLocation[]).map((loc) => (
                  <TabBtn key={loc} active={hubLocation === loc} onClick={() => setHubLocation(loc)}>{loc}</TabBtn>
                ))}
              </nav>

              {hubLocation === "广场" && (
                <Card className="animate-fade-in">
                  <h3 className="headstone mb-4 text-xl font-bold text-ink">中央广场</h3>
                  <p className="mb-5 text-ink-light">光球悬浮在广场中央，冰冷的虚空凝视着你。你尚未进入任何副本。</p>
                  <div className="border-l-4 border-gold bg-parchment-dark p-5">
                    <div className="font-display text-sm font-bold uppercase tracking-widest text-gold-dim">当前副本进度</div>
                    <div className="mt-2 text-ink-light">准备完毕后，可通过传送门前往未知世界。</div>
                  </div>
                </Card>
              )}

              {hubLocation === "商店" && <ShopPanel onBuyItem={handleBuyItem} companionsCount={companions.length} />}

              {hubLocation === "休息区" && (
                <div className="space-y-4 animate-fade-in">
                  <Card>
                    <h3 className="headstone mb-4 text-xl font-bold text-ink">休息区</h3>
                    <p className="mb-5 text-ink-light">在私人空间中放松，完全恢复生命值与能量值。消耗 1 点行动点。</p>
                    <div className="flex items-center gap-4">
                      <PrimaryBtn disabled={!player || actionPoints < 1 || (player.hp >= player.maxHp && player.ep >= player.maxEp)} onClick={restAtHub}>
                        <UIIcon icon="hp" size={14} /> 休息恢复
                      </PrimaryBtn>
                      {player && player.hp >= player.maxHp && player.ep >= player.maxEp && <span className="text-sm italic text-gold">状态已满</span>}
                    </div>
                  </Card>

                  <Card>
                    <h3 className="headstone mb-4 text-xl font-bold text-ink">随从营地</h3>
                    {companions.length === 0 ? (
                      <p className="text-ink-light">暂无随从。前往商店招募契约伙伴。</p>
                    ) : (
                      <div className="space-y-3">
                        {companions.map((comp) => (
                          <CompanionHubCard
                            key={comp.id}
                            companion={comp}
                            inventoryWeapons={store.inventoryWeapons}
                            inventoryArmors={store.inventoryArmors}
                            onEquipWeapon={(w) => equipCompanionWeapon(comp.id, w)}
                            onEquipArmor={(a) => equipCompanionArmor(comp.id, a)}
                            onUnequipWeapon={() => unequipCompanionWeapon(comp.id)}
                            onUnequipArmor={() => unequipCompanionArmor(comp.id)}
                            onDismiss={() => removeCompanion(comp.id)}
                          />
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {hubLocation === "训练场" && (
                <div className="space-y-4 animate-fade-in">
                  <Card>
                    <h3 className="headstone mb-4 text-xl font-bold text-ink">训练场</h3>
                    <p className="mb-5 text-ink-light">纯白空间中生成模拟敌人。消耗 1 点行动点进行一场模拟战斗。</p>
                    {!trainingCombat ? (
                      <PrimaryBtn disabled={!player || actionPoints < 1} onClick={startTraining}>
                        <UIIcon icon="sword" size={14} /> 开始模拟战斗
                      </PrimaryBtn>
                    ) : (
                      <CombatScene />
                    )}
                  </Card>

                  <Card>
                    <h3 className="headstone mb-4 text-xl font-bold text-ink">技能训练</h3>
                    <p className="mb-4 text-ink-light">消耗行动点进行专项训练，永久提升技能加值。（每项上限 +3）</p>
                    {player && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(["运动", "机械", "隐秘", "学识", "察觉", "社交", "统御", "生存"] as SkillName[]).map((sk) => {
                          const trained = player.trainedSkills[sk] ?? 0;
                          const total = player.skills[sk] ?? 0;
                          const maxed = trained >= 3;
                          return (
                            <div key={sk} className={`border-2 p-3 text-center ${maxed ? "border-gold bg-parchment" : "border-stone bg-parchment-dark"}`}>
                              <div className="text-xs font-semibold uppercase tracking-widest text-ink-light">{sk}</div>
                              <div className="mt-1 font-display text-lg font-bold text-ink">+{trained}</div>
                              <div className="text-[10px] text-ink-light">总计 {total}</div>
                              <button
                                type="button"
                                disabled={!player || actionPoints < 1 || maxed}
                                onClick={() => {
                                  const ok = trainSkill(sk, 1);
                                  if (ok) addLog(`${player.name} 训练了【${sk}】，技能加值 +1`);
                                  else if (maxed) addLog(`【${sk}】已达训练上限`);
                                  else addLog(`行动点不足，无法训练`);
                                }}
                                className="mt-2 w-full border-2 border-stone py-1 text-[10px] font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold disabled:opacity-40 disabled:hover:border-stone disabled:hover:text-ink-light"
                              >
                                {maxed ? "已满" : "训练"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {hubLocation === "传送门" && (
                <Card className="animate-fade-in">
                  <h3 className="headstone mb-4 text-xl font-bold text-ink">传送门</h3>
                  <p className="mb-5 text-ink-light">一扇古老的木门立在虚空之中。打开它，前往副本世界。</p>
                  <PrimaryBtn onClick={enterPortal}><UIIcon icon="star" size={14} /> 踏入传送门</PrimaryBtn>
                </Card>
              )}
            </>
          )}

          {phase === "explore_result" && (
            <Card className="animate-fade-in">
              <h3 className="headstone mb-4 text-xl font-bold text-ink">副本探索</h3>
              <p className="mb-5 text-ink-light">你成功完成了本段冒险。在完整的游戏中，这里将展开 A-B-C 三段剧情副本。</p>
              <PrimaryBtn onClick={returnToHub}>返回主神空间</PrimaryBtn>
            </Card>
          )}

          {phase !== "creation" && (
            <Card>
              <h4 className="headstone mb-3 text-sm font-bold tracking-widest text-ink-light">事件记录</h4>
              <div className="h-40 overflow-auto border-2 border-stone bg-parchment p-4 text-sm">
                {logLines.length === 0 && <div className="italic text-ink-light">暂无记录</div>}
                {logLines.map((line, idx) => (
                  <div key={idx} className="border-b border-stone/60 py-1.5 last:border-0">{line}</div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <aside className="space-y-5">
          <CharacterPanel />
        </aside>
      </main>

      <WikiPanel
        open={wikiOpen}
        onClose={() => setWikiOpen(false)}
        highlightAbility={wikiHighlight}
      />

      <SaveLoadPanel />
    </div>
  );

  // ------------------------------------------------------------------
  // 子组件
  // ------------------------------------------------------------------
  function SaveLoadPanel() {
    const [saves, setSaves] = useState<Record<number, import("@/store/game").SaveSlot>>(() => listSaves());
    const [slotName, setSlotName] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    function refresh() {
      setSaves(listSaves());
    }

    function handleSave(slot: number) {
      store.saveGame(slot, slotName || undefined);
      setSlotName("");
      refresh();
    }

    function handleLoad(slot: number) {
      const ok = store.loadGame(slot);
      if (ok) {
        setSavePanelOpen(false);
        refresh();
      }
    }

    function handleDelete(slot: number) {
      store.deleteSave(slot);
      setConfirmDelete(null);
      refresh();
    }

    if (!savePanelOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setSavePanelOpen(false); }}>
        <div className="w-full max-w-lg border-2 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
          <div className="mb-4 flex items-center justify-between border-b-2 border-stone pb-3">
            <div className="headstone text-lg font-bold text-ink">存档管理</div>
            <button type="button" onClick={() => setSavePanelOpen(false)} className="text-xs font-semibold uppercase tracking-widest text-ink-light hover:text-ink">关闭</button>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              placeholder="存档备注（可选）"
              className="flex-1 border-2 border-stone bg-parchment-dark px-3 py-2 text-sm text-ink placeholder:text-ink-light/50 focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((slot) => {
              const save = saves[slot];
              return (
                <div key={slot} className="flex items-center justify-between border-2 border-stone bg-parchment-dark p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-widest text-gold">槽位 {slot}</div>
                    {save ? (
                      <div className="mt-1 text-sm text-ink">
                        <div className="truncate font-display">{save.name}</div>
                        <div className="text-[10px] text-ink-light">{new Date(save.timestamp).toLocaleString("zh-CN")}</div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm italic text-ink-light">空槽位</div>
                    )}
                  </div>
                  <div className="ml-3 flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => handleSave(slot)} className="border-2 border-ink bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90">
                      存档
                    </button>
                    {save && (
                      <>
                        <button type="button" onClick={() => handleLoad(slot)} className="border-2 border-gold bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-parchment transition hover:bg-gold/90">
                          读档
                        </button>
                        {confirmDelete === slot ? (
                          <button type="button" onClick={() => handleDelete(slot)} className="border-2 border-blood bg-blood px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-parchment transition hover:bg-blood/90">
                            确认
                          </button>
                        ) : (
                          <button type="button" onClick={() => setConfirmDelete(slot)} className="border-2 border-stone px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink-light transition hover:border-blood hover:text-blood">
                            删除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <header className="sticky top-0 z-40 border-b-2 border-gold/30 bg-parchment/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-gold">
              <UIIcon icon="star" size={20} />
            </div>
            <div>
              <h1 className="headstone text-base font-bold tracking-[0.2em] text-ink">关主野事</h1>
              <div className="text-[10px] uppercase tracking-[0.25em] text-ink-light">模拟器</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setWikiOpen(true)} className="border-2 border-stone px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold">
              规则手册
            </button>
            {phase !== "creation" && (
              <>
                <span className="border-2 border-gold px-3 py-1.5 font-display text-gold">AP <b>{actionPoints}</b> / 6</span>
                <span className="border-2 border-stone px-3 py-1.5 text-ink-light">周期 {cycleCount + 1}</span>
              </>
            )}
            <button type="button" onClick={() => setSavePanelOpen(true)} className="border-2 border-stone px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold">
              系统
            </button>
          </div>
        </div>
      </header>
    );
  }

  function CharacterPanel() {
    if (!player) {
      return (
        <Card>
          <div className="text-sm italic text-ink-light">尚未创建角色</div>
        </Card>
      );
    }
    return (
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center gap-3 border-b-2 border-stone pb-4">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-gold bg-parchment">
              <UIIcon icon="star" size={22} />
            </div>
            <div>
              <div className="headstone text-base font-bold text-ink">{player.name}</div>
              <div className="text-xs italic text-ink-light">
                {player.career?.name || "无职业"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <StatBar icon={<UIIcon icon="hp" size={14} />} label="生命值" current={player.hp} max={player.maxHp} color="bg-blood" />
            <StatBar icon={<UIIcon icon="ep" size={14} />} label="能量值" current={player.ep} max={player.maxEp} color="bg-bronze" />

            <div className="grid grid-cols-2 gap-3 border-t-2 border-stone pt-4">
              <AttrBox icon={<UIIcon icon="strength" size={14} />} label="力量" value={player.attributes.力量} />
              <AttrBox icon={<UIIcon icon="agility" size={14} />} label="敏捷" value={player.attributes.敏捷} />
              <AttrBox icon={<UIIcon icon="intelligence" size={14} />} label="智力" value={player.attributes.智力} />
              <AttrBox icon={<UIIcon icon="will" size={14} />} label="意志" value={player.attributes.意志} />
            </div>

            <div className="border-t-2 border-stone pt-4 text-sm">
              <div className="mb-2 flex items-center gap-2 text-ink-light"><UIIcon icon="dodge" size={12} /> 闪避 <span className="ml-auto font-display text-lg">{player.dodge}</span></div>
              <div className="mb-2 flex items-center gap-2 text-ink-light"><UIIcon icon="block" size={12} /> 格挡 <span className="ml-auto font-display text-lg">{player.block}</span></div>
              <div className="flex items-center gap-2 text-ink-light"><UIIcon icon="attack" size={12} /> 攻击 <span className="ml-auto font-display text-lg">+{player.attackBonus}</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">技能等级</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(player.skills).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between border-b border-stone pb-1.5">
                <span className="text-ink-light">{name}</span>
                <span className="font-display text-base font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">能力</div>
          {player.activeAbilities.length === 0 && player.passiveAbilities.length === 0 ? (
            <div className="text-sm italic text-ink-light">暂无可用的主动或被动能力</div>
          ) : (
            <div className="space-y-4 text-sm">
              {player.activeAbilities.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gold">主动能力</div>
                  <div className="space-y-1.5">
                    {player.activeAbilities.map((a) => (
                      <div key={a.id} className="border border-stone bg-parchment-dark p-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-semibold text-ink">{a.name}</span>
                          <span className="text-[10px] text-ink-light">{a.cost}{a.costType === "能量值" ? "EP" : "HP"} · {a.target}</span>
                        </div>
                        <div className="mt-1 text-xs text-ink-light">{a.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {player.passiveAbilities.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gold">被动能力</div>
                  <div className="space-y-1.5">
                    {player.passiveAbilities.map((p) => (
                      <div key={p.id} className="border border-stone bg-parchment-dark p-2">
                        <div className="font-display text-sm font-semibold text-ink">{p.name}</div>
                        <div className="mt-1 text-xs text-ink-light">{p.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">当前装备</div>
          <div className="space-y-3 text-sm">
            <EquipRow icon={<WeaponIcon category={player.weapon?.category || "轻型"} size={16} />} label="武器" value={player.weapon?.name} />
            <EquipRow icon={<ArmorIcon type={player.armor?.type || "轻甲"} size={16} />} label="护甲" value={player.armor?.name} />
            <EquipRow icon={<BloodlineIcon rarity={player.bloodline?.rarity || "稀有"} size={16} />} label="血统" value={player.bloodline?.name} />
          </div>
        </Card>

        {companions.length > 0 && (
          <Card>
            <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">随从</div>
            <div className="space-y-2">
              {companions.map((c) => (
                <div key={c.id} className={`border p-2 text-xs ${c.hp > 0 ? "border-stone bg-parchment-dark" : "border-blood/30 bg-parchment-dark/50"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-ink">{c.name}</span>
                    {c.hp <= 0 && <span className="text-[10px] font-bold text-blood">阵亡</span>}
                  </div>
                  <div className="mt-1 flex gap-3 text-ink-light">
                    <span>HP {c.hp}/{c.maxHp}</span>
                    <span>EP {c.ep}/{c.maxEp}</span>
                    <span>{c.weapon?.name ?? "无武器"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">仓库</div>
          <div className="space-y-2 text-sm">
            <StashRow label="武器" count={store.inventoryWeapons.length} />
            <StashRow label="护甲" count={store.inventoryArmors.length} />
            <StashRow label="消耗品" count={store.inventoryConsumables.length} />
            {store.inventoryConsumables.length > 0 && (
              <div className="space-y-1.5 border-l-2 border-stone pl-3">
                {store.inventoryConsumables.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-light">{c.name} <span className="text-ink-light/60">{c.effect}</span></span>
                    <button
                      type="button"
                      onClick={() => {
                        const log = store.useConsumable(c.id);
                        if (log) store.addLog(log);
                      }}
                      className="border border-stone px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold"
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            )}
            <StashRow label="血统" count={store.ownedBloodlines.length} />
            <StashRow label="职业" count={store.ownedCareers.length} />
          </div>
          <div className="mt-5 flex gap-2">
            <InventoryPanel />
            <EquipmentPanel />
          </div>
        </Card>
      </div>
    );
  }

  function StatBar({ icon, label, current, max, color }: { icon: React.ReactNode; label: string; current: number; max: number; color: string }) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-widest text-ink-light">
          <span className="flex items-center gap-2">{icon} {label}</span>
          <span className="font-display">{current} / {max}</span>
        </div>
        <div className="h-1.5 w-full bg-stone">
          <div className={`h-1.5 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  function AttrBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
      <div className="flex items-center justify-between border-b border-stone pb-2">
        <span className="flex items-center gap-2 text-xs text-ink-light">{icon} {label}</span>
        <span className="font-display text-lg font-semibold">{value}</span>
      </div>
    );
  }

  function EquipRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-ink-light">{icon}</span>
        <span className="text-ink-light">{label}</span>
        <span className="ml-auto font-display text-sm font-semibold">{value || "未装备"}</span>
      </div>
    );
  }

  function StashRow({ label, count }: { label: string; count: number }) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-light">{label}</span>
        <span className="font-display text-base font-semibold">{count}</span>
      </div>
    );
  }

  function CompanionHubCard({
    companion,
    inventoryWeapons,
    inventoryArmors,
    onEquipWeapon,
    onEquipArmor,
    onUnequipWeapon,
    onUnequipArmor,
    onDismiss,
  }: {
    companion: Companion;
    inventoryWeapons: Weapon[];
    inventoryArmors: Armor[];
    onEquipWeapon: (w: Weapon) => void;
    onEquipArmor: (a: Armor) => void;
    onUnequipWeapon: () => void;
    onUnequipArmor: () => void;
    onDismiss: () => void;
  }) {
    const [showEquip, setShowEquip] = useState(false);
    const alive = companion.hp > 0;

    return (
      <div className={`border-2 p-4 ${alive ? "border-stone bg-parchment-dark" : "border-blood/30 bg-parchment-dark/50"}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UIIcon icon="ally" size={16} />
            <span className="font-display text-sm font-bold text-ink">{companion.name}</span>
            {!alive && <span className="text-[10px] font-bold uppercase tracking-widest text-blood">战斗中阵亡</span>}
          </div>
          <button type="button" onClick={onDismiss} className="text-[10px] font-semibold uppercase tracking-widest text-ink-light hover:text-blood">解散</button>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="border border-stone bg-parchment p-1.5">
            <div className="text-ink-light">HP</div>
            <div className={`font-display font-semibold ${alive ? "text-ink" : "text-blood"}`}>{companion.hp}/{companion.maxHp}</div>
          </div>
          <div className="border border-stone bg-parchment p-1.5">
            <div className="text-ink-light">EP</div>
            <div className="font-display font-semibold text-ink">{companion.ep}/{companion.maxEp}</div>
          </div>
          <div className="border border-stone bg-parchment p-1.5">
            <div className="text-ink-light">闪避</div>
            <div className="font-display font-semibold text-ink">{companion.dodge}</div>
          </div>
          <div className="border border-stone bg-parchment p-1.5">
            <div className="text-ink-light">格挡</div>
            <div className="font-display font-semibold text-ink">{companion.block}</div>
          </div>
        </div>

        <div className="mb-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-ink-light">武器</span>
            <span className="text-ink">{companion.weapon?.name ?? "无"} {companion.weapon && <button type="button" onClick={onUnequipWeapon} className="ml-1 text-blood hover:underline">卸下</button>}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-light">护甲</span>
            <span className="text-ink">{companion.armor?.name ?? "无"} {companion.armor && <button type="button" onClick={onUnequipArmor} className="ml-1 text-blood hover:underline">卸下</button>}</span>
          </div>
        </div>

        <button type="button" onClick={() => setShowEquip((v) => !v)} className="w-full border-2 border-stone py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold">
          {showEquip ? "关闭装备" : "更换装备"}
        </button>

        {showEquip && (
          <div className="mt-3 space-y-3">
            {inventoryWeapons.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gold">可用武器</div>
                {inventoryWeapons.map((w) => (
                  <button key={w.id} type="button" onClick={() => { onEquipWeapon(w); setShowEquip(false); }} className="flex w-full items-center justify-between border border-stone bg-parchment px-2 py-1 text-xs hover:border-gold">
                    <span>{w.name}</span>
                    <span className="text-ink-light">{w.quality} · +{w.weaponBonus}</span>
                  </button>
                ))}
              </div>
            )}
            {inventoryArmors.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gold">可用护甲</div>
                {inventoryArmors.map((a) => (
                  <button key={a.id} type="button" onClick={() => { onEquipArmor(a); setShowEquip(false); }} className="flex w-full items-center justify-between border border-stone bg-parchment px-2 py-1 text-xs hover:border-gold">
                    <span>{a.name}</span>
                    <span className="text-ink-light">{a.quality} · 闪{a.dodgeBonus} 格{a.blockBonus}</span>
                  </button>
                ))}
              </div>
            )}
            {inventoryWeapons.length === 0 && inventoryArmors.length === 0 && (
              <p className="text-xs italic text-ink-light">背包中没有可用装备。</p>
            )}
          </div>
        )}
      </div>
    );
  }

  function CombatScene() {
    if (!trainingCombat) return null;
    const [statusDetail, setStatusDetail] = useState<{ unitName: string; name: string; remaining: number; effects: { type: string; value?: number; attribute?: string; damageType?: string }[]; isBuff: boolean } | null>(null);
    const currentUnit = getCurrentUnit(trainingCombat);
    const enemies = trainingCombat.units.filter((u) => !u.isPlayer);
    const allies = trainingCombat.units.filter((u) => u.isPlayer);

    const currentAbility = selectedAbilityIndex !== null ? currentUnit?.activeAbilities[selectedAbilityIndex] : null;
    const targetMode = combatMenu === "target";
    const selectEnemy = targetMode && (selectedAbilityIndex === null || currentAbility?.target.includes("敌对"));
    const selectAlly = targetMode && !!currentAbility?.target.includes("友方");

    return (
      <div className="relative flex min-h-[420px] flex-col gap-4">
        {/* 行动顺序条 */}
        <div className="flex items-center gap-2 overflow-x-auto border-b-2 border-stone pb-3">
          {trainingCombat.initiativeOrder.map((id, idx) => {
            const u = trainingCombat!.units.find((x) => x.id === id);
            if (!u || u.hp <= 0) return null;
            const isCurrent = trainingCombat!.initiativeOrder[trainingCombat!.currentTurnIndex] === id;
            return (
              <div
                key={id}
                className={`shrink-0 border-2 px-3 py-1 text-xs font-display uppercase tracking-widest transition ${
                  isCurrent ? "border-gold bg-parchment text-gold" : "border-stone bg-parchment-dark text-ink-light"
                }`}
              >
                {u.name}
              </div>
            );
          })}
        </div>

        {/* 敌人区 */}
        <div className="flex flex-wrap items-start justify-center gap-4">
          {enemies.map((u) => (
            <div
              key={u.id}
              onClick={() => { if (selectEnemy && u.hp > 0) onTargetClick(u.id); }}
              className={`relative w-36 border-2 p-4 text-left transition ${
                u.hp <= 0
                  ? "border-stone bg-parchment/60 opacity-50"
                  : selectEnemy
                  ? selectedTargetId === u.id
                    ? "border-gold bg-parchment shadow-[0_0_0_2px_#c5a059] cursor-pointer"
                    : "border-blood bg-parchment hover:border-gold cursor-pointer"
                  : "border-stone bg-parchment"
              }`}
            >
              <div className="font-display text-sm font-bold uppercase tracking-widest text-blood">{u.name}</div>
              <div className="mt-2 text-xs text-ink-light">闪避 {u.dodge}</div>
              <div className="text-xs text-ink-light">格挡 {u.block}</div>
              <div className="mt-3 h-1.5 w-full bg-stone">
                <div className={`h-1.5 ${u.hp <= u.maxHp * 0.3 ? "bg-blood" : "bg-ink"}`} style={{ width: `${(u.hp / u.maxHp) * 100}%` }} />
              </div>
              <div className="mt-1 text-right font-display text-xs">{u.hp}/{u.maxHp}</div>
              <div className="mt-2 flex flex-wrap gap-1 min-h-[18px]">
                {u.buffs.map((b, i) => (
                  <span key={`b${i}`} onClick={(e) => { e.stopPropagation(); setStatusDetail({ unitName: u.name, name: b.name, remaining: b.remaining, effects: b.effects, isBuff: true }); }} className="bg-gold/15 text-gold border border-gold/30 px-1 py-0.5 text-[9px] uppercase tracking-wider cursor-pointer hover:bg-gold/30">{b.name} {b.remaining}</span>
                ))}
                {u.debuffs.map((d, i) => (
                  <span key={`d${i}`} onClick={(e) => { e.stopPropagation(); setStatusDetail({ unitName: u.name, name: d.name, remaining: d.remaining, effects: d.effects, isBuff: false }); }} className="bg-blood/15 text-blood border border-blood/30 px-1 py-0.5 text-[9px] uppercase tracking-wider cursor-pointer hover:bg-blood/30">{d.name} {d.remaining}</span>
                ))}
              </div>
              {selectEnemy && u.hp > 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blood px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-parchment">目标</div>
              )}
            </div>
          ))}
        </div>

        {/* 中区：日志 */}
        <div className="flex-1 min-h-[80px] overflow-auto border-2 border-stone bg-parchment p-4 text-xs">
          {trainingCombat.logs.slice(-20).map((log, idx) => (
            <div key={idx} className="border-b border-stone/60 py-1.5 last:border-0">
              <span className="text-ink-light">[R{log.round}]</span>{" "}
              <span className={log.result === "破防" ? "text-blood" : log.result === "格挡" ? "text-bronze" : log.result === "闪避" ? "text-ink-light" : "text-ink"}>
                {log.message}
              </span>
            </div>
          ))}
        </div>

        {/* 底部：友方 + 指令菜单 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
          {/* 友方 */}
          <div className="flex flex-wrap items-end gap-3">
            {allies.map((u) => (
              <div
                key={u.id}
                onClick={() => { if (selectAlly && u.hp > 0) onTargetClick(u.id); }}
                className={`relative w-40 border-2 p-4 text-left transition ${
                  trainingCombat!.initiativeOrder[trainingCombat!.currentTurnIndex] === u.id
                    ? "border-gold bg-parchment"
                    : "border-stone bg-parchment-dark"
                } ${selectAlly && u.hp > 0 ? "cursor-pointer hover:border-gold" : ""} ${selectAlly && selectedTargetId === u.id ? "shadow-[0_0_0_2px_#c5a059] border-gold" : ""}`}
              >
                <div className="font-display text-sm font-bold uppercase tracking-widest text-gold-dim">{u.name}</div>
                <div className="mt-2 h-1.5 w-full bg-stone">
                  <div className="h-1.5 bg-blood" style={{ width: `${(u.hp / u.maxHp) * 100}%` }} />
                </div>
                <div className="mt-1 text-right font-display text-xs">HP {u.hp}/{u.maxHp}</div>
                <div className="mt-2 h-1 w-full bg-stone">
                  <div className="h-1 bg-bronze" style={{ width: `${(u.ep / u.maxEp) * 100}%` }} />
                </div>
                <div className="mt-1 text-right font-display text-[10px]">EP {u.ep}/{u.maxEp}</div>
                <div className="mt-2 flex flex-wrap gap-1 min-h-[18px]">
                  {u.buffs.map((b, i) => (
                    <span key={`b${i}`} onClick={(e) => { e.stopPropagation(); setStatusDetail({ unitName: u.name, name: b.name, remaining: b.remaining, effects: b.effects, isBuff: true }); }} className="bg-gold/15 text-gold border border-gold/30 px-1 py-0.5 text-[9px] uppercase tracking-wider cursor-pointer hover:bg-gold/30">{b.name} {b.remaining}</span>
                  ))}
                  {u.debuffs.map((d, i) => (
                    <span key={`d${i}`} onClick={(e) => { e.stopPropagation(); setStatusDetail({ unitName: u.name, name: d.name, remaining: d.remaining, effects: d.effects, isBuff: false }); }} className="bg-blood/15 text-blood border border-blood/30 px-1 py-0.5 text-[9px] uppercase tracking-wider cursor-pointer hover:bg-blood/30">{d.name} {d.remaining}</span>
                  ))}
                </div>
                {selectAlly && u.hp > 0 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-parchment">可选</div>
                )}
              </div>
            ))}
          </div>

          {/* 指令菜单 */}
          <div className="border-2 border-stone bg-parchment p-4">
            {currentUnit?.isPlayer && currentUnit.hp > 0 && !trainingCombat.finished && (
              <>
                {combatMenu === "main" && (
                  <div className="space-y-2">
                    <ActionBtn icon={<UIIcon icon="attack" size={14} />} label="攻击" primary onClick={onAttackClick} />
                    <ActionBtn icon={<UIIcon icon="shield" size={14} />} label="全力防御" onClick={onDefendClick} />
                    <ActionBtn icon={<UIIcon icon="star" size={14} />} label={`物品 (${store.inventoryConsumables.length})`} onClick={() => setCombatMenu("item")} />
                    <div className="my-2 border-t border-stone" />
                    {currentUnit.activeAbilities.map((a, idx) => {
                      const disabled = a.costType === "能量值" ? currentUnit.ep < a.cost : currentUnit.hp < a.cost;
                      return (
                        <div key={a.id} className="flex items-center gap-1">
                          <AbilityBtn disabled={disabled} onClick={() => onAbilityClick(idx)}>
                            {a.name} <span className="text-ink-light">({a.cost}{a.costType === "能量值" ? "EP" : "HP"})</span>
                          </AbilityBtn>
                          <button
                            type="button"
                            onClick={() => { setWikiHighlight({ name: a.name, type: "active" }); setWikiOpen(true); }}
                            className="shrink-0 border-2 border-stone px-1.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-light transition hover:border-gold hover:text-gold"
                            title="查看Wiki"
                          >
                            ?
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {combatMenu === "target" && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-gold">选择目标</div>
                    <SecondaryBtn onClick={onCancelTarget}>取消</SecondaryBtn>
                  </div>
                )}

                {combatMenu === "ability_select" && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-gold">选择能力</div>
                    <SecondaryBtn onClick={() => setCombatMenu("main")}>返回</SecondaryBtn>
                  </div>
                )}

                {combatMenu === "item" && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-gold">使用物品</div>
                    {store.inventoryConsumables.length === 0 && (
                      <div className="text-xs italic text-ink-light">背包中没有消耗品</div>
                    )}
                    {store.inventoryConsumables.map((item) => (
                      <AbilityBtn key={item.id} onClick={() => onUseItem(item)}>
                        {item.name} <span className="text-ink-light">— {item.effect}</span>
                      </AbilityBtn>
                    ))}
                    <SecondaryBtn onClick={() => setCombatMenu("main")}>返回</SecondaryBtn>
                  </div>
                )}
              </>
            )}

            {(!currentUnit?.isPlayer || currentUnit.hp <= 0) && !trainingCombat.finished && (
              <div className="text-center text-xs italic text-ink-light">敌方行动中…</div>
            )}

            {trainingCombat.finished && (
              <div className="text-center font-display text-gold">战斗结束</div>
            )}
          </div>
        </div>

        {/* 玩家骰子 / 仪式覆盖层 */}
        {combatMenu === "dice" && pendingDiceLogs.length > 0 && (
          <DiceRollOverlay
            logs={pendingDiceLogs}
            currentIndex={currentDiceIndex}
            onNext={() => setCurrentDiceIndex((i) => i + 1)}
            onComplete={onDiceAnimationComplete}
          />
        )}

        {combatMenu === "ritual" && ritualLog && (
          <RitualOverlay log={ritualLog} onComplete={onRitualComplete} />
        )}

        {/* 敌人骰子 / 仪式覆盖层 */}
        {enemyMenu === "dice" && enemyDiceLogs.length > 0 && (
          <DiceRollOverlay
            logs={enemyDiceLogs}
            currentIndex={enemyDiceIndex}
            onNext={onEnemyDiceNext}
            onComplete={onEnemyDiceComplete}
            size="small"
            title={`${enemyDiceLogs[0]?.actor ?? "敌人"} 的行动`}
          />
        )}

        {enemyMenu === "ritual" && enemyRitualLog && (
          <RitualOverlay log={enemyRitualLog} onComplete={onEnemyRitualComplete} />
        )}

        {/* Buff/Debuff 详情弹窗 */}
        {statusDetail && (
          <div className="absolute inset-0 z-[35] flex items-center justify-center bg-ink/30" onClick={() => setStatusDetail(null)}>
            <div className="w-full max-w-xs border-2 border-gold bg-parchment p-5 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between border-b-2 border-stone pb-2">
                <span className="font-display text-sm font-bold text-ink">{statusDetail.unitName}</span>
                <button type="button" onClick={() => setStatusDetail(null)} className="text-xs text-ink-light hover:text-ink">关闭</button>
              </div>
              <div className={`mb-2 text-xs font-semibold uppercase tracking-widest ${statusDetail.isBuff ? "text-gold" : "text-blood"}`}>
                {statusDetail.isBuff ? "增益" : "减益"} · {statusDetail.name} · 剩余 {statusDetail.remaining} 回合
              </div>
              <div className="space-y-1 text-xs text-ink-light">
                {statusDetail.effects.map((e, i) => {
                  let desc = e.type;
                  if (e.type === "buff_dodge") desc = `闪避 +${e.value}`;
                  else if (e.type === "buff_block") desc = `格挡 +${e.value}`;
                  else if (e.type === "buff_attack") desc = `攻击 +${e.value}`;
                  else if (e.type === "buff_attribute") desc = `${e.attribute} +${e.value}`;
                  else if (e.type === "buff_resistance") desc = `${(e as any).damageTypes?.join(", ") || e.damageType} 抗性`;
                  else if (e.type === "debuff_dodge") desc = `闪避 -${e.value}`;
                  else if (e.type === "debuff_block") desc = `格挡 -${e.value}`;
                  else if (e.type === "debuff_attack") desc = `攻击 -${e.value}`;
                  else if (e.type === "debuff_attribute") desc = `${e.attribute} -${e.value}`;
                  else if (e.type === "debuff_vulnerable") desc = `${(e as any).damageTypes?.join(", ") || e.damageType} 易伤`;
                  else if (e.type === "debuff_max_energy") desc = `最大能量 -${e.value}`;
                  else if (e.type === "multi_buff") desc = `多重复合增益`;
                  return <div key={i} className="border-b border-stone/40 pb-1">{desc}</div>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ActionBtn({ icon, label, primary, onClick }: { icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-sm font-semibold uppercase tracking-widest transition ${
          primary ? "border-ink bg-ink text-parchment hover:bg-ink/90" : "border-stone bg-parchment text-ink hover:border-ink"
        }`}
      >
        <span className="text-gold">{icon}</span> {label}
      </button>
    );
  }

  function AbilityBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full border-2 border-gold-dim bg-parchment px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-gold-dim transition hover:bg-gold-dim hover:text-parchment disabled:border-stone disabled:text-ink-light disabled:hover:bg-transparent"
      >
        {children}
      </button>
    );
  }

  function DiceRollOverlay({ logs, currentIndex, onNext, onComplete, size = "default", title }: { logs: CombatLog[]; currentIndex: number; onNext: () => void; onComplete: () => void; size?: "default" | "small"; title?: string }) {
    const log = logs[currentIndex];
    const isLast = currentIndex >= logs.length - 1;
    const [showing, setShowing] = useState(false);
    const [dice1, dice2] = useMemo(() => rollToDice(log?.roll ?? 7, 0), [log?.roll]);

    useEffect(() => {
      setShowing(false);
      const t1 = setTimeout(() => setShowing(true), 50);
      const t2 = setTimeout(() => {
        if (isLast) {
          setTimeout(onComplete, 900);
        } else {
          setTimeout(onNext, 600);
        }
      }, 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [currentIndex, isLast, onNext, onComplete]);

    if (!log) return null;
    const rawRoll = (log.roll ?? 7);
    const outcome = log.result ?? "命中";
    const outcomeText = outcome;
    const outcomeColor = outcome === "破防" ? "text-blood" : outcome === "格挡" ? "text-bronze" : outcome === "闪避" ? "text-ink-light" : "text-gold";

    const isSmall = size === "small";
    const dieSize = isSmall ? 48 : 80;
    const fontResult = isSmall ? "text-2xl" : "text-4xl";
    const fontRoll = isSmall ? "text-xl" : "text-2xl";
    const gap = isSmall ? "gap-4" : "gap-8";
    const plusSize = isSmall ? "text-xl" : "text-3xl";
    const infoSize = isSmall ? "text-xs" : "text-sm";

    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-sm">
        {title ? (
          <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-gold">{title}</div>
        ) : (
          <div className="mb-6 font-display text-xs uppercase tracking-[0.3em] text-gold">命运检定</div>
        )}

        <div className={`flex items-center ${gap}`}>
          <Die face={dice1} showing={showing} size={dieSize} />
          <span className={`font-display ${plusSize} text-parchment/60`}>+</span>
          <Die face={dice2} showing={showing} size={dieSize} />
        </div>

        <div className={`mt-8 flex items-center gap-4 ${isSmall ? "scale-90" : ""}`}>
          <div className={`font-display ${fontRoll} text-parchment`}>{rawRoll}</div>
          <div className="h-px w-16 bg-parchment/30" />
          <div className={`font-display ${fontResult} font-bold ${outcomeColor}`}>{outcomeText}</div>
        </div>

        <div className={`mt-4 ${infoSize} italic text-parchment/70`}>{log.actor} → {log.target}</div>

        {!isLast && (
          <div className="mt-6 text-[10px] uppercase tracking-widest text-parchment/40">连击判定 {currentIndex + 1} / {logs.length}</div>
        )}
      </div>
    );
  }

  function RitualOverlay({ log, onComplete }: { log: CombatLog; onComplete: () => void }) {
    useEffect(() => {
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }, [onComplete]);

    const isHeal = typeof log.heal === "number";
    const isBuff = log.action.includes("强化") || log.action.includes("庇护") || log.action.includes("链接") || log.action.includes("全面强化");
    const isItem = log.action === "使用物品";
    const accent = isHeal ? "text-emerald-400" : isBuff ? "text-gold" : isItem ? "text-bronze" : "text-parchment";
    const bigText = isHeal ? `+${log.heal}` : isItem ? "物品" : log.action;

    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-sm animate-fade-in">
        <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-gold">{isHeal ? "治愈仪式" : isItem ? "物品使用" : "能力发动"}</div>
        <div className={`font-display text-5xl font-bold ${accent}`}>{bigText}</div>
        <div className="mt-4 text-sm italic text-parchment/80">{log.message}</div>
      </div>
    );
  }

  function Die({ face, showing, size = 80 }: { face: number; showing: boolean; size?: number }) {
    const transform = getDieTransform(face);
    const half = size / 2;
    const textSize = size < 64 ? "text-xl" : "text-3xl";
    return (
      <div className="relative" style={{ width: size, height: size, perspective: 400 }}>
        <div
          className="absolute inset-0 transition-transform duration-[1200ms]"
          style={{
            transformStyle: "preserve-3d",
            transform: showing ? transform : "rotateX(720deg) rotateY(720deg)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`absolute flex items-center justify-center border-2 border-parchment/80 bg-parchment font-display ${textSize} text-ink`}
              style={{
                width: size,
                height: size,
                ...dieFaceStyle(n, half),
                backfaceVisibility: "hidden",
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function InventoryPanel() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="border-2 border-stone px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink-light transition hover:border-ink hover:text-ink">背包</button>
        {open && (
          <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 p-0" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="h-full w-full max-w-md overflow-auto border-l-4 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
              <div className="mb-6 flex items-center justify-between border-b-2 border-stone pb-4">
                <div className="headstone text-lg font-bold text-ink">背包</div>
                <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold uppercase tracking-widest text-ink-light hover:text-ink">关闭</button>
              </div>
              <div className="space-y-5 text-sm">
                <InvSection title="武器" items={store.inventoryWeapons} render={(w) => <span className="font-display tracking-wide">{w.name} <span className="text-ink-light">(+{w.weaponBonus})</span></span>} />
                <InvSection title="护甲" items={store.inventoryArmors} render={(a) => <span className="font-display tracking-wide">{a.name} <span className="text-ink-light">(闪避{a.dodgeBonus} 格挡{a.blockBonus})</span></span>} />
                <InvSection title="消耗品" items={store.inventoryConsumables} render={(c) => <span>{c.name} <span className="text-ink-light">— {c.effect}</span></span>} />
                <InvSection title="血统" items={store.ownedBloodlines} render={(b) => <span className="font-display tracking-wide">{b.name} <span className="text-ink-light">({b.rarity})</span></span>} />
                <InvSection title="职业" items={store.ownedCareers} render={(c) => <span className="font-display tracking-wide">{c.name} <span className="text-ink-light">({c.tier})</span></span>} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function EquipmentPanel() {
    const [open, setOpen] = useState(false);
    const { player, equipWeapon, equipArmor, equipBloodline, equipCareer, unequipWeapon, unequipArmor, unequipBloodline, unequipCareer } = store;
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="border-2 border-stone px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink-light transition hover:border-ink hover:text-ink">装备</button>
        {open && (
          <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 p-0" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="h-full w-full max-w-md overflow-auto border-l-4 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
              <div className="mb-6 flex items-center justify-between border-b-2 border-stone pb-4">
                <div className="headstone text-lg font-bold text-ink">装备与能力</div>
                <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold uppercase tracking-widest text-ink-light hover:text-ink">关闭</button>
              </div>
              {!player && <div className="text-sm italic text-ink-light">没有角色</div>}
              {player && (
                <div className="space-y-6 text-sm">
                  <div className="border-2 border-stone bg-parchment-dark p-4">
                    <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">当前装备</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><span className="text-ink-light">武器</span><span className="font-display">{player.weapon?.name || "无"}</span>{player.weapon && <button className="text-xs text-blood hover:underline" onClick={() => unequipWeapon()}>卸下</button>}</div>
                      <div className="flex items-center justify-between"><span className="text-ink-light">护甲</span><span className="font-display">{player.armor?.name || "无"}</span>{player.armor && <button className="text-xs text-blood hover:underline" onClick={() => unequipArmor()}>卸下</button>}</div>
                      <div className="flex items-center justify-between"><span className="text-ink-light">血统</span><span className="font-display">{player.bloodline?.name || "无"}</span>{player.bloodline && <button className="text-xs text-blood hover:underline" onClick={() => unequipBloodline()}>卸下</button>}</div>
                      <div className="flex items-center justify-between"><span className="text-ink-light">职业</span><span className="font-display">{player.career?.name || "无"}</span>{player.career && <button className="text-xs text-blood hover:underline" onClick={() => unequipCareer()}>卸下</button>}</div>
                    </div>
                  </div>
                  <InvSection title="武器库" items={store.inventoryWeapons} render={(w) => (
                    <div className="flex w-full items-center justify-between"><span className="font-display tracking-wide">{w.name}</span><GhostBtn onClick={() => equipWeapon(w)}>装备</GhostBtn></div>
                  )} />
                  <InvSection title="护甲库" items={store.inventoryArmors} render={(a) => (
                    <div className="flex w-full items-center justify-between"><span className="font-display tracking-wide">{a.name}</span><GhostBtn onClick={() => equipArmor(a)}>装备</GhostBtn></div>
                  )} />
                  <InvSection title="血统库" items={store.ownedBloodlines} render={(b) => (
                    <div className="flex w-full items-center justify-between"><span className="font-display tracking-wide">{b.name}</span><GhostBtn onClick={() => equipBloodline(b)}>融合</GhostBtn></div>
                  )} />
                  <InvSection title="职业库" items={store.ownedCareers} render={(c) => (
                    <div className="flex w-full items-center justify-between"><span className="font-display tracking-wide">{c.name}</span><GhostBtn onClick={() => equipCareer(c)}>就职</GhostBtn></div>
                  )} />
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  function InvSection<T>({ title, items, render }: { title: string; items: T[]; render: (item: T) => React.ReactNode }) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-light">{title}</div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-stone pb-2">
              {render(item)}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

// ------------------------------------------------------------------
// 工具
// ------------------------------------------------------------------
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollToDice(totalWithBonus: number, _attackBonus: number): [number, number] {
  const raw = Math.max(2, Math.min(12, totalWithBonus - _attackBonus));
  let a = Math.min(6, Math.max(1, Math.floor(raw / 2)));
  let b = raw - a;
  while (b < 1 || b > 6) {
    if (b < 1) { a--; b = raw - a; }
    if (b > 6) { a++; b = raw - a; }
  }
  return [a, b];
}

function getDieTransform(face: number): string {
  const map: Record<number, string> = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateY(180deg)",
    3: "rotateY(-90deg)",
    4: "rotateY(90deg)",
    5: "rotateX(-90deg)",
    6: "rotateX(90deg)",
  };
  // 额外旋转圈数，确保动画有足够行程
  const extraX = 720;
  const extraY = 720;
  const base = map[face] || map[1];
  // 简单拼接额外旋转（仅用于首次落地时营造旋转感，后续可用不同 seed）
  return `rotateX(${extraX}deg) rotateY(${extraY}deg) ${base}`;
}

function dieFaceStyle(n: number, translateZ = 40): React.CSSProperties {
  switch (n) {
    case 1: return { transform: `rotateY(0deg) translateZ(${translateZ}px)` };
    case 2: return { transform: `rotateY(180deg) translateZ(${translateZ}px)` };
    case 3: return { transform: `rotateY(90deg) translateZ(${translateZ}px)` };
    case 4: return { transform: `rotateY(-90deg) translateZ(${translateZ}px)` };
    case 5: return { transform: `rotateX(90deg) translateZ(${translateZ}px)` };
    case 6: return { transform: `rotateX(-90deg) translateZ(${translateZ}px)` };
    default: return {};
  }
}

function generateShopStock() {
  const randCount = () => Math.floor(Math.random() * 10) + 5; // 5 ~ 14
  let seed = Date.now();
  const uid = () => `${seed++}_${Math.floor(Math.random() * 10000)}`;

  const consumablePool = [
    { name: "小型生命药水", price: 50, effect: "恢复3点生命值", gameEffect: { type: "heal_hp" as const, value: 3 } },
    { name: "小型能量药水", price: 50, effect: "恢复3点能量值", gameEffect: { type: "heal_ep" as const, value: 3 } },
    { name: "中型生命药水", price: 80, effect: "恢复4点生命值", gameEffect: { type: "heal_hp" as const, value: 4 } },
    { name: "中型能量药水", price: 80, effect: "恢复4点能量值", gameEffect: { type: "heal_ep" as const, value: 4 } },
    { name: "强效生命药水", price: 120, effect: "恢复6点生命值", gameEffect: { type: "heal_hp" as const, value: 6 } },
    { name: "强效能量药水", price: 120, effect: "恢复6点能量值", gameEffect: { type: "heal_ep" as const, value: 6 } },
    { name: "特级生命药水", price: 200, effect: "恢复10点生命值", gameEffect: { type: "heal_hp" as const, value: 10 } },
    { name: "特级能量药水", price: 200, effect: "恢复10点能量值", gameEffect: { type: "heal_ep" as const, value: 10 } },
    { name: "解毒草", price: 60, effect: "移除一个毒素效果", gameEffect: { type: "heal_hp" as const, value: 0 } },
    { name: "清醒剂", price: 60, effect: "移除一个眩晕效果", gameEffect: { type: "heal_ep" as const, value: 0 } },
    { name: "绷带", price: 30, effect: "恢复2点生命值", gameEffect: { type: "heal_hp" as const, value: 2 } },
    { name: "精力糖果", price: 30, effect: "恢复2点能量值", gameEffect: { type: "heal_ep" as const, value: 2 } },
  ];

  return {
    weapons: Array.from({ length: randCount() }, () => generateWeapon(pickOne(["普通", "不凡", "不凡", "稀有"]))),
    armors: Array.from({ length: randCount() }, () => generateArmor(pickOne(["普通", "不凡", "不凡", "稀有"]))),
    bloodlines: Array.from({ length: randCount() }, () => generateBloodline(pickOne(["稀有", "稀有", "超凡"]))),
    careers: Array.from({ length: randCount() }, () => generateCareer()),
    consumables: Array.from({ length: randCount() }, () => {
      const base = pickOne(consumablePool);
      return { id: `cns_${uid()}`, ...base, uses: 1 };
    }),
    companions: Array.from({ length: 3 }, () => generateCompanion(pickOne(["普通级", "精英级"]))),
  };
}
