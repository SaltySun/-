import type { Character, Monster, Companion, CombatUnit, CombatState, CombatLog, ActiveAbility, DamageType, Buff, Debuff, PassiveAbility, MonsterCategory, Attribute } from "./types";

// ========================================
// 战斗系统核心
// ========================================

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function roll2D6(): number {
  return rollD6() + rollD6();
}

function uid(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// ========================================
// 创建战斗单位
// ========================================

export function createCombatUnitFromCharacter(char: Character): CombatUnit {
  return {
    id: char.id,
    name: char.name,
    isPlayer: true,
    hp: char.hp,
    maxHp: char.maxHp,
    ep: char.ep,
    maxEp: char.maxEp,
    dodge: char.dodge,
    baseDodge: char.dodge,
    block: char.block,
    baseBlock: char.block,
    attackBonus: char.attackBonus,
    baseAttackBonus: char.attackBonus,
    attributes: { ...char.attributes },
    baseAttributes: { ...char.attributes },
    resistances: [...char.resistances],
    baseResistances: [...char.resistances],
    vulnerabilities: [...char.vulnerabilities],
    baseVulnerabilities: [...char.vulnerabilities],
    checkAttribute: char.weapon?.checkAttribute ?? "力量",
    damageType: char.weapon?.damageType ?? "物理",
    activeAbilities: [...char.activeAbilities],
    passiveAbilities: [...char.passiveAbilities],
    weaponBonus: char.weapon?.weaponBonus ?? 0,
    buffs: [],
    debuffs: [],
  };
}

export function createCombatUnitFromMonster(mon: Monster): CombatUnit {
  return {
    id: mon.id,
    name: mon.name,
    isPlayer: false,
    category: mon.category,
    hp: mon.hp,
    maxHp: mon.maxHp,
    ep: mon.ep,
    maxEp: mon.maxEp,
    dodge: mon.dodge,
    baseDodge: mon.dodge,
    block: mon.block,
    baseBlock: mon.block,
    attackBonus: mon.attackBonus,
    baseAttackBonus: mon.attackBonus,
    attributes: { ...mon.attributes },
    baseAttributes: { ...mon.attributes },
    resistances: [...mon.resistances],
    baseResistances: [...mon.resistances],
    vulnerabilities: [...mon.vulnerabilities],
    baseVulnerabilities: [...mon.vulnerabilities],
    checkAttribute: mon.checkAttribute,
    damageType: mon.damageType,
    activeAbilities: [...mon.activeAbilities],
    passiveAbilities: [...mon.passiveAbilities],
    weaponBonus: 0,
    buffs: [],
    debuffs: [],
  };
}

export function createCombatUnitFromCompanion(comp: Companion): CombatUnit {
  return {
    id: comp.id,
    name: comp.name,
    isPlayer: true,
    hp: comp.hp,
    maxHp: comp.maxHp,
    ep: comp.ep,
    maxEp: comp.maxEp,
    dodge: comp.dodge,
    baseDodge: comp.dodge,
    block: comp.block,
    baseBlock: comp.block,
    attackBonus: comp.attackBonus,
    baseAttackBonus: comp.attackBonus,
    attributes: { ...comp.attributes },
    baseAttributes: { ...comp.attributes },
    resistances: [...comp.resistances],
    baseResistances: [...comp.resistances],
    vulnerabilities: [...comp.vulnerabilities],
    baseVulnerabilities: [...comp.vulnerabilities],
    checkAttribute: comp.checkAttribute,
    damageType: comp.damageType,
    activeAbilities: [...comp.activeAbilities],
    passiveAbilities: [...comp.passiveAbilities],
    weaponBonus: comp.weapon?.weaponBonus ?? 0,
    buffs: [],
    debuffs: [],
  };
}

// ========================================
// 先攻检定
// ========================================

function initiativeRoll(unit: CombatUnit): number {
  return roll2D6() + unit.attributes["敏捷"];
}

// ========================================
// 初始化战斗
// ========================================

export function initCombat(players: Character[], monsters: Monster[], companions: Companion[] = []): CombatState {
  const units: CombatUnit[] = [
    ...players.map(createCombatUnitFromCharacter),
    ...companions.map(createCombatUnitFromCompanion),
    ...monsters.map(createCombatUnitFromMonster),
  ];

  const initiative = units
    .map((u) => ({ id: u.id, roll: initiativeRoll(u), agi: u.attributes["敏捷"] }))
    .sort((a, b) => {
      if (b.roll !== a.roll) return b.roll - a.roll;
      if (b.agi !== a.agi) return b.agi - a.agi;
      return Math.random() - 0.5;
    });

  return {
    round: 1,
    units,
    initiativeOrder: initiative.map((i) => i.id),
    currentTurnIndex: 0,
    logs: [],
    finished: false,
  };
}

// ========================================
// 状态效果处理
// ========================================

function recomputeUnitStats(unit: CombatUnit): void {
  // 重置到基础值
  unit.dodge = unit.baseDodge;
  unit.block = unit.baseBlock;
  unit.attackBonus = unit.baseAttackBonus;
  unit.attributes = { ...unit.baseAttributes };
  unit.resistances = [...unit.baseResistances];
  unit.vulnerabilities = [...unit.baseVulnerabilities];

  for (const b of unit.buffs) {
    for (const e of b.effects) {
      applyStatEffect(unit, e.type, e.value ?? 0, e.attribute, e.damageType, true);
    }
  }
  for (const d of unit.debuffs) {
    for (const e of d.effects) {
      applyStatEffect(unit, e.type, e.value ?? 0, e.attribute, e.damageType, false);
    }
  }
}

function applyStatEffect(
  unit: CombatUnit,
  type: string,
  value: number,
  attribute?: string,
  damageType?: DamageType,
  isBuff = true
): void {
  switch (type) {
    case "buff_dodge":
    case "debuff_dodge":
      unit.dodge += value;
      break;
    case "buff_block":
      unit.block += value;
      break;
    case "debuff_block":
      unit.block += value; // value is negative
      if (unit.block < unit.dodge) unit.block = unit.dodge;
      break;
    case "buff_attack":
    case "debuff_attack":
      unit.attackBonus += value;
      break;
    case "buff_attribute":
    case "debuff_attribute":
      if (attribute) unit.attributes[attribute as keyof typeof unit.attributes] += value;
      break;
    case "buff_resistance":
      if (damageType && !unit.resistances.includes(damageType)) unit.resistances.push(damageType);
      break;
    case "debuff_vulnerable":
      if (damageType && !unit.vulnerabilities.includes(damageType)) unit.vulnerabilities.push(damageType);
      break;
    case "debuff_max_energy":
      // 能量上限减少在效果持续期间生效，这里简化处理：直接扣减当前上限
      unit.maxEp -= value;
      if (unit.ep > unit.maxEp) unit.ep = unit.maxEp;
      break;
  }
}

function tickStatusEffects(unit: CombatUnit): void {
  unit.buffs = unit.buffs.filter((b) => {
    b.remaining--;
    return b.remaining > 0;
  });
  unit.debuffs = unit.debuffs.filter((d) => {
    d.remaining--;
    return d.remaining > 0;
  });
  recomputeUnitStats(unit);
}

// ========================================
// 攻击检定与伤害
// ========================================

export type AttackResult = { result: "闪避" | "格挡" | "破防"; roll: number; damage: number };

export function performAttack(attacker: CombatUnit, defender: CombatUnit, bonus = 0, forcedRoll?: number, attribute?: Attribute): AttackResult {
  let extraBonus = bonus;
  let monsterBonus = 0;
  if (defender.category) {
    for (const p of attacker.passiveAbilities) {
      if (p.effect.type === "monster_attack_bonus" && p.effect.category === defender.category) {
        monsterBonus += p.effect.value;
        extraBonus += p.effect.value;
      }
    }
  }

  const dice = forcedRoll !== undefined ? forcedRoll : roll2D6();
  const weaponAttrHalf = Math.ceil(attacker.attributes[attacker.checkAttribute] / 2);

  let roll: number;
  let skillBase = 0;
  if (attribute && attacker.attributes[attribute] !== undefined) {
    // 技能检定：使用技能属性 + 熟练/被动加成，不含武器加值
    const skillAttrHalf = Math.ceil(attacker.attributes[attribute] / 2);
    // attackBonus = weaponAttrHalf + proficiency + weaponBonus + passiveAttack
    // 技能基础 = attackBonus - weaponBonus - weaponAttrHalf + skillAttrHalf
    //          = proficiency + passiveAttack + skillAttrHalf
    skillBase = attacker.attackBonus - attacker.weaponBonus - weaponAttrHalf + skillAttrHalf;
    roll = dice + skillBase + extraBonus;
  } else {
    // 普通攻击：使用完整 attackBonus（含武器加值）
    roll = dice + attacker.attackBonus + extraBonus;
  }

  console.log(
    `%c[检定] ${attacker.name} → ${defender.name}`,
    "color:#c9a84c; font-weight:bold;",
    `\n  骰子: ${dice} (2d6${forcedRoll !== undefined ? " 强制" : ""})`,
    attribute
      ? `\n  [技能模式] 属性 [${attribute}]: 半值=${Math.ceil(attacker.attributes[attribute] / 2)} | 武器加值: 移除(-${attacker.weaponBonus}) | 技能基础加值: ${skillBase}`
      : `\n  [普攻模式] 武器属性 [${attacker.checkAttribute}]: 半值=${weaponAttrHalf} | 武器加值: +${attacker.weaponBonus} | 攻击加值: ${attacker.attackBonus}`,
    `\n  技能加值: ${bonus >= 0 ? "+" : ""}${bonus}`,
    monsterBonus > 0 ? `\n  怪物克制加值: +${monsterBonus}` : "",
    `\n  ─────────────────`,
    attribute
      ? `\n  最终检定: ${dice} + ${skillBase}${extraBonus !== 0 ? ` ${extraBonus >= 0 ? "+" : ""}${extraBonus}` : ""} = ${roll}`
      : `\n  最终检定: ${dice} + ${attacker.attackBonus}${extraBonus !== 0 ? ` ${extraBonus >= 0 ? "+" : ""}${extraBonus}` : ""} = ${roll}`,
    `\n  目标闪避: ${defender.dodge} | 目标格挡: ${defender.block}`,
  );

  if (roll < defender.dodge) {
    console.log(`%c  结果: 闪避`, "color:#e57373; font-weight:bold;");
    return { result: "闪避", roll, damage: 0 };
  }
  if (roll < defender.block) {
    console.log(`%c  结果: 格挡 (固定1伤)`, "color:#ffb74d; font-weight:bold;");
    return { result: "格挡", roll, damage: 1 };
  }
  const baseDamage = roll - defender.block + 1;
  console.log(`%c  结果: 破防 | 基础伤害: ${roll} - ${defender.block} + 1 = ${baseDamage}`, "color:#81c784; font-weight:bold;");
  return { result: "破防", roll, damage: baseDamage };
}

export function resolveDamage(attacker: CombatUnit, defender: CombatUnit, damage: number, damageType: DamageType): { damage: number; logs: string[] } {
  let final = damage;
  const resisted = defender.resistances.includes(damageType);
  const vulnerable = defender.vulnerabilities.includes(damageType);
  if (resisted) final -= 3;
  if (vulnerable) final += 3;
  if (final < 0) final = 0;
  defender.hp -= final;
  if (defender.hp < 0) defender.hp = 0;

  console.log(
    `%c[伤害结算] ${attacker.name} → ${defender.name}`,
    "color:#c9a84c; font-weight:bold;",
    `\n  基础伤害: ${damage}`,
    `\n  伤害类型: ${damageType}`,
    resisted ? `\n  抗性减免: -3 (${defender.name} 抗性: ${defender.resistances.join(", ")})` : "",
    vulnerable ? `\n  易伤加成: +3 (${defender.name} 易伤: ${defender.vulnerabilities.join(", ")})` : "",
    `\n  最终伤害: ${final}`,
    `\n  ${defender.name} HP: ${defender.hp + final} → ${defender.hp} / ${defender.maxHp}`,
  );

  const logs: string[] = [];
  for (const p of attacker.passiveAbilities) {
    if (p.effect.type === "life_steal") {
      const heal = p.effect.value;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      logs.push(`${attacker.name} 通过【${p.name}】恢复${heal}点生命值`);
    }
    if (p.effect.type === "energy_steal") {
      const drain = p.effect.value;
      attacker.ep = Math.min(attacker.maxEp, attacker.ep + drain);
      defender.ep -= drain;
      if (defender.ep < 0) defender.ep = 0;
      logs.push(`${attacker.name} 通过【${p.name}】偷取${drain}点能量值`);
    }
  }

  return { damage: final, logs };
}

// ========================================
// 执行主动能力
// ========================================

export function executeAbility(
  state: CombatState,
  caster: CombatUnit,
  ability: ActiveAbility,
  targetIds: string[]
): CombatLog[] {
  const logs: CombatLog[] = [];

  // 消耗
  if (ability.costType === "能量值") {
    caster.ep -= ability.cost;
    if (caster.ep < 0) caster.ep = 0;
  } else {
    caster.hp -= ability.cost;
    if (caster.hp < 0) caster.hp = 0;
  }

  const targets = state.units.filter((u) => targetIds.includes(u.id) && u.hp > 0);
  const effect = ability.effect;

  if (effect.type === "damage" || effect.type === "combo") {
    for (const target of targets) {
      const bonus = effect.type === "damage" ? effect.bonus : effect.bonus;
      const atkAttr = effect.type === "damage" ? effect.attribute : undefined;
      const atk = performAttack(caster, target, bonus, undefined, atkAttr);
      let finalDamage = 0;
      const dmgType = effect.type === "damage" ? effect.damageType : caster.damageType;
      if (atk.result !== "闪避") {
        const res = resolveDamage(caster, target, atk.damage, dmgType);
        finalDamage = res.damage;
        for (const msg of res.logs) {
          logs.push({ round: state.round, actor: caster.name, action: "被动", message: msg });
        }
      }
      logs.push({
        round: state.round,
        actor: caster.name,
        action: ability.name,
        target: target.name,
        roll: atk.roll,
        damage: finalDamage,
        result: atk.result,
        message: `${caster.name} 使用 [${ability.name}] 攻击 ${target.name}，检定${atk.roll} → ${atk.result}，造成${finalDamage}点【${dmgType}】伤害`,
      });

      // 连击效果
      if (effect.type === "combo" && effect.extraNormalAttackOnHit && atk.result !== "闪避") {
        const second = performAttack(caster, target, 0);
        let secondDmg = 0;
        if (second.result !== "闪避") {
          const res2 = resolveDamage(caster, target, second.damage, caster.damageType);
          secondDmg = res2.damage;
          for (const msg of res2.logs) {
            logs.push({ round: state.round, actor: caster.name, action: "被动", message: msg });
          }
        }
        logs.push({
          round: state.round,
          actor: caster.name,
          action: "连击",
          target: target.name,
          roll: second.roll,
          damage: secondDmg,
          result: second.result,
          message: `${caster.name} 发动连击，检定${second.roll} → ${second.result}，造成${secondDmg}点【${caster.damageType}】伤害`,
        });
      }

      // 吸血/吸能
      if (effect.type === "damage") {
        if ((effect as { healSelf?: number }).healSelf) {
          const heal = (effect as { healSelf?: number }).healSelf ?? 0;
          caster.hp = Math.min(caster.maxHp, caster.hp + heal);
          if (heal > 0) {
            logs.push({
              round: state.round,
              actor: caster.name,
              action: "恢复",
              message: `${caster.name} 恢复${heal}点生命值`,
            });
          }
        }
        if ((effect as { drainEnergy?: number }).drainEnergy) {
          const drain = (effect as { drainEnergy?: number }).drainEnergy ?? 0;
          caster.ep = Math.min(caster.maxEp, caster.ep + drain);
          target.ep -= drain;
          if (target.ep < 0) target.ep = 0;
          if (drain > 0) {
            logs.push({
              round: state.round,
              actor: caster.name,
              action: "偷取",
              message: `${caster.name} 偷取${drain}点能量值`,
            });
          }
        }
      }
    }
  } else if (effect.type === "heal") {
    for (const target of targets) {
      if (effect.hp) {
        target.hp = Math.min(target.maxHp, target.hp + effect.hp);
      }
      if (effect.ep) {
        target.ep = Math.min(target.maxEp, target.ep + effect.ep);
      }
      const healParts: string[] = [];
      if (effect.hp) healParts.push(`${effect.hp}HP`);
      if (effect.ep) healParts.push(`${effect.ep}EP`);
      logs.push({
        round: state.round,
        actor: caster.name,
        action: ability.name,
        target: target.name,
        heal: (effect.hp ?? 0) + (effect.ep ?? 0),
        message: `${caster.name} 使用 [${ability.name}] 恢复 ${target.name} ${healParts.join(" ")}`,
      });
    }
    // 生命链接自身恢复
    if (ability.name === "生命链接") {
      caster.hp = Math.min(caster.maxHp, caster.hp + 2);
      logs.push({
        round: state.round,
        actor: caster.name,
        action: ability.name,
        message: `${caster.name} 通过生命链接恢复2点生命值`,
      });
    }
  } else if (
    [
      "buff_dodge",
      "buff_block",
      "buff_resistance",
      "buff_attack",
      "buff_attribute",
      "debuff_dodge",
      "debuff_block",
      "debuff_vulnerable",
      "debuff_attack",
      "debuff_attribute",
      "debuff_max_energy",
      "multi_buff",
    ].includes(effect.type)
  ) {
    for (const target of targets) {
      let isDebuff = effect.type.startsWith("debuff");
      const duration = (effect as { duration: number }).duration;
      const fx = [] as { type: string; value?: number; attribute?: Attribute; damageType?: DamageType }[];

      if (effect.type === "buff_dodge") fx.push({ type: "buff_dodge", value: (effect as { value: number }).value });
      if (effect.type === "debuff_dodge") fx.push({ type: "debuff_dodge", value: -(effect as { value: number }).value });
      if (effect.type === "buff_block") fx.push({ type: "buff_block", value: (effect as { value: number }).value });
      if (effect.type === "debuff_block") fx.push({ type: "debuff_block", value: -(effect as { value: number }).value });
      if (effect.type === "buff_attack") fx.push({ type: "buff_attack", value: (effect as { value: number }).value });
      if (effect.type === "debuff_attack") fx.push({ type: "debuff_attack", value: -(effect as { value: number }).value });
      if (effect.type === "buff_attribute") {
        const be = effect as { attribute: Attribute; value: number };
        fx.push({ type: "buff_attribute", value: be.value, attribute: be.attribute });
      }
      if (effect.type === "debuff_attribute") {
        const de = effect as { attribute: Attribute; value: number };
        fx.push({ type: "debuff_attribute", value: -de.value, attribute: de.attribute });
      }
      if (effect.type === "buff_resistance") {
        for (const dt of (effect as { damageTypes: DamageType[] }).damageTypes) {
          fx.push({ type: "buff_resistance", damageType: dt });
        }
      }
      if (effect.type === "debuff_vulnerable") {
        for (const dt of (effect as { damageTypes: DamageType[] }).damageTypes) {
          fx.push({ type: "debuff_vulnerable", damageType: dt });
        }
      }
      if (effect.type === "debuff_max_energy") {
        fx.push({ type: "debuff_max_energy", value: (effect as { value: number }).value });
      }
      if (effect.type === "multi_buff") {
        const me = effect as { dodge?: number; block?: number; attack?: number; duration: number };
        // 判断 multi_buff 是增益还是减益
        const hasNegative = (me.dodge !== undefined && me.dodge < 0) || (me.block !== undefined && me.block < 0) || (me.attack !== undefined && me.attack < 0);
        if (hasNegative) isDebuff = true;
        if (me.dodge !== undefined) fx.push({ type: isDebuff ? "debuff_dodge" : "buff_dodge", value: me.dodge });
        if (me.block !== undefined) fx.push({ type: isDebuff ? "debuff_block" : "buff_block", value: me.block });
        if (me.attack !== undefined) fx.push({ type: isDebuff ? "debuff_attack" : "buff_attack", value: me.attack });
      }

      if (isDebuff) {
        target.debuffs.push({ name: ability.name, remaining: duration, effects: fx });
      } else {
        target.buffs.push({ name: ability.name, remaining: duration, effects: fx });
      }
      recomputeUnitStats(target);

      logs.push({
        round: state.round,
        actor: caster.name,
        action: ability.name,
        target: target.name,
        message: `${caster.name} 对 ${target.name} 施放 [${ability.name}]，持续${duration}回合`,
      });
    }
  }

  return logs;
}

// ========================================
// 执行回合
// ========================================

export function doNormalAttack(state: CombatState, attacker: CombatUnit, targetId: string, forcedRoll?: number): CombatLog[] {
  const target = state.units.find((u) => u.id === targetId);
  if (!target || target.hp <= 0) return [];
  const result = performAttack(attacker, target, 0, forcedRoll);
  let damage = 0;
  const logs: CombatLog[] = [];
  if (result.result !== "闪避") {
    const res = resolveDamage(attacker, target, result.damage, attacker.damageType);
    damage = res.damage;
    for (const msg of res.logs) {
      logs.push({ round: state.round, actor: attacker.name, action: "被动", message: msg });
    }
  }
  logs.push({
    round: state.round,
    actor: attacker.name,
    action: "普通攻击",
    target: target.name,
    roll: result.roll,
    damage,
    result: result.result,
    message: `${attacker.name} 普通攻击 ${target.name}，检定${result.roll} → ${result.result}，造成${damage}点【${attacker.damageType}】伤害`,
  });
  return logs;
}

export function doFullDefense(state: CombatState, unit: CombatUnit): CombatLog[] {
  unit.buffs.push({
    name: "全力防御",
    remaining: 3,
    effects: [
      { type: "buff_dodge", value: 2 },
      { type: "buff_block", value: 1 },
    ],
  });
  recomputeUnitStats(unit);
  return [{
    round: state.round,
    actor: unit.name,
    action: "全力防御",
    message: `${unit.name} 进入全力防御姿态，闪避+2，格挡+1，持续3回合`,
  }];
}

// ========================================
// 推进回合
// ========================================

export function nextTurn(state: CombatState): CombatState {
  if (state.finished) return state;

  // 检查胜负
  const playersAlive = state.units.some((u) => u.isPlayer && u.hp > 0);
  const enemiesAlive = state.units.some((u) => !u.isPlayer && u.hp > 0);
  if (!playersAlive || !enemiesAlive) {
    state.finished = true;
    state.logs.push({
      round: state.round,
      actor: "系统",
      action: "战斗结束",
      message: !playersAlive ? "玩家方全灭，战斗失败" : "敌人全灭，战斗胜利",
    });
    return state;
  }

  state.currentTurnIndex++;
  if (state.currentTurnIndex >= state.initiativeOrder.length) {
    state.currentTurnIndex = 0;
    state.round++;
    // 每轮开始扣除状态持续回合
    for (const uid of state.initiativeOrder) {
      const u = state.units.find((x) => x.id === uid);
      if (u && u.hp > 0) tickStatusEffects(u);
    }
  }

  // 跳过已死亡单位
  const currentId = state.initiativeOrder[state.currentTurnIndex];
  const currentUnit = state.units.find((u) => u.id === currentId);
  if (!currentUnit || currentUnit.hp <= 0) {
    return nextTurn(state);
  }

  return state;
}

export function getCurrentUnit(state: CombatState): CombatUnit | undefined {
  const id = state.initiativeOrder[state.currentTurnIndex];
  return state.units.find((u) => u.id === id && u.hp > 0);
}

// ========================================
// AI 自动行动
// ========================================

function getAbilityDamageType(a: ActiveAbility): DamageType | undefined {
  const e = a.effect;
  if (e.type === "damage") return e.damageType;
  return undefined;
}

function isDebuffAbility(a: ActiveAbility): boolean {
  const t = a.effect.type;
  return t.startsWith("debuff") || (t === "multi_buff" && (
    ((a.effect as { dodge?: number }).dodge ?? 0) < 0 ||
    ((a.effect as { block?: number }).block ?? 0) < 0 ||
    ((a.effect as { attack?: number }).attack ?? 0) < 0
  ));
}

function targetHasDebuff(target: CombatUnit, debuffName: string): boolean {
  return target.debuffs.some((d) => d.name === debuffName);
}

export function aiAutoAction(state: CombatState, unit: CombatUnit): CombatLog[] {
  const players = state.units.filter((u) => u.isPlayer && u.hp > 0);
  const allies = state.units.filter((u) => !u.isPlayer && u.hp > 0);
  if (players.length === 0) return [];

  const usableAbilities = unit.activeAbilities.filter((a) =>
    a.costType === "能量值" ? unit.ep >= a.cost : unit.hp > a.cost
  );

  if (usableAbilities.length > 0) {
    // 收集所有玩家当前的易伤类型
    const playerVulns = new Set<DamageType>();
    for (const p of players) {
      for (const v of p.vulnerabilities) playerVulns.add(v);
    }

    // 按策略评分排序能力
    const scored = usableAbilities.map((a) => {
      let score = Math.random() * 3;

      const dmgType = getAbilityDamageType(a);
      if (dmgType && playerVulns.has(dmgType)) score += 10;

      if (isDebuffAbility(a)) {
        const hasFreshTarget = players.some((p) => !targetHasDebuff(p, a.name));
        if (hasFreshTarget) score += 4;
        else score -= 4;
      }

      if (a.target === "自己" || a.target.includes("友方")) score += 2;

      return { ability: a, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const ability = scored[0].ability;

    let targets: string[] = [];
    if (ability.target === "自己") {
      targets = [unit.id];
    } else if (ability.target.includes("友方单位")) {
      if (ability.target.includes("所有")) {
        targets = allies.map((a) => a.id);
      } else {
        targets = allies.length > 0 ? [pickOne(allies).id] : [unit.id];
      }
    } else if (ability.target.includes("敌对单位")) {
      if (ability.target.includes("所有")) {
        targets = players.map((p) => p.id);
      } else {
        // 优先选有对应易伤或没有该 debuff 的目标
        const preferred = players.filter((p) => {
          const dmgType = getAbilityDamageType(ability);
          if (dmgType && p.vulnerabilities.includes(dmgType)) return true;
          if (isDebuffAbility(ability) && !targetHasDebuff(p, ability.name)) return true;
          return false;
        });
        targets = [pickOne(preferred.length > 0 ? preferred : players).id];
      }
    } else if (ability.target === "所有单位") {
      targets = state.units.filter((u) => u.hp > 0).map((u) => u.id);
    } else {
      targets = [pickOne(players).id];
    }
    return executeAbility(state, unit, ability, targets);
  }

    // 普攻：优先打有对应易伤的目标
  const preferredPlayers = players.filter((p) => p.vulnerabilities.includes(unit.damageType));
  const target = pickOne(preferredPlayers.length > 0 ? preferredPlayers : players);
  return doNormalAttack(state, unit, target.id);
}

// ========================================
// 随从 AI 自动行动（友方 AI，目标为敌人）
// ========================================

export function companionAutoAction(state: CombatState, unit: CombatUnit): CombatLog[] {
  const enemies = state.units.filter((u) => !u.isPlayer && u.hp > 0);
  const allies = state.units.filter((u) => u.isPlayer && u.hp > 0);
  if (enemies.length === 0) return [];

  const usableAbilities = unit.activeAbilities.filter((a) =>
    a.costType === "能量值" ? unit.ep >= a.cost : unit.hp > a.cost
  );

  if (usableAbilities.length > 0) {
    const enemyVulns = new Set<DamageType>();
    for (const e of enemies) {
      for (const v of e.vulnerabilities) enemyVulns.add(v);
    }

    const scored = usableAbilities.map((a) => {
      let score = Math.random() * 3;
      const dmgType = getAbilityDamageType(a);
      if (dmgType && enemyVulns.has(dmgType)) score += 10;
      if (isDebuffAbility(a)) {
        const hasFreshTarget = enemies.some((e) => !targetHasDebuff(e, a.name));
        if (hasFreshTarget) score += 4;
        else score -= 4;
      }
      if (a.target === "自己" || a.target.includes("友方")) score += 2;
      return { ability: a, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const ability = scored[0].ability;

    let targets: string[] = [];
    if (ability.target === "自己") {
      targets = [unit.id];
    } else if (ability.target.includes("友方单位")) {
      targets = ability.target.includes("所有") ? allies.map((a) => a.id) : [pickOne(allies).id];
    } else if (ability.target.includes("敌对单位")) {
      targets = ability.target.includes("所有") ? enemies.map((e) => e.id) : [pickOne(enemies).id];
    } else if (ability.target === "所有单位") {
      targets = state.units.filter((u) => u.hp > 0).map((u) => u.id);
    } else {
      targets = [pickOne(enemies).id];
    }
    return executeAbility(state, unit, ability, targets);
  }

  const preferredEnemies = enemies.filter((e) => e.vulnerabilities.includes(unit.damageType));
  const target = pickOne(preferredEnemies.length > 0 ? preferredEnemies : enemies);
  return doNormalAttack(state, unit, target.id);
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
