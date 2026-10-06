// MOCK CONTENT: illustrative mentor hints and reflection prompts.
// A real backend / AI endpoint will replace this; the shapes returned to the UI will not change.
import type { HintLevel, MentorHint } from '../../types/domain'

type Written = Record<1 | 2 | 3 | 4 | 5, string>

const WRITTEN_HINTS: Record<string, Written> = {
  'task-1': {
    1: 'What did you expect the server to receive, and what is your code actually sending? How could you check that?',
    2: 'A login endpoint that expects JSON needs to be told the body is JSON. Think about what the request headers tell the server.',
    3: 'Check these in order:\n1. Is the body serialised with JSON.stringify?\n2. Is a Content-Type header set to application/json?\n3. Do you check res.ok before parsing the response?',
    4: "Here is a similar call for a different endpoint:\n\nfetch('/api/profile', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name }),\n})\n\nCompare its shape with your login request, line by line.",
    5: "One working version:\n\nfunction login(username, password) {\n  return fetch('/api/login', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ username, password }),\n  }).then((res) => {\n    if (!res.ok) throw new Error('Login failed')\n    return res.json()\n  })\n}\n\nTry rewriting it in your own words before you copy it.",
  },
  'task-2': {
    1: 'Which method is the problem pointing you toward: factorising, completing the square or the formula? What made you pick it?',
    2: 'Look at the coefficients. If the equation factorises neatly, two numbers will multiply to c and add to b.',
    3: 'Steps:\n1. Write the equation as ax² + bx + c = 0.\n2. Check the discriminant b² − 4ac.\n3. Choose a method based on whether it factorises.',
    4: 'Worked example: x² − 5x + 6 = 0. Two numbers that multiply to 6 and add to −5 are −2 and −3, so (x − 2)(x − 3) = 0 and x = 2 or x = 3. Now try problem 1 the same way.',
    5: 'For a problem like x² + 7x + 12 = 0: (x + 3)(x + 4) = 0, so x = −3 or x = −4. Check by substituting back in, then compare with your own working.',
  },
  'task-3': {
    1: 'What was your question in the experiment, and which of your measurements best answers it?',
    2: 'A good report links method, result and conclusion. Think about how each section should lead into the next.',
    3: 'Structure:\n1. Aim in one sentence.\n2. Method, with the variables you controlled.\n3. Results table.\n4. One source of error and how it affects the result.',
    4: "Example error paragraph: 'Timing by hand adds reaction-time error of roughly 0.2 s per measurement, which makes the period look longer than it is.' Write one for your own data.",
    5: 'A full sample report is not provided for this task. Use the structure from Level 3 and the example from Level 4, then bring your draft to your teacher.',
  },
  'task-4': {
    1: 'If someone strongly disagreed with your position, what would their best argument be?',
    2: 'A counter-argument is strongest when you acknowledge it fairly and then explain why your position still holds.',
    3: 'Outline pattern:\n1. Position.\n2. Point one with evidence.\n3. Point two.\n4. Point three.\n5. Counter-argument and your response.',
    4: "Example point: 'Schools should start later. Research on teenage sleep suggests…' It states a claim, then gives a reason. Do the same for each of your points.",
    5: 'Sample outline on a different topic:\nPosition: cities need more cycle lanes.\nPoint 1: safety. Point 2: congestion. Point 3: health.\nCounter: cost. Response: lanes cost less than road widening.\n\nNow build yours on your own topic.',
  },
}

/** Fallback so every task gets contextual guidance, even without hand-written hints. */
function genericHint(title: string, subject: string, level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1:
      return `Think about the goal of "${title}". What would a finished answer look like?`
    case 2:
      return `Which idea from your recent ${subject} lessons is closest to this problem?`
    case 3:
      return 'Break the task into two or three smaller steps and decide which one to try first.'
    case 4:
      return 'Find a similar example in your class notes and compare its steps with your own work.'
    case 5:
      return 'A full solution is not available for this task in the demo. Bring your work to your teacher.'
  }
}

export function hintContent(taskId: string, title: string, subject: string, level: HintLevel): string {
  if (level === 0) return ''
  return WRITTEN_HINTS[taskId]?.[level] ?? genericHint(title, subject, level)
}

/** Hints already delivered for the seeded in-progress task, consistent with its seeded evidence. */
export const seedHints: MentorHint[] = [1, 2].map((level) => ({
  id: `mh-task-1-${level}`,
  taskId: 'task-1',
  level: level as HintLevel,
  content: hintContent('task-1', '', '', level as HintLevel),
}))
