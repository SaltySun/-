import type { ActiveAbility, PassiveAbility, DamageType } from "./types";
import { ACTIVE_ABILITIES, PASSIVE_ABILITIES } from "./abilities";

// ========================================
// 类型化能力池系统
// 装备/血统/职业按主题类型从对应池中抽取能力
// ========================================

export type WeaponTheme =
  | "物理系" | "火焰系" | "冰霜系" | "闪电系" | "黑暗系" | "光明系";

export type CareerTheme =
  | "战斗大师" | "暗影行者" | "元素使" | "圣骑士" | "狂战士" | "守护者" | "游侠" | "战术家";

export type BloodlineTheme =
  | "蛮荒血脉" | "精灵王族" | "恶魔之血" | "天使遗孤" | "龙血后裔" | "虚空行者" | "元素之子" | "亡灵共生";

export type ArmorTheme =
  | "轻甲灵动" | "中甲均衡" | "重甲堡垒";

// ---------- 伤害类型 → 武器主题 ----------
export function damageTypeToWeaponTheme(dt: DamageType): WeaponTheme {
  switch (dt) {
    case "物理": return "物理系";
    case "火焰": return "火焰系";
    case "冰霜": return "冰霜系";
    case "闪电": return "闪电系";
    case "黑暗": return "黑暗系";
    case "光明": return "光明系";
  }
}

// ---------- 主动能力分类 ----------
function classifyActiveAbility(a: ActiveAbility): {
  damageTypes: DamageType[];
  isPhysical: boolean;
  isFire: boolean;
  isIce: boolean;
  isLightning: boolean;
  isDark: boolean;
  isLight: boolean;
  isHeal: boolean;
  isBuff: boolean;
  isDebuff: boolean;
  isArea: boolean;
} {
  const effect = a.effect;
  const types: DamageType[] = [];
  let isPhysical = false, isFire = false, isIce = false;
  let isLightning = false, isDark = false, isLight = false;
  let isHeal = false, isBuff = false, isDebuff = false, isArea = false;

  if (effect.type === "damage" || effect.type === "combo") {
    const dt = (effect as { damageType?: DamageType }).damageType;
    if (dt) {
      types.push(dt);
      if (dt === "物理") isPhysical = true;
      if (dt === "火焰") isFire = true;
      if (dt === "冰霜") isIce = true;
      if (dt === "闪电") isLightning = true;
      if (dt === "黑暗") isDark = true;
      if (dt === "光明") isLight = true;
    }
    const attr = (effect as { attribute?: string }).attribute;
    if (attr === "力量" || attr === "敏捷") isPhysical = true;
  }

  if (effect.type === "heal") isHeal = true;
  if (effect.type.startsWith("buff")) isBuff = true;
  if (effect.type.startsWith("debuff")) isDebuff = true;
  if (a.target === "所有敌对单位" || a.target === "所有友方单位" || a.target === "所有单位") isArea = true;

  // 增益中的抗性分类
  if (effect.type === "buff_resistance") {
    const dts = (effect as { damageTypes: DamageType[] }).damageTypes;
    for (const dt of dts) {
      types.push(dt);
      if (dt === "物理") isPhysical = true;
      if (dt === "火焰") isFire = true;
      if (dt === "冰霜") isIce = true;
      if (dt === "闪电") isLightning = true;
      if (dt === "黑暗") isDark = true;
      if (dt === "光明") isLight = true;
    }
  }

  // 减益中的易伤分类
  if (effect.type === "debuff_vulnerable") {
    const dts = (effect as { damageTypes: DamageType[] }).damageTypes;
    for (const dt of dts) {
      types.push(dt);
      if (dt === "物理") isPhysical = true;
      if (dt === "火焰") isFire = true;
      if (dt === "冰霜") isIce = true;
      if (dt === "闪电") isLightning = true;
      if (dt === "黑暗") isDark = true;
      if (dt === "光明") isLight = true;
    }
  }

  return { damageTypes: types, isPhysical, isFire, isIce, isLightning, isDark, isLight, isHeal, isBuff, isDebuff, isArea };
}

// ---------- 被动能力分类 ----------
function classifyPassiveAbility(p: PassiveAbility): {
  isPhysical: boolean;
  isFire: boolean;
  isIce: boolean;
  isLightning: boolean;
  isDark: boolean;
  isLight: boolean;
  isDefensive: boolean;
  isOffensive: boolean;
  isLife: boolean;
  isEnergy: boolean;
  isStr: boolean;
  isAgi: boolean;
  isInt: boolean;
  isWil: boolean;
} {
  const e = p.effect;
  let isPhysical = false, isFire = false, isIce = false;
  let isLightning = false, isDark = false, isLight = false;
  let isDefensive = false, isOffensive = false;
  let isLife = false, isEnergy = false;
  let isStr = false, isAgi = false, isInt = false, isWil = false;

  if (e.type === "attribute") {
    if (e.attribute === "力量") isStr = isPhysical = true;
    if (e.attribute === "敏捷") isAgi = true;
    if (e.attribute === "智力") isInt = true;
    if (e.attribute === "意志") isWil = true;
  }

  if (e.type === "resistance") {
    isDefensive = true;
    for (const dt of e.damageTypes) {
      if (dt === "物理") isPhysical = true;
      if (dt === "火焰") isFire = true;
      if (dt === "冰霜") isIce = true;
      if (dt === "闪电") isLightning = true;
      if (dt === "黑暗") isDark = true;
      if (dt === "光明") isLight = true;
    }
  }

  if (e.type === "vulnerable") {
    for (const dt of e.damageTypes) {
      if (dt === "物理") isPhysical = true;
      if (dt === "火焰") isFire = true;
      if (dt === "冰霜") isIce = true;
      if (dt === "闪电") isLightning = true;
      if (dt === "黑暗") isDark = true;
      if (dt === "光明") isLight = true;
    }
  }

  if (e.type === "dodge" || e.type === "block") isDefensive = true;
  if (e.type === "attack") isOffensive = true;
  if (e.type === "max_hp") isLife = true;
  if (e.type === "max_energy") isEnergy = true;
  if (e.type === "life_steal") { isDark = true; isLife = true; }
  if (e.type === "energy_steal") { isDark = true; isEnergy = true; }
  if (e.type === "monster_attack_bonus") isOffensive = true;

  return { isPhysical, isFire, isIce, isLightning, isDark, isLight, isDefensive, isOffensive, isLife, isEnergy, isStr, isAgi, isInt, isWil };
}

// ========================================
// 武器能力池
// ========================================

export const WEAPON_POOLS: Record<WeaponTheme, { actives: ActiveAbility[]; passives: PassiveAbility[] }> = {
  物理系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isPhysical;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isPhysical || c.isOffensive || c.isStr || c.isAgi;
    }),
  },
  火焰系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isFire;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isFire || c.isOffensive;
    }),
  },
  冰霜系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isIce;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isIce || c.isDefensive;
    }),
  },
  闪电系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isLightning;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isLightning || c.isAgi || c.isOffensive;
    }),
  },
  黑暗系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDark;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDark || c.isLife || c.isEnergy;
    }),
  },
  光明系: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isLight || c.isHeal;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isLight || c.isDefensive || c.isHeal || c.isWil;
    }),
  },
};

// ========================================
// 职业能力池
// ========================================

export const CAREER_POOLS: Record<CareerTheme, { actives: ActiveAbility[]; passives: PassiveAbility[] }> = {
  战斗大师: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isPhysical && !c.isHeal && !c.isArea;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isOffensive || c.isStr || c.isPhysical;
    }),
  },
  暗影行者: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDark || (c.isPhysical && (a.effect.type === "combo" || a.costType === "生命值"));
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDark || c.isAgi || c.isOffensive;
    }),
  },
  元素使: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isFire || c.isIce || c.isLightning || c.isArea;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isFire || c.isIce || c.isLightning || c.isInt;
    }),
  },
  圣骑士: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isLight || c.isHeal || c.isBuff;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isLight || c.isDefensive || c.isWil;
    }),
  },
  狂战士: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isPhysical && (a.costType === "生命值" || c.isDebuff);
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isStr || c.isOffensive || c.isLife;
    }),
  },
  守护者: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isBuff || c.isHeal || c.isDebuff;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDefensive || c.isLife || c.isStr;
    }),
  },
  游侠: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return (c.isPhysical && a.target === "敌对单位") || c.isDebuff;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isAgi || c.isOffensive || c.isDefensive;
    }),
  },
  战术家: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDebuff || c.isBuff || c.isArea;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isInt || c.isWil || c.isOffensive || c.isDefensive;
    }),
  },
};

// ========================================
// 血统能力池
// ========================================

export const BLOODLINE_POOLS: Record<BloodlineTheme, { actives: ActiveAbility[]; passives: PassiveAbility[] }> = {
  蛮荒血脉: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isPhysical && a.costType === "生命值";
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isStr || c.isLife || c.isPhysical;
    }),
  },
  精灵王族: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isAgi || c.isDebuff || c.isBuff;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isAgi || c.isDefensive;
    }),
  },
  恶魔之血: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDark;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDark || c.isLife || c.isEnergy;
    }),
  },
  天使遗孤: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isLight || c.isHeal;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isLight || c.isDefensive || c.isWil;
    }),
  },
  龙血后裔: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isFire || c.isArea;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isFire || c.isStr || c.isLife;
    }),
  },
  虚空行者: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDark || c.isDebuff;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDark || c.isInt || c.isEnergy;
    }),
  },
  元素之子: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isFire || c.isIce || c.isLightning;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isFire || c.isIce || c.isLightning || c.isInt;
    }),
  },
  亡灵共生: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isDark || c.isHeal;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDark || c.isLife || c.isEnergy;
    }),
  },
};

// ========================================
// 护甲能力池
// ========================================

export const ARMOR_POOLS: Record<ArmorTheme, { actives: ActiveAbility[]; passives: PassiveAbility[] }> = {
  轻甲灵动: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isBuff && (c.isAgi || a.name.includes("闪避"));
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isAgi || (c.isDefensive && !c.isStr);
    }),
  },
  中甲均衡: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isBuff || c.isHeal;
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isDefensive || c.isOffensive;
    }),
  },
  重甲堡垒: {
    actives: ACTIVE_ABILITIES.filter((a) => {
      const c = classifyActiveAbility(a);
      return c.isBuff && (a.name.includes("护甲") || a.name.includes("护盾"));
    }),
    passives: PASSIVE_ABILITIES.filter((p) => {
      const c = classifyPassiveAbility(p);
      return c.isStr || c.isLife || c.isDefensive;
    }),
  },
};

// ========================================
// 主题名称生成库
// ========================================

export const WEAPON_THEME_NAMES: Record<WeaponTheme, { prefixes: string[]; suffixes: string[] }> = {
  物理系: { prefixes: ["精钢", "战痕", "破军", "锐锋", "铁骨", "碎骨", "裂魂"], suffixes: ["之刃", "短剑", "大剑", "战斧", "长枪", "战戟", "斩马刀"] },
  火焰系: { prefixes: ["熔岩", "烈焰", "焚心", "炎铸", "赤红", "灰烬", "熔火"], suffixes: ["之刃", "短刀", "长剑", "战斧", "魔杖", "符文", "之触"] },
  冰霜系: { prefixes: ["霜冻", "寒冰", "极寒", "冰晶", "雪魄", "霜噬", "凛冬"], suffixes: ["之刃", "短剑", "长弓", "魔典", "符文", "之触", "之环"] },
  闪电系: { prefixes: ["雷霆", "电弧", "风暴", "闪击", "天罚", "雷罚", "霆击"], suffixes: ["之刃", "长枪", "战戟", "法杖", "符文", "之触", "之矛"] },
  黑暗系: { prefixes: ["暗影", "噬魂", "堕落", "虚空", "诅咒", "噬灭", "永夜"], suffixes: ["之刃", "匕首", "镰刀", "魔典", "符文", "之触", "之牙"] },
  光明系: { prefixes: ["圣光", "晨曦", "辉煌", "天启", "神圣", "辉耀", "净世"], suffixes: ["之刃", "长剑", "战锤", "法杖", "圣典", "之触", "之裁决"] },
};

export const CAREER_THEME_NAMES: Record<CareerTheme, string[]> = {
  战斗大师: ["战斗大师", "武道家", "武器专家", "格斗宗师", "兵器使"],
  暗影行者: ["暗影行者", "夜刃", "影舞者", "刺客", "暗杀者"],
  元素使: ["元素使", "元素法师", "奥术师", "咒术师", "元素掌控者"],
  圣骑士: ["圣骑士", "圣殿骑士", "光明卫士", "神圣战士", "正义执行者"],
  狂战士: ["狂战士", "血怒者", "战狂", " berserker", "暴怒战士"],
  守护者: ["守护者", "铁壁", "盾卫", "堡垒", "守护者"],
  游侠: ["游侠", "猎手", "巡林客", "神射手", "荒野行者"],
  战术家: ["战术家", "指挥官", "军师", "谋略家", "战场统帅"],
};

export const BLOODLINE_THEME_NAMES: Record<BloodlineTheme, string[]> = {
  蛮荒血脉: ["蛮荒血脉", "泰坦之血", "兽王血统", "原始之力", "远古战魂"],
  精灵王族: ["精灵王族", "高等精灵", "月神后裔", "森林之子", "银月血脉"],
  恶魔之血: ["恶魔之血", "深渊血脉", "魔裔", "地狱之子", "堕落之血"],
  天使遗孤: ["天使遗孤", "圣血", "天界遗民", "光辉后裔", "神恩之血"],
  龙血后裔: ["龙血后裔", "龙之血脉", "龙裔", "炎龙之子", "远古龙血"],
  虚空行者: ["虚空行者", "虚空血脉", "星界遗民", "次元之子", "虚空之触"],
  元素之子: ["元素之子", "元素共鸣", "原初元素", "自然之子", "元素亲和"],
  亡灵共生: ["亡灵共生", "死亡契约", "不死者", "幽冥之血", "亡者之息"],
};

export const ARMOR_THEME_NAMES: Record<ArmorTheme, { prefixes: string[]; suffixes: string[] }> = {
  轻甲灵动: { prefixes: ["影织", "风语", "猎鹰", "夜行", "幽灵"], suffixes: ["斗篷", "皮甲", "战衣", "猎装", "游侠服"] },
  中甲均衡: { prefixes: ["钢铁", "护卫", "战士", "骑士", "荣耀"], suffixes: ["链甲", "胸甲", "战袍", "护卫铠", "武士甲"] },
  重甲堡垒: { prefixes: ["堡垒", "泰坦", "龙鳞", "圣盾", "铁壁"], suffixes: ["板甲", "堡垒铠", "重盔", "铁壁甲", "龙鳞铠"] },
};

// ========================================
// 抽取辅助函数
// ========================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function pickMany<T>(arr: T[], count: number, unique = true): T[] {
  if (!unique) return Array.from({ length: count }, () => pickOne(arr));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function pickByScoreRange<T extends { score: number }>(
  pool: T[],
  count: number,
  minScore: number,
  maxScore: number
): T[] {
  const filtered = pool.filter((a) => a.score >= minScore && a.score <= maxScore);
  return pickMany(filtered, count);
}

// ---------- 品质 → 评分范围 ----------
export function getScoreRangeByQuality(quality: "普通" | "不凡" | "稀有" | "传说"): [number, number] {
  switch (quality) {
    case "普通": return [1, 3];
    case "不凡": return [2, 5];
    case "稀有": return [3, 6];
    case "传说": return [4, 8];
  }
}

// ---------- 品质 → 能力槽位 ----------
export function getAbilitySlotsByQuality(quality: "普通" | "不凡" | "稀有" | "传说"): { passive: number; active: number } {
  switch (quality) {
    case "普通": return { passive: 0, active: 0 };
    case "不凡": return { passive: 1, active: 0 };
    case "稀有": return { passive: 1, active: 1 };
    case "传说": return { passive: 2, active: 1 };
  }
}

// ---------- 从类型池抽取能力 ----------
export function drawAbilitiesFromPool<T extends { score: number }>(
  pool: T[],
  count: number,
  minScore: number,
  maxScore: number
): T[] {
  const filtered = pool.filter((a) => a.score >= minScore && a.score <= maxScore);
  if (filtered.length === 0) {
    // 降级：放宽评分范围
    const relaxed = pool.filter((a) => a.score >= Math.max(1, minScore - 2) && a.score <= maxScore);
    return pickMany(relaxed, count);
  }
  return pickMany(filtered, count);
}

// ---------- 能力池降级回退（确保不空） ----------
export function drawWithFallback<T extends { score: number }>(
  themedPool: T[],
  globalPool: T[],
  count: number,
  minScore: number,
  maxScore: number
): T[] {
  const themed = drawAbilitiesFromPool(themedPool, count, minScore, maxScore);
  if (themed.length >= count) return themed;
  const remaining = count - themed.length;
  const fallback = drawAbilitiesFromPool(globalPool, remaining, minScore, maxScore);
  return [...themed, ...fallback];
}
