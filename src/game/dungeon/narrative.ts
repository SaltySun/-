// ========================================
// 灰蚀大陆 - AI 叙事引擎
// ========================================

import type { Character, Companion, CombatLog } from "@/game/types";
import type {
  DungeonState,
  NarrativeNode,
  ChoiceOption,
  CombatSummary,
  NarrativeEntry,
  NPCBond,
  NarrativeSegment,
  StatusChange,
  Checkpoint,
} from "./types";
import { WORLD_DATA, getChapterTemplate, NPC_SILAS } from "./data";
import { getAllDungeonMonsterNames } from "./monsterLibrary";
import { streamLLM, type StreamOptions } from "@/utils/llm";
import { getChapterSummaries } from "@/utils/dungeonMemory";

// ------------------------------------------------------------------
// 系统提示词构建（精简版）
// ------------------------------------------------------------------

export function buildSystemPrompt(): string {
  const w = WORLD_DATA;
  const factionNames = w.factions.map((f) => f.name).join("、");
  const locationBrief = w.locations
    .map((l) => `${l.name}${l.danger ? `(${l.danger})` : ""}`)
    .join("、");
  const deityNames = w.faith.deities.map((d) => d.name).join("、");

  return `你是「灰蚀大陆」哥特奇幻副本的TRPG主持人。风格沉郁诗意，色彩即生命。

## 核心设定
${w.truth}
被灰蚀者：先失颜色→再失情感→最后失记忆。
势力：${factionNames}
地点：${locationBrief}
信仰：${w.faith.name}（${w.faith.doctrine}）· ${deityNames}

## 关键NPC（玩家可能尚不知道他们的名字）
**金发守烛人**：${NPC_SILAS.faction}成员。${NPC_SILAS.appearance} ${NPC_SILAS.personality}
视觉符号：金发在灰雾中黯淡、烛光下虹彩，异色瞳孔。左手小指已灰化，戴黑手套遮掩。唯一享受蜂蜜渍金桔，却总让给别人。

## 叙事原则
- 色彩即生命：面色灰白=恐惧，绯红=羞赧
- 塞拉斯的金发是视觉符号
- 蜂蜜渍金桔代表人性温暖
- **NPC 初次出场时，玩家不知道其名字。先用外貌/身份特征称呼（如「那位守烛人」「金发青年」），等玩家从对话或事件中得知名字后再使用全名**
- **NPC态度决定台词基调**：
  - 冷漠/试探：保持距离，简短回答，不轻易透露信息
  - 友好/信任：主动提供帮助，分享细节，语气温暖
  - 依赖：把玩家当作唯一依靠，情感表达更强烈
  - 警惕/敌对：防备、质疑、可能拒绝合作

## 副本怪物库（触发战斗时从此列表选取）
${getAllDungeonMonsterNames().join("、")}

## 输出格式（每轮严格遵守）

### 结构
1. 场景描述（一段，60-100字）。只写当前瞬间，禁止解释世界观。
2. NPC对话（可选，最多两段）：
   **名字**：「纯对话内容」
   动作、神态、心理必须写在引号外。引号内只有角色说的话。
3. 文末标记（按需使用，每个标记最多出现一次）

### 标记语法
[选择]
A. 选项一（15字内，具体动作）
B. 选项二
C. 选项三

[战斗:敌人1,敌人2] — 仅剧情高潮。每章≤2场，间隔≥3轮。低威胁敌人用叙事绕过。
[道具:名称]
[章节推进:ID]
[检定点:技能+难度] — 最多1个。技能仅限{运动,机械,隐秘,学识,察觉,社交,统御,生存}，禁止属性名。
[治疗:HP+数值] / [伤害:HP-数值]
[恢复:EP+数值] / [扣减:EP-数值]
[结局:标题] — 仅在进入结局章节（E.x）后，当你认为结局演出已经完成时添加。添加后副本立即结束。
[目标:标题] — 设置当前章节的目标。如：[目标:救出至少3名被困平民]
[进度:标签=当前值/总值] — 更新目标进度。如：[进度:平民=2/3]
[目标完成] — 标记当前目标已完成，进入章节收尾阶段。
[线索:标题] — 发现新线索。如：[线索:贵族吞噬平民色彩记忆] 贵族通过禁忌契约定期吞噬普通人的色彩记忆以维持人性。

### 绝对规则
- 一次只推进一个场景
- 总字数150-250字
- 每轮必须提供 [选择]，绝不省略
- 你不计算数值，只负责叙事和标记
- **战后叙事中禁止自动恢复 HP/EP**。战斗结束后，玩家必须回主神空间休息或使用道具才能恢复。你可以描述"塞拉斯递给你一瓶药剂"，但必须同时加上 [消耗:道具名] 和 [治疗:HP+数值]，否则治疗标记不会生效。

### 示例
灰色液体从砖缝渗出，汇成黏腻沼泽。前方巷口透出钴蓝光晕。

**塞拉斯·维恩**：「别靠近……灰蚀浓度在上升。」

[选择]
A. 帮他守住这里
B. 绕路寻找通道
C. 观察灰蚀来源
`;
}

// ------------------------------------------------------------------
// 叙事请求 Prompt 构建（Messages 历史流）
// ------------------------------------------------------------------

function buildHistoryMessages(state: DungeonState): { role: "user" | "assistant"; content: string }[] {
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  const history = state.narrativeHistory.slice(-6);

  for (const entry of history) {
    let role: "user" | "assistant";
    let content: string;

    switch (entry.role) {
      case "player":
        role = "user";
        content = `玩家：${entry.content}`;
        break;
      case "system":
        role = "user";
        content = `[系统] ${entry.content}`;
        break;
      case "narrator":
        role = "assistant";
        content = entry.content;
        break;
      case "npc":
        role = "assistant";
        content = `**${entry.speaker ?? "NPC"}**：「${entry.content}」`;
        break;
      default:
        continue;
    }

    // 合并连续同角色消息（OpenAI API 要求 user/assistant 交替）
    const last = messages[messages.length - 1];
    if (last && last.role === role) {
      last.content += "\n\n" + content;
    } else {
      messages.push({ role, content });
    }
  }

  return messages;
}

export async function buildNarrativePrompt(
  state: DungeonState,
  player: Character,
  companions: Companion[],
  combatSummary?: CombatSummary
): Promise<StreamOptions> {
  const chapter = getChapterTemplate(state.chapter);
  const roundsSince = state.lastCombatRound >= 0
    ? state.narrativeHistory.length - state.lastCombatRound
    : 999;

  // 1. 构建对话历史（narrativeHistory → messages）
  const messages = buildHistoryMessages(state);

  // 2. 组装当前轮次的 user prompt（极度精简，只保留必要信息）
  let current = "";

  // 战斗摘要优先（如果有）
  if (combatSummary) {
    current += `【上一战】${combatSummary.keyEvents.join("；")}。存活：${combatSummary.playerAlive ? "玩家" : "玩家阵亡"}${combatSummary.alliesAlive.length > 0 ? "," + combatSummary.alliesAlive.join(",") : ""}。战利品：${combatSummary.lootDescription}\n\n`;
  }

  // 状态头（一行）
  current += `【状态】${state.chapter}「${chapter?.title ?? "未知"}」·${chapter?.location ?? "未知"} | HP ${player.hp}/${player.maxHp} EP ${player.ep}/${player.maxEp}`;
  if (companions.length > 0) {
    current += ` | 随从：${companions.map((c) => `${c.name}(${c.hp})`).join(",")}`;
  }
  current += `\n`;

  // 战斗限制（一行）
  if (roundsSince < 3) {
    current += `⚠️ 战斗冷却中（${roundsSince}/3轮）。禁止触发战斗，用叙事处理敌人。\n`;
  } else if (state.combatCount >= 2) {
    current += `⚠️ 本章战斗已达上限（2/2）。禁止触发战斗。\n`;
  }

  // NPC关系（一行）
  if (state.npcBonds.length > 0) {
    current += `【关系】${state.npcBonds.map((b) => `${b.name}(${b.fondness},${b.attitude})`).join("，")}\n`;
  }

  // 道具（一行）
  if (state.collectedItems.length > 0) {
    current += `【道具】${state.collectedItems.map((i) => `${i.name}x${i.quantity}`).join("，")}\n`;
  }

  // 当前目标与进度（一行）
  if (state.currentObjective) {
    const progressText = state.currentObjective.progress.map((p) => `${p.label}${p.current}/${p.total}`).join("，");
    current += `【目标】${state.currentObjective.title}${progressText ? "（" + progressText + "）" : ""}\n`;
  }

  // 已发现线索（一行）
  if (state.discoveredClues.length > 0) {
    current += `【线索】${state.discoveredClues.map((c) => c.title).join("、")}\n`;
  }

  // 前情摘要（L3 记忆，一行）
  const summaries = await getChapterSummaries(state.moduleId);
  const prevSummaries = summaries.filter((s) => s.chapter !== state.chapter);
  if (prevSummaries.length > 0) {
    current += `【前情】${prevSummaries.map((s) => s.summary).join("；")}\n`;
  }

  // 场景信息（保持换行，因为这是叙事核心上下文）
  if (chapter) {
    current += `\n【场景】${chapter.description}\n`;
    if (chapter.enemyPool?.length) {
      current += `可能出现的敌人：${chapter.enemyPool.join("、")}\n`;
    }
  }

  // 分支条件
  if (chapter?.nextChapters.length) {
    current += `\n【分支】${chapter.nextChapters.map((n) => `${n.condition}→${n.chapter}`).join(" / ")}\n`;
  }

  // 强制收尾指令
  current += `\n请推进剧情。必须提供 [选择] 标记（A/B/C三个选项，每个15字内）。
- 如果玩家尚不认识某个NPC，不要直接说出他的名字，先用外貌特征或身份代称`;
  if (state.narrativeHistory.length === 0) {
    current += `这是副本开始，描述玩家进入霜烬堡下层灰蚀隔离带。引入一位金发守烛人，玩家尚不知道他的名字。`;
  }

  messages.push({ role: "user", content: current });

  return {
    systemPrompt: buildSystemPrompt(),
    messages,
    temperature: 0.75,
    maxTokens: 1200,
  };
}

// ------------------------------------------------------------------
// AI 响应解析
// ------------------------------------------------------------------

/** 把场景描述文本拆分为旁白段落和NPC对话片段 */
export function splitSceneIntoSegments(text: string): NarrativeSegment[] {
  const segments: NarrativeSegment[] = [];

  // 按行拆分，识别对话模式：**名字**：「内容」 或 **名字**："内容"
  const dialogueRegex = /\*\*([^*]+)\*\*\s*：\s*[「"]([^"」]+)["」]/g;
  const parts: { type: "text" | "dialogue"; content: string; speaker?: string }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = dialogueRegex.exec(text)) !== null) {
    // 对话前的文本
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: "text", content: before });
    }
    // 对话
    parts.push({ type: "dialogue", speaker: match[1].trim(), content: match[2].trim() });
    lastIndex = dialogueRegex.lastIndex;
  }

  // 最后剩余的文本
  if (lastIndex < text.length) {
    const after = text.slice(lastIndex).trim();
    if (after) parts.push({ type: "text", content: after });
  }

  // 如果没有匹配到任何对话，整个文本作为旁白
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: "text", content: text.trim() });
  }

  // 转换为 NarrativeSegment
  for (const part of parts) {
    if (part.type === "dialogue" && part.speaker) {
      segments.push({ type: "dialogue", speaker: part.speaker, content: part.content });
    } else {
      // 把文本按段落拆分
      const paragraphs = part.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      for (const para of paragraphs) {
        segments.push({ type: "narration", content: para });
      }
    }
  }

  return segments;
}

export function parseAIResponse(rawText: string): NarrativeNode {
  let working = rawText.trim();
  const node: NarrativeNode = {
    sceneDescription: working,
    segments: [],
    choices: [],
  };

  // 解析 [选择] 区块
  const choiceMatch = working.match(/\[选择\]\s*([\s\S]*?)(?=\[|$)/);
  if (choiceMatch) {
    const choiceBlock = choiceMatch[1];
    const choiceLines = choiceBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^[A-Z]\.\s+/.test(l));

    for (const line of choiceLines) {
      const match = line.match(/^([A-Z])\.\s+(.+)$/);
      if (match) {
        node.choices.push({
          id: match[1],
          label: match[2],
        });
      }
    }

    working = working.replace(/\[选择\][\s\S]*/, "").trim();
  }

  // 解析 [战斗:敌人1,敌人2]
  const combatMatch = working.match(/\[战斗:([^\]]+)\]/);
  if (combatMatch) {
    const enemies = combatMatch[1]
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    node.combatTrigger = { enemies, context: "战斗开始" };
    working = working.replace(/\[战斗:[^\]]+\][\s\S]*/, "").trim();
  }

  // 解析 [道具:道具名称] 或 [道具:道具名称x3]
  const itemMatches = [...working.matchAll(/\[道具:([^\]]+)\]/g)];
  if (itemMatches.length > 0) {
    node.itemRewards = itemMatches.map((m) => {
      const raw = m[1].trim();
      const qtyMatch = raw.match(/(.+?)[\s]*[xX×](\d+)/);
      const name = qtyMatch ? qtyMatch[1].trim() : raw;
      const quantity = qtyMatch ? Math.max(1, parseInt(qtyMatch[2], 10)) : 1;
      return {
        id: `dungeon_item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        description: "副本中获得的重要道具",
        quantity,
      };
    });
    working = working.replace(/\[道具:[^\]]+\]/g, "").trim();
  }

  // 解析 [章节推进:章节ID]
  const chapterMatch = working.match(/\[章节推进:([^\]]+)\]/);
  if (chapterMatch) {
    const nextCh = chapterMatch[1].trim();
    if (/^[A-F](\.\d)?$/.test(nextCh)) {
      node.nextChapter = nextCh as DungeonState["chapter"];
    }
    working = working.replace(/\[章节推进:[^\]]+\]/, "").trim();
  }

  // 解析状态变化标记：消耗 / 治疗 / 伤害 / 恢复 / 扣减 / 获得武器 / 获得护甲
  const statusChanges: StatusChange[] = [];

  // [消耗:道具名] / [消耗:道具名x2]
  const consumeMatches = [...working.matchAll(/\[消耗:([^\]]+)\]/g)];
  for (const m of consumeMatches) {
    const raw = m[1].trim();
    const qtyMatch = raw.match(/(.+?)[\s]*[xX×](\d+)/);
    const name = qtyMatch ? qtyMatch[1].trim() : raw;
    const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[2], 10)) : 1;
    statusChanges.push({ type: "consume", target: name, value: qty });
  }
  working = working.replace(/\[消耗:[^\]]+\]/g, "").trim();

  // [治疗:HP+20] / [伤害:HP-15]
  const healHpMatches = [...working.matchAll(/\[治疗:HP\+([\d]+)\]/g)];
  for (const m of healHpMatches) statusChanges.push({ type: "heal_hp", value: parseInt(m[1], 10) });
  working = working.replace(/\[治疗:HP\+[\d]+\]/g, "").trim();

  const dmgHpMatches = [...working.matchAll(/\[伤害:HP-([\d]+)\]/g)];
  for (const m of dmgHpMatches) statusChanges.push({ type: "damage_hp", value: parseInt(m[1], 10) });
  working = working.replace(/\[伤害:HP-[\d]+\]/g, "").trim();

  // [恢复:EP+10] / [扣减:EP-5]
  const healEpMatches = [...working.matchAll(/\[恢复:EP\+([\d]+)\]/g)];
  for (const m of healEpMatches) statusChanges.push({ type: "heal_ep", value: parseInt(m[1], 10) });
  working = working.replace(/\[恢复:EP\+[\d]+\]/g, "").trim();

  const dmgEpMatches = [...working.matchAll(/\[扣减:EP-([\d]+)\]/g)];
  for (const m of dmgEpMatches) statusChanges.push({ type: "damage_ep", value: parseInt(m[1], 10) });
  working = working.replace(/\[扣减:EP-[\d]+\]/g, "").trim();

  // [获得武器:短剑]
  const weaponMatches = [...working.matchAll(/\[获得武器:([^\]]+)\]/g)];
  for (const m of weaponMatches) statusChanges.push({ type: "gain_weapon", target: m[1].trim(), value: 1 });
  working = working.replace(/\[获得武器:[^\]]+\]/g, "").trim();

  // [获得护甲:轻甲]
  const armorMatches = [...working.matchAll(/\[获得护甲:([^\]]+)\]/g)];
  for (const m of armorMatches) statusChanges.push({ type: "gain_armor", target: m[1].trim(), value: 1 });
  working = working.replace(/\[获得护甲:[^\]]+\]/g, "").trim();

  if (statusChanges.length > 0) {
    node.statusChanges = statusChanges;
  }

  // 解析 [检定点:技能+难度]
  const checkpointMatches = [...working.matchAll(/\[检定点:([^\]]+)\]/g)];
  if (checkpointMatches.length > 0) {
    node.checkpoints = checkpointMatches.map((m) => {
      const raw = m[1].trim();
      const parts = raw.split(/\+/);
      const skill = parts[0]?.trim() ?? "未知";
      const difficulty = parts[1] ? parseInt(parts[1].trim(), 10) : 6;
      return { skill, difficulty: isNaN(difficulty) ? 6 : difficulty };
    });
    working = working.replace(/\[检定点:[^\]]+\]/g, "").trim();
  }

  // 解析 [结局:标题] 描述内容
  const endingMatch = working.match(/\[结局:([^\]]+)\]/);
  if (endingMatch) {
    const title = endingMatch[1].trim();
    // 取标记后的文本作为描述（如果有的话）
    const afterMarker = working.slice(working.indexOf(endingMatch[0]) + endingMatch[0].length).trim();
    node.ending = { title, description: afterMarker || title };
    working = working.replace(/\[结局:[^\]]+\][\s\S]*/, "").trim();
  }

  // 解析目标系统标记
  // [目标:标题]
  const objectiveMatch = working.match(/\[目标:([^\]]+)\]/);
  if (objectiveMatch) {
    const title = objectiveMatch[1].trim();
    node.objectiveUpdate = { ...node.objectiveUpdate, title };
    working = working.replace(/\[目标:[^\]]+\]/g, "").trim();
  }

  // [进度:标签=当前值/总值] 或 [进度:标签+1]
  const progressMatches = [...working.matchAll(/\[进度:([^=\]]+)=([\d]+)\/([\d]+)\]/g)];
  const progressIncMatches = [...working.matchAll(/\[进度:([^\]]+)\+([\d]+)\]/g)];
  if (progressMatches.length > 0 || progressIncMatches.length > 0) {
    const progress: import("./types").ObjectiveProgress[] = [];
    for (const m of progressMatches) {
      progress.push({ label: m[1].trim(), current: parseInt(m[2], 10), total: parseInt(m[3], 10) });
    }
    for (const m of progressIncMatches) {
      progress.push({ label: m[1].trim(), current: parseInt(m[2], 10), total: parseInt(m[2], 10) });
    }
    node.objectiveUpdate = { ...node.objectiveUpdate, progress };
    working = working.replace(/\[进度:[^\]]+\]/g, "").trim();
  }

  // [目标完成]
  if (working.includes("[目标完成]")) {
    node.objectiveUpdate = { ...node.objectiveUpdate, completed: true };
    working = working.replace(/\[目标完成\]/g, "").trim();
  }

  // [线索:标题] 描述
  const clueMatches = [...working.matchAll(/\[线索:([^\]]+)\]/g)];
  if (clueMatches.length > 0) {
    node.newClues = clueMatches.map((m) => {
      const title = m[1].trim();
      const idx = working.indexOf(m[0]);
      const after = working.slice(idx + m[0].length).split(/\[线索:/)[0].trim();
      return { title, description: after || title };
    });
    working = working.replace(/\[线索:[^\]]+\]/g, "").trim();
  }

  // 清理多余空行
  working = working.replace(/\n{3,}/g, "\n\n").trim();
  node.sceneDescription = working;

  // 拆分为片段
  node.segments = splitSceneIntoSegments(working);

  // 解析第一个NPC对话的信息（用于兼容性）
  const firstDialogue = node.segments.find((s): s is Extract<NarrativeSegment, { type: "dialogue" }> => s.type === "dialogue");
  if (firstDialogue) {
    node.speaker = "npc";
    node.speakerName = firstDialogue.speaker;
  }

  return node;
}

// ------------------------------------------------------------------
// 战斗日志压缩
// ------------------------------------------------------------------

export function compressCombatLog(logs: CombatLog[]): CombatSummary {
  const keyEvents: string[] = [];
  const enemiesDefeated: string[] = [];
  const alliesAlive: string[] = [];
  let playerAlive = true;

  const rounds = new Set(logs.map((l) => l.round));
  const roundCount = rounds.size;

  for (const log of logs) {
    // 击杀 / 全灭
    if (log.message.includes("击杀") || log.message.includes("击败") || log.message.includes("死亡") || log.message.includes("全灭")) {
      const targetMatch = log.message.match(/击败\s*(.+?)(?:\s|$)/) || log.message.match(/击杀\s*(.+?)(?:\s|$)/);
      if (targetMatch && log.actor) {
        keyEvents.push(`${log.actor} 击败 ${targetMatch[1].trim()}`);
      }
      if (log.message.includes("敌人全灭")) {
        keyEvents.push("敌人全灭，战斗胜利");
      }
      if (log.message.includes("玩家方全灭")) {
        keyEvents.push("玩家方全灭，战斗失败");
        playerAlive = false;
      }
    }
    // 破防/重击
    if (log.result === "破防" && (log.damage ?? 0) >= 5) {
      keyEvents.push(`${log.actor} 对 ${log.target ?? "目标"} 破防造成${log.damage}点伤害`);
    }
    // 治疗
    if ((log.heal ?? 0) >= 5) {
      keyEvents.push(`${log.actor} 恢复 ${log.target ?? "自己"} ${log.heal}点生命`);
    }
    // 玩家状态
    if (log.message.includes("玩家") && log.message.includes("阵亡")) {
      playerAlive = false;
    }
  }

  // 提取唯一事件（去重）
  const uniqueEvents = [...new Set(keyEvents)];

  return {
    roundCount,
    keyEvents: uniqueEvents.slice(0, 6),
    playerAlive,
    alliesAlive,
    enemiesDefeated: [...new Set(enemiesDefeated)],
    lootDescription: "根据战斗结果获得战利品",
  };
}

export function buildCombatSummaryFromState(
  logs: CombatLog[],
  playerName: string,
  companionNames: string[]
): CombatSummary {
  const summary = compressCombatLog(logs);

  // 从日志中推断存活的盟友
  const aliveAllies = new Set(companionNames);
  for (const log of logs) {
    for (const name of companionNames) {
      if (log.message.includes(name) && (log.message.includes("阵亡") || log.message.includes("死亡"))) {
        aliveAllies.delete(name);
      }
    }
  }
  summary.alliesAlive = Array.from(aliveAllies);

  // 推断玩家存活
  summary.playerAlive = !logs.some(
    (l) => l.message.includes(playerName) && (l.message.includes("阵亡") || l.message.includes("死亡"))
  );

  return summary;
}

// ------------------------------------------------------------------
// 流式叙事生成
// ------------------------------------------------------------------

export async function* generateNarrative(
  state: DungeonState,
  player: Character,
  companions: Companion[],
  apiConfig: { baseURL: string; apiKey: string; modelId: string },
  combatSummary?: CombatSummary,
  signal?: AbortSignal
): AsyncGenerator<string, NarrativeNode, unknown> {
  const options = await buildNarrativePrompt(state, player, companions, combatSummary);

  let fullText = "";

  try {
    for await (const chunk of streamLLM({ ...apiConfig, ...options, signal })) {
      fullText += chunk;
      yield chunk;
    }
  } catch (err) {
    if (err instanceof Error && (err.name === "AbortError" || err.message === "Aborted")) {
      // 返回已生成的部分
    } else {
      throw err;
    }
  }

  const node = parseAIResponse(fullText);
  return node;
}

// ------------------------------------------------------------------
// 工具函数
// ------------------------------------------------------------------

export function getBondStatusText(bond: NPCBond): string {
  const texts: Record<NPCBond["status"], string> = {
    陌生: "你们只是萍水相逢",
    熟悉: "他开始信任你",
    信任: "你们建立了深厚的羁绊",
    羁绊: "你们的心灵紧密相连",
    敌对: "他对你充满戒备",
  };
  return texts[bond.status] ?? "关系不明";
}

export function createPlayerChoiceEntry(choiceLabel: string): NarrativeEntry {
  return {
    role: "player",
    content: choiceLabel,
    timestamp: Date.now(),
  };
}

export function createNarratorEntry(content: string): NarrativeEntry {
  return {
    role: "narrator",
    content,
    timestamp: Date.now(),
  };
}

export function createNPCEntry(speaker: string, content: string): NarrativeEntry {
  return {
    role: "npc",
    speaker,
    content,
    timestamp: Date.now(),
  };
}
