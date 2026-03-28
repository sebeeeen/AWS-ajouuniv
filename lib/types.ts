import type {
  AppSelfAssessment,
  AppSessionMode,
  AppSessionStatus
} from "@/lib/app-constants";

export type SolveQuestion = {
  id: string;
  code: string;
  orderIndex: number;
  timeLimitSeconds: number;
  typeName: string;
  typeKey: string;
  prompt: string;
  passage: string | null;
  explanation: string;
  fastStrategy: string;
  commonTrap: string;
  takeaway: string;
  choices: {
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
  }[];
};

export type SolveSessionData = {
  id: string;
  title: string;
  mode: AppSessionMode;
  status: AppSessionStatus;
  startedAt: string | null;
  questions: SolveQuestion[];
};

export type SessionAnswerPayload = {
  questionId: string;
  selectedChoiceId?: string;
  selfAssessment?: AppSelfAssessment;
  elapsedSeconds: number;
  memo?: string;
};

export type SessionSubmissionPayload = {
  answers: SessionAnswerPayload[];
};
