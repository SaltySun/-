// ========================================
// 灰蚀大陆副本 - 核心类型定义
// ========================================

import type { Monster, Character, Companion, CombatLog } from "@/game/types";

/** 副本章节标识 */
export type DungeonChapter =
  | "A"
  | "B.1" | "B.2" | "B.3" | "B.4"
  | "C.1" | "C.2" | "C.3" | "C.4" | "C.5"
  | "D.1" | "D.2" | "D.3" | "D.4" | "D.5"
  | "E.1" | "E.2" | "E.3" | "E.4" | "E.5"
  | "F";

/** 副本进行阶段 */
export type DungeonPhase = "narrative" | "combat" | "choice" | "ending" | "loading";

/** 副本专属道具 */
export type DungeonDifficulty = "简单" | "困难" | "死亡";

export interface DungeonItem {
  id: string;
  name: string;
  description: string;
  chapter?: DungeonChapter;
  effect?: string;
  quantity: number;
  usable?: boolean;
  effectType?: "heal_hp" | "heal_ep" | "buff" | "resist_gray";
  effectValue?: number;
}

/** NPC 羁绊状态 */
export interface NPCBond {
  npcId: string;
  name: string;
  fondness: number; // 0~100
  status: "陌生" | "熟悉" | "信任" | "羁绊" | "敌对";
  attitude: "冷漠" | "试探" | "友好" | "信任" | "依赖" | "警惕" | "敌对";
  flags: string[]; // 剧情标记，如 "received_warning", "shared_secret"
}

/** 叙事历史记录 */
export interface NarrativeEntry {
  role: "narrator" | "player" | "npc" | "system";
  speaker?: string;
  content: string;
  timestamp: number;
}

/** 玩家选择项 */
export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  consequenceHint?: string;
}

/** 叙事片段类型 */
export type NarrativeSegment =
  | { type: "narration"; content: string }
  | { type: "dialogue"; speaker: string; content: string };

/** AI 输出的叙事节点（解析后的结构化数据） */
export interface StatusChange {
  type: "consume" | "heal_hp" | "damage_hp" | "heal_ep" | "damage_ep" | "gain_weapon" | "gain_armor";
  target?: string;
  value: number;
}

export interface Checkpoint {
  skill: string; // 技能名，如"隐秘"
  difficulty: number; // 难度，6或8
  description?: string; // 场景描述，如"一扇锈死的铁门"
}

/** 目标进度项 */
export interface ObjectiveProgress {
  label: string;
  current: number;
  total: number;
}

/** 副本目标 */
export interface DungeonObjective {
  title: string;
  progress: ObjectiveProgress[];
}

/** 线索 */
export interface Clue {
  title: string;
  description: string;
  chapter?: DungeonChapter;
}

export interface NarrativeNode {
  sceneDescription: string;
  segments: NarrativeSegment[];
  speaker?: string;
  speakerName?: string;
  choices: ChoiceOption[];
  combatTrigger?: {
    enemies: string[];
    context: string;
  };
  itemRewards?: DungeonItem[];
  nextChapter?: DungeonChapter;
  npcDialogue?: {
    npcId: string;
    text: string;
  };
  statusChanges?: StatusChange[];
  checkpoints?: Checkpoint[];
  ending?: {
    title: string;
    description: string;
  };
  /** 目标更新（AI 标记 [目标:标题] [进度:标签=当前/总计] [目标完成]） */
  objectiveUpdate?: {
    title?: string;
    progress?: ObjectiveProgress[];
    completed?: boolean;
  };
  /** 新线索（AI 标记 [线索:标题]） */
  newClues?: Clue[];
}

/** 战斗摘要（传递给 AI 继续叙事用） */
export interface CombatSummary {
  roundCount: number;
  keyEvents: string[];
  playerAlive: boolean;
  alliesAlive: string[];
  enemiesDefeated: string[];
  lootDescription: string;
}

/** 副本完整状态 */
export interface DungeonState {
  moduleId: string;
  chapter: DungeonChapter;
  phase: DungeonPhase;
  difficulty: DungeonDifficulty;
  narrativeHistory: NarrativeEntry[];
  choices: ChoiceOption[];
  currentText: string;
  collectedItems: DungeonItem[];
  npcBonds: NPCBond[];
  choiceHistory: { chapter: DungeonChapter; choiceId: string; label: string }[];
  combatSummary?: CombatSummary;
  dyingRounds: number; // HP<=0 时的濒死计数，0=已死
  // 战斗频率控制
  combatCount: number; // 本章已触发战斗次数
  lastCombatRound: number; // 上次战斗时的 narrativeHistory 长度
  // 流式生成状态
  isStreaming: boolean;
  streamBuffer: string;
  // 结局信息（由 AI [结局] 标记触发）
  endingResult?: {
    title: string;
    description: string;
  };
  // 目标系统
  currentObjective?: DungeonObjective;
  discoveredClues: Clue[];
  completedChapters: DungeonChapter[];
}

/** 章节模板定义 */
export interface ChapterTemplate {
  id: DungeonChapter;
  title: string;
  location: string;
  objective: string;
  description: string;
  enemyPool: string[];
  allyPool?: string[];
  nextChapters: { condition: string; chapter: DungeonChapter }[];
  lootPool?: string[];
}

/** 怪物模板（基于 Monster 的副本专属配置） */
export interface DungeonMonsterTemplate {
  name: string;
  tier: Monster["tier"];
  category: Monster["category"];
  description: string;
  weakTo?: string;
  immuneTo?: string;
  specialTrait?: string;
}

/** NPC 人设模板 */
export interface NPCProfile {
  id: string;
  name: string;
  title: string;
  age: number;
  gender: string;
  faction: string;
  appearance: string;
  personality: string;
  backstory: string;
  goals: string;
  relationships: { name: string; relation: string }[];
  likes: string[];
  fears: string[];
  quirks: string[];
}

/** 世界观数据包 */
export interface WorldData {
  name: string;
  theme: string;
  truth: string;
  factions: { name: string; description: string; split?: string[] }[];
  locations: { name: string; description: string; danger?: string }[];
  faith: { name: string; doctrine: string; deities: { name: string; aspect: string }[] };
  npcs: NPCProfile[];
  monsters: DungeonMonsterTemplate[];
  items: DungeonItem[];
  chapters: ChapterTemplate[];
  endings: { id: string; title: string; description: string; condition: string }[];
}
