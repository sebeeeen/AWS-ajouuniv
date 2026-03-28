export const SESSION_MODES = [
  "FULL_MOCK",
  "FULL_WRONG",
  "MINI_WRONG",
  "WEAK_TYPE_WRONG"
] as const;

export const SESSION_STATUSES = ["READY", "IN_PROGRESS", "COMPLETED"] as const;

export const SELF_ASSESSMENTS = ["CORRECT", "UNSURE", "WRONG"] as const;

export type AppSessionMode = (typeof SESSION_MODES)[number];
export type AppSessionStatus = (typeof SESSION_STATUSES)[number];
export type AppSelfAssessment = (typeof SELF_ASSESSMENTS)[number];

