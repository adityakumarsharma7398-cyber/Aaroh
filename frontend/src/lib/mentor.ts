import { MAX_HINT_LEVEL, type HintLevel } from '../types/domain'

export const HINT_LEVELS: HintLevel[] = [0, 1, 2, 3, 4, 5]

/** The next level the ladder can offer, or undefined at the top. Guidance moves one level at a time. */
export function nextHintLevel(current: HintLevel): HintLevel | undefined {
  return current >= MAX_HINT_LEVEL ? undefined : ((current + 1) as HintLevel)
}
