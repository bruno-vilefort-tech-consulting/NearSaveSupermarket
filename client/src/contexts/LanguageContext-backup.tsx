// Temporary simple implementation without hooks to test the issue
import { Language, getTranslation, TranslationKeys } from '@shared/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

// Simple global state without React hooks for testing
let currentLanguage: Language = 'pt-BR';

// Load from localStorage on initialization
try {
  const saved = localStorage.getItem('app-language') as Language;
  if (saved && (saved === 'pt-BR' || saved === 'en-US')) {
    currentLanguage = saved;
  }
} catch (e) {
  console.warn('Failed to load language from localStorage');
}

const languageAPI: LanguageContextType = {
  get language() {
    return currentLanguage;
  },
  setLanguage: (newLanguage: Language) => {
    currentLanguage = newLanguage;
    try {
      localStorage.setItem('app-language', newLanguage);
    } catch (e) {
      console.warn('Failed to save language to localStorage');
    }
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('languageChange'));
  },
  t: (key: keyof TranslationKeys): string => {
    try {
      return getTranslation(key, currentLanguage);
    } catch (error) {
      console.warn('Translation failed for key:', key);
      return key as string;
    }
  }
};

// Simple provider that doesn't use React hooks
export function LanguageProvider({ children }: { children: any }) {
  return children;
}

export function useLanguage(): LanguageContextType {
  return languageAPI;
}

export const useLanguageGlobal = useLanguage;