export type ProfileRole = "student" | "teacher";

export interface Profile {
  id: string;
  name: string;
  email?: string | null;
  role: ProfileRole;
  classId?: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string | null;
  role?: "student";
  gradeLevel?: string | null;
  classId?: string | null;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string | null;
  role?: "teacher";
  createdAt: string;
}
