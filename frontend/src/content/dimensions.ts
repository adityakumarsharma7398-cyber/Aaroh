import type { DevelopmentDimension } from '../types/domain'

// Plain-language explanations. They describe a kind of behaviour, not a personality trait.
export const DIMENSION_DESCRIPTIONS: Record<DevelopmentDimension, string> = {
  'self-reliance':
    'Working through a problem on your own before turning to others, and knowing when and how to ask for help.',
  perseverance: 'Staying with a difficult task through setbacks, and trying again when something does not work.',
  initiative: 'Taking the next step without being told: choosing an approach, starting, or extending your work.',
  'problem-solving':
    'Breaking a problem into parts, testing ideas, and adjusting your approach based on what you find.',
  'sustained-engagement': 'Keeping steady, focused effort on a task over time rather than in a single burst.',
}
