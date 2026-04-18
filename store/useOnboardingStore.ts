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
    set((state) => {
      // Clamp the moved slider to [0, 100]
      const clamped = Math.max(0, Math.min(100, value));
      const remaining = 100 - clamped;

      // The other two keys
      const others = (['body', 'mind', 'work'] as const).filter(k => k !== key);
      const [a, b] = others;

      const currentA = state.allocation[a];
      const currentB = state.allocation[b];
      const currentOtherTotal = currentA + currentB;

      let newA: number;
      let newB: number;

      if (currentOtherTotal === 0) {
        // Edge case: split evenly
        newA = Math.round(remaining / 2);
        newB = remaining - newA;
      } else {
        // Preserve relative ratio between the other two
        newA = Math.round((currentA / currentOtherTotal) * remaining);
        newB = remaining - newA;
      }

      return {
        allocation: {
          ...state.allocation,
          [key]: clamped,
          [a]: newA,
          [b]: newB,
        },
      };
    }),
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
