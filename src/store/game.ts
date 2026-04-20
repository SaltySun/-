import { create } from "zustand";
import type { Weapon, Armor, Bloodline, Career, Character, Consumable, Companion, SkillName } from "@/game/types";
import type { DungeonState, DungeonChapter, DungeonPhase, DungeonItem, ChoiceOption, NarrativeEntry, NPCBond, DungeonDifficulty } from "@/game/dungeon/types";

export type GamePhase = "creation" | "hub" | "training" | "explore_result" | "dungeon";
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
  dungeonState: DungeonState | null;
  // 全局NPC关系（跨副本继承）
  globalNPCBonds: NPCBond[];
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
  adjustCompanionFondness: (id: string, delta: number) => void;
  chatWithCompanion: (id: string) => boolean;
  // 训练场
  trainSkill: (skill: SkillName, amount?: number) => boolean;
  // 流程控制
  setPhase: (phase: GamePhase) => void;
  setHubLocation: (loc: HubLocation) => void;
  spendActionPoint: (cost?: number) => boolean;
  restoreActionPoints: () => void;
  nextCycle: () => void;
  resetGame: () => void;
  // 副本
  startDungeon: (difficulty?: DungeonDifficulty) => void;
  consumeDungeonItem: (name: string, qty?: number) => boolean;
  setDungeonDyingRounds: (rounds: number) => void;
  recordDungeonCombat: () => void;
  advanceDungeon: (chapter: DungeonChapter) => void;
  makeChoice: (choice: ChoiceOption) => void;
  addDungeonItem: (item: DungeonItem) => void;
  updateNPCBond: (npcId: string, delta: number, flag?: string) => void;
  setDungeonPhase: (phase: DungeonPhase) => void;
  appendNarrative: (entry: NarrativeEntry) => void;
  setDungeonStream: (isStreaming: boolean, buffer?: string) => void;
  setDungeonEnding: (ending: { title: string; description: string }) => void;
  setDungeonObjective: (objective: DungeonObjective) => void;
  updateDungeonProgress: (label: string, current: number, total?: number) => void;
  completeDungeonObjective: () => void;
  addDungeonClue: (clue: Clue) => void;
  markChapterComplete: (chapter: DungeonChapter) => void;
  endDungeon: () => void;
  // 存档
  saveGame: (slot: number, name?: string) => void;
  loadGame: (slot: number) => boolean;
  deleteSave: (slot: number) => void;
};

import { equipWeapon as charEquipWeapon, equipArmor as charEquipArmor, setBloodline as charSetBloodline, addCareer as charAddCareer, recalculateCharacter } from "@/game/character";
import { getChapterTemplate } from "@/game/dungeon/data";
import { saveChapterSummary, clearDungeonMemory } from "@/utils/dungeonMemory";

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
  dungeonState: null,
  globalNPCBonds: [
    { npcId: "silas_vane", name: "塞拉斯·维恩", fondness: 10, status: "陌生", attitude: "试探", flags: [] },
  ],
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

  adjustCompanionFondness: (id, delta) => {
    set((s) => ({
      companions: s.companions.map((c) =>
        c.id === id ? { ...c, fondness: Math.max(0, Math.min(100, c.fondness + delta)) } : c
      ),
    }));
  },

  chatWithCompanion: (id) => {
    const { player, spendActionPoint, companions } = get();
    if (!player) return false;
    const comp = companions.find((c) => c.id === id);
    if (!comp) return false;
    if (!spendActionPoint(1)) return false;
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const newFondness = Math.min(100, comp.fondness + rand(3, 8));
    set((s) => ({
      companions: s.companions.map((c) =>
        c.id === id ? { ...c, fondness: newFondness } : c
      ),
    }));
    return true;
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

  startDungeon: (difficulty = "困难") => {
    // 清理旧副本记忆
    clearDungeonMemory("gray_corrosion").catch(() => {});
    const { globalNPCBonds } = get();
    const chapterA = getChapterTemplate("A");
    // 用全局NPC关系初始化副本关系（跨副本继承）
    const dungeonNPCBonds = globalNPCBonds.map((b) => ({ ...b }));
    const initialDungeon: DungeonState = {
      moduleId: "gray_corrosion",
      chapter: "A",
      phase: "narrative",
      difficulty,
      narrativeHistory: [],
      choices: [],
      currentText: "",
      collectedItems: [],
      npcBonds: dungeonNPCBonds,
      choiceHistory: [],
      dyingRounds: -1,
      combatCount: 0,
      lastCombatRound: -1,
      isStreaming: false,
      streamBuffer: "",
      discoveredClues: [],
      completedChapters: [],
      currentObjective: chapterA?.objective ? { title: chapterA.objective, progress: [] } : undefined,
    };
    set({ phase: "dungeon", dungeonState: initialDungeon });
  },

  endDungeon: () => {
    clearDungeonMemory("gray_corrosion").catch(() => {});
    set((s) => {
      // 将副本中更新的NPC关系同步回全局
      const updatedBonds = s.dungeonState?.npcBonds ?? s.globalNPCBonds;
      return {
        phase: "hub",
        hubLocation: "广场",
        dungeonState: null,
        globalNPCBonds: updatedBonds,
      };
    });
  },

  consumeDungeonItem: (name, qty = 1) => {
    let success = false;
    set((s) => {
      if (!s.dungeonState) return s;
      const idx = s.dungeonState.collectedItems.findIndex((i) => i.name === name);
      if (idx < 0) return s;
      const item = s.dungeonState.collectedItems[idx];
      if (item.quantity < qty) return s;
      success = true;
      const updated = [...s.dungeonState.collectedItems];
      if (item.quantity <= qty) {
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...item, quantity: item.quantity - qty };
      }
      return { dungeonState: { ...s.dungeonState, collectedItems: updated } };
    });
    return success;
  },

  setDungeonDyingRounds: (rounds) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return { dungeonState: { ...s.dungeonState, dyingRounds: rounds } };
    });
  },

  recordDungeonCombat: () => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          combatCount: s.dungeonState.combatCount + 1,
          lastCombatRound: s.dungeonState.narrativeHistory.length,
        },
      };
    });
  },

  advanceDungeon: (chapter) => {
    set((s) => {
      if (!s.dungeonState) return s;
      const prevChapter = s.dungeonState.chapter;
      // 生成上一章节摘要并存入 IndexedDB
      const prevTemplate = getChapterTemplate(prevChapter);
      const chapterChoices = s.dungeonState.choiceHistory.filter((c) => c.chapter === prevChapter);
      const chapterItems = s.dungeonState.collectedItems.filter((i) => i.chapter === prevChapter);
      const summaryParts: string[] = [];
      if (prevTemplate) summaryParts.push(`【${prevTemplate.title}】`);
      if (chapterChoices.length > 0) {
        summaryParts.push(`玩家选择：${chapterChoices.map((c) => c.label).join("、")}`);
      }
      if (chapterItems.length > 0) {
        summaryParts.push(`获得道具：${chapterItems.map((i) => i.name).join("、")}`);
      }
      if (s.dungeonState.npcBonds.length > 0) {
        summaryParts.push(
          `NPC状态：${s.dungeonState.npcBonds.map((b) => `${b.name}(${b.status},${b.fondness})`).join("、")}`
        );
      }
      const summary = summaryParts.join("；") + "。";
      saveChapterSummary(s.dungeonState.moduleId, prevChapter, summary).catch(() => {});

      // 设置新章节目标
      const nextTemplate = getChapterTemplate(chapter);
      const nextObjective = nextTemplate?.objective
        ? { title: nextTemplate.objective, progress: [] as import("./types").ObjectiveProgress[] }
        : undefined;

      return {
        dungeonState: {
          ...s.dungeonState,
          chapter,
          phase: "narrative",
          combatSummary: undefined,
          combatCount: 0, // 新章节重置战斗计数
          lastCombatRound: -1,
          currentObjective: nextObjective,
        },
      };
    });
  },

  makeChoice: (choice) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          choiceHistory: [
            ...s.dungeonState.choiceHistory,
            { chapter: s.dungeonState.chapter, choiceId: choice.id, label: choice.label },
          ],
          choices: [],
          phase: "loading",
        },
      };
    });
  },

  addDungeonItem: (item) => {
    set((s) => {
      if (!s.dungeonState) return s;
      const existingIndex = s.dungeonState.collectedItems.findIndex((i) => i.name === item.name);
      if (existingIndex >= 0) {
        const updated = [...s.dungeonState.collectedItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + item.quantity };
        return { dungeonState: { ...s.dungeonState, collectedItems: updated } };
      }
      return {
        dungeonState: {
          ...s.dungeonState,
          collectedItems: [...s.dungeonState.collectedItems, item],
        },
      };
    });
  },

  updateNPCBond: (npcId, delta, flag) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          npcBonds: s.dungeonState.npcBonds.map((bond) => {
            if (bond.npcId !== npcId) return bond;
            const newFondness = Math.max(0, Math.min(100, bond.fondness + delta));
            let status: NPCBond["status"] = bond.status;
            if (newFondness >= 80) status = "羁绊";
            else if (newFondness >= 60) status = "信任";
            else if (newFondness >= 30) status = "熟悉";
            else if (newFondness >= 10) status = "陌生";
            else status = "敌对";
            // 态度自动映射（更细粒度）
            let attitude: NPCBond["attitude"] = bond.attitude;
            if (newFondness >= 85) attitude = "依赖";
            else if (newFondness >= 70) attitude = "信任";
            else if (newFondness >= 50) attitude = "友好";
            else if (newFondness >= 35) attitude = "试探";
            else if (newFondness >= 15) attitude = "冷漠";
            else if (newFondness >= 5) attitude = "警惕";
            else attitude = "敌对";
            return {
              ...bond,
              fondness: newFondness,
              status,
              attitude,
              flags: flag ? [...bond.flags, flag] : bond.flags,
            };
          }),
        },
      };
    });
  },

  setDungeonPhase: (phase) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return { dungeonState: { ...s.dungeonState, phase } };
    });
  },

  appendNarrative: (entry) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          narrativeHistory: [...s.dungeonState.narrativeHistory, entry],
          currentText: entry.role === "narrator" || entry.role === "npc" ? entry.content : s.dungeonState.currentText,
        },
      };
    });
  },

  setDungeonStream: (isStreaming, buffer = "") => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          isStreaming,
          streamBuffer: buffer,
        },
      };
    });
  },

  setDungeonEnding: (ending) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          phase: "ending",
          endingResult: ending,
        },
      };
    });
  },

  setDungeonObjective: (objective) => {
    set((s) => {
      if (!s.dungeonState) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          currentObjective: objective,
        },
      };
    });
  },

  updateDungeonProgress: (label, current, total) => {
    set((s) => {
      if (!s.dungeonState || !s.dungeonState.currentObjective) return s;
      const obj = s.dungeonState.currentObjective;
      const existing = obj.progress.find((p) => p.label === label);
      let newProgress;
      if (existing) {
        newProgress = obj.progress.map((p) =>
          p.label === label ? { ...p, current, total: total ?? p.total } : p
        );
      } else {
        newProgress = [...obj.progress, { label, current, total: total ?? current }];
      }
      return {
        dungeonState: {
          ...s.dungeonState,
          currentObjective: { ...obj, progress: newProgress },
        },
      };
    });
  },

  completeDungeonObjective: () => {
    set((s) => {
      if (!s.dungeonState || !s.dungeonState.currentObjective) return s;
      const chapter = s.dungeonState.chapter;
      const completed = s.dungeonState.completedChapters.includes(chapter)
        ? s.dungeonState.completedChapters
        : [...s.dungeonState.completedChapters, chapter];
      return {
        dungeonState: {
          ...s.dungeonState,
          currentObjective: undefined,
          completedChapters: completed,
        },
      };
    });
  },

  addDungeonClue: (clue) => {
    set((s) => {
      if (!s.dungeonState) return s;
      const exists = s.dungeonState.discoveredClues.some((c) => c.title === clue.title);
      if (exists) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          discoveredClues: [...s.dungeonState.discoveredClues, clue],
        },
      };
    });
  },

  markChapterComplete: (chapter) => {
    set((s) => {
      if (!s.dungeonState) return s;
      if (s.dungeonState.completedChapters.includes(chapter)) return s;
      return {
        dungeonState: {
          ...s.dungeonState,
          completedChapters: [...s.dungeonState.completedChapters, chapter],
        },
      };
    });
  },

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
        dungeonState: state.dungeonState,
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
