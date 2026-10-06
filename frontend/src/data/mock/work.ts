// MOCK SEED DATA: stands in for backend responses until real services exist.
// Only src/services/* may import from src/data/mock. Everything here is fictional and illustrative.
//
// Cast (deliberately varied, none of it a ranking):
//  stu-1 Asha   rich history, mentor use mixed with independent attempts, one teacher note
//  stu-2 Rohan  steady retries across tasks, completes work, one teacher note
//  stu-3 Kabir  moves to high-level hints very quickly on two tasks, nothing completed, no teacher note
//  stu-4 Isha   some early work, then no activity for about a week
//  stu-5 Dev    just started, a single recorded action
//  stu-6 Tara   long, varied history across tasks, missions and two teacher notes
import type {
  Activity,
  DevelopmentSignal,
  EvidenceEvent,
  EvidenceEventType,
  GrowthInsight,
  Mission,
  MissionAttempt,
  Reflection,
  Task,
  TaskAttempt,
  TaskStatus,
  TeacherObservation,
} from '../../types/domain'

// ---- Activities (teacher-defined) and the tasks students get from them ----

export const mockActivities: Activity[] = [
  {
    id: 'act-auth',
    title: 'Debug the authentication function',
    subject: 'Web Development',
    description: 'Find and fix the issue causing the login request to fail.',
    estimatedMinutes: 45,
    opportunities: [
      { dimension: 'self-reliance', reason: 'Tracing the failure yourself first builds the habit of working a problem before asking for help.' },
      { dimension: 'perseverance', reason: 'Login bugs rarely fall to the first fix, so expect to try, learn and try again.' },
      { dimension: 'problem-solving', reason: 'You will follow a request from the form to the server response to isolate where it breaks.' },
    ],
  },
  {
    id: 'act-quad',
    title: 'Solve the quadratic equations problem set',
    subject: 'Mathematics',
    description: 'Complete problems 1 to 12 and show your working for each.',
    estimatedMinutes: 60,
    opportunities: [
      { dimension: 'perseverance', reason: 'Some problems will not work out on the first attempt. Staying with them is the point.' },
      { dimension: 'self-reliance', reason: 'Try each problem on your own before checking the worked examples.' },
    ],
  },
  {
    id: 'act-pendulum',
    title: 'Write up the pendulum experiment report',
    subject: 'Physics',
    description: 'Summarise your method, results and one source of error from the lab session.',
    estimatedMinutes: 90,
    opportunities: [
      { dimension: 'initiative', reason: 'You decide how to structure the report and which source of error is worth discussing.' },
      { dimension: 'sustained-engagement', reason: 'A longer piece of writing rewards steady, focused work over several sittings.' },
    ],
  },
  {
    id: 'act-essay',
    title: 'Outline an argumentative essay',
    subject: 'English',
    description: 'Choose a position, list three supporting points and note one counter-argument.',
    estimatedMinutes: 40,
    opportunities: [
      { dimension: 'initiative', reason: 'Picking your own position and structure means taking the first step without being told how.' },
      { dimension: 'problem-solving', reason: 'Answering a counter-argument asks you to test your own reasoning.' },
    ],
  },
  {
    id: 'act-navbar',
    title: 'Build a responsive navigation bar',
    subject: 'Web Development',
    description: 'Create a navigation bar that collapses into a menu on small screens.',
    estimatedMinutes: 50,
    opportunities: [
      { dimension: 'problem-solving', reason: 'Layout problems at different screen sizes need you to isolate and fix one thing at a time.' },
      { dimension: 'self-reliance', reason: 'Documentation and experiments come before asking for help.' },
    ],
  },
  {
    id: 'act-prob',
    title: 'Complete the probability worksheet',
    subject: 'Mathematics',
    description: 'Work through the dice and cards questions from chapter 6.',
    estimatedMinutes: 30,
    opportunities: [
      { dimension: 'perseverance', reason: 'Counting problems often need a second or third approach before they click.' },
    ],
  },
]

const activity = (id: string): Activity => {
  const found = mockActivities.find((a) => a.id === id)
  if (!found) throw new Error(`Unknown activity ${id}`)
  return found
}

function taskFor(activityId: string, id: string, studentId: string, status: TaskStatus): Task {
  const a = activity(activityId)
  return {
    id,
    studentId,
    activityId,
    title: a.title,
    subject: a.subject,
    description: a.description,
    status,
    estimatedMinutes: a.estimatedMinutes,
    opportunities: a.opportunities,
  }
}

export const mockTasks: Task[] = [
  // stu-1 Asha (ids kept from earlier phases)
  taskFor('act-auth', 'task-1', 'stu-1', 'in-progress'),
  taskFor('act-quad', 'task-2', 'stu-1', 'not-started'),
  taskFor('act-pendulum', 'task-3', 'stu-1', 'not-started'),
  taskFor('act-essay', 'task-4', 'stu-1', 'in-progress'),
  taskFor('act-navbar', 'task-5', 'stu-1', 'completed'),
  taskFor('act-prob', 'task-6', 'stu-1', 'completed'),
  // stu-2 Rohan
  taskFor('act-auth', 't2-auth', 'stu-2', 'completed'),
  taskFor('act-quad', 't2-quad', 'stu-2', 'in-progress'),
  taskFor('act-pendulum', 't2-pend', 'stu-2', 'not-started'),
  taskFor('act-navbar', 't2-nav', 'stu-2', 'completed'),
  taskFor('act-prob', 't2-prob', 'stu-2', 'completed'),
  // stu-3 Kabir
  taskFor('act-auth', 't3-auth', 'stu-3', 'in-progress'),
  taskFor('act-quad', 't3-quad', 'stu-3', 'in-progress'),
  taskFor('act-essay', 't3-essay', 'stu-3', 'not-started'),
  taskFor('act-prob', 't3-prob', 'stu-3', 'not-started'),
  // stu-4 Isha
  taskFor('act-prob', 't4-prob', 'stu-4', 'completed'),
  taskFor('act-navbar', 't4-nav', 'stu-4', 'in-progress'),
  taskFor('act-pendulum', 't4-pend', 'stu-4', 'not-started'),
  // stu-5 Dev
  taskFor('act-auth', 't5-auth', 'stu-5', 'in-progress'),
  taskFor('act-quad', 't5-quad', 'stu-5', 'not-started'),
  // stu-6 Tara
  taskFor('act-pendulum', 't6-pend', 'stu-6', 'completed'),
  taskFor('act-essay', 't6-essay', 'stu-6', 'completed'),
  taskFor('act-navbar', 't6-nav', 'stu-6', 'completed'),
  taskFor('act-auth', 't6-auth', 'stu-6', 'in-progress'),
  taskFor('act-quad', 't6-quad', 'stu-6', 'in-progress'),
]

// ---- Student-side detail for stu-1 (the signed-in student) ----

export const mockAttempts: TaskAttempt[] = [
  {
    id: 'att-1',
    studentId: 'stu-1',
    taskId: 'task-1',
    createdAt: '2026-10-06T16:05:00+05:30',
    content: `function login(username, password) {
  return fetch('/api/login', {
    method: 'POST',
    body: { username, password },
  }).then((res) => res.json())
}

// Expected a token back. Got a 400 error instead. Not sure why yet.`,
  },
  {
    id: 'att-2',
    studentId: 'stu-1',
    taskId: 'task-1',
    createdAt: '2026-10-06T17:05:00+05:30',
    content: `function login(username, password) {
  return fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((res) => res.json())
}

// The body is JSON now, but it still fails. Checking the headers next.`,
  },
  {
    id: 'att-5',
    studentId: 'stu-1',
    taskId: 'task-5',
    createdAt: '2026-10-03T11:00:00+05:30',
    content: 'Used a flex container for the links and a media query at 640px to swap them for a menu button.',
  },
]

export const mockMissions: Mission[] = [
  {
    id: 'mis-1',
    studentId: 'stu-1',
    taskId: 'task-1',
    title: 'Try the next step on your own first',
    whyItMatters: 'Working through the difficulty before asking for help is how independent problem-solving gets built.',
    action: 'Before opening a hint, write down what you tried and what you expected to happen.',
    dimension: 'self-reliance',
    status: 'active',
  },
  {
    id: 'mis-2',
    studentId: 'stu-1',
    taskId: 'task-5',
    title: 'Read the documentation before asking',
    whyItMatters: 'Looking things up yourself first is a practical way to build self-reliance.',
    action: 'Before asking for help, find the relevant documentation page and note one thing you learned.',
    dimension: 'self-reliance',
    status: 'completed',
  },
  {
    id: 'mis-3',
    studentId: 'stu-1',
    taskId: 'task-2',
    title: 'Stay with one stuck problem a little longer',
    whyItMatters: 'Giving a hard problem a few more minutes before moving on is one way to practise perseverance.',
    action: 'When you get stuck, try one new approach and write down what changed.',
    dimension: 'perseverance',
    status: 'available',
  },
  {
    id: 'mis-r',
    studentId: 'stu-2',
    taskId: 't2-auth',
    title: 'Try a different approach after a failed attempt',
    whyItMatters: 'Changing the approach, not just repeating it, is a practical way to stay with a hard problem.',
    action: 'After a failed attempt, change one thing and note what difference it made.',
    dimension: 'perseverance',
    status: 'completed',
  },
  {
    id: 'mis-t',
    studentId: 'stu-6',
    taskId: 't6-essay',
    title: 'Decide the structure before looking at examples',
    whyItMatters: 'Choosing a structure yourself is a practical way to take the first step.',
    action: 'Sketch your own structure first, then compare it with an example.',
    dimension: 'initiative',
    status: 'completed',
  },
]

export const mockMissionAttempts: MissionAttempt[] = [
  {
    id: 'matt-1',
    studentId: 'stu-1',
    missionId: 'mis-2',
    createdAt: '2026-10-04T10:00:00+05:30',
    note: 'Read the MDN page on media queries before asking. Learned that min-width queries suit a mobile-first layout.',
  },
  {
    id: 'matt-r',
    studentId: 'stu-2',
    missionId: 'mis-r',
    createdAt: '2026-10-03T09:00:00+05:30',
    note: 'Switched from guessing at the headers to reading the server response, and that showed the real error.',
  },
  {
    id: 'matt-t',
    studentId: 'stu-6',
    missionId: 'mis-t',
    createdAt: '2026-10-04T09:00:00+05:30',
    note: 'Sketched a three-point structure first, then compared it with the example and kept my own order.',
  },
]

export const mockReflections: Reflection[] = [
  {
    id: 'ref-5',
    studentId: 'stu-1',
    taskId: 'task-5',
    createdAt: '2026-10-03T12:25:00+05:30',
    answers: [
      { prompt: 'What was difficult about this task?', response: 'Getting the menu to close after choosing a link.' },
      { prompt: 'What did you try before asking for help?', response: 'I logged the state and found the click handler was never reset.' },
      { prompt: 'What would you do differently next time?', response: 'Plan the open and closed states before writing the markup.' },
    ],
  },
]

// ---- Evidence ----

const at = (day: string, time: string) => `2026-${day}T${time}:00+05:30`

type Row = [taskId: string, type: EvidenceEventType, occurredAt: string, extra?: Partial<EvidenceEvent>]

/** Builds events with ids `${prefix}-1`, `${prefix}-2`, … in row order. */
const eventsFor = (studentId: string, prefix: string, rows: Row[]): EvidenceEvent[] =>
  rows.map(([taskId, type, occurredAt, extra], i) => ({ id: `${prefix}-${i + 1}`, studentId, taskId, type, occurredAt, ...extra }))

export const mockEvidenceEvents: EvidenceEvent[] = [
  // stu-1 Asha
  { id: 'ev-a6', studentId: 'stu-1', taskId: 'task-6', type: 'attempt-created', occurredAt: at('10-01', '15:00') },
  { id: 'ev-c6', studentId: 'stu-1', taskId: 'task-6', type: 'task-completed', occurredAt: at('10-01', '15:40') },
  { id: 'ev-a5', studentId: 'stu-1', taskId: 'task-5', type: 'attempt-created', occurredAt: at('10-03', '11:00') },
  { id: 'ev-c5', studentId: 'stu-1', taskId: 'task-5', type: 'task-completed', occurredAt: at('10-03', '12:10') },
  { id: 'ev-r5', studentId: 'stu-1', taskId: 'task-5', type: 'reflection-added', occurredAt: at('10-03', '12:25') },
  { id: 'ev-m2', studentId: 'stu-1', taskId: 'task-5', type: 'mission-completed', missionId: 'mis-2', occurredAt: at('10-04', '10:00') },
  { id: 'ev-1', studentId: 'stu-1', taskId: 'task-1', type: 'attempt-created', occurredAt: at('10-06', '16:05') },
  { id: 'ev-2a', studentId: 'stu-1', taskId: 'task-1', type: 'hint-requested', hintLevel: 1, occurredAt: at('10-06', '16:20') },
  { id: 'ev-2', studentId: 'stu-1', taskId: 'task-1', type: 'hint-requested', hintLevel: 2, occurredAt: at('10-06', '16:40') },
  { id: 'ev-3', studentId: 'stu-1', taskId: 'task-1', type: 'retry', occurredAt: at('10-06', '17:05') },
  { id: 'ev-4', studentId: 'stu-1', taskId: 'task-1', type: 'feedback-applied', occurredAt: at('10-06', '17:30') },

  // stu-2 Rohan: r-1 … r-17
  ...eventsFor('stu-2', 'r', [
    ['t2-auth', 'attempt-created', at('10-02', '14:00')],
    ['t2-auth', 'retry', at('10-02', '14:30')],
    ['t2-auth', 'retry', at('10-02', '15:10')],
    ['t2-auth', 'feedback-applied', at('10-02', '15:30')],
    ['t2-auth', 'task-completed', at('10-02', '15:50')],
    ['t2-auth', 'reflection-added', at('10-02', '16:05')],
    ['t2-nav', 'attempt-created', at('10-04', '11:00')],
    ['t2-nav', 'hint-requested', at('10-04', '11:20'), { hintLevel: 1 }],
    ['t2-nav', 'task-completed', at('10-04', '12:00')],
    ['t2-prob', 'attempt-created', at('10-01', '09:30')],
    ['t2-prob', 'retry', at('10-01', '09:50')],
    ['t2-prob', 'task-completed', at('10-01', '10:15')],
    ['t2-quad', 'attempt-created', at('10-06', '15:00')],
    ['t2-quad', 'retry', at('10-06', '15:25')],
    ['t2-quad', 'retry', at('10-06', '15:50')],
    ['t2-quad', 'hint-requested', at('10-06', '16:05'), { hintLevel: 1 }],
    ['t2-auth', 'mission-completed', at('10-03', '09:00'), { missionId: 'mis-r' }],
  ]),

  // stu-3 Kabir: k-1 … k-11
  ...eventsFor('stu-3', 'k', [
    ['t3-auth', 'attempt-created', at('10-05', '15:00')],
    ['t3-auth', 'hint-requested', at('10-05', '15:05'), { hintLevel: 1 }],
    ['t3-auth', 'hint-requested', at('10-05', '15:08'), { hintLevel: 2 }],
    ['t3-auth', 'hint-requested', at('10-05', '15:12'), { hintLevel: 3 }],
    ['t3-auth', 'hint-requested', at('10-05', '15:18'), { hintLevel: 4 }],
    ['t3-auth', 'hint-requested', at('10-05', '15:25'), { hintLevel: 5 }],
    ['t3-quad', 'attempt-created', at('10-06', '14:00')],
    ['t3-quad', 'hint-requested', at('10-06', '14:05'), { hintLevel: 1 }],
    ['t3-quad', 'hint-requested', at('10-06', '14:10'), { hintLevel: 2 }],
    ['t3-quad', 'hint-requested', at('10-06', '14:12'), { hintLevel: 3 }],
    ['t3-quad', 'hint-requested', at('10-06', '14:20'), { hintLevel: 4 }],
  ]),

  // stu-4 Isha: i-1 … i-4 (nothing after 29 Sept)
  ...eventsFor('stu-4', 'i', [
    ['t4-prob', 'attempt-created', at('09-28', '10:00')],
    ['t4-prob', 'task-completed', at('09-28', '10:30')],
    ['t4-nav', 'attempt-created', at('09-29', '11:00')],
    ['t4-nav', 'hint-requested', at('09-29', '11:20'), { hintLevel: 1 }],
  ]),

  // stu-5 Dev: d-1
  ...eventsFor('stu-5', 'd', [['t5-auth', 'attempt-created', at('10-06', '11:00')]]),

  // stu-6 Tara: a-1 … a-15
  ...eventsFor('stu-6', 'a', [
    ['t6-pend', 'attempt-created', at('10-01', '14:00')],
    ['t6-pend', 'retry', at('10-01', '15:00')],
    ['t6-pend', 'task-completed', at('10-02', '12:00')],
    ['t6-pend', 'reflection-added', at('10-02', '12:15')],
    ['t6-essay', 'attempt-created', at('10-03', '10:00')],
    ['t6-essay', 'retry', at('10-03', '10:40')],
    ['t6-essay', 'task-completed', at('10-03', '11:30')],
    ['t6-essay', 'mission-completed', at('10-04', '09:00'), { missionId: 'mis-t' }],
    ['t6-nav', 'attempt-created', at('10-05', '13:00')],
    ['t6-nav', 'hint-requested', at('10-05', '13:30'), { hintLevel: 1 }],
    ['t6-nav', 'retry', at('10-05', '13:50')],
    ['t6-nav', 'task-completed', at('10-05', '14:20')],
    ['t6-auth', 'attempt-created', at('10-06', '12:00')],
    ['t6-auth', 'retry', at('10-06', '12:30')],
    ['t6-quad', 'attempt-created', at('10-06', '17:00')],
  ]),
]

// Signals are produced by the backend's signal engine. They are NOT recomputed in the browser:
// in this mock they stay as seeded, while new evidence appears in the evidence views.
// Kabir, Isha and Dev have no signals yet, so they exercise the "not enough evidence" state.
export const mockSignals: DevelopmentSignal[] = [
  // stu-1 Asha
  {
    id: 'sig-1', studentId: 'stu-1', dimension: 'self-reliance', trend: 'improving',
    summary: 'Recent evidence suggests attempts were made before guidance was requested, and a mission about reading documentation first was completed.',
    evidenceEventIds: ['ev-a5', 'ev-m2', 'ev-1', 'ev-2a', 'ev-2'],
  },
  {
    id: 'sig-2', studentId: 'stu-1', dimension: 'perseverance', trend: 'stable',
    summary: 'Observed pattern: further attempts followed feedback on recent work, with no clear change in either direction yet.',
    evidenceEventIds: ['ev-a6', 'ev-3', 'ev-4'],
  },
  // stu-2 Rohan
  {
    id: 'sig-r1', studentId: 'stu-2', dimension: 'perseverance', trend: 'improving',
    summary: 'Recent evidence suggests repeated attempts after feedback, across two different tasks.',
    evidenceEventIds: ['r-2', 'r-3', 'r-4', 'r-14', 'r-15'],
  },
  {
    id: 'sig-r2', studentId: 'stu-2', dimension: 'self-reliance', trend: 'stable',
    summary: 'Observed pattern: attempts were saved before hints were requested on recent tasks, with no clear change over time.',
    evidenceEventIds: ['r-1', 'r-7', 'r-8', 'r-13', 'r-16'],
  },
  {
    id: 'sig-r3', studentId: 'stu-2', dimension: 'problem-solving', trend: 'emerging',
    summary: 'Early evidence of adjusting an approach after feedback or a hint. More evidence is needed.',
    evidenceEventIds: ['r-4', 'r-8', 'r-16'],
  },
  // stu-6 Tara
  {
    id: 'sig-a1', studentId: 'stu-6', dimension: 'self-reliance', trend: 'improving',
    summary: 'Recent evidence suggests attempts were saved before any hint was requested, across several tasks.',
    evidenceEventIds: ['a-1', 'a-5', 'a-9', 'a-10'],
  },
  {
    id: 'sig-a2', studentId: 'stu-6', dimension: 'perseverance', trend: 'stable',
    summary: 'Observed pattern: further attempts followed the first one on several tasks, with no clear change over time.',
    evidenceEventIds: ['a-2', 'a-6', 'a-11'],
  },
  {
    id: 'sig-a3', studentId: 'stu-6', dimension: 'problem-solving', trend: 'emerging',
    summary: 'Early evidence of changing an approach after a hint. More evidence is needed.',
    evidenceEventIds: ['a-10', 'a-11', 'a-14'],
  },
  {
    id: 'sig-a4', studentId: 'stu-6', dimension: 'initiative', trend: 'improving',
    summary: 'Recent evidence suggests choices were made independently across several tasks, including a completed mission.',
    evidenceEventIds: ['a-1', 'a-5', 'a-8'],
  },
  {
    id: 'sig-a5', studentId: 'stu-6', dimension: 'sustained-engagement', trend: 'emerging',
    summary: 'Early evidence of returning to work across several days. More evidence is needed.',
    evidenceEventIds: ['a-2', 'a-6', 'a-14', 'a-15'],
  },
]

export const mockInsights: GrowthInsight[] = [
  {
    id: 'ins-1',
    studentId: 'stu-1',
    observation:
      'You asked for help after attempting the problem yourself. That gave you a chance to work through the difficulty before receiving guidance.',
    evidenceEventIds: ['ev-1', 'ev-2a', 'ev-2'],
  },
]

// ---- Teacher observations ----

export const mockObservations: TeacherObservation[] = [
  {
    id: 'obs-1', studentId: 'stu-6', dimension: 'initiative', taskId: 't6-essay', createdAt: at('10-03', '12:00'),
    text: 'Chose a less obvious counter-argument and addressed it directly in the outline.',
  },
  {
    id: 'obs-2', studentId: 'stu-6', dimension: 'sustained-engagement', taskId: 't6-pend', createdAt: at('10-02', '13:00'),
    text: 'Re-checked the pendulum measurements after class without being asked.',
  },
  {
    id: 'obs-3', studentId: 'stu-2', dimension: 'perseverance', taskId: 't2-auth', createdAt: at('10-02', '16:20'),
    text: 'Kept going after the first two attempts failed, and asked a specific question before taking the hint.',
  },
  {
    id: 'obs-4', studentId: 'stu-1', dimension: 'self-reliance', taskId: 'task-1', createdAt: at('10-06', '17:40'),
    text: 'Wrote down what had been tried before asking about the login bug.',
  },
]
