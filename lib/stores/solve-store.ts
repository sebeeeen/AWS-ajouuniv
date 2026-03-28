"use client";

import { create } from "zustand";
import type { AppSelfAssessment, AppSessionMode } from "@/lib/app-constants";

type StoredAnswer = {
  selectedChoiceId?: string;
  selfAssessment?: AppSelfAssessment;
  elapsedSeconds: number;
  memo: string;
};

type SolveStore = {
  sessionId: string | null;
  mode: AppSessionMode | null;
  currentIndex: number;
  autoAdvance: boolean;
  answers: Record<string, StoredAnswer>;
  hydrate: (params: {
    sessionId: string;
    mode: AppSessionMode;
    questionIds: string[];
  }) => void;
  setCurrentIndex: (index: number) => void;
  setAutoAdvance: (value: boolean) => void;
  selectChoice: (questionId: string, choiceId: string) => void;
  setAssessment: (questionId: string, assessment: AppSelfAssessment) => void;
  setElapsedSeconds: (questionId: string, elapsedSeconds: number) => void;
  setMemo: (questionId: string, memo: string) => void;
  reset: () => void;
};

export const useSolveStore = create<SolveStore>((set) => ({
  sessionId: null,
  mode: null,
  currentIndex: 0,
  autoAdvance: true,
  answers: {},
  hydrate: ({ sessionId, mode, questionIds }) =>
    set((state) => {
      if (state.sessionId === sessionId) {
        return state;
      }

      return {
        sessionId,
        mode,
        currentIndex: 0,
        autoAdvance: true,
        answers: questionIds.reduce<Record<string, StoredAnswer>>((accumulator, questionId) => {
          accumulator[questionId] = {
            elapsedSeconds: 0,
            memo: ""
          };
          return accumulator;
        }, {})
      };
    }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setAutoAdvance: (autoAdvance) => set({ autoAdvance }),
  selectChoice: (questionId, selectedChoiceId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          selectedChoiceId
        }
      }
    })),
  setAssessment: (questionId, selfAssessment) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          selfAssessment
        }
      }
    })),
  setElapsedSeconds: (questionId, elapsedSeconds) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          elapsedSeconds: Math.max(state.answers[questionId]?.elapsedSeconds ?? 0, elapsedSeconds)
        }
      }
    })),
  setMemo: (questionId, memo) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          memo
        }
      }
    })),
  reset: () =>
    set({
      sessionId: null,
      mode: null,
      currentIndex: 0,
      autoAdvance: true,
      answers: {}
    })
}));
