import { create } from 'zustand';

interface OnboardingState {
  step: 1 | 2 | 3;
  mcqAnswers: {
    q1: string;
    q2: string;
    q3: string;
  };
  allocation: {
    body: number;
    mind: number;
    work: number;
  };
  generatedMissions: any[];
  isGenerating: boolean;

  setStep: (step: 1 | 2 | 3) => void;
  setMcqAnswer: (q: 'q1' | 'q2' | 'q3', answer: string) => void;
  setAllocation: (key: 'body' | 'mind' | 'work', value: number) => void;
  setGeneratedMissions: (missions: any[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  mcqAnswers: { q1: '', q2: '', q3: '' },
  allocation: {
    body: 33,
    mind: 33,
    work: 34,
  },
  generatedMissions: [],
  isGenerating: false,

  setStep: (step) => set({ step }),
  setMcqAnswer: (q, answer) => set((state) => ({ 
    mcqAnswers: { ...state.mcqAnswers, [q]: answer }
  })),
  setAllocation: (key, value) => 
    set((state) => ({
      allocation: { ...state.allocation, [key]: value }
    })),
  setGeneratedMissions: (missions) => set({ generatedMissions: missions }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  reset: () => set({ 
    step: 1, 
    mcqAnswers: { q1: '', q2: '', q3: '' }, 
    allocation: { body: 33, mind: 33, work: 34 }, 
    generatedMissions: [], 
    isGenerating: false 
  }),
}));
