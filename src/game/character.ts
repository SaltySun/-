import type { Character, Attribute, SkillName, Weapon, Armor, Bloodline, Career, PassiveAbility } from "./types";

// ========================================
// 角色创建与属性计算
// ========================================

export function createCharacter(
  name: string,
  attributes: Record<Attribute, number>,
  career?: Career,
  bloodline?: Bloodline,
  weapon?: Weapon,
  armor?: Armor
): Character {
  const char: Character = {
    id: `pc_${Date.now()}`,
    name,
    attributes: { ...attributes },
    baseAttributes: { ...attributes },
    hp: 0,
    maxHp: 0,
    ep: 0,
    maxEp: 0,
    career,
    bloodline,
    weapon,
    armor,
    inventory: [],
    passiveAbilities: [],
    activeAbilities: [],
    skills: {
      运动: 0,
      机械: 0,
      隐秘: 0,
      学识: 0,
      察觉: 0,
      社交: 0,
      统御: 0,
      生存: 0,
    },
    trainedSkills: {
      运动: 0,
      机械: 0,
      隐秘: 0,
      学识: 0,
      察觉: 0,
      社交: 0,
      统御: 0,
      生存: 0,
    },
    dodge: 0,
    block: 0,
    attackBonus: 0,
    resistances: [],
    vulnerabilities: [],
  };

  recalculateCharacter(char);
  char.hp = char.maxHp;
  char.ep = char.maxEp;
  return char;
}

export function recalculateCharacter(char: Character): void {
  // ========== 1. 从纯净基础属性重新开始 ==========
  char.attributes = { ...char.baseAttributes };

  // 收集所有被动能力和主动能力来源
  const allPassives: PassiveAbility[] = [];
  const allActives = [] as typeof char.activeAbilities;

  if (char.career) {
    allPassives.push(...char.career.passiveAbilities);
    allActives.push(...char.career.activeAbilities);
  }
  if (char.bloodline) {
    allPassives.push(...char.bloodline.passiveAbilities);
    allActives.push(...char.bloodline.activeAbilities);
  }
  if (char.weapon) {
    allPassives.push(...char.weapon.passiveAbilities);
    allActives.push(...char.weapon.activeAbilities);
  }
  if (char.armor) {
    allPassives.push(...char.armor.passiveAbilities);
    allActives.push(...char.armor.activeAbilities);
  }

  // ========== 2. 血统属性调整 ==========
  if (char.bloodline) {
    for (const [attr, val] of Object.entries(char.bloodline.attributeAdjustments)) {
      if (val) {
        char.attributes[attr as Attribute] += val;
      }
    }
  }

  // ========== 3. 应用被动能力（属性类先应用） ==========
  for (const p of allPassives) {
    const e = p.effect;
    if (e.type === "attribute") {
      char.attributes[e.attribute] += e.value;
    }
  }

  // ========== 4. 重新读取最终属性并计算所有派生值 ==========
  const str = char.attributes["力量"];
  const agi = char.attributes["敏捷"];
  const int = char.attributes["智力"];
  const wil = char.attributes["意志"];

  // 基础生命值/能量值
  let maxHp = 15 + str;
  let maxEp = 5 + int + wil;

  // 基础闪避/格挡
  let dodge = 5 + Math.ceil(agi / 2);
  let block = dodge + Math.ceil(str / 2);

  // 护甲修正
  if (char.armor) {
    dodge += char.armor.dodgeBonus;
    block += char.armor.blockBonus;
  }

  // 武器加值
  const weaponBonus = char.weapon?.weaponBonus ?? 0;

  // 熟练加值根据职业等级决定：基础+1，进阶+2，大师+3
  const proficiencyBonus = char.career ? (char.career.tier === "大师" ? 3 : char.career.tier === "进阶" ? 2 : 1) : 1;

  // 攻击加值 = 主属性/2(向上取整) + 熟练加值 + 武器加值
  const mainAttr = char.weapon?.checkAttribute ?? "力量";
  let attackBonus = Math.ceil(char.attributes[mainAttr] / 2) + proficiencyBonus + weaponBonus;

  // 抗性/易伤（血统基础）
  const resistances: string[] = [];
  const vulnerabilities: string[] = [];

  if (char.bloodline) {
    resistances.push(...char.bloodline.resistances);
    vulnerabilities.push(...char.bloodline.vulnerabilities);
  }

  // 技能基础值
  const skills: Record<SkillName, number> = {
    运动: Math.ceil(str / 2),
    机械: Math.ceil(int / 2),
    隐秘: Math.ceil(agi / 2),
    学识: Math.ceil(int / 2),
    察觉: Math.ceil(agi / 2),
    社交: Math.ceil(wil / 2),
    统御: Math.ceil(wil / 2),
    生存: Math.ceil(int / 2),
  };

  // 职业技能修正
  if (char.career) {
    for (const [sk, val] of Object.entries(char.career.skillModifiers)) {
      if (val) skills[sk as SkillName] += val;
    }
  }

  // 训练场技能修正
  if (char.trainedSkills) {
    for (const [sk, val] of Object.entries(char.trainedSkills)) {
      if (val) skills[sk as SkillName] += val;
    }
  }

  // 护甲技能修正
  if (char.armor) {
    skills["隐秘"] += char.armor.stealthModifier;
    skills["运动"] += char.armor.athleticsModifier;
  }

  // ========== 5. 应用其他被动能力（非属性类） ==========
  for (const p of allPassives) {
    const e = p.effect;
    switch (e.type) {
      case "max_hp":
        maxHp += e.value;
        break;
      case "max_energy":
        maxEp += e.value;
        break;
      case "dodge":
        dodge += e.value;
        break;
      case "block":
        block += e.value;
        break;
      case "attack":
        attackBonus += e.value;
        break;
      case "skill":
        skills[e.skill] += e.value;
        break;
      case "multi_skill":
        for (const s of e.skills) skills[s] += e.value;
        break;
      case "resistance":
        for (const dt of e.damageTypes) {
          if (!resistances.includes(dt)) resistances.push(dt);
        }
        break;
      case "vulnerable":
        for (const dt of e.damageTypes) {
          if (!vulnerabilities.includes(dt)) vulnerabilities.push(dt);
        }
        break;
      // monster_attack_bonus, life_steal, energy_steal 在战斗中处理
    }
  }

  // ========== 6. 保存回角色 ==========
  char.maxHp = maxHp;
  char.maxEp = maxEp;
  char.dodge = dodge;
  char.block = block;
  char.attackBonus = attackBonus;
  char.resistances = resistances as typeof char.resistances;
  char.vulnerabilities = vulnerabilities as typeof char.vulnerabilities;
  char.skills = skills;
  char.passiveAbilities = allPassives;
  char.activeAbilities = allActives;
}

export function equipWeapon(char: Character, weapon: Weapon): void {
  char.weapon = weapon;
  recalculateCharacter(char);
}

export function equipArmor(char: Character, armor: Armor): void {
  char.armor = armor;
  recalculateCharacter(char);
}

export function setBloodline(char: Character, bloodline: Bloodline): void {
  char.bloodline = bloodline;
  recalculateCharacter(char);
}

export function addCareer(char: Character, career: Career): void {
  char.career = career;
  recalculateCharacter(char);
}
