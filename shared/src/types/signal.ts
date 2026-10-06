export type DevelopmentDimension =
  | "self_reliance"
  | "perseverance"
  | "problem_solving"
  | "initiative"
  | "sustained_engagement";

export type EvidenceStrength =
  | "insufficient"
  | "emerging"
  | "developing"
  | "strengthening";

export type SignalState = "positive" | "neutral" | "insufficient_data";

export interface EvidenceRecord {
  id: string;
  studentId: string;
  taskId?: string | null;
  dimension: DevelopmentDimension;
  ruleId: string;
  summary: string;
  supportingEventIds: string[];
  strength: EvidenceStrength;
  createdAt: string;
}

export interface ObservableDevelopmentSignal {
  id: string;
  studentId: string;
  dimension: DevelopmentDimension;
  state: SignalState;
  summary: string;
  ruleId: string;
  ruleExplanation: string;
  supportingEventIds: string[];
  evidenceStrength: EvidenceStrength;
  generatedAt: string;
  isCharacterVerdict: false;
}

// DevelopmentSignal supporting both MVP signal contracts and existing baseline properties
export interface DevelopmentSignal {
  id?: string;
  studentId?: string;
  signalName?: string;
  indicator?: "growth" | "steady" | "needs_support";
  value?: number;
  description?: string;

  dimension?: DevelopmentDimension;
  state?: SignalState;
  summary?: string;
  ruleId?: string;
  ruleExplanation?: string;
  supportingEventIds?: string[];
  evidenceStrength?: EvidenceStrength;
  generatedAt: string;
  isCharacterVerdict?: false;
}
