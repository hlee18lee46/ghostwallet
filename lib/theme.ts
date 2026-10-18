import type { Rarity, ThemeColor } from '@/lib/types'

/** Static class strings so Tailwind can see them. */
export const COLOR_CLASSES: Record<ThemeColor, { text: string; bg: string; soft: string; border: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary text-primary-foreground', soft: 'bg-primary/15', border: 'border-primary/40' },
  secondary: { text: 'text-secondary', bg: 'bg-secondary text-secondary-foreground', soft: 'bg-secondary/15', border: 'border-secondary/40' },
  accent: { text: 'text-accent', bg: 'bg-accent text-accent-foreground', soft: 'bg-accent/15', border: 'border-accent/40' },
  success: { text: 'text-success', bg: 'bg-success text-success-foreground', soft: 'bg-success/15', border: 'border-success/40' },
  warning: { text: 'text-warning', bg: 'bg-warning text-warning-foreground', soft: 'bg-warning/15', border: 'border-warning/40' },
}

export const RARITY_COLOR: Record<Rarity, ThemeColor> = {
  Common: 'secondary',
  Uncommon: 'success',
  Rare: 'accent',
  Epic: 'primary',
  Legendary: 'warning',
}

export const HEX: Record<ThemeColor, string> = {
  primary: '#8b5cf6',
  secondary: '#a78bfa',
  accent: '#22d3ee',
  success: '#4ade80',
  warning: '#fbbf24',
}
