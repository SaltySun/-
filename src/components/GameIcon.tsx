import type { CSSProperties } from "react";

export type GameIconProps = {
  /** 作者文件夹名，如 delapouite / lorc */
  artist: string;
  /** SVG 文件名（不含 .svg），如 sword-brandish */
  name: string;
  /** 显示尺寸 */
  size?: number;
  /** 自定义 className */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 是否翻转颜色（适合深色背景） */
  invert?: boolean;
  /** 旋转角度 */
  rotate?: number;
};

export function GameIcon({
  artist,
  name,
  size = 24,
  className = "",
  style,
  invert = false,
  rotate = 0,
}: GameIconProps) {
  const src = `/assets/${artist}/${name}.svg`;

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: invert ? "invert(1)" : undefined,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
      draggable={false}
    />
  );
}

// ========================================
// 预定义的 CRPG 常用图标映射
// ========================================

import type { DamageType, WeaponCategory, ArmorType, MonsterCategory, BloodlineRarity, CareerTier } from "@/game/types";

/** 武器类型图标 */
export const WEAPON_ICONS: Record<WeaponCategory, { artist: string; name: string }> = {
  轻型: { artist: "delapouite", name: "dagger-rose" },
  重型: { artist: "lorc", name: "battered-axe" },
  长柄: { artist: "lorc", name: "halberd" },
  远程: { artist: "delapouite", name: "bow-arrow" },
  法器: { artist: "lorc", name: "crystal-wand" },
};

/** 护甲类型图标 */
export const ARMOR_ICONS: Record<ArmorType, { artist: string; name: string }> = {
  轻甲: { artist: "lorc", name: "leather-boot" },
  中甲: { artist: "lorc", name: "lamellar" },
  重甲: { artist: "lorc", name: "heavy-helm" },
};

/** 伤害类型图标 */
export const DAMAGE_ICONS: Record<DamageType, { artist: string; name: string }> = {
  物理: { artist: "lorc", name: "broadsword" },
  火焰: { artist: "lorc", name: "fire" },
  冰霜: { artist: "lorc", name: "ice-cube" },
  闪电: { artist: "lorc", name: "lightning-storm" },
  黑暗: { artist: "lorc", name: "evil-hand" },
  光明: { artist: "lorc", name: "sun" },
};

/** 怪物类别图标 */
export const MONSTER_ICONS: Record<MonsterCategory, { artist: string; name: string }> = {
  类人生物: { artist: "delapouite", name: "barbarian" },
  野兽: { artist: "lorc", name: "wolf-head" },
  亡灵: { artist: "delapouite", name: "shambling-zombie" },
  构装体: { artist: "lorc", name: "robot-golem" },
  元素体: { artist: "lorc", name: "fire-bomb" },
  异界生物: { artist: "lorc", name: "tentacle-strike" },
};

/** 血统稀有度图标 */
export const BLOODLINE_ICONS: Record<BloodlineRarity, { artist: string; name: string }> = {
  稀有: { artist: "lorc", name: "emerald" },
  超凡: { artist: "lorc", name: "crowned-skull" },
  神话: { artist: "lorc", name: "trophy" },
};

/** 职业层级图标 */
export const CAREER_ICONS: Record<CareerTier, { artist: string; name: string }> = {
  基础: { artist: "lorc", name: "backup" },
  进阶: { artist: "skoll", name: "rank-2" },
  大师: { artist: "skoll", name: "rank-3" },
};

/** 通用 UI / 状态图标 */
export const UI_ICONS = {
  hp: { artist: "zeromancer", name: "heart-plus" },
  ep: { artist: "lorc", name: "lightning-helix" },
  attack: { artist: "lorc", name: "sword-clash" },
  defense: { artist: "lorc", name: "shield" },
  dodge: { artist: "lorc", name: "dodging" },
  block: { artist: "delapouite", name: "shield-bash" },
  strength: { artist: "lorc", name: "muscle-up" },
  agility: { artist: "lorc", name: "run" },
  intelligence: { artist: "lorc", name: "brain" },
  will: { artist: "lorc", name: "meditation" },
  backpack: { artist: "delapouite", name: "backpack" },
  equipment: { artist: "lorc", name: "battle-gear" },
  coin: { artist: "delapouite", name: "two-coins" },
  star: { artist: "delapouite", name: "star-medal" },
  skull: { artist: "lorc", name: "skull-crossed-bones" },
  potion: { artist: "lorc", name: "standing-potion" },
  scroll: { artist: "lorc", name: "scroll-unfurled" },
  ring: { artist: "delapouite", name: "diamond-ring" },
  amulet: { artist: "lorc", name: "gem-pendant" },
  chest: { artist: "delapouite", name: "chest" },
  sword: { artist: "lorc", name: "broadsword" },
  shield: { artist: "sbed", name: "shield" },
  fire: { artist: "lorc", name: "fire" },
  ice: { artist: "lorc", name: "ice-cube" },
  lightning: { artist: "lorc", name: "lightning-storm" },
  dark: { artist: "lorc", name: "evil-hand" },
  light: { artist: "lorc", name: "shining-sun" },
  ally: { artist: "lorc", name: "ghost-ally" },
} as const;

// ========================================
// 快捷组件
// ========================================

export function WeaponIcon({ category, size = 20, invert }: { category: WeaponCategory; size?: number; invert?: boolean }) {
  const { artist, name } = WEAPON_ICONS[category];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function ArmorIcon({ type, size = 20, invert }: { type: ArmorType; size?: number; invert?: boolean }) {
  const { artist, name } = ARMOR_ICONS[type];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function DamageIcon({ type, size = 18, invert }: { type: DamageType; size?: number; invert?: boolean }) {
  const { artist, name } = DAMAGE_ICONS[type];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function MonsterIcon({ category, size = 20, invert }: { category: MonsterCategory; size?: number; invert?: boolean }) {
  const { artist, name } = MONSTER_ICONS[category];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function BloodlineIcon({ rarity, size = 20, invert }: { rarity: BloodlineRarity; size?: number; invert?: boolean }) {
  const { artist, name } = BLOODLINE_ICONS[rarity];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function CareerIcon({ tier, size = 20, invert }: { tier: CareerTier; size?: number; invert?: boolean }) {
  const { artist, name } = CAREER_ICONS[tier];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}

export function UIIcon({ icon, size = 20, invert }: { icon: keyof typeof UI_ICONS; size?: number; invert?: boolean }) {
  const { artist, name } = UI_ICONS[icon];
  return <GameIcon artist={artist} name={name} size={size} invert={invert} />;
}
