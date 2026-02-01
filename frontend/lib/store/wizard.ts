import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WizardState {
    // Step 1: Mode & Style
    mode: 'TEXT' | 'CONTEXT' | null;
    styleId: string | null;
    styleName: string | null;

    // Step 2: Input
    language: string;
    lyrics: string;
    context: string;

    // Step 3: Confirmation
    title: string;

    // Metadata
    currentStep: number;

    // Actions
    setMode: (mode: 'TEXT' | 'CONTEXT') => void;
    setStyle: (styleId: string, styleName: string) => void;
    setLanguage: (language: string) => void;
    setLyrics: (lyrics: string) => void;
    setContext: (context: string) => void;
    setTitle: (title: string) => void;
    setCurrentStep: (step: number) => void;
    resetWizard: () => void;
}

const initialState = {
    mode: null,
    styleId: null,
    styleName: null,
    language: 'en',
    lyrics: '',
    context: '',
    title: '',
    currentStep: 1,
};

export const useWizardStore = create<WizardState>()(
    persist(
        (set) => ({
            ...initialState,

            setMode: (mode) => set({ mode }),
            setStyle: (styleId, styleName) => set({ styleId, styleName }),
            setLanguage: (language) => set({ language }),
            setLyrics: (lyrics) => set({ lyrics }),
            setContext: (context) => set({ context }),
            setTitle: (title) => set({ title }),
            setCurrentStep: (currentStep) => set({ currentStep }),
            resetWizard: () => set(initialState),
        }),
        {
            name: 'music-wizard-storage',
        }
    )
);
