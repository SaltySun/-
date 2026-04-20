// ========================================
// 灰蚀大陆 - 完整静态数据
// ========================================

import type { WorldData, DungeonMonsterTemplate, DungeonItem, ChapterTemplate, NPCProfile } from "./types";

// ------------------------------------------------------------------
// NPC 人设
// ------------------------------------------------------------------

export const NPC_SILAS: NPCProfile = {
  id: "silas_vane",
  name: "塞拉斯·维恩",
  title: "祷言骑士",
  age: 24,
  gender: "男性",
  faction: "守烛人议会·烬灯派",
  appearance:
    "如融化黄金般的长发垂至肩胛骨，这是灰蚀大陆上近乎绝迹的「原初色彩」。左眼灰蓝，右眼琥珀金（异色瞳，据说能看见「色彩的流动」）。轮廓柔和，病态苍白，眼下青黑。左手小指已彻底灰化，用黑色丝质手套遮掩。身着深炭灰色精钢轻甲，胸甲镶嵌着一块破碎的钴蓝色彩绘玻璃碎片。",
  personality:
    "温柔的悲观主义者。对孩童与伤者有近乎母性的耐心，对敌人展现悲哀的决绝。患有严重的「幸存者愧疚」，认为自己的金发是偷取他人色彩的诅咒，拒绝一切奢侈享受，将配给物资分给下层区儿童。内心深处渴望找到第三条路——既不向灰蚀投降，也不激进重构世界。",
  backstory:
    "出生于霜烬堡下层区灰蚀隔离带，五岁时一场灰蚀泄漏吞噬整个街区，他是唯一幸存者，头发从棕色变成了金色——色彩未被夺走，反而被「过度赋予」。被烬灯派高阶修女玛格丽特·灰语收养。二十岁时在褪色集市目睹贵族吞噬平民色彩记忆，第一次使用被禁的「原初祷言」，以一缕金发为代价救回平民，此后左手小指开始灰化。",
  goals:
    "寻找「第三种净化」——让被灰蚀者恢复色彩而不毁灭世界。近期目标是前往原色深渊寻找「伊拉礼之泪」。隐藏欲望是能在阳光下解开头发，作为一个普通人感到平凡的幸福。",
  relationships: [
    { name: "玛格丽特·灰语", relation: "养母/导师，烬灯派修女院长，身患灰蚀肺病" },
    { name: "艾德里安·烬喉", relation: "同僚/对立，辉徨派指挥官，激进战斗狂，爱慕其发色" },
    { name: "「灰鼠」小蒂姆", relation: "下层区眼线，12岁孤儿，像弟弟一样被保护" },
  ],
  likes: ["蜂蜜渍金桔（自己从不吃，都送给患病孩童）", "古代文献", "礼拜堂的寂静"],
  fears: ["极度害怕镜子", "怀疑自己的「幸存」已是变异开始"],
  quirks: ["战斗前会解开绑发的黑丝带", "用银匙尖挑起一滴蜂蜜含在舌尖想象美好世界", "为被灰蚀转化的人念诵完整安魂祷词"],
};

// ------------------------------------------------------------------
// 怪物模板（27种）
// ------------------------------------------------------------------

export const DUNGEON_MONSTERS: DungeonMonsterTemplate[] = [
  // A冒险
  { name: "回声", tier: "普通级", category: "异界生物", description: "无色的、模仿人类尖叫声的生物", weakTo: "声音陷阱", specialTrait: "模仿尖叫声使目标恐惧" },
  { name: "灰化贫民", tier: "普通级", category: "亡灵", description: "被灰蚀侵蚀的平民转化的怪物", weakTo: "光明", specialTrait: "数量多，缓慢但持续逼近" },
  // B.1
  { name: "褪色诵经者", tier: "精英级", category: "类人生物", description: "身披灰色长袍的教士，吟唱使玩家逐渐失去色彩视觉", weakTo: "噪音打断", specialTrait: "持续吟唱降低玩家命中" },
  // B.2
  { name: "静默猎犬", tier: "精英级", category: "野兽", description: "被灰蚀侵蚀的无声野兽，能吸收声音进行瞬移", weakTo: "火焰", specialTrait: "吸收声音后瞬移攻击" },
  // B.3
  { name: "灰化守卫", tier: "精英级", category: "构装体", description: "已完全灰化但保留战斗本能的生物", weakTo: "光明", specialTrait: "无情感，不受恐惧影响" },
  // B.4
  { name: "石化侍从", tier: "精英级", category: "构装体", description: "被魔法控制的石化生物", weakTo: "物理重击", specialTrait: "高防御，时间流速异常" },
  // C.1
  { name: "记忆幽灵", tier: "精英级", category: "亡灵", description: "由被困记忆产生的灵体生物", weakTo: "光明", specialTrait: "攻击附带记忆混乱效果" },
  { name: "灰化修士", tier: "普通级", category: "类人生物", description: "被灰蚀侵蚀的静默礼拜堂修士", weakTo: "火焰", specialTrait: "静默中突袭" },
  // C.2
  { name: "深渊巡航者", tier: "首领级", category: "异界生物", description: "在深渊中游荡的巨大生物", weakTo: "闪电", specialTrait: "范围攻击，深渊环境增益" },
  { name: "色彩异常体", tier: "精英级", category: "元素体", description: "色谱碎片共振产生的能量生物", weakTo: "黑暗", specialTrait: "随机变换抗性" },
  // C.3
  { name: "灰化审判者", tier: "精英级", category: "类人生物", description: "负责检验仪式者是否足够「理性」", weakTo: "情感攻击", specialTrait: "判定玩家「理性值」" },
  { name: "完全灰化者", tier: "首领级", category: "亡灵", description: "已完全失去人性的高阶灰化生物", weakTo: "光明", specialTrait: "免疫精神控制" },
  // C.4
  { name: "贵族亲卫", tier: "精英级", category: "类人生物", description: "被魔法强化的贵族卫队", weakTo: "破甲", specialTrait: "时间流速护盾" },
  { name: "时间残像", tier: "精英级", category: "异界生物", description: "被困在时间回廊中的灵体", weakTo: "光明", specialTrait: "攻击来自不同时间线" },
  // C.5
  { name: "集市盗贼", tier: "普通级", category: "类人生物", description: "试图偷走玩家道具的小偷", weakTo: "察觉", specialTrait: "偷取道具后逃跑" },
  { name: "颜料幻见", tier: "精英级", category: "元素体", description: "由颜料迷雾产生的幻象生物", weakTo: "风", specialTrait: "制造幻象分身" },
  // D.1
  { name: "结界干扰者", tier: "首领级", category: "异界生物", description: "试图破坏结界的灰蚀生物", weakTo: "光明", specialTrait: "持续削弱结界" },
  // D.2
  { name: "色谱异常体（强化版）", tier: "首领级", category: "元素体", description: "重构过程中产生的强大能量生物", weakTo: "平衡攻击", specialTrait: "色彩反噬" },
  // D.3
  { name: "抵抗者幽灵", tier: "精英级", category: "亡灵", description: "被灰化者遗留的情感产物", weakTo: "安抚", specialTrait: "情感冲击使玩家混乱" },
  // D.4
  { name: "烬灯守卫", tier: "精英级", category: "类人生物", description: "守护永恒之火的骑士", weakTo: "说服", specialTrait: "圣火加持，光明抗性" },
  { name: "辉徨战士", tier: "精英级", category: "类人生物", description: "试图阻止玩家的激进派", weakTo: "理据说服", specialTrait: "激进攻击，低防御" },
  // D.5
  { name: "双生异常体", tier: "首领级", category: "元素体", description: "同时具有灰蚀和色彩特性的生物", weakTo: "同时攻击两种特性", specialTrait: "灰蚀/色彩双重形态切换" },
  // E.1
  { name: "灰蚀巨兽", tier: "领主级", category: "异界生物", description: "试图破坏结界的巨大生物", weakTo: "结界能量", specialTrait: "范围灰蚀吐息" },
  // E.3
  { name: "抵抗者之影", tier: "领主级", category: "亡灵", description: "人类情感的最后抵抗", weakTo: "理解与接纳", specialTrait: "情感具现化攻击" },
  // E.4
  { name: "旧世界守护者", tier: "领主级", category: "构装体", description: "拒绝接受变化的旧势力", weakTo: "变化之力", specialTrait: "固守旧形态，抗拒改变" },
  // E.5
  { name: "封印抵抗者", tier: "首领级", category: "类人生物", description: "试图阻止封印的旧势力", weakTo: "决心", specialTrait: "攻击玩家的意志" },
];

// ------------------------------------------------------------------
// 副本专属道具
// ------------------------------------------------------------------

export const DUNGEON_ITEMS: DungeonItem[] = [
  { id: "item_glass_shard", name: "彩绘玻璃碎片", description: "某座被灰蚀吞没的教堂花窗残片，呈现破碎的钴蓝色。可用于兑换守烛人好感或镶嵌在护甲上。", chapter: "A", quantity: 1 },
  { id: "item_memory_liquid", name: "记忆液体样本", description: "从静默礼拜堂石壁渗出的灰色液体提取物，能暂时抑制灰蚀疼痛，也可解读古代记忆残像。", chapter: "A", quantity: 1 },
  { id: "item_pyre_emblem", name: "烬灯派纹章", description: "守烛人议会烬灯派的身份标识，持有者可进入静默礼拜堂地下图书馆。", chapter: "B.1", quantity: 1 },
  { id: "item_ila_statue", name: "伊拉礼女神小神像", description: "破碎的彩绘玻璃神像，散发微弱的圣光。提供圣属性抗性。", chapter: "B.1", quantity: 1 },
  { id: "item_chroma_shard_red", name: "原初色谱碎片·赤", description: "从原色深渊边缘获取的第一块色谱碎片，攻击附带回春效果。", chapter: "B.2", quantity: 1 },
  { id: "item_abyss_notes", name: "深渊观测笔记", description: "古代法师留下的观测记录，记载着灰蚀起源的线索。", chapter: "B.2", quantity: 1 },
  { id: "item_gray_rune", name: "灰色符文皮肤", description: "灰烬誓约的刺青符文，免疫灰蚀dot，但降低情感类技能效果。", chapter: "B.3", quantity: 1 },
  { id: "item_void_canvass", name: "无名灰主圣典", description: "空白画布的教义抄本，阅读后理解「存在的另一面」。", chapter: "B.3", quantity: 1 },
  { id: "item_time_pocketwatch", name: "时间流速怀表", description: "褪色贵族的秘宝，战斗外可使用一次时间停止。", chapter: "B.4", quantity: 1 },
  { id: "item_noble_vial", name: "贵族血瓶", description: "蕴含浓缩色彩记忆的血液，可强制恢复色彩记忆。", chapter: "B.4", quantity: 1 },
  { id: "item_ila_tear", name: "伊拉礼之泪", description: "女神陨落时流下的唯一一滴液态色彩，能够中和灰蚀而不引发连锁反应。真结局关键道具。", chapter: "D.4", quantity: 1 },
];

// ------------------------------------------------------------------
// 章节模板
// ------------------------------------------------------------------

export const CHAPTER_TEMPLATES: ChapterTemplate[] = [
  {
    id: "A",
    title: "灰烬初啼",
    location: "霜烬堡下层区·灰蚀隔离带",
    objective: "调查「灰蚀泄漏事件」，救出至少3名被困平民，与塞拉斯·维恩建立初步信任",
    description:
      "霜烬堡下层区的空气中弥漫着焚烧香料的苦涩味道，墙壁渗出黏腻的灰色液体。玩家发现正在用「原初祷言」救助平民的塞拉斯·维恩。",
    enemyPool: ["回声", "灰化贫民"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [
      { condition: "选择疏散平民，保护至上", chapter: "B.1" },
      { condition: "选择追查源头，主动进攻", chapter: "B.2" },
      { condition: "选择研究灰蚀本身，理解敌人", chapter: "B.3" },
      { condition: "发现贵族纹章并隐藏，卷入阴谋", chapter: "B.4" },
    ],
    lootPool: ["彩绘玻璃碎片", "记忆液体样本"],
  },
  {
    id: "B.1",
    title: "烬灯之守",
    location: "静默礼拜堂",
    objective: "协助塞拉斯完成「大庇护仪式」，保护霜烬堡下层区30日不被灰蚀侵蚀",
    description: "烬灯派保守路线。在静默礼拜堂重新绘制防御符文阵，维持永恒之火平衡。",
    enemyPool: ["褪色诵经者", "灰化贫民"],
    allyPool: ["塞拉斯·维恩", "玛格丽特·灰语"],
    nextChapters: [
      { condition: "完成庇护仪式", chapter: "C.1" },
      { condition: "被艾德里安说服改变立场", chapter: "C.2" },
    ],
    lootPool: ["烬灯派纹章", "伊拉礼女神小神像"],
  },
  {
    id: "B.2",
    title: "辉徨之刃",
    location: "原色深渊边缘",
    objective: "跟随艾德里安夺取第一块「原初色谱碎片」",
    description: "辉徨派激进路线。深入活性灰蚀沼泽，面对古代法师留下的色彩锁谜题。",
    enemyPool: ["静默猎犬", "色彩异常体"],
    allyPool: ["艾德里安·烬喉"],
    nextChapters: [
      { condition: "夺取色谱碎片", chapter: "C.2" },
      { condition: "被塞拉斯说服放弃激进", chapter: "C.1" },
    ],
    lootPool: ["原初色谱碎片·赤", "深渊观测笔记"],
  },
  {
    id: "B.3",
    title: "灰烬誓约",
    location: "灰烬誓约祭坛",
    objective: "接受「灰色符文」刺青，在不失去意识的前提下承受灰蚀侵蚀",
    description: "褪色者教团路线。经历情感剥离试炼，理解「绝对理性」的代价。",
    enemyPool: ["灰化守卫", "灰化贫民"],
    allyPool: ["空白画布祭司"],
    nextChapters: [
      { condition: "完成灰蚀试炼", chapter: "C.3" },
      { condition: "叛逃，拒绝最终转化", chapter: "C.5" },
    ],
    lootPool: ["灰色符文皮肤", "无名灰主圣典"],
  },
  {
    id: "B.4",
    title: "贵族阴影",
    location: "褪色集市·贵族庄园",
    objective: "调查「色彩记忆失踪案」，发现贵族吞噬平民记忆的证据",
    description: "褪色贵族阴谋路线。潜入时间流速不同的贵族庄园，面对石化凝视守卫。",
    enemyPool: ["石化侍从", "集市盗贼"],
    allyPool: ["「灰鼠」小蒂姆"],
    nextChapters: [
      { condition: "揭露贵族阴谋", chapter: "C.4" },
      { condition: "情报交易", chapter: "C.5" },
    ],
    lootPool: ["时间流速怀表", "贵族血瓶"],
  },
  {
    id: "C.1",
    title: "静默之誓",
    location: "静默礼拜堂·地下记忆图书馆",
    objective: "玛格丽特病重，发现《原色谱残卷》抄本",
    description: "守烛人保守派深化。在地下记忆图书馆寻找「第三种净化」的线索。",
    enemyPool: ["记忆幽灵", "灰化修士"],
    allyPool: ["塞拉斯·维恩", "玛格丽特·灰语"],
    nextChapters: [
      { condition: "建立结界", chapter: "D.1" },
      { condition: "发现伊拉礼之泪线索", chapter: "D.4" },
    ],
  },
  {
    id: "C.2",
    title: "深渊前线",
    location: "原色深渊·前线观测站",
    objective: "色谱碎片反噬，面对牺牲塞拉斯的道德抉择",
    description: "守烛人激进派深化。集齐的色谱碎片开始反噬，艾德里安要求牺牲塞拉斯完成最终武器。",
    enemyPool: ["深渊巡航者", "色彩异常体"],
    allyPool: ["塞拉斯·维恩", "艾德里安·烬喉"],
    nextChapters: [
      { condition: "重构色谱", chapter: "D.2" },
      { condition: "色谱碎片失控", chapter: "D.3" },
    ],
  },
  {
    id: "C.3",
    title: "褪色者之路",
    location: "灰烬誓约·中央祭坛",
    objective: "完全灰化仪式前最后的人性考验",
    description: "灰烬誓约深化。处决一名抵抗灰蚀的儿童，或拒绝最终转化。",
    enemyPool: ["灰化审判者", "完全灰化者"],
    allyPool: ["空白画布祭司"],
    nextChapters: [
      { condition: "完成转化", chapter: "D.3" },
      { condition: "理解灰蚀本质后叛逃", chapter: "D.5" },
    ],
  },
  {
    id: "C.4",
    title: "倒转黑塔",
    location: "倒转黑塔·时之间",
    objective: "发现贵族阴谋真相",
    description: "贵族阴谋深化。黑塔中心封印的并非怪物，而是「被囚禁的变化之力」本身。",
    enemyPool: ["贵族亲卫", "时间残像"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [
      { condition: "找到黑塔秘密", chapter: "D.4" },
      { condition: "选择与贵族合作", chapter: "D.2" },
    ],
  },
  {
    id: "C.5",
    title: "灰色集市",
    location: "褪色集市·交汇点",
    objective: "情报交易与资源整合",
    description: "唯一必须通过网状跳跃才能进入的C阶段。用所有道具交换「伊拉礼之泪」情报。",
    enemyPool: ["集市盗贼", "颜料幻见"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [
      { condition: "获得伊拉礼之泪情报", chapter: "D.4" },
    ],
  },
  {
    id: "D.1",
    title: "结界永续",
    location: "霜烬堡",
    objective: "建立覆盖霜烬堡的巨大结界",
    description: "烬灯派结局准备。放弃外界，保存文明火种。塞拉斯可能自愿献身。",
    enemyPool: ["结界干扰者", "灰化贫民"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [{ condition: "完成结界", chapter: "E.1" }],
  },
  {
    id: "D.2",
    title: "色谱重构",
    location: "原色深渊",
    objective: "用收集的所有色谱碎片重构「原初色谱」",
    description: "辉徨派结局准备。70%概率失败直接导致灰蚀爆发。",
    enemyPool: ["色谱异常体（强化版）"],
    allyPool: ["艾德里安·烬喉"],
    nextChapters: [
      { condition: "重构成功", chapter: "E.2" },
      { condition: "重构失败", chapter: "E.3" },
    ],
  },
  {
    id: "D.3",
    title: "存在稀释",
    location: "灰烬誓约·终极祭坛",
    objective: "完成全球灰化仪式",
    description: "灰烬誓约结局准备。玩家自身也必须接受灰化。",
    enemyPool: ["抵抗者幽灵", "完全灰化者"],
    nextChapters: [{ condition: "完成仪式", chapter: "E.3" }],
  },
  {
    id: "D.4",
    title: "伊拉礼之泪",
    location: "霜烬堡上层·永恒之火核心",
    objective: "从永恒之火中提取伊拉礼之泪",
    description: "真结局准备。突袭霜烬堡上层，同时对抗烬灯派和辉徨派混合部队。",
    enemyPool: ["烬灯守卫", "辉徨战士"],
    allyPool: ["塞拉斯·维恩", "空白画布祭司"],
    nextChapters: [{ condition: "提取成功", chapter: "E.4" }],
  },
  {
    id: "D.5",
    title: "双生融合",
    location: "原色深渊·倒转黑塔",
    objective: "寻找同时承载「灰蚀」与「色彩」的容器",
    description: "隐藏路线准备。玩家自身成为实验体，灰蚀与色彩融合。",
    enemyPool: ["双生异常体"],
    allyPool: ["空白画布祭司"],
    nextChapters: [
      { condition: "融合成功", chapter: "E.4" },
      { condition: "独自承担", chapter: "E.5" },
    ],
  },
  {
    id: "E.1",
    title: "烛火长明",
    location: "霜烬堡",
    objective: "守护最后的彩色孤岛",
    description: "守烛人正统结局。结界成功建立，世界95%被灰蚀吞没，文明延续。",
    enemyPool: ["灰蚀巨兽"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [],
  },
  {
    id: "E.2",
    title: "完美重构",
    location: "原色深渊",
    objective: "重构世界色彩",
    description: "辉徨派结局。世界恢复色彩，但人类失去「痛苦记忆」。",
    enemyPool: ["色谱异常体（强化版）"],
    nextChapters: [],
  },
  {
    id: "E.3",
    title: "灰色黎明",
    location: "灰蚀大陆",
    objective: "迎接全球灰化",
    description: "灰烬誓约结局。全世界被灰蚀覆盖，所有生命转化为理性永生。",
    enemyPool: ["抵抗者之影"],
    nextChapters: [],
  },
  {
    id: "E.4",
    title: "第三种色彩",
    location: "霜烬堡·金桔树下",
    objective: "伊拉礼之泪与灰蚀融合",
    description: "真结局。产生了「第三种色彩」——能包容灰色与彩色的新形态。",
    enemyPool: ["旧世界守护者"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [{ condition: "真结局达成", chapter: "F" }],
  },
  {
    id: "E.5",
    title: "孤独守望",
    location: "倒转黑塔顶端",
    objective: "成为新的「原初色谱」活体容器",
    description: "隐藏牺牲结局。世界得救，但你必须永远孤独地坐在塔顶。",
    enemyPool: ["封印抵抗者"],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [],
  },
  {
    id: "F",
    title: "新世界黎明",
    location: "恢复色彩的大陆各地",
    objective: "后日谈/自由探索",
    description: "与塞拉斯游历新世界，建立玩家自己的聚落。",
    enemyPool: [],
    allyPool: ["塞拉斯·维恩"],
    nextChapters: [],
  },
];

// ------------------------------------------------------------------
// 世界观数据包
// ------------------------------------------------------------------

export const WORLD_DATA: WorldData = {
  name: "灰蚀大陆",
  theme: "奇幻 / 魔法 / 哥特 / 中等难度 / 分支结局",
  truth:
    "灰蚀大陆并非自然形成的世界，而是一件「失败的神造物」。远古时代，一群追求完美的法师试图创造一个能够容纳「绝对之美」的容器，他们窃取了被称为「原初色谱」的创世之力。但色彩的本质是流动与变化。被囚禁的色谱开始「腐败」，化作名为「灰蚀」的反噬之力——它并非单纯的毁灭，而是一种「存在的稀释」。被灰蚀触及之物不会死亡，而是逐渐失去颜色、情感、记忆，最终化为无名的灰色怪物，成为新世界的「基底」。",

  factions: [
    {
      name: "守烛人议会",
      description:
        "身着黑曜石色重甲的宗教-军事组织，总部设在燃烧着「永恒之火」的霜烬堡。他们将灰蚀视为瘟疫，致力于保护最后的人类聚居地。铠甲镶嵌着彩绘玻璃，在移动时会发出脆弱的彩色光晕。",
      split: [
        "辉徨派：主张主动进攻，寻找原色谱的碎片来重构世界",
        "烬灯派：认为应保存现有火种，建立结界让文明在有限范围内永续",
      ],
    },
    {
      name: "灰烬誓约",
      description:
        "由主动拥抱灰蚀的「褪色者」组成的教团。他们相信灰蚀是进化的终极形态——当失去色彩与情感，生命将摆脱欲望的煎熬，获得绝对理性与永生。他们在皮肤上刻画灰色符文，让灰蚀缓慢侵蚀身体但保留意识。",
    },
    {
      name: "褪色贵族",
      description:
        "旧帝国的残余，通过禁忌契约与灰蚀共存。他们居住在时间流速不同的城堡中，拥有近乎永生但逐渐石化的躯体。为了维持人性，他们定期吞噬普通人的「色彩记忆」。他们想利用普通人的「色彩记忆」，回到小部分能够安居享乐的「黄金时代」。",
    },
  ],

  locations: [
    {
      name: "霜烬堡（Frostpyre Keep）",
      description:
        "建立在巨大燃烧水晶上的垂直都市，哥特式尖塔与蒸汽机械诡异地融合。上层：守烛人统治区，彩色玻璃穹顶过滤出人造彩虹。中层：工匠与商人，空气中永远飘着焚烧香料的味道。下层：贫民窟与灰蚀隔离区，墙壁渗出灰色液体，居民需要戴面具出门。",
      danger: "下层灰蚀隔离区墙壁渗出灰色液体",
    },
    {
      name: "静默礼拜堂（The Silent Chapel）",
      description:
        "位于地下溶洞的巨大宗教中心，这里没有声音——声音会被灰色石壁吸收。修士们通过手语与书写交流，研究从石壁渗出的「记忆液体」。",
      danger: "礼拜堂深处连接着「浅层深渊」，爬出「回声」怪物",
    },
    {
      name: "褪色集市（The Bleached Bazaar）",
      description:
        "灰蚀最严重的中立贸易区，整座城市已80%灰化，但依然繁荣。这里交易的不是金币，而是「色彩」——一滴纯红颜料可以换一条人命。商人戴着鸟嘴面具，用特殊的药水暂时恢复物品的颜色来吸引顾客。",
      danger: "灰色浓度高，需戴面具",
    },
    {
      name: "原色深渊（The Primal Chasm）",
      description:
        "世界的伤口，一道贯穿大陆的巨大裂谷。谷底充满液态的灰色，中心悬浮着倒转的黑色尖塔——传说中封印「原初色谱」与「灰白之神」的地方。",
      danger: "封印「原初色谱」与「灰白之神」",
    },
  ],

  faith: {
    name: "双生黄昏教",
    doctrine: "生命是色彩的借债，死亡是灰色的归还。",
    deities: [
      { name: "伊拉礼", aspect: "「最后的彩光」，象征记忆、艺术、痛苦与爱的女神，被认为已陨落，只留下破碎的彩绘玻璃神像" },
      { name: "无名灰主", aspect: "灰蚀本身的拟人化，不被描绘形象，只有空白画布。信徒认为它不是邪恶，而是「存在的另一面」" },
    ],
  },

  npcs: [NPC_SILAS],
  monsters: DUNGEON_MONSTERS,
  items: DUNGEON_ITEMS,
  chapters: CHAPTER_TEMPLATES,

  endings: [
    { id: "E.1", title: "烛火长明", description: "结界成功建立，霜烬堡成为最后的彩色孤岛。世界95%区域已被灰蚀吞没，但文明得以延续。", condition: "完成D.1结界永续" },
    { id: "E.2", title: "完美重构", description: "原初色谱被成功重构，灰蚀被驱逐。但所有人类失去了「痛苦记忆」作为燃料。", condition: "D.2重构成功" },
    { id: "E.3", title: "灰色黎明", description: "全世界被灰蚀覆盖，所有生命转化为理性永生的灰色存在。没有战争、痛苦、疾病，也没有爱、艺术、颜色。", condition: "完成D.3或D.2失败" },
    { id: "E.4", title: "第三种色彩", description: "伊拉礼之泪与灰蚀融合，产生了「第三种色彩」。被灰蚀者逐渐恢复，彩色区域学会与灰色共存。", condition: "完成D.4或D.5" },
    { id: "E.5", title: "孤独守望", description: "你成为新的「原初色谱」活体容器，将灰蚀吸入自己体内。世界得救，但你永远孤独。", condition: "D.5特殊条件：独自承担" },
  ],
};

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

export function getChapterTemplate(chapterId: string): ChapterTemplate | undefined {
  return CHAPTER_TEMPLATES.find((c) => c.id === chapterId);
}

export function getMonsterTemplate(name: string): DungeonMonsterTemplate | undefined {
  return DUNGEON_MONSTERS.find((m) => m.name === name);
}

export function getNPCProfile(id: string): NPCProfile | undefined {
  return WORLD_DATA.npcs.find((n) => n.id === id);
}

export function getDungeonItem(id: string): DungeonItem | undefined {
  return DUNGEON_ITEMS.find((i) => i.id === id);
}

export function getNextChapters(chapterId: string): ChapterTemplate["nextChapters"] {
  const ch = getChapterTemplate(chapterId);
  return ch?.nextChapters ?? [];
}

/** 根据章节ID获取推荐怪物列表 */
export function getEnemiesForChapter(chapterId: string): DungeonMonsterTemplate[] {
  const ch = getChapterTemplate(chapterId);
  if (!ch?.enemyPool) return [];
  return ch.enemyPool
    .map((name) => getMonsterTemplate(name))
    .filter((m): m is DungeonMonsterTemplate => !!m);
}
