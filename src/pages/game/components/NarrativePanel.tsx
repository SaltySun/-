// ========================================
// 叙事面板 - LLM 驱动跑团核心 UI（MVP）
// 旁白叙述 + NPC对话框样式
// ========================================

import { useState, useEffect, useRef, useCallback } from "react";
import type { Character, Companion, Monster, EquipmentQuality } from "@/game/types";
import type { DungeonState, NarrativeNode, ChoiceOption, CombatSummary, NarrativeSegment, DungeonDifficulty, DungeonItem, Checkpoint } from "@/game/dungeon/types";
import { useGlobalStore } from "@/store/global";
import { useGameStore } from "@/store/game";
import {
  generateNarrative,
  parseAIResponse,
  createNarratorEntry,
  createPlayerChoiceEntry,
  createNPCEntry,
  getBondStatusText,
} from "@/game/dungeon/narrative";
import { getChapterTemplate } from "@/game/dungeon/data";
import { saveRawLog, getChapterSummaries } from "@/utils/dungeonMemory";
import { generateWeapon, generateArmor } from "@/game/generator";
import { resolveCombatEnemies } from "@/game/dungeon/monsterLibrary";

// ------------------------------------------------------------------
// 技能检定关键词映射
// ------------------------------------------------------------------

const SKILL_KEYWORDS: Record<string, string> = {
  "说服": "社交", "谈判": "社交", "交流": "社交", "沟通": "社交", "劝说": "社交",
  "撬锁": "隐秘", "潜行": "隐秘", "躲藏": "隐秘", "偷袭": "隐秘", "偷窃": "隐秘", "隐蔽": "隐秘",
  "观察": "察觉", "搜索": "察觉", "检查": "察觉", "感知": "察觉", "聆听": "察觉", "侦察": "察觉",
  "阅读": "学识", "研究": "学识", "分析": "学识", "辨认": "学识", "解读": "学识", "理解": "学识",
  "攀爬": "运动", "跳跃": "运动", "游泳": "运动", "破门": "运动", "奔跑": "运动",
  "修理": "机械", "拆解": "机械", "组装": "机械", "操控": "机械", "破解": "机械",
  "指挥": "统御", "号召": "统御", "激励": "统御", "领导": "统御",
  "野外": "生存", "追踪": "生存", "生火": "生存", "觅食": "生存", "露营": "生存",
};

function roll2d6(): [number, number] {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

function resolveSkillCheck(
  action: string,
  checkpoints: Checkpoint[],
  player: Character
): { skill: string; difficulty: number; dice: [number, number]; skillValue: number; total: number; result: "大失败" | "失败" | "成功" | "大成功" } | null {
  // 1. 匹配关键词到技能
  let matchedSkill: string | null = null;
  for (const [keyword, skill] of Object.entries(SKILL_KEYWORDS)) {
    if (action.includes(keyword)) {
      matchedSkill = skill;
      break;
    }
  }
  if (!matchedSkill) return null; // 没有技能关键词，不检定

  // 2. 在检定点中查找匹配的技能
  const cp = checkpoints.find((c) => c.skill === matchedSkill);
  const difficulty = cp?.difficulty ?? 6; // 默认难度 6

  // 3. 投骰子
  const [d1, d2] = roll2d6();
  const skillValue = (player.skills as Record<string, number>)[matchedSkill] ?? 0;
  const total = d1 + d2 + skillValue;

  // 4. 判定结果
  let result: "大失败" | "失败" | "成功" | "大成功";
  if (d1 === 1 && d2 === 1) {
    result = "大失败";
  } else if (d1 === 6 && d2 === 6) {
    result = "大成功";
  } else if (total > difficulty) {
    result = "成功";
  } else {
    result = "失败";
  }

  return { skill: matchedSkill, difficulty, dice: [d1, d2], skillValue, total, result };
}

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

function getMaxQuality(difficulty: DungeonDifficulty): EquipmentQuality {
  switch (difficulty) {
    case "简单": return "不凡";
    case "困难": return "稀有";
    case "死亡": return "传说";
  }
}

function rollQuality(difficulty: DungeonDifficulty): EquipmentQuality {
  const qualities: EquipmentQuality[] = ["普通", "不凡", "稀有", "传说"];
  const maxIndex = qualities.indexOf(getMaxQuality(difficulty));
  const roll = Math.floor(Math.random() * (maxIndex + 1));
  return qualities[roll];
}

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------

interface NarrativePanelProps {
  player: Character;
  companions: Companion[];
  onCombatStart?: (enemies: Monster[], context: string) => void;
}

// ------------------------------------------------------------------
// 渲染单个叙事片段
// ------------------------------------------------------------------

function NarrationBlock({ content }: { content: string }) {
  return (
    <div className="border-l-4 border-stone bg-parchment-dark/50 py-3 pl-4 pr-3">
      <p className="text-sm leading-relaxed text-ink-light whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function DialogueBlock({ speaker, content }: { speaker: string; content: string }) {
  const isSilas = speaker.includes("塞拉斯");
  return (
    <div className="flex gap-3 py-1">
      {/* 左侧名字标签 */}
      <div className="flex-shrink-0 pt-1">
        <div
          className={`inline-block border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
            isSilas
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-stone bg-parchment-dark text-ink-light"
          }`}
        >
          {speaker}
        </div>
      </div>
      {/* 右侧对话气泡 */}
      <div className="flex-1 min-w-0">
        <div
          className={`inline-block border-2 px-4 py-2.5 text-sm leading-relaxed ${
            isSilas
              ? "border-gold/40 bg-parchment text-ink"
              : "border-stone bg-parchment-dark text-ink"
          }`}
        >
          <span className={isSilas ? "text-gold" : "text-ink-light"}>「</span>
          {content}
          <span className={isSilas ? "text-gold" : "text-ink-light"}>」</span>
        </div>
      </div>
    </div>
  );
}

function PlayerActionBlock({ content }: { content: string }) {
  return (
    <div className="flex justify-end py-1">
      <div className="inline-block border-2 border-ink bg-ink px-4 py-2 text-xs text-parchment">
        {content}
      </div>
    </div>
  );
}

function SystemBlock({ content }: { content: string }) {
  return (
    <div className="py-1 text-center">
      <span className="text-[10px] uppercase tracking-[0.3em] text-ink-light/50">{content}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// 组件
// ------------------------------------------------------------------

export default function NarrativePanel({ player, companions, onCombatStart }: NarrativePanelProps) {
  const { baseURL, apiKey, modelId } = useGlobalStore();
  const {
    dungeonState,
    appendNarrative,
    makeChoice,
    addDungeonItem,
    consumeDungeonItem,
    updateNPCBond,
    setDungeonPhase,
    setDungeonStream,
    setDungeonDyingRounds,
    recordDungeonCombat,
    advanceDungeon,
    setDungeonEnding,
    setDungeonObjective,
    updateDungeonProgress,
    completeDungeonObjective,
    addDungeonClue,
    markChapterComplete,
    endDungeon,
    addWeapon,
    addArmor,
    setPlayer,
  } = useGameStore();

  const [displayText, setDisplayText] = useState("");
  const [choices, setChoices] = useState<ChoiceOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const state = dungeonState;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayText, isGenerating, state?.narrativeHistory.length]);

  // 核心：触发 AI 叙事生成
  const generate = useCallback(
    async (combatSummary?: CombatSummary) => {
      // 主动获取最新 dungeonState，避免闭包陷阱
      const state = useGameStore.getState().dungeonState;
      if (!state || isGenerating) return;
      if (!baseURL || !apiKey) {
        setError("LLM API 未配置。请检查 .env.local 中的 VITE_MUJIAN_API_KEY。");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setChoices([]);
      setDisplayText("");
      setDungeonStream(true, "");

      // 取消之前的请求
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      let fullText = "";

      try {
        const apiConfig = { baseURL, apiKey, modelId };
        const generator = generateNarrative(state, player, companions, apiConfig, combatSummary, controller.signal);

        let result: IteratorResult<string, NarrativeNode>;

        do {
          result = await generator.next();
          if (!result.done) {
            fullText += result.value;
            setDisplayText(fullText);
            setDungeonStream(true, fullText);
          }
        } while (!result.done);

        const node: NarrativeNode = result.value;

        // 处理解析结果：把片段追加到叙事历史
        for (const seg of node.segments) {
          if (seg.type === "narration") {
            appendNarrative(createNarratorEntry(seg.content));
          } else if (seg.type === "dialogue") {
            appendNarrative(createNPCEntry(seg.speaker, seg.content));
          }
        }
        // 如果没有解析到任何片段，把整个文本作为旁白
        if (node.segments.length === 0 && node.sceneDescription) {
          appendNarrative(createNarratorEntry(node.sceneDescription));
        }

        setDisplayText("");
        setDungeonStream(false, "");

        // 保存原始日志到 IndexedDB（L1）
        const roundIndex = state.narrativeHistory.length;
        saveRawLog(state.moduleId, state.chapter, roundIndex, state.narrativeHistory).catch(() => {});

        // 保存检定点
        if (node.checkpoints && node.checkpoints.length > 0) {
          setCheckpoints(node.checkpoints);
        }

        // 处理道具奖励
        if (node.itemRewards) {
          for (const item of node.itemRewards) {
            addDungeonItem(item);
          }
        }

        // 处理章节推进
        if (node.nextChapter) {
          advanceDungeon(node.nextChapter);
          // 设置新章节的默认目标（从章节模板读取）
          const nextTemplate = getChapterTemplate(node.nextChapter);
          if (nextTemplate?.objective) {
            setDungeonObjective({ title: nextTemplate.objective, progress: [] });
          }
          return;
        }

        // 处理目标系统更新
        if (node.objectiveUpdate) {
          if (node.objectiveUpdate.title) {
            setDungeonObjective({ title: node.objectiveUpdate.title, progress: node.objectiveUpdate.progress ?? [] });
          } else if (node.objectiveUpdate.progress && node.objectiveUpdate.progress.length > 0) {
            for (const p of node.objectiveUpdate.progress) {
              updateDungeonProgress(p.label, p.current, p.total);
            }
          }
          if (node.objectiveUpdate.completed) {
            completeDungeonObjective();
            appendNarrative({ role: "system", content: "✅ 当前目标已完成。", timestamp: Date.now() });
          }
        }

        // 处理新线索
        if (node.newClues && node.newClues.length > 0) {
          for (const clue of node.newClues) {
            addDungeonClue(clue);
            appendNarrative({ role: "system", content: `🕵️ 发现线索：${clue.title}`, timestamp: Date.now() });
          }
        }

        // 处理状态变化（消耗/治疗/伤害/恢复/扣减/获得装备）
        let nextHp = player.hp;
        let nextEp = player.ep;
        // 战后恢复过滤：战斗刚结束时，禁止 AI 自动恢复 HP/EP（防止脑补回血）
        const isPostCombat = !!combatSummary;
        const filteredChanges = isPostCombat
          ? node.statusChanges?.filter((c) => c.type !== "heal_hp" && c.type !== "heal_ep") ?? []
          : node.statusChanges ?? [];
        if (isPostCombat && filteredChanges.length < (node.statusChanges?.length ?? 0)) {
          appendNarrative({ role: "system", content: "（战后叙事中忽略了自动恢复效果——战斗损耗不会凭空消失）", timestamp: Date.now() });
        }
        if (filteredChanges.length > 0) {
          for (const change of filteredChanges) {
            switch (change.type) {
              case "consume": {
                if (change.target) {
                  const ok = consumeDungeonItem(change.target, change.value);
                  appendNarrative({ role: "system", content: ok ? `消耗了 ${change.target} ×${change.value}` : `尝试消耗 ${change.target}，但数量不足`, timestamp: Date.now() });
                }
                break;
              }
              case "heal_hp": {
                const before = nextHp;
                nextHp = Math.min(player.maxHp, nextHp + change.value);
                appendNarrative({ role: "system", content: `恢复了 ${nextHp - before} 点生命值`, timestamp: Date.now() });
                break;
              }
              case "damage_hp": {
                nextHp = Math.max(0, nextHp - change.value);
                appendNarrative({ role: "system", content: `受到 ${change.value} 点伤害，生命值降至 ${nextHp}`, timestamp: Date.now() });
                break;
              }
              case "heal_ep": {
                const before = nextEp;
                nextEp = Math.min(player.maxEp, nextEp + change.value);
                appendNarrative({ role: "system", content: `恢复了 ${nextEp - before} 点能量值`, timestamp: Date.now() });
                break;
              }
              case "damage_ep": {
                nextEp = Math.max(0, nextEp - change.value);
                appendNarrative({ role: "system", content: `消耗了 ${change.value} 点能量值，剩余 ${nextEp}`, timestamp: Date.now() });
                break;
              }
              case "gain_weapon": {
                if (change.target) {
                  const quality = rollQuality(state.difficulty);
                  const weapon = generateWeapon(quality, change.target as Parameters<typeof generateWeapon>[1]);
                  addWeapon(weapon);
                  appendNarrative({ role: "system", content: `获得武器：${weapon.name}（${weapon.quality}）`, timestamp: Date.now() });
                }
                break;
              }
              case "gain_armor": {
                if (change.target) {
                  const quality = rollQuality(state.difficulty);
                  const armor = generateArmor(quality, change.target as Parameters<typeof generateArmor>[1]);
                  addArmor(armor);
                  appendNarrative({ role: "system", content: `获得护甲：${armor.name}（${armor.quality}）`, timestamp: Date.now() });
                }
                break;
              }
            }
          }
          // 统一应用 HP/EP 修改
          if (nextHp !== player.hp || nextEp !== player.ep) {
            setPlayer({ ...player, hp: nextHp, ep: nextEp });
          }
        }

        // 处理濒死状态
        if (nextHp <= 0) {
          if (state.dyingRounds === -1) {
            setDungeonDyingRounds(3);
            appendNarrative({ role: "system", content: "⚠️ 你倒下了，灰蚀正在侵蚀你的身体…… 3轮内必须恢复生命值，否则将被完全同化。", timestamp: Date.now() });
          } else if (state.dyingRounds > 0) {
            const remaining = state.dyingRounds - 1;
            setDungeonDyingRounds(remaining);
            if (remaining > 0) {
              appendNarrative({ role: "system", content: `⚠️ 灰蚀侵蚀加剧…… 剩余 ${remaining} 轮。`, timestamp: Date.now() });
            } else {
              appendNarrative({ role: "system", content: "💀 你的身体被灰蚀完全吞噬，意识消散在铅灰色的雾中。副本失败。", timestamp: Date.now() });
              setDungeonEnding({ title: "灰蚀同化", description: "你的身体被灰蚀完全吞噬，意识消散在铅灰色的雾中。" });
              return;
            }
          }
        } else if (state.dyingRounds !== -1) {
          // 从濒死恢复
          setDungeonDyingRounds(-1);
          appendNarrative({ role: "system", content: "✅ 你从死亡边缘挣脱，灰蚀的侵蚀暂时停止。", timestamp: Date.now() });
        }

        // 处理战斗触发（带冷却检查）
        if (node.combatTrigger && onCombatStart) {
          const roundsSinceCombat = state.lastCombatRound >= 0
            ? state.narrativeHistory.length - state.lastCombatRound
            : 999;
          const combatCooldown = roundsSinceCombat < 3;
          const combatLimit = state.combatCount >= 2;

          if (combatCooldown) {
            appendNarrative({
              role: "system",
              content: `（战斗冷却中：距离上次战斗仅 ${roundsSinceCombat} 轮，AI 试图触发战斗但被抑制。请继续叙事推进。）`,
              timestamp: Date.now(),
            });
          } else if (combatLimit) {
            appendNarrative({
              role: "system",
              content: `（本章战斗次数已达上限 ${state.combatCount}/2，AI 试图触发战斗但被抑制。请继续叙事推进。）`,
              timestamp: Date.now(),
            });
          } else {
            const { monsters: enemies, missing } = resolveCombatEnemies(
              node.combatTrigger.enemies,
              state.difficulty
            );

            if (missing.length > 0) {
              appendNarrative({
                role: "system",
                content: `（系统警告：怪物库中找不到 ${missing.join("、")}，已跳过。）`,
                timestamp: Date.now(),
              });
            }

            if (enemies.length > 0) {
              recordDungeonCombat();
              setDungeonPhase("combat");
              onCombatStart(enemies, node.combatTrigger.context);
              return;
            }
          }
        }

        // 处理 AI 主动结局标记
        if (node.ending) {
          setDungeonEnding(node.ending);
          return;
        }

        // 处理选择
        if (node.choices.length > 0) {
          setChoices(node.choices);
          setDungeonPhase("choice");
        } else if (!node.nextChapter && !node.combatTrigger) {
          // 停留在 narrative 阶段，等待玩家点击"继续"按钮
          setDungeonPhase("narrative");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "Aborted") {
          // 正常取消
        } else {
          setError(err instanceof Error ? err.message : "生成失败");
          console.error("Narrative generation error:", err);
        }
      } finally {
        setIsGenerating(false);
        setDungeonStream(false, fullText || displayText);
        abortRef.current = null;
      }
    },
    [player, companions, baseURL, apiKey, modelId, isGenerating, displayText]
  );

  // ref 确保 setTimeout 总是调用最新 generate
  const generateRef = useRef(generate);
  useEffect(() => {
    generateRef.current = generate;
  }, [generate]);

  // 组件挂载或章节变化时触发生成
  useEffect(() => {
    if (!state) return;
    if (state.phase === "narrative" && state.narrativeHistory.length === 0) {
      // 首次进入，开始生成
      generateRef.current();
    }
  }, [state?.chapter, state?.phase]);

  // 处理玩家选择
  const handleChoice = useCallback(
    (choice: ChoiceOption) => {
      if (!state || isGenerating) return;

      // 技能检定（预设选择也可能匹配检定点）
      const checkResult = resolveSkillCheck(choice.label, checkpoints, player);
      if (checkResult) {
        appendNarrative({
          role: "system",
          content: `【${checkResult.skill}】检定：🎲 ${checkResult.dice[0]}+${checkResult.dice[1]} +${checkResult.skillValue} = ${checkResult.total}，难度${checkResult.difficulty}（${checkResult.result}）`,
          timestamp: Date.now(),
        });
        setCheckpoints((prev) => prev.filter((cp) => cp.skill !== checkResult.skill));
      }

      // 记录玩家选择
      appendNarrative(createPlayerChoiceEntry(choice.label));
      makeChoice(choice);

      // 简单的羁绊影响（根据选择关键词）
      if (choice.label.includes("塞拉斯") || choice.label.includes("金发") || choice.label.includes("祈祷")) {
        updateNPCBond("silas_vane", 5);
      }
      if (choice.label.includes("灰蚀") || choice.label.includes("理解") || choice.label.includes("研究")) {
        updateNPCBond("silas_vane", 3);
      }
      if (choice.label.includes("攻击") || choice.label.includes("激进") || choice.label.includes("切割")) {
        updateNPCBond("silas_vane", -3);
      }

      // 延迟后生成下一段
      setTimeout(() => generateRef.current(), 300);
    },
    [state, isGenerating, generate, checkpoints, player]
  );

  // 判断 AI 生成的道具是否可用（启发式）
  function guessItemUsable(name: string): boolean {
    const healKeywords = ["药", "血瓶", "治疗", "金桔", "蜂蜜", "药剂", "药水", "液", "膏", "丸"];
    const epKeywords = ["能量", "精力", "魔药", "催化剂"];
    return healKeywords.some((k) => name.includes(k)) || epKeywords.some((k) => name.includes(k));
  }

  function getItemEffect(name: string): { type: "heal_hp" | "heal_ep"; value: number } {
    const epKeywords = ["能量", "精力", "魔药", "催化剂"];
    const isEp = epKeywords.some((k) => name.includes(k));
    return { type: isEp ? "heal_ep" : "heal_hp", value: isEp ? 15 : 20 };
  }

  // 使用副本道具
  const handleUseItem = useCallback(
    (item: DungeonItem) => {
      if (!state) return;
      const ok = consumeDungeonItem(item.name, 1);
      if (!ok) return;

      const effect = item.effectType && item.effectValue !== undefined
        ? { type: item.effectType, value: item.effectValue }
        : getItemEffect(item.name);

      const newPlayer = { ...player };
      if (effect.type === "heal_hp") {
        const before = newPlayer.hp;
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + effect.value);
        setPlayer(newPlayer);
        appendNarrative({ role: "system", content: `使用了 ${item.name}，恢复了 ${newPlayer.hp - before} 点生命值`, timestamp: Date.now() });
      } else if (effect.type === "heal_ep") {
        const before = newPlayer.ep;
        newPlayer.ep = Math.min(newPlayer.maxEp, newPlayer.ep + effect.value);
        setPlayer(newPlayer);
        appendNarrative({ role: "system", content: `使用了 ${item.name}，恢复了 ${newPlayer.ep - before} 点能量值`, timestamp: Date.now() });
      }

      // 濒死恢复检查
      if (newPlayer.hp > 0 && state.dyingRounds !== -1) {
        setDungeonDyingRounds(-1);
        appendNarrative({ role: "system", content: "✅ 你从死亡边缘挣脱，灰蚀的侵蚀暂时停止。", timestamp: Date.now() });
      }
    },
    [state, player, consumeDungeonItem, setPlayer, appendNarrative, setDungeonDyingRounds]
  );

  // 手动继续（当AI输出不完整或卡住时）
  const handleContinue = useCallback(() => {
    if (!isGenerating) {
      generateRef.current();
    }
  }, [isGenerating]);

  // 自定义行动
  const [customAction, setCustomAction] = useState("");
  const handleCustomAction = useCallback(() => {
    if (!state || isGenerating || !customAction.trim()) return;
    const action = customAction.trim();

    // 技能检定
    const checkResult = resolveSkillCheck(action, checkpoints, player);
    if (checkResult) {
      appendNarrative({
        role: "system",
        content: `【${checkResult.skill}】检定：🎲 ${checkResult.dice[0]}+${checkResult.dice[1]} +${checkResult.skillValue} = ${checkResult.total}，难度${checkResult.difficulty}（${checkResult.result}）`,
        timestamp: Date.now(),
      });
      setCheckpoints((prev) => prev.filter((cp) => cp.skill !== checkResult.skill));
    }

    appendNarrative(createPlayerChoiceEntry(action));
    setCustomAction("");
    setChoices([]);
    setDungeonPhase("loading");
    setTimeout(() => generateRef.current(), 300);
  }, [state, isGenerating, customAction, generate, checkpoints, player]);

  // 战斗结束后的回调
  useEffect(() => {
    if (!state?.combatSummary) return;
    if (state.phase === "narrative") {
      generate(state.combatSummary);
    }
  }, [state?.combatSummary, state?.phase]);

  if (!state) {
    return (
      <div className="border-2 border-stone bg-parchment-dark p-6">
        <p className="text-ink-light">副本状态未初始化</p>
      </div>
    );
  }

  const chapter = getChapterTemplate(state.chapter);
  const silasBond = state.npcBonds.find((b) => b.npcId === "silas_vane");

  return (
    <div className="flex flex-col gap-4">
      {/* 章节标题栏 */}
      <div className="flex items-center justify-between border-2 border-gold bg-parchment-dark px-4 py-3">
        <div>
          <div className="font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
            章节 {state.chapter}
          </div>
          <div className="text-sm font-semibold text-ink">{chapter?.title ?? "未知章节"}</div>
        </div>
        <div className="text-right text-xs text-ink-light">
          {chapter?.location && <div>{chapter.location}</div>}
          {silasBond && (
            <div className="mt-1 text-gold">
              {silasBond.name} · {silasBond.status} · {silasBond.attitude}
            </div>
          )}
        </div>
      </div>

      {/* 目标与线索面板 */}
      {(state.currentObjective || state.discoveredClues.length > 0) && (
        <div className="border-2 border-stone bg-parchment-dark p-4">
          {state.currentObjective && (
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-light">当前目标</div>
              <div className="mt-1 text-sm font-bold text-ink">{state.currentObjective.title}</div>
              {state.currentObjective.progress.length > 0 && (
                <div className="mt-2 space-y-1">
                  {state.currentObjective.progress.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-stone/30">
                        <div
                          className="h-full bg-gold transition-all"
                          style={{ width: `${Math.min(100, (p.current / p.total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ink-light">
                        {p.label} {p.current}/{p.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {state.discoveredClues.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-light">已发现线索</div>
              <div className="mt-1 space-y-1">
                {state.discoveredClues.map((clue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-ink">
                    <span className="text-gold">◆</span>
                    <span>{clue.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 叙事文本区域 */}
      <div
        ref={scrollRef}
        className="min-h-[300px] border-2 border-stone bg-parchment p-5 space-y-3"
        style={{ maxHeight: "55vh", overflowY: "auto" }}
      >
        {/* 流式生成中：显示原始文本 */}
        {isGenerating && displayText && (
          <div className="text-sm leading-relaxed text-ink-light whitespace-pre-wrap animate-pulse">
            {displayText}
            <span className="inline-block h-1.5 w-1.5 ml-1 rounded-full bg-gold" />
          </div>
        )}

        {/* 历史叙事：按类型分别渲染 */}
        {state.narrativeHistory.map((entry, idx) => {
          if (entry.role === "narrator") {
            return <NarrationBlock key={idx} content={entry.content} />;
          }
          if (entry.role === "npc" && entry.speaker) {
            return <DialogueBlock key={idx} speaker={entry.speaker} content={entry.content} />;
          }
          if (entry.role === "player") {
            return <PlayerActionBlock key={idx} content={entry.content} />;
          }
          if (entry.role === "system") {
            return <SystemBlock key={idx} content={entry.content} />;
          }
          return null;
        })}

        {/* 空状态 */}
        {!isGenerating && state.narrativeHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-ink-light">
            <div className="text-xs uppercase tracking-widest">等待叙事开始</div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="border-2 border-blood bg-blood/10 p-4 text-sm text-blood">
          <div className="font-semibold">生成出错</div>
          <div className="mt-1">{error}</div>
          <button
            type="button"
            onClick={handleContinue}
            className="mt-3 border border-blood px-3 py-1 text-xs uppercase tracking-widest text-blood transition hover:bg-blood hover:text-parchment"
          >
            重试
          </button>
        </div>
      )}

      {/* 选择按钮 */}
      {choices.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">你的选择</div>
          <div className="grid grid-cols-1 gap-2">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleChoice(choice)}
                className="border-2 border-stone bg-parchment-dark px-4 py-3 text-left text-sm text-ink transition hover:border-gold hover:bg-parchment"
              >
                <span className="mr-2 font-display font-bold text-gold">{choice.id}.</span>
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 自定义行动输入（narrative / choice 阶段始终可用） */}
      {!isGenerating && (state.phase === "narrative" || state.phase === "choice") && (
        <div className="border-2 border-dashed border-stone bg-parchment-dark p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-ink-light">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
            自由行动
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customAction.trim()) {
                  handleCustomAction();
                }
              }}
              placeholder="输入你想做的事……"
              className="flex-1 border-2 border-stone bg-parchment px-3 py-2 text-sm text-ink outline-none transition focus:border-gold placeholder:text-ink-light/50"
            />
            <button
              type="button"
              disabled={!customAction.trim()}
              onClick={handleCustomAction}
              className="border-2 border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90 disabled:border-stone disabled:bg-stone disabled:opacity-60"
            >
              执行
            </button>
          </div>
          <p className="mt-2 text-[10px] text-ink-light/70">
            除预设选项外，你也可以输入任何自定义行动。AI 会根据你的行动描述继续叙事。
          </p>
        </div>
      )}

      {/* 结局 */}
      {state.phase === "ending" && !isGenerating && (
        <div className="border-2 border-gold bg-gold/10 p-5 text-center">
          <div className="font-display text-lg font-bold text-gold">
            {state.endingResult?.title ?? "副本结束"}
          </div>
          <p className="mt-2 text-sm text-ink">
            {state.endingResult?.description ?? "你完成了灰蚀大陆的冒险。"}
          </p>
          <button
            type="button"
            onClick={endDungeon}
            className="mt-4 border-2 border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-parchment transition hover:bg-ink/90"
          >
            返回主神空间
          </button>
        </div>
      )}

      {/* 副本道具面板 */}
      {showItems && state.collectedItems.length > 0 && (
        <div className="border-2 border-stone bg-parchment-dark p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-light">副本道具</span>
            <button type="button" onClick={() => setShowItems(false)} className="text-xs text-ink-light hover:text-blood">收起</button>
          </div>
          <div className="space-y-2">
            {state.collectedItems.map((item) => {
              const usable = item.usable || guessItemUsable(item.name);
              return (
                <div key={item.id} className="flex items-start gap-2 border border-stone bg-parchment p-2">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-gold" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="rounded bg-stone px-1.5 py-0.5 text-[10px] text-parchment">×{item.quantity}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-light">{item.description}</p>
                    {item.effect && (
                      <p className="mt-0.5 text-xs text-gold">效果：{item.effect}</p>
                    )}
                  </div>
                  {usable && state.phase !== "combat" && (
                    <button
                      type="button"
                      onClick={() => handleUseItem(item)}
                      className="shrink-0 border border-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-parchment"
                    >
                      使用
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between border-t-2 border-stone pt-3">
        <div className="flex gap-2 text-xs text-ink-light">
          {state.collectedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowItems((v) => !v)}
              className="flex items-center gap-1 text-ink-light transition hover:text-gold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              道具 ({state.collectedItems.reduce((sum, i) => sum + i.quantity, 0)})
            </button>
          )}
          {state.choiceHistory.length > 0 && (
            <span>已做选择：{state.choiceHistory.length}</span>
          )}
        </div>
        <div className="flex gap-2">
          {isGenerating && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="border-2 border-blood px-3 py-1 text-xs uppercase tracking-widest text-blood transition hover:bg-blood hover:text-parchment"
            >
              停止生成
            </button>
          )}
          {!isGenerating && state.phase === "narrative" && choices.length === 0 && (
            <button
              type="button"
              onClick={handleContinue}
              className="border-2 border-ink-light px-3 py-1 text-xs uppercase tracking-widest text-ink-light transition hover:border-ink hover:text-ink"
            >
              继续
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
