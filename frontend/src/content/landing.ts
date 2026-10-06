// Static, illustrative content for the public landing page.
// Kept separate from the components so it can later be swapped for real data or CMS content.

import type { SignalItem } from '../components/ui/SignalList'

export type Tone = 'blue' | 'yellow' | 'orange' | 'pink'
export type CardTone = Tone | 'softBlue' | 'softYellow' | 'softOrange' | 'softPink'

/** The five directions of growth shown around the hero compass, placed clockwise from the top. */
export const COMPASS_DIMENSIONS: { label: string; angle: number; tone: 'orange' | 'blue' | 'softBlue' | 'yellow' | 'pink' }[] = [
  { label: 'Self-Reliance', angle: -90, tone: 'orange' },
  { label: 'Perseverance', angle: -18, tone: 'blue' },
  { label: 'Sustained Engagement', angle: 54, tone: 'softBlue' },
  { label: 'Problem-Solving', angle: 126, tone: 'yellow' },
  { label: 'Initiative', angle: 198, tone: 'pink' },
]

/** Small contextual cards that float around the compass. They are examples, not a sequence. */
export const HERO_CARDS: { tone: 'orange' | 'pink' | 'yellow'; tag: string; text: string }[] = [
  { tone: 'orange', tag: "Today's challenge", text: 'Try once before asking for a hint.' },
  { tone: 'yellow', tag: 'Growth insight', text: 'Your actions are creating evidence.' },
  { tone: 'pink', tag: 'You did', text: 'Attempted · Got stuck · Tried again' },
]

export const PROBLEM_TRACKED = ['Marks', 'Assignments', 'Submissions', 'Attendance']

export const PROBLEM_MISSING: { title: string; text: string; tone: Tone; icon: string }[] = [
  { title: 'Self-reliance', text: 'Did the student try before asking?', tone: 'orange', icon: '◎' },
  { title: 'Perseverance', text: 'What happened after the first setback?', tone: 'pink', icon: '↻' },
  { title: 'Initiative', text: 'Who took the next step unprompted?', tone: 'yellow', icon: '▲' },
  { title: 'Problem-solving', text: 'How did the approach change over time?', tone: 'blue', icon: '✦' },
]

export const ENGINE_STEPS: { n: string; label: string; tone: CardTone; text: string }[] = [
  { n: '01', label: 'Academic Work', tone: 'blue', text: 'It starts with work the student already has to do: an assignment, a problem set, a project.' },
  { n: '02', label: 'Development Opportunity', tone: 'yellow', text: 'The task is read for the qualities it can build, such as self-reliance or perseverance.' },
  { n: '03', label: 'Growth Mission', tone: 'orange', text: 'A small, concrete mission attaches to the task, e.g. "attempt it independently first".' },
  { n: '04', label: 'Productive Difficulty', tone: 'pink', text: 'The student meets real friction. The mentor supports without removing the struggle.' },
  { n: '05', label: 'Evidence', tone: 'softBlue', text: 'Attempts, hint requests, retries and completions are recorded as observable events.' },
  { n: '06', label: 'Development Signal', tone: 'softYellow', text: 'Evidence over time becomes a signal such as "Perseverance: improving", always with its reasons.' },
]

export const ACADEMIC_EXAMPLE = {
  task: 'Debug this JavaScript function.',
  opportunities: ['Self-Reliance', 'Perseverance', 'Problem-Solving'],
  mission: 'Attempt the problem independently before requesting direct assistance.',
  loop: ['Attempt', 'Difficulty', 'Retry', 'Completion'],
}

export const HINT_LEVELS: { id: string; name: string; says: string }[] = [
  { id: 'L0', name: 'Independent Thinking', says: 'No hint yet. "Take ten minutes with this on your own. What have you tried?"' },
  { id: 'L1', name: 'Reflective Prompt', says: '"What did you expect this function to return? What does it return instead?"' },
  { id: 'L2', name: 'Conceptual Hint', says: '"Look at how the loop variable changes. Which concept controls it?"' },
  { id: 'L3', name: 'Structured Guidance', says: '"Check three things in order: the inputs, the loop bounds, the return value."' },
  { id: 'L4', name: 'Worked Example', says: 'A similar function is solved step by step. Yours stays unsolved.' },
  { id: 'L5', name: 'Solution', says: 'The full answer, shown last, and recorded as such in the evidence.' },
]
export const DEFAULT_HINT_LEVEL = 2

export const EVIDENCE_EVENTS = ['Attempted independently', 'Requested Level 2 hint', 'Retried', 'Applied feedback', 'Completed']
export const EVIDENCE_SIGNALS: SignalItem[] = [
  { label: 'Self-Reliance', trend: 'Improving' },
  { label: 'Perseverance', trend: 'Improving' },
]

export const TEACHER_EXAMPLE = {
  course: 'Programming',
  progress: '84%',
  signals: [
    { label: 'Self-Reliance', trend: 'Improving' },
    { label: 'Perseverance', trend: 'Improving' },
    { label: 'Problem-Solving', trend: 'Stable' },
  ] as SignalItem[],
  whyQuestion: 'Why is Self-Reliance improving?',
  trail: [
    'Attempted before requesting a hint on 4 of the last 5 tasks',
    'Hints requested stayed at Level 2 or below',
    'Applied feedback and retried within the same session',
  ],
}

export const FOUNDATION_PRINCIPLES: { name: string; does: string }[] = [
  { name: 'Self-reliance', does: 'Try before asking' },
  { name: 'Perseverance', does: 'Retry after a setback' },
  { name: 'Strength', does: 'Stay with difficulty' },
  { name: 'Initiative', does: 'Take the next step' },
  { name: 'Service', does: 'Help others and share what you learn' },
  { name: 'Practical action', does: 'Do the work, then reflect' },
]
