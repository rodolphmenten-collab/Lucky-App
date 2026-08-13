import type { Intention } from '@/lib/types';

export const INTENTION_META: Record<Intention, { label: string; symbol: string; classes: string }> = {
  dating: {
    label: 'Dating',
    symbol: '♥',
    classes: 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-300',
  },
  business: {
    label: 'Business',
    symbol: '◆',
    classes: 'border-blue-600/50 bg-blue-700/20 text-blue-300',
  },
  social: {
    label: 'Social',
    symbol: '●',
    classes: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  },
  looking: {
    label: 'Just looking',
    symbol: '○',
    classes: 'border-white/20 bg-white/5 text-bone-dim',
  },
};
