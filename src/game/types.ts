// ========================================
// 《关主野事》CRPG 跑团模拟器 - 核心类型定义
// ========================================

export type Attribute = "力量" | "敏捷" | "智力" | "意志";
export type DamageType = "物理" | "火焰" | "冰霜" | "闪电" | "黑暗" | "光明";
export type MonsterCategory = "类人生物" | "野兽" | "亡灵" | "构装体" | "元素体" | "异界生物";
export type EquipmentQuality = "普通" | "不凡" | "稀有" | "传说";
export type ArmorType = "轻甲" | "中甲" | "重甲";
export type WeaponCategory = "轻型" | "重型" | "长柄" | "远程" | "法器";
export type BloodlineRarity = "稀有" | "超凡" | "神话";
export type CareerTier = "基础" | "进阶" | "大师";
export type MonsterTier = "普通级" | "精英级" | "首领级" | "领主级";

// 技能类型
export type SkillName = "运动" | "机械" | "隐秘" | "学识" | "察觉" | "社交" | "统御" | "生存";

// 主动能力效果类型
export type ActiveEffectType =
  | { type: "damage"; attribute: Attribute; damageType: DamageType; bonus: number; healSelf?: number; drainEnergy?: number }
  | { type: "heal"; hp?: number; ep?: number }
  | { type: "buff_dodge"; value: number; duration: number }
  | { type: "buff_block"; value: number; duration: number }
  | { type: "buff_resistance"; damageTypes: DamageType[]; duration: number }
  | { type: "buff_attack"; value: number; duration: number }
  | { type: "buff_attribute"; attribute: Attribute; value: number; duration: number }
  | { type: "debuff_dodge"; value: number; duration: number }
  | { type: "debuff_block"; value: number; duration: number }
  | { type: "debuff_vulnerable"; damageTypes: DamageType[]; duration: number }
  | { type: "debuff_attack"; value: number; duration: number }
  | { type: "debuff_attribute"; attribute: Attribute; value: number; duration: number }
  | { type: "debuff_max_energy"; value: number; duration: number }
  | { type: "multi_buff"; dodge?: number; block?: number; attack?: number; duration: number }
  | { type: "combo"; bonus: number; extraNormalAttackOnHit: boolean };

// 主动能力
export interface ActiveAbility {
  id: string;
  name: string;
  costType: "能量值" | "生命值";
  cost: number;
  target:
    | "自己"
    | "友方单位"
    | "所有友方单位"
    | "敌对单位"
    | "所有敌对单位"
    | "所有单位";
  effect: ActiveEffectType;
  description: string;
  /** 1~10 分，评分越高效果越强 */
  score: number;
}

// 被动效果
export type PassiveEffectType =
  | { type: "attribute"; attribute: Attribute; value: number }
  | { type: "skill"; skill: SkillName; value: number }
  | { type: "multi_skill"; skills: SkillName[]; value: number }
  | { type: "resistance"; damageTypes: DamageType[] }
  | { type: "vulnerable"; damageTypes: DamageType[] }
  | { type: "monster_attack_bonus"; category: MonsterCategory; value: number }
  | { type: "life_steal"; value: number }
  | { type: "energy_steal"; value: number }
  | { type: "dodge"; value: number }
  | { type: "block"; value: number }
  | { type: "attack"; value: number }
  | { type: "max_hp"; value: number }
  | { type: "max_energy"; value: number };

// 被动能力
export interface PassiveAbility {
  id: string;
  name: string;
  effect: PassiveEffectType;
  description: string;
  /** 1~10 分 */
  score: number;
}

// 武器
export interface Weapon {
  id: string;
  name: string;
  quality: EquipmentQuality;
  category: WeaponCategory;
  checkAttribute: Attribute;
  weaponBonus: number;
  damageType: DamageType;
  passiveAbilities: PassiveAbility[];
  activeAbilities: ActiveAbility[];
  price: number;
  description: string;
}

// 护甲
export interface Armor {
  id: string;
  name: string;
  quality: EquipmentQuality;
  type: ArmorType;
  dodgeBonus: number;
  blockBonus: number;
  stealthModifier: number;
  athleticsModifier: number;
  initiativeModifier: number;
  passiveAbilities: PassiveAbility[];
  activeAbilities: ActiveAbility[];
  price: number;
  description: string;
}

// 血统
export interface Bloodline {
  id: string;
  name: string;
  rarity: BloodlineRarity;
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  attributeAdjustments: Partial<Record<Attribute, number>>;
  passiveAbilities: PassiveAbility[];
  activeAbilities: ActiveAbility[];
  price: number;
  description: string;
}

// 职业
export interface Career {
  id: string;
  name: string;
  tier: CareerTier;
  skillModifiers: Partial<Record<SkillName, number>>;
  totalSkillModifierLimit: number;
  passiveAbilities: PassiveAbility[];
  activeAbilities: ActiveAbility[];
  price: number;
  description: string;
}

// 消耗品
export type ConsumableGameEffect =
  | { type: "heal_hp"; value: number }
  | { type: "heal_ep"; value: number };

export interface Consumable {
  id: string;
  name: string;
  price: number;
  uses: number;
  effect: string;
  gameEffect: ConsumableGameEffect;
}

// 角色
export interface Character {
  id: string;
  name: string;
  attributes: Record<Attribute, number>;
  baseAttributes: Record<Attribute, number>;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  career?: Career;
  bloodline?: Bloodline;
  weapon?: Weapon;
  armor?: Armor;
  inventory: Consumable[];
  passiveAbilities: PassiveAbility[];
  activeAbilities: ActiveAbility[];
  skills: Record<SkillName, number>;
  trainedSkills: Partial<Record<SkillName, number>>;
  dodge: number;
  block: number;
  attackBonus: number;
  resistances: DamageType[];
  vulnerabilities: DamageType[];
}

// 怪物
export interface Monster {
  id: string;
  name: string;
  tier: MonsterTier;
  category: MonsterCategory;
  attributes: Record<Attribute, number>;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  dodge: number;
  block: number;
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  checkAttribute: Attribute;
  attackBonus: number;
  damageType: DamageType;
  activeAbilities: ActiveAbility[];
  passiveAbilities: PassiveAbility[];
}

export type Gender = "男" | "女";

// 随从
export interface Companion {
  id: string;
  name: string;
  gender: Gender;
  trait: string;
  fondness: number;
  attributes: Record<Attribute, number>;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  weapon?: Weapon;
  armor?: Armor;
  activeAbilities: ActiveAbility[];
  passiveAbilities: PassiveAbility[];
  dodge: number;
  block: number;
  attackBonus: number;
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  checkAttribute: Attribute;
  damageType: DamageType;
}

// 战斗单位（角色、怪物或随从）
export interface CombatUnit {
  id: string;
  name: string;
  isPlayer: boolean;
  category?: MonsterCategory;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  dodge: number;
  baseDodge: number;
  block: number;
  baseBlock: number;
  attackBonus: number;
  baseAttackBonus: number;
  attributes: Record<Attribute, number>;
  baseAttributes: Record<Attribute, number>;
  resistances: DamageType[];
  baseResistances: DamageType[];
  vulnerabilities: DamageType[];
  baseVulnerabilities: DamageType[];
  checkAttribute: Attribute;
  damageType: DamageType;
  activeAbilities: ActiveAbility[];
  passiveAbilities: PassiveAbility[];
  weaponBonus: number;
  buffs: Buff[];
  debuffs: Debuff[];
}

// 状态效果
export interface Buff {
  name: string;
  remaining: number;
  effects: { type: string; value?: number; attribute?: Attribute; damageType?: DamageType }[];
}

export interface Debuff {
  name: string;
  remaining: number;
  effects: { type: string; value?: number; attribute?: Attribute; damageType?: DamageType }[];
}

// 战斗记录
export interface CombatLog {
  round: number;
  actor: string;
  action: string;
  target?: string;
  roll?: number;
  damage?: number;
  result?: "闪避" | "格挡" | "破防";
  heal?: number;
  message: string;
}

// 战斗场景
export interface CombatState {
  round: number;
  units: CombatUnit[];
  initiativeOrder: string[];
  currentTurnIndex: number;
  logs: CombatLog[];
  finished: boolean;
}
