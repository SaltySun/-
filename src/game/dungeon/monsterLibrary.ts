// ========================================
// 灰蚀大陆 - 副本专属怪物库
// ========================================
// 每个怪物都是预设的完整战斗实体，从名字直接实例化。
// 不再使用 generateMonster() 的随机生成逻辑。

import type { Monster, MonsterTier, MonsterCategory, Attribute, DamageType, ActiveAbility, PassiveAbility } from "@/game/types";
import type { DungeonDifficulty } from "./types";
import { ACTIVE_ABILITIES, PASSIVE_ABILITIES } from "@/game/abilities";

// ------------------------------------------------------------------
// 类型定义
// ------------------------------------------------------------------

interface MonsterBlueprint {
  name: string;
  tier: MonsterTier;
  category: MonsterCategory;
  attributes: Record<Attribute, number>;
  hp: number;
  ep: number;
  dodge: number;
  block: number;
  attackBonus: number;
  damageType: DamageType;
  checkAttribute: Attribute;
  activeAbilityIds: string[];
  passiveAbilityIds: string[];
  resistances: DamageType[];
  vulnerabilities: DamageType[];
}

// ------------------------------------------------------------------
// 灰蚀大陆专属怪物蓝图（27种）
// ------------------------------------------------------------------

const GRAY_CORROSION_MONSTERS: MonsterBlueprint[] = [
  // ========== A章：灰烬初啼 ==========
  {
    name: "回声",
    tier: "普通级",
    category: "异界生物",
    attributes: { 力量: 1, 敏捷: 4, 智力: 2, 意志: 1 },
    hp: 6, ep: 3, dodge: 5, block: 6, attackBonus: 2,
    damageType: "黑暗", checkAttribute: "敏捷",
    activeAbilityIds: ["act_04"], // 暗影突袭
    passiveAbilityIds: ["pas_02", "pas_20"], // 敏捷强化, 战斗直觉
    resistances: [], vulnerabilities: ["光明"],
  },
  {
    name: "灰化贫民",
    tier: "普通级",
    category: "亡灵",
    attributes: { 力量: 2, 敏捷: 1, 智力: 1, 意志: 1 },
    hp: 7, ep: 0, dodge: 1, block: 3, attackBonus: 1,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_01"], // 猛击
    passiveAbilityIds: ["pas_25"], // 坚韧体魄
    resistances: ["黑暗"], vulnerabilities: ["光明"],
  },

  // ========== B.1：烬灯之守 ==========
  {
    name: "褪色诵经者",
    tier: "精英级",
    category: "类人生物",
    attributes: { 力量: 1, 敏捷: 2, 智力: 4, 意志: 2 },
    hp: 12, ep: 6, dodge: 3, block: 5, attackBonus: 3,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_11", "act_22"], // 黑暗侵蚀, 暗影箭
    passiveAbilityIds: ["pas_10", "pas_37"], // 心智强化, 黑暗抗性
    resistances: ["黑暗"], vulnerabilities: ["光明"],
  },

  // ========== B.2：辉徨之刃 ==========
  {
    name: "静默猎犬",
    tier: "精英级",
    category: "野兽",
    attributes: { 力量: 2, 敏捷: 5, 智力: 1, 意志: 1 },
    hp: 11, ep: 3, dodge: 6, block: 7, attackBonus: 3,
    damageType: "物理", checkAttribute: "敏捷",
    activeAbilityIds: ["act_04", "act_06"], // 暗影突袭, 双重斩击
    passiveAbilityIds: ["pas_06", "pas_30"], // 超凡敏捷, 闪避大师
    resistances: [], vulnerabilities: ["火焰"],
  },

  // ========== B.3：灰烬誓约 ==========
  {
    name: "灰化守卫",
    tier: "精英级",
    category: "构装体",
    attributes: { 力量: 4, 敏捷: 1, 智力: 1, 意志: 3 },
    hp: 15, ep: 2, dodge: 2, block: 7, attackBonus: 3,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_09", "act_13"], // 破甲打击, 狂暴挥砍
    passiveAbilityIds: ["pas_23", "pas_39"], // 格挡精通, 物理抗性
    resistances: ["物理"], vulnerabilities: ["光明"],
  },

  // ========== B.4：贵族阴影 ==========
  {
    name: "石化侍从",
    tier: "精英级",
    category: "构装体",
    attributes: { 力量: 3, 敏捷: 1, 智力: 2, 意志: 3 },
    hp: 14, ep: 4, dodge: 2, block: 8, attackBonus: 2,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_09"], // 破甲打击
    passiveAbilityIds: ["pas_23", "pas_25", "pas_39"], // 格挡精通, 坚韧体魄, 物理抗性
    resistances: ["物理"], vulnerabilities: ["闪电"],
  },

  // ========== C.1：静默之誓 ==========
  {
    name: "记忆幽灵",
    tier: "精英级",
    category: "亡灵",
    attributes: { 力量: 1, 敏捷: 3, 智力: 3, 意志: 2 },
    hp: 10, ep: 6, dodge: 5, block: 5, attackBonus: 3,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_16", "act_11"], // 灵魂收割, 黑暗侵蚀
    passiveAbilityIds: ["pas_37", "pas_20"], // 黑暗抗性, 战斗直觉
    resistances: ["物理", "黑暗"], vulnerabilities: ["光明"],
  },
  {
    name: "灰化修士",
    tier: "普通级",
    category: "类人生物",
    attributes: { 力量: 2, 敏捷: 2, 智力: 1, 意志: 2 },
    hp: 8, ep: 2, dodge: 3, block: 4, attackBonus: 2,
    damageType: "物理", checkAttribute: "敏捷",
    activeAbilityIds: ["act_15"], // 剧毒之刃
    passiveAbilityIds: ["pas_02", "pas_20"], // 敏捷强化, 战斗直觉
    resistances: [], vulnerabilities: ["火焰"],
  },

  // ========== C.2：深渊前线 ==========
  {
    name: "深渊巡航者",
    tier: "首领级",
    category: "异界生物",
    attributes: { 力量: 5, 敏捷: 2, 智力: 3, 意志: 4 },
    hp: 22, ep: 8, dodge: 3, block: 8, attackBonus: 4,
    damageType: "黑暗", checkAttribute: "力量",
    activeAbilityIds: ["act_18", "act_07"], // 旋风斩, 火焰风暴
    passiveAbilityIds: ["pas_05", "pas_24", "pas_41"], // 超凡力量, 全面防御, 神圣抗性
    resistances: ["黑暗", "火焰"], vulnerabilities: ["闪电"],
  },
  {
    name: "色彩异常体",
    tier: "精英级",
    category: "元素体",
    attributes: { 力量: 1, 敏捷: 3, 智力: 4, 意志: 1 },
    hp: 11, ep: 6, dodge: 5, block: 5, attackBonus: 3,
    damageType: "火焰", checkAttribute: "智力",
    activeAbilityIds: ["act_07", "act_26"], // 火焰风暴, 烈焰风暴(意志)
    passiveAbilityIds: ["pas_40", "pas_27"], // 元素抗性, 魔法亲和
    resistances: ["火焰", "冰霜"], vulnerabilities: ["黑暗"],
  },

  // ========== C.3：褪色者之路 ==========
  {
    name: "灰化审判者",
    tier: "精英级",
    category: "类人生物",
    attributes: { 力量: 2, 敏捷: 2, 智力: 3, 意志: 4 },
    hp: 13, ep: 5, dodge: 3, block: 6, attackBonus: 3,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_11", "act_12"], // 黑暗侵蚀, 光明审判
    passiveAbilityIds: ["pas_10", "pas_38"], // 心智强化, 光明抗性
    resistances: ["光明"], vulnerabilities: ["黑暗"],
  },
  {
    name: "完全灰化者",
    tier: "首领级",
    category: "亡灵",
    attributes: { 力量: 4, 敏捷: 2, 智力: 2, 意志: 5 },
    hp: 20, ep: 5, dodge: 3, block: 8, attackBonus: 4,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_13", "act_18"], // 狂暴挥砍, 旋风斩
    passiveAbilityIds: ["pas_25", "pas_37", "pas_49"], // 坚韧体魄, 黑暗抗性, 武器大师
    resistances: ["黑暗", "物理"], vulnerabilities: ["光明"],
  },

  // ========== C.4：倒转黑塔 ==========
  {
    name: "贵族亲卫",
    tier: "精英级",
    category: "类人生物",
    attributes: { 力量: 3, 敏捷: 3, 智力: 2, 意志: 2 },
    hp: 14, ep: 4, dodge: 4, block: 6, attackBonus: 3,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_06", "act_09"], // 双重斩击, 破甲打击
    passiveAbilityIds: ["pas_24", "pas_43"], // 全面防御, 伤害减免
    resistances: ["物理"], vulnerabilities: ["黑暗"],
  },
  {
    name: "时间残像",
    tier: "精英级",
    category: "异界生物",
    attributes: { 力量: 1, 敏捷: 4, 智力: 3, 意志: 3 },
    hp: 10, ep: 7, dodge: 6, block: 5, attackBonus: 3,
    damageType: "闪电", checkAttribute: "敏捷",
    activeAbilityIds: ["act_14", "act_24"], // 雷电冲击, 连环闪电
    passiveAbilityIds: ["pas_06", "pas_45"], // 超凡敏捷, 闪电抗性
    resistances: ["闪电"], vulnerabilities: ["光明"],
  },

  // ========== C.5：灰色集市 ==========
  {
    name: "集市盗贼",
    tier: "普通级",
    category: "类人生物",
    attributes: { 力量: 1, 敏捷: 4, 智力: 2, 意志: 1 },
    hp: 6, ep: 3, dodge: 5, block: 4, attackBonus: 2,
    damageType: "物理", checkAttribute: "敏捷",
    activeAbilityIds: ["act_04", "act_10"], // 暗影突袭, 精准射击
    passiveAbilityIds: ["pas_02", "pas_20"], // 敏捷强化, 战斗直觉
    resistances: [], vulnerabilities: [],
  },
  {
    name: "颜料幻见",
    tier: "精英级",
    category: "元素体",
    attributes: { 力量: 1, 敏捷: 4, 智力: 3, 意志: 2 },
    hp: 11, ep: 6, dodge: 6, block: 5, attackBonus: 3,
    damageType: "冰霜", checkAttribute: "智力",
    activeAbilityIds: ["act_08", "act_19"], // 冰霜新星, 冰冻射线
    passiveAbilityIds: ["pas_06", "pas_36"], // 超凡敏捷, 冰霜抗性
    resistances: ["冰霜"], vulnerabilities: ["火焰"],
  },

  // ========== D.1：结界永续 ==========
  {
    name: "结界干扰者",
    tier: "首领级",
    category: "异界生物",
    attributes: { 力量: 3, 敏捷: 3, 智力: 4, 意志: 3 },
    hp: 19, ep: 8, dodge: 4, block: 7, attackBonus: 4,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_11", "act_16", "act_25"], // 黑暗侵蚀, 灵魂收割, 噬魂斩
    passiveAbilityIds: ["pas_10", "pas_37", "pas_74"], // 心智强化, 黑暗抗性, 生命汲取
    resistances: ["黑暗"], vulnerabilities: ["光明"],
  },

  // ========== D.2：色谱重构 ==========
  {
    name: "色谱异常体（强化版）",
    tier: "首领级",
    category: "元素体",
    attributes: { 力量: 2, 敏捷: 3, 智力: 5, 意志: 3 },
    hp: 18, ep: 10, dodge: 4, block: 7, attackBonus: 4,
    damageType: "火焰", checkAttribute: "智力",
    activeAbilityIds: ["act_07", "act_26", "act_27"], // 火焰风暴, 烈焰风暴, 霜冻之环
    passiveAbilityIds: ["pas_15", "pas_42", "pas_27"], // 完美平衡, 全元素抗性, 魔法亲和
    resistances: ["火焰", "冰霜", "光明"], vulnerabilities: ["黑暗"],
  },

  // ========== D.3：存在稀释 ==========
  {
    name: "抵抗者幽灵",
    tier: "精英级",
    category: "亡灵",
    attributes: { 力量: 1, 敏捷: 2, 智力: 3, 意志: 5 },
    hp: 12, ep: 7, dodge: 3, block: 5, attackBonus: 3,
    damageType: "黑暗", checkAttribute: "意志",
    activeAbilityIds: ["act_16", "act_25"], // 灵魂收割, 噬魂斩
    passiveAbilityIds: ["pas_08", "pas_37", "pas_74"], // 超凡意志, 黑暗抗性, 生命汲取
    resistances: ["黑暗"], vulnerabilities: ["光明"],
  },

  // ========== D.4：伊拉礼之泪 ==========
  {
    name: "烬灯守卫",
    tier: "精英级",
    category: "类人生物",
    attributes: { 力量: 3, 敏捷: 2, 智力: 2, 意志: 4 },
    hp: 14, ep: 5, dodge: 3, block: 7, attackBonus: 3,
    damageType: "光明", checkAttribute: "力量",
    activeAbilityIds: ["act_23", "act_12"], // 神圣之锤, 光明审判
    passiveAbilityIds: ["pas_11", "pas_38", "pas_49"], // 体魄强化, 光明抗性, 武器大师
    resistances: ["光明"], vulnerabilities: ["黑暗"],
  },
  {
    name: "辉徨战士",
    tier: "精英级",
    category: "类人生物",
    attributes: { 力量: 4, 敏捷: 3, 智力: 1, 意志: 2 },
    hp: 13, ep: 3, dodge: 4, block: 4, attackBonus: 4,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_09", "act_13", "act_21"], // 破甲打击, 狂暴挥砍, 雷霆一击
    passiveAbilityIds: ["pas_05", "pas_49"], // 超凡力量, 武器大师
    resistances: [], vulnerabilities: [],
  },

  // ========== D.5：双生融合 ==========
  {
    name: "双生异常体",
    tier: "首领级",
    category: "元素体",
    attributes: { 力量: 3, 敏捷: 3, 智力: 4, 意志: 3 },
    hp: 18, ep: 8, dodge: 4, block: 7, attackBonus: 4,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_11", "act_12", "act_25"], // 黑暗侵蚀, 光明审判, 噬魂斩
    passiveAbilityIds: ["pas_15", "pas_41", "pas_74"], // 完美平衡, 神圣抗性, 生命汲取
    resistances: ["光明", "黑暗"], vulnerabilities: ["物理"],
  },

  // ========== E.1：烛火长明 ==========
  {
    name: "灰蚀巨兽",
    tier: "领主级",
    category: "异界生物",
    attributes: { 力量: 6, 敏捷: 2, 智力: 3, 意志: 6 },
    hp: 30, ep: 10, dodge: 4, block: 10, attackBonus: 6,
    damageType: "黑暗", checkAttribute: "力量",
    activeAbilityIds: ["act_18", "act_07", "act_26"], // 旋风斩, 火焰风暴, 烈焰风暴
    passiveAbilityIds: ["pas_16", "pas_24", "pas_41", "pas_76"], // 极限力量, 全面防御, 神圣抗性, 噬魂者
    resistances: ["黑暗", "火焰", "冰霜"], vulnerabilities: ["光明"],
  },

  // ========== E.3：灰色黎明 ==========
  {
    name: "抵抗者之影",
    tier: "领主级",
    category: "亡灵",
    attributes: { 力量: 2, 敏捷: 4, 智力: 4, 意志: 7 },
    hp: 25, ep: 12, dodge: 5, block: 8, attackBonus: 5,
    damageType: "黑暗", checkAttribute: "意志",
    activeAbilityIds: ["act_16", "act_25", "act_11"], // 灵魂收割, 噬魂斩, 黑暗侵蚀
    passiveAbilityIds: ["pas_08", "pas_37", "pas_76", "pas_30"], // 超凡意志, 黑暗抗性, 噬魂者, 闪避大师
    resistances: ["黑暗", "光明"], vulnerabilities: ["物理"],
  },

  // ========== E.4：第三种色彩 ==========
  {
    name: "旧世界守护者",
    tier: "领主级",
    category: "构装体",
    attributes: { 力量: 6, 敏捷: 1, 智力: 2, 意志: 6 },
    hp: 32, ep: 6, dodge: 2, block: 12, attackBonus: 5,
    damageType: "物理", checkAttribute: "力量",
    activeAbilityIds: ["act_09", "act_13", "act_18"], // 破甲打击, 狂暴挥砍, 旋风斩
    passiveAbilityIds: ["pas_16", "pas_23", "pas_39", "pas_31"], // 极限力量, 格挡精通, 物理抗性, 格挡大师
    resistances: ["物理", "火焰"], vulnerabilities: ["闪电"],
  },

  // ========== E.5：孤独守望 ==========
  {
    name: "封印抵抗者",
    tier: "首领级",
    category: "类人生物",
    attributes: { 力量: 2, 敏捷: 3, 智力: 4, 意志: 4 },
    hp: 17, ep: 7, dodge: 4, block: 6, attackBonus: 4,
    damageType: "黑暗", checkAttribute: "智力",
    activeAbilityIds: ["act_11", "act_16", "act_25"], // 黑暗侵蚀, 灵魂收割, 噬魂斩
    passiveAbilityIds: ["pas_10", "pas_37", "pas_74"], // 心智强化, 黑暗抗性, 生命汲取
    resistances: ["黑暗"], vulnerabilities: ["光明"],
  },
];

// ------------------------------------------------------------------
// 内部辅助
// ------------------------------------------------------------------

const MONSTER_MAP = new Map<string, MonsterBlueprint>();
for (const m of GRAY_CORROSION_MONSTERS) {
  MONSTER_MAP.set(m.name, m);
}

function findAbility<T extends { id: string }>(pool: T[], id: string): T | undefined {
  return pool.find((a) => a.id === id);
}

function cloneAbility<T>(ability: T): T {
  return JSON.parse(JSON.stringify(ability));
}

/** 根据难度微调怪物属性 */
function applyDifficulty(bp: MonsterBlueprint, difficulty: DungeonDifficulty): MonsterBlueprint {
  if (difficulty === "简单") {
    return {
      ...bp,
      hp: Math.max(1, Math.floor(bp.hp * 0.8)),
      attackBonus: Math.max(0, bp.attackBonus - 1),
    };
  }
  if (difficulty === "死亡") {
    return {
      ...bp,
      hp: Math.floor(bp.hp * 1.3),
      attackBonus: bp.attackBonus + 1,
      dodge: bp.dodge + 1,
    };
  }
  // 困难 = 不变
  return bp;
}

/** 将蓝图实例化为 Monster */
function instantiateMonster(bp: MonsterBlueprint, index: number): Monster {
  const actives: ActiveAbility[] = [];
  for (const id of bp.activeAbilityIds) {
    const ability = findAbility(ACTIVE_ABILITIES, id);
    if (ability) actives.push(cloneAbility(ability));
  }

  const passives: PassiveAbility[] = [];
  for (const id of bp.passiveAbilityIds) {
    const ability = findAbility(PASSIVE_ABILITIES, id);
    if (ability) passives.push(cloneAbility(ability));
  }

  return {
    id: `dungeon_mon_${Date.now()}_${index}`,
    name: bp.name,
    tier: bp.tier,
    category: bp.category,
    attributes: { ...bp.attributes },
    hp: bp.hp,
    maxHp: bp.hp,
    ep: bp.ep,
    maxEp: bp.ep,
    dodge: bp.dodge,
    block: bp.block,
    resistances: [...bp.resistances],
    vulnerabilities: [...bp.vulnerabilities],
    checkAttribute: bp.checkAttribute,
    attackBonus: bp.attackBonus,
    damageType: bp.damageType,
    activeAbilities: actives,
    passiveAbilities: passives,
  };
}

// ------------------------------------------------------------------
// 公共 API
// ------------------------------------------------------------------

/** 根据怪物名字获取蓝图（未应用难度） */
export function getMonsterBlueprint(name: string): MonsterBlueprint | undefined {
  return MONSTER_MAP.get(name);
}

/** 获取灰蚀大陆所有怪物名称列表（用于 AI Prompt） */
export function getAllDungeonMonsterNames(): string[] {
  return Array.from(MONSTER_MAP.keys());
}

/**
 * 解析战斗标记中的敌人列表，实例化为完整 Monster 对象。
 * 支持格式：["回声", "灰化贫民×3"]
 */
export function resolveCombatEnemies(
  enemyNames: string[],
  difficulty: DungeonDifficulty = "困难"
): { monsters: Monster[]; missing: string[] } {
  const monsters: Monster[] = [];
  const missing: string[] = [];
  let index = 0;

  for (const raw of enemyNames) {
    const qtyMatch = raw.match(/(.+?)[\u00D7xX](\d+)/);
    const name = qtyMatch ? qtyMatch[1].trim() : raw.trim();
    const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[2], 10)) : 1;

    const blueprint = MONSTER_MAP.get(name);
    if (!blueprint) {
      missing.push(name);
      continue;
    }

    const adjusted = applyDifficulty(blueprint, difficulty);
    for (let i = 0; i < qty; i++) {
      monsters.push(instantiateMonster(adjusted, index++));
    }
  }

  return { monsters, missing };
}
