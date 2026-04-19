import { create } from "zustand";
import type { Weapon, Armor, Bloodline, Career, Character, Consumable, Companion } from "@/game/types";

export type GamePhase = "creation" | "hub" | "training" | "explore_result";
export type HubLocation = "广场" | "商店" | "休息区" | "训练场" | "传送门";

export type GameSave = {
  player: Character | null;
  inventoryWeapons: Weapon[];
  inventoryArmors: Armor[];
  inventoryConsumables: Consumable[];
  ownedBloodlines: Bloodline[];
  ownedCareers: Career[];
  companions: Companion[];
  // 主神空间状态
  phase: GamePhase;
  hubLocation: HubLocation;
  actionPoints: number;
  cycleCount: number;
  dungeonLetter: "A" | "B" | "C" | null;
};

export type SaveSlot = {
  name: string;
  timestamp: number;
  data: GameSave;
};

const SAVE_KEY = "crpg_saves_v1";

function readSaves(): Record<number, SaveSlot> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function writeSaves(saves: Record<number, SaveSlot>) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

export function listSaves(): Record<number, SaveSlot> {
  return readSaves();
}

type GameState = GameSave & {
  setPlayer: (player: Character | null) => void;
  addWeapon: (weapon: Weapon) => void;
  removeWeapon: (id: string) => void;
  addArmor: (armor: Armor) => void;
  removeArmor: (id: string) => void;
  addConsumable: (item: Consumable) => void;
  removeConsumable: (id: string) => void;
  useConsumable: (id: string) => string | null;
  addBloodline: (bloodline: Bloodline) => void;
  removeBloodline: (id: string) => void;
  addCareer: (career: Career) => void;
  removeCareer: (id: string) => void;
  equipWeapon: (weapon: Weapon) => void;
  equipArmor: (armor: Armor) => void;
  equipBloodline: (bloodline: Bloodline) => void;
  equipCareer: (career: Career) => void;
  unequipWeapon: () => void;
  unequipArmor: () => void;
  unequipBloodline: () => void;
  unequipCareer: () => void;
  // 随从
  addCompanion: (companion: Companion) => void;
  removeCompanion: (id: string) => void;
  equipCompanionWeapon: (companionId: string, weapon: Weapon) => void;
  equipCompanionArmor: (companionId: string, armor: Armor) => void;
  unequipCompanionWeapon: (companionId: string) => void;
  unequipCompanionArmor: (companionId: string) => void;
  reviveCompanions: () => void;
  // 训练场
  trainSkill: (skill: SkillName, amount?: number) => boolean;
  // 流程控制
  setPhase: (phase: GamePhase) => void;
  setHubLocation: (loc: HubLocation) => void;
  spendActionPoint: (cost?: number) => boolean;
  restoreActionPoints: () => void;
  nextCycle: () => void;
  resetGame: () => void;
  // 存档
  saveGame: (slot: number, name?: string) => void;
  loadGame: (slot: number) => boolean;
  deleteSave: (slot: number) => void;
};

import { equipWeapon as charEquipWeapon, equipArmor as charEquipArmor, setBloodline as charSetBloodline, addCareer as charAddCareer, recalculateCharacter } from "@/game/character";

const INITIAL_STATE: GameSave = {
  player: null,
  inventoryWeapons: [],
  inventoryArmors: [],
  inventoryConsumables: [],
  ownedBloodlines: [],
  ownedCareers: [],
  companions: [],
  phase: "creation",
  hubLocation: "广场",
  actionPoints: 6,
  cycleCount: 0,
  dungeonLetter: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setPlayer: (player) => set({ player }),

  addWeapon: (weapon) => set((s) => ({ inventoryWeapons: [...s.inventoryWeapons, weapon] })),
  removeWeapon: (id) => set((s) => ({ inventoryWeapons: s.inventoryWeapons.filter((w) => w.id !== id) })),

  addArmor: (armor) => set((s) => ({ inventoryArmors: [...s.inventoryArmors, armor] })),
  removeArmor: (id) => set((s) => ({ inventoryArmors: s.inventoryArmors.filter((a) => a.id !== id) })),

  addConsumable: (item) => set((s) => ({ inventoryConsumables: [...s.inventoryConsumables, item] })),
  removeConsumable: (id) => set((s) => ({ inventoryConsumables: s.inventoryConsumables.filter((i) => i.id !== id) })),

  useConsumable: (id) => {
    const { player, inventoryConsumables, removeConsumable } = get();
    if (!player) return null;
    const item = inventoryConsumables.find((c) => c.id === id);
    if (!item) return null;
    let log = "";
    if (item.gameEffect.type === "heal_hp") {
      const before = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + item.gameEffect.value);
      const healed = player.hp - before;
      log = `${player.name} 使用 ${item.name}，恢复 ${healed} 点生命值`;
    } else if (item.gameEffect.type === "heal_ep") {
      const before = player.ep;
      player.ep = Math.min(player.maxEp, player.ep + item.gameEffect.value);
      const healed = player.ep - before;
      log = `${player.name} 使用 ${item.name}，恢复 ${healed} 点能量值`;
    }
    removeConsumable(item.id);
    set({ player: { ...player } });
    return log;
  },

  addBloodline: (bloodline) => set((s) => ({ ownedBloodlines: [...s.ownedBloodlines, bloodline] })),
  removeBloodline: (id) => set((s) => ({ ownedBloodlines: s.ownedBloodlines.filter((b) => b.id !== id) })),

  addCareer: (career) => set((s) => ({ ownedCareers: [...s.ownedCareers, career] })),
  removeCareer: (id) => set((s) => ({ ownedCareers: s.ownedCareers.filter((c) => c.id !== id) })),

  equipWeapon: (weapon) => {
    const { player, addWeapon, removeWeapon } = get();
    if (!player) return;
    if (player.weapon) addWeapon(player.weapon);
    removeWeapon(weapon.id);
    charEquipWeapon(player, weapon);
    set({ player: { ...player } });
  },

  equipArmor: (armor) => {
    const { player, addArmor, removeArmor } = get();
    if (!player) return;
    if (player.armor) addArmor(player.armor);
    removeArmor(armor.id);
    charEquipArmor(player, armor);
    set({ player: { ...player } });
  },

  equipBloodline: (bloodline) => {
    const { player, addBloodline, removeBloodline } = get();
    if (!player) return;
    if (player.bloodline) addBloodline(player.bloodline);
    removeBloodline(bloodline.id);
    charSetBloodline(player, bloodline);
    set({ player: { ...player } });
  },

  equipCareer: (career) => {
    const { player, addCareer, removeCareer } = get();
    if (!player) return;
    if (player.career) addCareer(player.career);
    removeCareer(career.id);
    charAddCareer(player, career);
    set({ player: { ...player } });
  },

  unequipWeapon: () => {
    const { player, addWeapon } = get();
    if (!player) return;
    if (player.weapon) addWeapon(player.weapon);
    player.weapon = undefined;
    recalculateCharacter(player);
    set({ player: { ...player } });
  },

  unequipArmor: () => {
    const { player, addArmor } = get();
    if (!player) return;
    if (player.armor) addArmor(player.armor);
    player.armor = undefined;
    recalculateCharacter(player);
    set({ player: { ...player } });
  },

  unequipBloodline: () => {
    const { player, addBloodline } = get();
    if (!player) return;
    if (player.bloodline) addBloodline(player.bloodline);
    player.bloodline = undefined;
    recalculateCharacter(player);
    set({ player: { ...player } });
  },

  unequipCareer: () => {
    const { player, addCareer } = get();
    if (!player) return;
    if (player.career) addCareer(player.career);
    player.career = undefined;
    recalculateCharacter(player);
    set({ player: { ...player } });
  },

  addCompanion: (companion) => set((s) => ({ companions: [...s.companions, companion] })),
  removeCompanion: (id) => set((s) => ({ companions: s.companions.filter((c) => c.id !== id) })),

  equipCompanionWeapon: (companionId, weapon) => {
    const { companions, addWeapon, removeWeapon } = get();
    const comp = companions.find((c) => c.id === companionId);
    if (!comp) return;
    if (comp.weapon) addWeapon(comp.weapon);
    removeWeapon(weapon.id);
    comp.weapon = weapon;
    // 重新计算随从战斗数值
    const attrHalf = Math.ceil(comp.attributes[weapon.checkAttribute] / 2);
    comp.attackBonus = attrHalf + 1 + weapon.weaponBonus;
    comp.checkAttribute = weapon.checkAttribute;
    comp.damageType = weapon.damageType;
    set({ companions: [...companions] });
  },

  equipCompanionArmor: (companionId, armor) => {
    const { companions, addArmor, removeArmor } = get();
    const comp = companions.find((c) => c.id === companionId);
    if (!comp) return;
    if (comp.armor) addArmor(comp.armor);
    removeArmor(armor.id);
    comp.armor = armor;
    // 重新计算防御数值
    const agi = comp.attributes["敏捷"];
    const str = comp.attributes["力量"];
    comp.dodge = 5 + Math.ceil(agi / 2) + armor.dodgeBonus;
    comp.block = comp.dodge + Math.ceil(str / 2) + armor.blockBonus;
    set({ companions: [...companions] });
  },

  unequipCompanionWeapon: (companionId) => {
    const { companions, addWeapon } = get();
    const comp = companions.find((c) => c.id === companionId);
    if (!comp || !comp.weapon) return;
    addWeapon(comp.weapon);
    comp.weapon = undefined;
    comp.attackBonus = Math.ceil(comp.attributes["力量"] / 2) + 1;
    comp.checkAttribute = "力量";
    comp.damageType = "物理";
    set({ companions: [...companions] });
  },

  unequipCompanionArmor: (companionId) => {
    const { companions, addArmor } = get();
    const comp = companions.find((c) => c.id === companionId);
    if (!comp || !comp.armor) return;
    addArmor(comp.armor);
    comp.armor = undefined;
    const agi = comp.attributes["敏捷"];
    const str = comp.attributes["力量"];
    comp.dodge = 5 + Math.ceil(agi / 2);
    comp.block = comp.dodge + Math.ceil(str / 2);
    set({ companions: [...companions] });
  },

  reviveCompanions: () => {
    set((s) => ({
      companions: s.companions.map((c) => ({
        ...c,
        hp: c.maxHp,
        ep: c.maxEp,
      })),
    }));
  },

  trainSkill: (skill, amount = 1) => {
    const { player, spendActionPoint } = get();
    if (!player) return false;
    if (!spendActionPoint(1)) return false;
    const current = player.trainedSkills[skill] ?? 0;
    const maxTrain = 3;
    if (current >= maxTrain) return false;
    player.trainedSkills[skill] = Math.min(maxTrain, current + amount);
    recalculateCharacter(player);
    set({ player: { ...player } });
    return true;
  },

  setPhase: (phase) => set({ phase }),
  setHubLocation: (hubLocation) => set({ hubLocation }),

  spendActionPoint: (cost = 1) => {
    const { actionPoints } = get();
    if (actionPoints < cost) return false;
    set({ actionPoints: actionPoints - cost });
    return true;
  },

  restoreActionPoints: () => set({ actionPoints: 6 }),

  nextCycle: () => set((s) => ({
    cycleCount: s.cycleCount + 1,
    actionPoints: 6,
    dungeonLetter: null,
    companions: s.companions.map((c) => ({ ...c, hp: c.maxHp, ep: c.maxEp })),
  })),

  resetGame: () => set(INITIAL_STATE),

  saveGame: (slot, name) => {
    const state = get();
    const saves = readSaves();
    const saveName = name || (state.player ? `${state.player.name} · ${state.hubLocation} · 第${state.cycleCount}周期` : `存档 ${slot}`);
    saves[slot] = {
      name: saveName,
      timestamp: Date.now(),
      data: {
        player: state.player,
        inventoryWeapons: state.inventoryWeapons,
        inventoryArmors: state.inventoryArmors,
        inventoryConsumables: state.inventoryConsumables,
        ownedBloodlines: state.ownedBloodlines,
        ownedCareers: state.ownedCareers,
        companions: state.companions,
        phase: state.phase,
        hubLocation: state.hubLocation,
        actionPoints: state.actionPoints,
        cycleCount: state.cycleCount,
        dungeonLetter: state.dungeonLetter,
      },
    };
    writeSaves(saves);
  },

  loadGame: (slot) => {
    const saves = readSaves();
    const save = saves[slot];
    if (!save) return false;
    set({ ...save.data });
    return true;
  },

  deleteSave: (slot) => {
    const saves = readSaves();
    delete saves[slot];
    writeSaves(saves);
  },
}));
