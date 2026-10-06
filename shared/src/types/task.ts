import type { DevelopmentDimension } from "./signal";

export interface AcademicTask {
  id: string;
  title: string;
  subject: string;
  description: string;
  createdBy?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export type MissionStatus = "active" | "completed";

export interface Mission {
  id: string;
  taskId: string;
  studentId: string;
  instruction: string;
  dimensions: DevelopmentDimension[];
  status: MissionStatus;
  createdAt: string;
}
