import type {
  Weapon,
  Armor,
  Bloodline,
  Career,
  Monster,
  Companion,
  EquipmentQuality,
  BloodlineRarity,
  CareerTier,
  MonsterTier,
  Attribute,
  DamageType,
  WeaponCategory,
  ArmorType,
  MonsterCategory,
} from "./types";
import { ACTIVE_ABILITIES, PASSIVE_ABILITIES, getAbilitySlots } from "./abilities";

// ========================================
// 随机生成器核心
// ========================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function pickMany<T>(arr: T[], count: number, unique = true): T[] {
  if (!unique) {
    return Array.from({ length: count }, () => pickOne(arr));
  }
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

// ========================================
// 品质与评分范围映射
// ========================================

function getQualityScoreRange(quality: EquipmentQuality): [number, number] {
  switch (quality) {
    case "普通":
      return [1, 4];
    case "不凡":
      return [2, 5];
    case "稀有":
      return [3, 6];
    case "传说":
      return [4, 8];
  }
}

function getBloodlineScoreRange(rarity: BloodlineRarity): [number, number] {
  switch (rarity) {
    case "稀有":
      return [1, 5];
    case "超凡":
      return [2, 6];
    case "神话":
      return [3, 8];
  }
}

function getCareerScoreRange(tier: CareerTier): [number, number] {
  switch (tier) {
    case "基础":
      return [1, 4];
    case "进阶":
      return [2, 6];
    case "大师":
      return [3, 8];
  }
}

// ========================================
// 武器名称库
// ========================================

const WEAPON_PREFIXES: Record<DamageType, string[]> = {
  物理: ["精钢", "战痕", "破军", "锐锋", "铁骨"],
  火焰: ["熔岩", "烈焰", "焚心", "炎铸", "赤红"],
  冰霜: ["霜冻", "寒冰", "极寒", "冰晶", "雪魄"],
  闪电: ["雷霆", "电弧", "风暴", "闪击", "天罚"],
  黑暗: ["暗影", "噬魂", "堕落", "虚空", "诅咒"],
  光明: ["圣光", "晨曦", "辉煌", "天启", "神圣"],
};

const WEAPON_SUFFIXES: Record<WeaponCategory, string[]> = {
  轻型: ["短剑", "匕首", "手斧", "弯刀", "爪刃"],
  重型: ["大剑", "战斧", "巨锤", "斩马刀", "重刃"],
  长柄: ["长枪", "战戟", "关刀", "镰矛", "长柄斧"],
  远程: ["长弓", "猎弩", "投矛", "弹弓", "飞刀"],
  法器: ["法杖", "魔典", "水晶球", "符文石", "图腾"],
};

function generateWeaponName(quality: EquipmentQuality, category: WeaponCategory, damageType: DamageType): string {
  const prefix = pickOne(WEAPON_PREFIXES[damageType]);
  const suffix = pickOne(WEAPON_SUFFIXES[category]);
  const qualityLabel = quality === "普通" ? "" : `【${quality}】`;
  return `${qualityLabel}${prefix}${suffix}`;
}

// ========================================
// 护甲名称库
// ========================================

const ARMOR_PREFIXES = ["皮革", "链甲", "板甲", "鳞甲", "布袍", "战铠", "影织", "圣纹"];
const ARMOR_SUFFIXES: Record<ArmorType, string[]> = {
  轻甲: ["斗篷", "皮甲", "战衣", "猎装", "游侠服"],
  中甲: ["链甲", "胸甲", "战袍", "护卫铠", "武士甲"],
  重甲: ["板甲", "堡垒铠", "重盔", "铁壁甲", "龙鳞铠"],
};

function generateArmorName(quality: EquipmentQuality, type: ArmorType): string {
  const prefix = pickOne(ARMOR_PREFIXES);
  const suffix = pickOne(ARMOR_SUFFIXES[type]);
  const qualityLabel = quality === "普通" ? "" : `【${quality}】`;
  return `${qualityLabel}${prefix}${suffix}`;
}

// ========================================
// 血统名称库
// ========================================

const BLOODLINE_NAMES = [
  "龙血后裔", "精灵王族", "恶魔混血", "天使遗孤", "狼人之血",
  "吸血鬼裔", "泰坦血脉", "影族遗民", "元素之子", "亡灵共生",
  "古神眷族", "机械融合", "虚空行者", "圣光选民", "深渊凝视",
];

// ========================================
// 职业名称库
// ========================================

const CAREER_NAMES: Record<CareerTier, string[]> = {
  基础: ["战士", "游侠", "法师", "牧师", "盗贼", "骑士"],
  进阶: ["剑圣", "魔弓手", "元素使", "圣骑士", "暗影刺客", "狂战士"],
  大师: ["战神", "大贤者", "弑神者", "光暗主宰", "虚空领主", "龙骑士"],
};

// ========================================
// 护甲基础属性表
// ========================================

const ARMOR_BASE_STATS: Record<
  EquipmentQuality,
  Record<ArmorType, { dodge: number; block: number; stealth: number; athletics: number; initiative: number }>
> = {
  普通: {
    轻甲: { dodge: 2, block: 1, stealth: 2, athletics: 0, initiative: 1 },
    中甲: { dodge: 1, block: 2, stealth: 0, athletics: 0, initiative: 0 },
    重甲: { dodge: -2, block: 4, stealth: -1, athletics: -1, initiative: -2 },
  },
  不凡: {
    轻甲: { dodge: 2, block: 2, stealth: 2, athletics: 1, initiative: 1 },
    中甲: { dodge: 1, block: 3, stealth: 1, athletics: 0, initiative: 0 },
    重甲: { dodge: -2, block: 5, stealth: -1, athletics: -1, initiative: -2 },
  },
  稀有: {
    轻甲: { dodge: 2, block: 3, stealth: 2, athletics: 1, initiative: 2 },
    中甲: { dodge: 1, block: 4, stealth: 1, athletics: 0, initiative: 1 },
    重甲: { dodge: -2, block: 6, stealth: -1, athletics: 0, initiative: -1 },
  },
  传说: {
    轻甲: { dodge: 2, block: 4, stealth: 2, athletics: 1, initiative: 2 },
    中甲: { dodge: 1, block: 5, stealth: 1, athletics: 0, initiative: 1 },
    重甲: { dodge: -2, block: 7, stealth: -1, athletics: 0, initiative: -1 },
  },
};

// ========================================
// 武器生成器
// ========================================

export function generateWeapon(quality: EquipmentQuality, overrideCategory?: WeaponCategory): Weapon {
  const category = overrideCategory ?? pickOne<WeaponCategory>(["轻型", "重型", "长柄", "远程", "法器"]);
  const damageType = pickOne<DamageType>(["物理", "火焰", "冰霜", "闪电", "黑暗", "光明"]);
  const attrMap: Record<WeaponCategory, Attribute> = {
    轻型: "敏捷",
    重型: "力量",
    长柄: "力量",
    远程: "敏捷",
    法器: "智力",
  };
  const checkAttr = attrMap[category];
  const [minScore, maxScore] = getQualityScoreRange(quality);
  const slots = getAbilitySlots(quality);

  const weaponBonus = quality === "普通" ? randInt(0, 1) : quality === "不凡" ? randInt(0, 2) : randInt(1, 3);
  const price = (quality === "普通" ? 100 : quality === "不凡" ? 300 : quality === "稀有" ? 800 : 2000) + randInt(-50, 50);

  const passives = pickByScoreRange(PASSIVE_ABILITIES, slots.passive, minScore, maxScore);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, slots.active, minScore, maxScore);

  return {
    id: `wep_${Date.now()}_${randInt(1000, 9999)}`,
    name: generateWeaponName(quality, category, damageType),
    quality,
    category,
    checkAttribute: checkAttr,
    weaponBonus,
    damageType,
    passiveAbilities: passives,
    activeAbilities: actives,
    price,
    description: `一柄${quality}的${category}武器，蕴含${damageType}之力。`,
  };
}

// ========================================
// 护甲生成器
// ========================================

export function generateArmor(quality: EquipmentQuality, overrideType?: ArmorType): Armor {
  const type = overrideType ?? pickOne<ArmorType>(["轻甲", "中甲", "重甲"]);
  const stats = ARMOR_BASE_STATS[quality][type];
  const [minScore, maxScore] = getQualityScoreRange(quality);
  const slots = getAbilitySlots(quality);

  const price = (quality === "普通" ? 80 : quality === "不凡" ? 250 : quality === "稀有" ? 700 : 1800) + randInt(-50, 50);
  const passives = pickByScoreRange(PASSIVE_ABILITIES, slots.passive, minScore, maxScore);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, slots.active, minScore, maxScore);

  return {
    id: `arm_${Date.now()}_${randInt(1000, 9999)}`,
    name: generateArmorName(quality, type),
    quality,
    type,
    dodgeBonus: stats.dodge,
    blockBonus: stats.block,
    stealthModifier: stats.stealth,
    athleticsModifier: stats.athletics,
    initiativeModifier: stats.initiative,
    passiveAbilities: passives,
    activeAbilities: actives,
    price,
    description: `一件${quality}的${type}，提供可靠的防护。`,
  };
}

// ========================================
// 血统生成器
// ========================================

export function generateBloodline(rarity?: BloodlineRarity): Bloodline {
  const finalRarity = rarity ?? pickOne<BloodlineRarity>(["稀有", "超凡", "神话"]);
  const [minScore, maxScore] = getBloodlineScoreRange(finalRarity);

  const attrTotalLimit = finalRarity === "稀有" ? 2 : finalRarity === "超凡" ? 4 : 8;
  const resistanceCount = finalRarity === "稀有" ? 1 : finalRarity === "超凡" ? randInt(1, 2) : randInt(2, 3);
  const passiveCount = finalRarity === "稀有" ? 1 : finalRarity === "超凡" ? 2 : 3;
  const activeCount = 1;

  // 分配属性点
  const attrs: Attribute[] = ["力量", "敏捷", "智力", "意志"];
  const attributeAdjustments: Partial<Record<Attribute, number>> = {};
  let remaining = attrTotalLimit;
  for (const attr of attrs.sort(() => Math.random() - 0.5)) {
    if (remaining <= 0) break;
    const add = randInt(0, remaining);
    if (add > 0) attributeAdjustments[attr] = add;
    remaining -= add;
  }

  const allDamageTypes: DamageType[] = ["物理", "火焰", "冰霜", "闪电", "黑暗", "光明"];
  const resistances = pickMany(allDamageTypes, resistanceCount);
  const vulnerabilities = pickMany(
    allDamageTypes.filter((d) => !resistances.includes(d)),
    1
  );

  const passives = pickByScoreRange(PASSIVE_ABILITIES, passiveCount, minScore, maxScore);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, activeCount, minScore, maxScore);

  const price = finalRarity === "稀有" ? 1500 : finalRarity === "超凡" ? 4000 : 10000;

  return {
    id: `bld_${Date.now()}_${randInt(1000, 9999)}`,
    name: pickOne(BLOODLINE_NAMES),
    rarity: finalRarity,
    resistances,
    vulnerabilities,
    attributeAdjustments,
    passiveAbilities: passives,
    activeAbilities: actives,
    price,
    description: `${finalRarity}血统，赋予宿主非凡之力。`,
  };
}

// ========================================
// 职业生成器
// ========================================

export function generateCareer(tier?: CareerTier): Career {
  const finalTier = tier ?? pickOne<CareerTier>(["基础", "进阶", "大师"]);
  const [minScore, maxScore] = getCareerScoreRange(finalTier);

  const skillLimit = finalTier === "基础" ? 2 : finalTier === "进阶" ? 4 : 6;
  const skills: Record<string, number> = {};
  const skillNames = ["运动", "机械", "隐秘", "学识", "察觉", "社交", "统御", "生存"];
  let skillRemaining = skillLimit;
  for (const s of skillNames.sort(() => Math.random() - 0.5)) {
    if (skillRemaining <= 0) break;
    const add = randInt(0, skillRemaining);
    if (add > 0) skills[s] = add;
    skillRemaining -= add;
  }

  const passives = pickByScoreRange(PASSIVE_ABILITIES, 1, minScore, maxScore);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, 1, minScore, maxScore);

  const price = finalTier === "基础" ? 500 : finalTier === "进阶" ? 2000 : 6000;

  return {
    id: `car_${Date.now()}_${randInt(1000, 9999)}`,
    name: pickOne(CAREER_NAMES[finalTier]),
    tier: finalTier,
    skillModifiers: skills,
    totalSkillModifierLimit: skillLimit,
    passiveAbilities: passives,
    activeAbilities: actives,
    price,
    description: `${finalTier}职业，决定角色的成长方向。`,
  };
}

// ========================================
// 怪物生成器
// ========================================

const MONSTER_NAMES: Record<MonsterCategory, string[]> = {
  类人生物: ["土匪", "兽人战士", "黑暗教徒", "雇佣兵", "哥布林"],
  野兽: ["腐狼", "岩熊", "毒蛛", "影豹", "裂齿虎"],
  亡灵: ["骷髅兵", "食尸鬼", "幽灵", "丧尸", "巫妖侍从"],
  构装体: ["石魔像", "铁傀儡", "机关守卫", "发条猎犬", "魔像巨像"],
  元素体: ["火元素", "水元素", "风元素", "土元素", "雷元素"],
  异界生物: ["深渊恶魔", "虚空行者", "眼魔", "触须怪", "混沌猎手"],
};

export function generateMonster(tier?: MonsterTier, category?: MonsterCategory): Monster {
  const finalTier = tier ?? pickOne<MonsterTier>(["普通级", "精英级", "首领级", "领主级"]);
  const finalCategory = category ?? pickOne<MonsterCategory>(["类人生物", "野兽", "亡灵", "构装体", "元素体", "异界生物"]);

  let attrTotal: number;
  let hpBase: number;
  let epBase: number;
  let attackBonusRange: [number, number];
  let dodgeRange: [number, number];
  let blockOffsetRange: [number, number];
  let resistanceCount: number;
  let vulnerableCount: number;
  let passiveCount: number;
  let activeCount: number;

  switch (finalTier) {
    case "普通级":
      attrTotal = 8;
      hpBase = 5;
      epBase = 0;
      attackBonusRange = [1, 3];
      dodgeRange = [1, 5];
      blockOffsetRange = [1, 2];
      resistanceCount = 0;
      vulnerableCount = randInt(1, 2);
      passiveCount = 1;
      activeCount = 1;
      break;
    case "精英级":
      attrTotal = 14;
      hpBase = 8;
      epBase = 2;
      attackBonusRange = [2, 4];
      dodgeRange = [2, 6];
      blockOffsetRange = [2, 3];
      resistanceCount = 1;
      vulnerableCount = randInt(1, 2);
      passiveCount = 2;
      activeCount = 1;
      break;
    case "首领级":
      attrTotal = 25;
      hpBase = 15;
      epBase = 5;
      attackBonusRange = [3, 5];
      dodgeRange = [3, 7];
      blockOffsetRange = [2, 5];
      resistanceCount = randInt(1, 2);
      vulnerableCount = randInt(1, 2);
      passiveCount = 2;
      activeCount = 2;
      break;
    case "领主级":
      attrTotal = 40;
      hpBase = 15;
      epBase = 10;
      attackBonusRange = [5, 7];
      dodgeRange = [6, 8];
      blockOffsetRange = [3, 5];
      resistanceCount = randInt(2, 3);
      vulnerableCount = 1;
      passiveCount = 3;
      activeCount = 2;
      break;
  }

  // 分配属性
  const attributes: Record<Attribute, number> = { 力量: 1, 敏捷: 1, 智力: 1, 意志: 1 };
  const attrKeys: Attribute[] = ["力量", "敏捷", "智力", "意志"];
  let remaining = attrTotal - 4;
  for (const k of attrKeys.sort(() => Math.random() - 0.5)) {
    if (remaining <= 0) break;
    const add = randInt(0, remaining);
    attributes[k] += add;
    remaining -= add;
  }

  const str = attributes["力量"];
  const agi = attributes["敏捷"];
  const int = attributes["智力"];
  const wil = attributes["意志"];

  const hp = hpBase + str;
  const ep = epBase + int + wil;
  const dodge = randInt(dodgeRange[0], dodgeRange[1]);
  const block = dodge + randInt(blockOffsetRange[0], blockOffsetRange[1]);
  const attackBonus = randInt(attackBonusRange[0], attackBonusRange[1]);

  const allDamageTypes: DamageType[] = ["物理", "火焰", "冰霜", "闪电", "黑暗", "光明"];
  const resistances = pickMany(allDamageTypes, resistanceCount);
  const vulnerabilities = pickMany(
    allDamageTypes.filter((d) => !resistances.includes(d)),
    vulnerableCount
  );

  const checkAttr = pickOne<Attribute>(["力量", "敏捷", "智力", "意志"]);
  const damageType = pickOne<DamageType>(allDamageTypes);

  const abilityScoreMax = finalTier === "普通级" ? 4 : finalTier === "精英级" ? 5 : finalTier === "首领级" ? 7 : 9;
  const passives = pickByScoreRange(PASSIVE_ABILITIES, passiveCount, 1, abilityScoreMax);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, activeCount, 1, abilityScoreMax);

  return {
    id: `mon_${Date.now()}_${randInt(1000, 9999)}`,
    name: pickOne(MONSTER_NAMES[finalCategory]),
    tier: finalTier,
    category: finalCategory,
    attributes,
    hp,
    maxHp: hp,
    ep,
    maxEp: ep,
    dodge,
    block,
    resistances,
    vulnerabilities,
    checkAttribute: checkAttr,
    attackBonus,
    damageType,
    activeAbilities: actives,
    passiveAbilities: passives,
  };
}

// ========================================
// 批量生成便利函数
// ========================================

export function generateWeaponPool(count: number, quality?: EquipmentQuality): Weapon[] {
  return Array.from({ length: count }, () => generateWeapon(quality ?? pickOne(["普通", "不凡", "稀有", "传说"])));
}

export function generateArmorPool(count: number, quality?: EquipmentQuality): Armor[] {
  return Array.from({ length: count }, () => generateArmor(quality ?? pickOne(["普通", "不凡", "稀有", "传说"])));
}

export function generateBloodlinePool(count: number, rarity?: BloodlineRarity): Bloodline[] {
  return Array.from({ length: count }, () => generateBloodline(rarity));
}

export function generateCareerPool(count: number, tier?: CareerTier): Career[] {
  return Array.from({ length: count }, () => generateCareer(tier));
}

// ========================================
// 随从生成器
// ========================================

const COMPANION_NAMES = [
  "艾拉", "雷恩", "菲奥娜", "格雷", "露娜", "索尔", "薇拉", "凯恩",
  "伊娃", "德罗", "米娅", "维克多", "塞拉", "诺兰", "蒂亚", "布鲁诺",
];

const COMPANION_TITLES = [
  "佣兵", "护卫", "术士", "猎手", "骑士", "刺客", "祭司", "游侠",
];

export function generateCompanion(tier?: MonsterTier): Companion {
  const finalTier = tier ?? pickOne<MonsterTier>(["普通级", "精英级"]);

  let attrTotal: number;
  let hpBase: number;
  let epBase: number;
  let attackBonusBase: number;
  let abilityScoreMax: number;
  let passiveCount: number;
  let activeCount: number;

  switch (finalTier) {
    case "普通级":
      attrTotal = 6;
      hpBase = 5;
      epBase = 0;
      attackBonusBase = 1;
      abilityScoreMax = 4;
      passiveCount = 1;
      activeCount = 1;
      break;
    case "精英级":
      attrTotal = 10;
      hpBase = 8;
      epBase = 2;
      attackBonusBase = 2;
      abilityScoreMax = 5;
      passiveCount = 2;
      activeCount = 1;
      break;
    case "首领级":
      attrTotal = 16;
      hpBase = 12;
      epBase = 5;
      attackBonusBase = 4;
      abilityScoreMax = 7;
      passiveCount = 2;
      activeCount = 2;
      break;
    case "领主级":
      attrTotal = 22;
      hpBase = 15;
      epBase = 8;
      attackBonusBase = 6;
      abilityScoreMax = 9;
      passiveCount = 3;
      activeCount = 2;
      break;
  }

  // 分配属性
  const attributes: Record<Attribute, number> = { 力量: 1, 敏捷: 1, 智力: 1, 意志: 1 };
  const attrKeys: Attribute[] = ["力量", "敏捷", "智力", "意志"];
  let remaining = attrTotal - 4;
  for (const k of attrKeys.sort(() => Math.random() - 0.5)) {
    if (remaining <= 0) break;
    const add = randInt(0, remaining);
    attributes[k] += add;
    remaining -= add;
  }

  const str = attributes["力量"];
  const agi = attributes["敏捷"];
  const int = attributes["智力"];
  const wil = attributes["意志"];

  // 确定主属性和武器类型
  const attrEntries = Object.entries(attributes) as [Attribute, number][];
  attrEntries.sort((a, b) => b[1] - a[1]);
  const mainAttr = attrEntries[0][0];
  const attrMap: Record<Attribute, WeaponCategory> = {
    力量: "重型",
    敏捷: "轻型",
    智力: "法器",
    意志: "长柄",
  };
  const weaponCategory = attrMap[mainAttr];

  // 生成装备
  const weaponQuality: EquipmentQuality = finalTier === "普通级" ? "普通" : finalTier === "精英级" ? "不凡" : finalTier === "首领级" ? "稀有" : "传说";
  const companionWeapon = generateWeapon(weaponQuality, weaponCategory);
  const companionArmor = generateArmor(weaponQuality, pickOne<ArmorType>(["轻甲", "中甲"]));

  // 计算战斗数值
  const hp = hpBase + str + companionArmor.dodgeBonus + companionArmor.blockBonus;
  const ep = epBase + int + wil;
  const dodge = 5 + Math.ceil(agi / 2) + companionArmor.dodgeBonus;
  const block = dodge + Math.ceil(str / 2) + companionArmor.blockBonus;
  const weaponAttrHalf = Math.ceil(attributes[companionWeapon.checkAttribute] / 2);
  const proficiencyBonus = 1;
  const attackBonus = weaponAttrHalf + proficiencyBonus + companionWeapon.weaponBonus;

  const allDamageTypes: DamageType[] = ["物理", "火焰", "冰霜", "闪电", "黑暗", "光明"];
  const resistances = pickMany(allDamageTypes, randInt(0, 1));
  const vulnerabilities = pickMany(
    allDamageTypes.filter((d) => !resistances.includes(d)),
    randInt(0, 1)
  );

  const passives = pickByScoreRange(PASSIVE_ABILITIES, passiveCount, 1, abilityScoreMax);
  const actives = pickByScoreRange(ACTIVE_ABILITIES, activeCount, 1, abilityScoreMax);

  return {
    id: `cmp_${Date.now()}_${randInt(1000, 9999)}`,
    name: `${pickOne(COMPANION_NAMES)} · ${pickOne(COMPANION_TITLES)}`,
    attributes,
    hp,
    maxHp: hp,
    ep,
    maxEp: ep,
    weapon: companionWeapon,
    armor: companionArmor,
    activeAbilities: actives,
    passiveAbilities: passives,
    dodge,
    block,
    attackBonus,
    resistances,
    vulnerabilities,
    checkAttribute: companionWeapon.checkAttribute,
    damageType: companionWeapon.damageType,
  };
}

export function generateMonsterPool(count: number, tier?: MonsterTier): Monster[] {
  return Array.from({ length: count }, () => generateMonster(tier));
}
