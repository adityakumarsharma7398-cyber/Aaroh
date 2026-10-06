import { createHash } from "node:crypto";
import {
  evaluateSelfReliance,
  evaluatePerseverance,
  evaluateProblemSolving,
  evaluateInitiative,
  evaluateSustainedEngagement,
} from "./evidence";
import type {
  ObservableEvent,
  ObservableDevelopmentSignal,
  DevelopmentDimension,
} from "@education-growth/shared";

/**
 * Derives a deterministic signal ID from ruleId, studentId, and supporting event IDs.
 */
function generateDeterministicSignalId(
  ruleId: string,
  studentId: string,
  supportingEventIds: string[]
): string {
  const sorted = [...supportingEventIds].sort().join(",");
  const hash = createHash("sha256")
    .update(`signal:${ruleId}:${studentId}:${sorted}`)
    .digest("hex")
    .slice(0, 16);
  return `sig-${ruleId.toLowerCase()}-${hash}`;
}

/**
 * Extracts a deterministic timestamp from the latest event in the set.
 */
function getLatestTimestamp(events: ObservableEvent[]): string {
  if (!events || events.length === 0) {
    return new Date(0).toISOString();
  }
  const timestamps = events.map((e) => new Date(e.createdAt).getTime());
  return new Date(Math.max(...timestamps)).toISOString();
}

/**
 * Extracts studentId from event stream or returns fallback.
 */
function getStudentId(events: ObservableEvent[]): string {
  return events.length > 0 ? events[0].studentId : "unknown-student";
}

/**
 * RULE SR-01 — SELF RELIANCE
 * Evaluates decreasing assistance dependency across comparable completed tasks.
 */
export function evaluateSelfRelianceSignal(
  events: ObservableEvent[]
): ObservableDevelopmentSignal {
  const studentId = getStudentId(events);
  const evidenceList = evaluateSelfReliance(events);

  if (evidenceList.length > 0) {
    // Select the strongest/latest evidence record
    const ev = evidenceList[0];
    return {
      id: generateDeterministicSignalId("SR-01", studentId, ev.supportingEventIds),
      studentId,
      dimension: "self_reliance",
      state: "positive",
      summary: "Positive development signal: required assistance decreased across comparable tasks.",
      ruleId: "SR-01",
      ruleExplanation: ev.summary,
      supportingEventIds: ev.supportingEventIds,
      evidenceStrength: ev.strength,
      generatedAt: ev.createdAt,
      isCharacterVerdict: false,
    };
  }

  return {
    id: generateDeterministicSignalId("SR-01", studentId, []),
    studentId,
    dimension: "self_reliance",
    state: "insufficient_data",
    summary: "Insufficient comparable task data to determine assistance dependence trend.",
    ruleId: "SR-01",
    ruleExplanation:
      "Evaluating assistance trends requires at least 3 completed tasks with hint progression data.",
    supportingEventIds: [],
    evidenceStrength: "insufficient",
    generatedAt: getLatestTimestamp(events),
    isCharacterVerdict: false,
  };
}

/**
 * RULE PE-01 — PERSEVERANCE
 * Evaluates observable retry behavior following an unsuccessful attempt.
 */
export function evaluatePerseveranceSignal(
  events: ObservableEvent[]
): ObservableDevelopmentSignal {
  const studentId = getStudentId(events);
  const evidenceList = evaluatePerseverance(events);

  if (evidenceList.length > 0) {
    // Aggregate supporting events across all persevered tasks
    const allSupportingIds = Array.from(
      new Set(evidenceList.flatMap((e) => e.supportingEventIds))
    );
    const highestStrength = evidenceList.some((e) => e.strength === "strengthening")
      ? "strengthening"
      : "developing";

    const taskCount = evidenceList.length;
    const ruleExplanation =
      taskCount > 1
        ? `Observable retry and completion sequence detected across ${taskCount} separate tasks.`
        : evidenceList[0].summary;

    return {
      id: generateDeterministicSignalId("PE-01", studentId, allSupportingIds),
      studentId,
      dimension: "perseverance",
      state: "positive",
      summary: "Positive development signal: student retried after an unsuccessful attempt.",
      ruleId: "PE-01",
      ruleExplanation,
      supportingEventIds: allSupportingIds,
      evidenceStrength: highestStrength,
      generatedAt: evidenceList[evidenceList.length - 1].createdAt,
      isCharacterVerdict: false,
    };
  }

  return {
    id: generateDeterministicSignalId("PE-01", studentId, []),
    studentId,
    dimension: "perseverance",
    state: "insufficient_data",
    summary: "No observable setback-and-retry sequence recorded.",
    ruleId: "PE-01",
    ruleExplanation:
      "Perseverance signals evaluate observable responses to difficulty (unsuccessful attempt followed by retry and completion).",
    supportingEventIds: [],
    evidenceStrength: "insufficient",
    generatedAt: getLatestTimestamp(events),
    isCharacterVerdict: false,
  };
}

/**
 * RULE PS-01 — PROBLEM SOLVING
 * Evaluates observable iterative approach changes following feedback.
 */
export function evaluateProblemSolvingSignal(
  events: ObservableEvent[]
): ObservableDevelopmentSignal {
  const studentId = getStudentId(events);
  const evidenceList = evaluateProblemSolving(events);

  if (evidenceList.length > 0) {
    const allSupportingIds = Array.from(
      new Set(evidenceList.flatMap((e) => e.supportingEventIds))
    );

    return {
      id: generateDeterministicSignalId("PS-01", studentId, allSupportingIds),
      studentId,
      dimension: "problem_solving",
      state: "positive",
      summary: "Positive development signal: student applied feedback and adjusted approach before completing the task.",
      ruleId: "PS-01",
      ruleExplanation: evidenceList[0].summary,
      supportingEventIds: allSupportingIds,
      evidenceStrength: evidenceList[0].strength,
      generatedAt: evidenceList[evidenceList.length - 1].createdAt,
      isCharacterVerdict: false,
    };
  }

  return {
    id: generateDeterministicSignalId("PS-01", studentId, []),
    studentId,
    dimension: "problem_solving",
    state: "insufficient_data",
    summary: "Insufficient observable feedback-and-retry sequence recorded.",
    ruleId: "PS-01",
    ruleExplanation:
      "Problem solving signals evaluate observable application of feedback and subsequent retry.",
    supportingEventIds: [],
    evidenceStrength: "insufficient",
    generatedAt: getLatestTimestamp(events),
    isCharacterVerdict: false,
  };
}

/**
 * RULE IN-01 — INITIATIVE
 * Evaluates explicit observable elective task extensions or student-initiated actions.
 */
export function evaluateInitiativeSignal(
  events: ObservableEvent[]
): ObservableDevelopmentSignal {
  const studentId = getStudentId(events);
  const evidenceList = evaluateInitiative(events);

  if (evidenceList.length > 0) {
    const allSupportingIds = Array.from(
      new Set(evidenceList.flatMap((e) => e.supportingEventIds))
    );

    return {
      id: generateDeterministicSignalId("IN-01", studentId, allSupportingIds),
      studentId,
      dimension: "initiative",
      state: "positive",
      summary: "Positive development signal: student completed an optional extension beyond required task.",
      ruleId: "IN-01",
      ruleExplanation: evidenceList[0].summary,
      supportingEventIds: allSupportingIds,
      evidenceStrength: evidenceList[0].strength,
      generatedAt: evidenceList[evidenceList.length - 1].createdAt,
      isCharacterVerdict: false,
    };
  }

  return {
    id: generateDeterministicSignalId("IN-01", studentId, []),
    studentId,
    dimension: "initiative",
    state: "insufficient_data",
    summary: "Insufficient observable data for independent initiative.",
    ruleId: "IN-01",
    ruleExplanation:
      "Initiative signals require explicit observable evidence of elective extensions or self-initiated tasks.",
    supportingEventIds: [],
    evidenceStrength: "insufficient",
    generatedAt: getLatestTimestamp(events),
    isCharacterVerdict: false,
  };
}

/**
 * RULE SE-01 — SUSTAINED ENGAGEMENT
 * Evaluates observable session activity over task intervals without claiming internal attention.
 */
export function evaluateSustainedEngagementSignal(
  events: ObservableEvent[]
): ObservableDevelopmentSignal {
  const studentId = getStudentId(events);
  const evidenceList = evaluateSustainedEngagement(events);

  if (evidenceList.length > 0) {
    const allSupportingIds = Array.from(
      new Set(evidenceList.flatMap((e) => e.supportingEventIds))
    );

    return {
      id: generateDeterministicSignalId("SE-01", studentId, allSupportingIds),
      studentId,
      dimension: "sustained_engagement",
      state: "positive",
      summary: "Sustained engagement signal based on observable task activity.",
      ruleId: "SE-01",
      ruleExplanation: evidenceList[0].summary,
      supportingEventIds: allSupportingIds,
      evidenceStrength: evidenceList[0].strength,
      generatedAt: evidenceList[evidenceList.length - 1].createdAt,
      isCharacterVerdict: false,
    };
  }

  return {
    id: generateDeterministicSignalId("SE-01", studentId, []),
    studentId,
    dimension: "sustained_engagement",
    state: "insufficient_data",
    summary: "Insufficient observable task activity to determine sustained engagement.",
    ruleId: "SE-01",
    ruleExplanation:
      "Sustained engagement signals require multi-step active task interactions or explicit session observations.",
    supportingEventIds: [],
    evidenceStrength: "insufficient",
    generatedAt: getLatestTimestamp(events),
    isCharacterVerdict: false,
  };
}

/**
 * Evaluates all 5 MVP dimensions for a given event stream.
 * Pure deterministic function: same events always produce the exact same signals.
 */
export function generateDevelopmentSignals(
  events: ObservableEvent[]
): ObservableDevelopmentSignal[] {
  return [
    evaluateSelfRelianceSignal(events),
    evaluatePerseveranceSignal(events),
    evaluateProblemSolvingSignal(events),
    evaluateInitiativeSignal(events),
    evaluateSustainedEngagementSignal(events),
  ];
}
