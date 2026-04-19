import { useState, useEffect, useRef } from "react";
import { UIIcon, DamageIcon } from "@/components/GameIcon";
import { ACTIVE_ABILITIES, PASSIVE_ABILITIES } from "@/game/abilities";
import type { ActiveAbility, PassiveAbility } from "@/game/types";

export default function WikiPanel({
  open,
  onClose,
  initialTab,
  highlightAbility,
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: "rules" | "active" | "passive";
  highlightAbility?: { name: string; type: "active" | "passive" };
}) {
  const [tab, setTab] = useState<"rules" | "active" | "passive">(initialTab ?? "rules");
  const [activeFilter, setActiveFilter] = useState<string>("全部");
  const [passiveFilter, setPassiveFilter] = useState<string>("全部");
  const [detailAbility, setDetailAbility] = useState<ActiveAbility | PassiveAbility | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab ?? "rules");
      if (highlightAbility) {
        const list = highlightAbility.type === "active" ? ACTIVE_ABILITIES : PASSIVE_ABILITIES;
        const found = list.find((a) => a.name === highlightAbility.name);
        if (found) setDetailAbility(found);
      }
    }
  }, [open, initialTab, highlightAbility]);

  // 主动能力分类
  const activeCategories = ["全部", "造成伤害", "增益", "减益"];
  const activeGroups: Record<string, ActiveAbility[]> = {
    造成伤害: ACTIVE_ABILITIES.filter((a) => ["damage", "combo"].includes(a.effect.type)),
    增益: ACTIVE_ABILITIES.filter((a) => ["heal", "buff_dodge", "buff_block", "buff_attack", "buff_attribute", "buff_resistance", "multi_buff"].includes(a.effect.type)),
    减益: ACTIVE_ABILITIES.filter((a) => ["debuff_dodge", "debuff_block", "debuff_attack", "debuff_attribute", "debuff_vulnerable", "debuff_max_energy", "multi_debuff"].includes(a.effect.type)),
  };
  const filteredActives = activeFilter === "全部" ? ACTIVE_ABILITIES : activeGroups[activeFilter] || [];

  // 被动能力分类
  const passiveCategories = ["全部", "属性增强", "防御增强", "抗性", "攻击增强", "技能增强", "怪物特攻", "偷取"];
  const passiveGroups: Record<string, PassiveAbility[]> = {
    属性增强: PASSIVE_ABILITIES.filter((p) => p.effect.type === "attribute"),
    防御增强: PASSIVE_ABILITIES.filter((p) => ["dodge", "block"].includes(p.effect.type)),
    抗性: PASSIVE_ABILITIES.filter((p) => p.effect.type === "resistance"),
    攻击增强: PASSIVE_ABILITIES.filter((p) => p.effect.type === "attack"),
    技能增强: PASSIVE_ABILITIES.filter((p) => ["skill", "multi_skill"].includes(p.effect.type)),
    怪物特攻: PASSIVE_ABILITIES.filter((p) => p.effect.type === "monster_attack_bonus"),
    偷取: PASSIVE_ABILITIES.filter((p) => ["life_steal", "energy_steal"].includes(p.effect.type)),
  };
  const filteredPassives = passiveFilter === "全部" ? PASSIVE_ABILITIES : passiveGroups[passiveFilter] || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-ink/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)} className="relative ml-auto h-full w-full max-w-4xl overflow-auto border-l-4 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-stone pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-gold">
              <UIIcon icon="star" size={20} />
            </div>
            <div>
              <h1 className="headstone text-base font-bold tracking-[0.2em] text-ink">关主野事</h1>
              <div className="text-[10px] uppercase tracking-[0.25em] text-ink-light">规则手册</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="border-2 border-stone px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-light transition hover:border-ink hover:text-ink">
            关闭
          </button>
        </div>

        <div>
        {/* 主导航 */}
        <nav className="mb-6 flex flex-wrap gap-2 border-b-2 border-stone pb-3">
          {[
            { key: "rules" as const, label: "核心规则" },
            { key: "active" as const, label: `主动能力 (${ACTIVE_ABILITIES.length})` },
            { key: "passive" as const, label: `被动能力 (${PASSIVE_ABILITIES.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-widest transition ${
                tab === t.key ? "border-b-2 border-gold text-gold" : "text-ink-light hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* 规则页 */}
        {tab === "rules" && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-fade-in">
            <RuleCard title="属性与衍生数值" icon={<UIIcon icon="strength" size={16} />}>
              <div className="space-y-2 text-sm">
                <p className="text-ink-light">四项基础属性，每项初始至少为 1，总值 5 点自由分配。</p>
                <div className="grid grid-cols-2 gap-2">
                  <AttrRow label="力量" desc="影响最大生命值、格挡值、攻击检定" />
                  <AttrRow label="敏捷" desc="影响闪避值、先攻检定" />
                  <AttrRow label="智力" desc="影响最大能量值" />
                  <AttrRow label="意志" desc="影响最大能量值" />
                </div>
                <div className="border-t border-stone pt-2 text-xs text-ink-light">
                  <div>最大生命值 = 15 + 力量</div>
                  <div>最大能量值 = 5 + 智力 + 意志</div>
                  <div>闪避值 = 5 + ⌈敏捷 / 2⌉</div>
                  <div>格挡值 = 闪避值 + ⌈力量 / 2⌉</div>
                  <div>攻击加值 = ⌈主属性 / 2⌉ + 熟练加值 + 武器加值</div>
                  <div className="mt-1">熟练加值：基础职业 +1 / 进阶职业 +2 / 大师职业 +3</div>
                </div>
              </div>
            </RuleCard>

            <RuleCard title="战斗检定" icon={<UIIcon icon="attack" size={16} />}>
              <div className="space-y-2 text-sm">
                <p className="text-ink-light">攻击方掷 2D6 + 攻击加值，与防御方数值对比。</p>
                <div className="space-y-1 text-xs text-ink-light">
                  <div className="flex items-center gap-2"><span className="text-gold">●</span> <b>闪避</b>：检定值 &lt; 闪避值 → 完全无效</div>
                  <div className="flex items-center gap-2"><span className="text-bronze">●</span> <b>格挡</b>：闪避值 ≤ 检定值 &lt; 格挡值 → 仅造成 1 点伤害</div>
                  <div className="flex items-center gap-2"><span className="text-blood">●</span> <b>破防</b>：检定值 ≥ 格挡值 → 伤害 = 检定值 - 格挡值 + 1</div>
                </div>
                <div className="border-t border-stone pt-2 text-xs text-ink-light">
                  <div>抗性：对应伤害类型 -3</div>
                  <div>易伤：对应伤害类型 +3</div>
                  <div>伤害不会低于 0</div>
                </div>
              </div>
            </RuleCard>

            <RuleCard title="伤害类型" icon={<DamageIcon type="物理" size={16} />}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(["物理", "火焰", "冰霜", "闪电", "黑暗", "光明"] as const).map((dt) => (
                  <div key={dt} className="flex items-center gap-2 border border-stone p-2">
                    <DamageIcon type={dt} size={14} />
                    <span className="text-xs">{dt}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-light">武器、怪物、技能各有对应的伤害类型。通过血统或技能获得抗性/易伤。</p>
            </RuleCard>

            <RuleCard title="先攻与回合" icon={<UIIcon icon="agility" size={16} />}>
              <div className="space-y-2 text-sm text-ink-light">
                <div>战斗开始时，所有单位掷 <b>2D6 + 敏捷</b> 决定行动顺序。</div>
                <div>每轮开始时，所有 Buff/Debuff 持续回合 -1，到期后自动移除。</div>
                <div>已死亡单位自动跳过回合。</div>
              </div>
            </RuleCard>

            <RuleCard title="全力防御" icon={<UIIcon icon="shield" size={16} />}>
              <div className="text-sm text-ink-light">
                玩家可选择不进行攻击，而是进入全力防御姿态。获得 <b>闪避 +2、格挡 +2</b> 的 Buff，持续 3 回合。
              </div>
            </RuleCard>

            <RuleCard title="装备规则" icon={<UIIcon icon="sword" size={16} />}>
              <div className="space-y-1 text-sm text-ink-light">
                <div><b>武器</b>：决定检定属性、伤害类型和武器加值</div>
                <div><b>护甲</b>：提供闪避/格挡修正和技能调整</div>
                <div><b>血统</b>：提供抗性/易伤、属性调整和额外能力</div>
                <div><b>职业</b>：提供技能加成和被动/主动能力（只能装备一个，替换制）</div>
              </div>
            </RuleCard>
          </div>
        )}

        {/* 主动能力页 */}
        {tab === "active" && (
          <div className="animate-fade-in">
            <div className="mb-4 flex flex-wrap gap-2">
              {activeCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveFilter(c)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                    activeFilter === c ? "border-2 border-gold bg-parchment text-gold" : "border-2 border-stone bg-parchment-dark text-ink-light hover:border-gold-dim"
                  }`}
                >
                  {c} {c !== "全部" ? `(${activeGroups[c]?.length})` : `(${ACTIVE_ABILITIES.length})`}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActives.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setDetailAbility(a)}
                  className="border border-stone bg-parchment p-4 text-left transition hover:border-gold"
                >
                  <div className="font-display text-sm font-bold tracking-wide">{a.name}</div>
                  <div className="mt-1 text-xs text-ink-light">{a.description}</div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-light">
                    <span>{a.cost}{a.costType === "能量值" ? "EP" : "HP"}</span>
                    <span>·</span>
                    <span>{a.target}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 被动能力页 */}
        {tab === "passive" && (
          <div className="animate-fade-in">
            <div className="mb-4 flex flex-wrap gap-2">
              {passiveCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPassiveFilter(c)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                    passiveFilter === c ? "border-2 border-gold bg-parchment text-gold" : "border-2 border-stone bg-parchment-dark text-ink-light hover:border-gold-dim"
                  }`}
                >
                  {c} {c !== "全部" ? `(${passiveGroups[c]?.length})` : `(${PASSIVE_ABILITIES.length})`}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPassives.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDetailAbility(p)}
                  className="border border-stone bg-parchment p-4 text-left transition hover:border-gold"
                >
                  <div className="font-display text-sm font-bold tracking-wide">{p.name}</div>
                  <div className="mt-1 text-xs text-ink-light">{p.description}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-ink-light">评分 {p.score} / 10</div>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* 详情弹窗 */}
        {detailAbility && (
          <div
            className="absolute -mx-6 left-0 right-0 z-50 flex items-center justify-center bg-ink/70 px-6"
            style={{ top: scrollY, height: panelRef.current?.clientHeight ?? "100vh" }}
            onClick={(e) => { if (e.target === e.currentTarget) setDetailAbility(null); }}
          >
            <div className="w-full max-w-md border-2 border-gold bg-parchment p-6 shadow-2xl animate-fade-in">
              <div className="mb-4 flex items-center justify-between border-b-2 border-stone pb-3">
                <div className="headstone text-lg font-bold text-ink">{detailAbility.name}</div>
                <button type="button" onClick={() => setDetailAbility(null)} className="text-xs font-semibold uppercase tracking-widest text-ink-light hover:text-ink">关闭</button>
              </div>
              <div className="space-y-2 text-sm text-ink-light">
                {"cost" in detailAbility && (
                  <>
                    <div className="flex items-center justify-between"><span>消耗</span><span>{detailAbility.cost}{detailAbility.costType === "能量值" ? "EP" : "HP"}</span></div>
                    <div className="flex items-center justify-between"><span>目标</span><span>{detailAbility.target}</span></div>
                    <div className="flex items-center justify-between"><span>评分</span><span>{detailAbility.score} / 10</span></div>
                  </>
                )}
                {"score" in detailAbility && !("cost" in detailAbility) && (
                  <div className="flex items-center justify-between"><span>评分</span><span>{detailAbility.score} / 10</span></div>
                )}
                <div className="border-t border-stone pt-2 text-xs italic">{detailAbility.description}</div>
              </div>
              <div className="mt-4">
                <button type="button" onClick={() => setDetailAbility(null)} className="w-full border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90">
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  </div>
);
}

function RuleCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-2 border-stone bg-parchment-dark p-5">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest">
        <span className="text-gold">{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function AttrRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="border border-stone bg-parchment p-2">
      <div className="font-display text-sm font-bold">{label}</div>
      <div className="text-xs text-ink-light">{desc}</div>
    </div>
  );
}
