// Pure view helpers for evidence. The backend creates and interprets evidence;
// these only format and group what has already been loaded.
import { EVIDENCE_EVENT_LABELS, HINT_LEVEL_NAMES } from '../content/labels'
import type { DevelopmentDimension, DevelopmentSignal, EvidenceEvent, HintLevel, TaskAttempt } from '../types/domain'

export function describeEvent(event: EvidenceEvent): string {
  const base = EVIDENCE_EVENT_LABELS[event.type]
  if (event.type === 'hint-requested' && event.hintLevel !== undefined) {
    return `${base}: Level ${event.hintLevel}, ${HINT_LEVEL_NAMES[event.hintLevel]}`
  }
  return base
}

export function sortEvents(events: EvidenceEvent[], order: 'newest' | 'oldest'): EvidenceEvent[] {
  const dir = order === 'newest' ? -1 : 1
  return [...events].sort((a, b) => dir * (Date.parse(a.occurredAt) - Date.parse(b.occurredAt)))
}

/** Which development signals each event contributes to, according to the signals' own evidence lists. */
export function dimensionsByEvent(signals: DevelopmentSignal[]): Record<string, DevelopmentDimension[]> {
  const map: Record<string, DevelopmentDimension[]> = {}
  for (const signal of signals) {
    for (const id of signal.evidenceEventIds) {
      if (!map[id]) map[id] = []
      map[id].push(signal.dimension)
    }
  }
  return map
}

export interface DayGroup {
  key: string
  label: string
  events: EvidenceEvent[]
}

/** Groups events by local calendar day, keeping the order of the input. */
export function groupByDay(events: EvidenceEvent[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const event of events) {
    const date = new Date(event.occurredAt)
    const key = date.toLocaleDateString('en-CA')
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = {
        key,
        label: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
        events: [],
      }
      groups.push(group)
    }
    group.events.push(event)
  }
  return groups
}

export interface TaskWorkSummary {
  attemptsSaved: number
  hintsRequested: number
  highestHintLevel?: HintLevel
}

/** Counts of what was done. Plain facts, no interpretation. */
export function summariseTaskWork(events: EvidenceEvent[], attempts: TaskAttempt[]): TaskWorkSummary {
  const hints = events.filter((e) => e.type === 'hint-requested')
  const levels = hints.map((h) => h.hintLevel).filter((l): l is HintLevel => l !== undefined)
  return {
    attemptsSaved: attempts.length,
    hintsRequested: hints.length,
    highestHintLevel: levels.length ? (Math.max(...levels) as HintLevel) : undefined,
  }
}
