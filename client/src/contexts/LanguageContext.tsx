import { Language, getTranslation, TranslationKeys } from '@shared/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

// Simple implementation without React context to avoid hook issues
const languageState: { current: Language } = { current: 'pt-BR' };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useLanguageGlobal(): LanguageContextType {
  return {
    language: 'pt-BR',
    setLanguage: (newLanguage: Language) => {
      languageState.current = newLanguage;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app-language', newLanguage);
      }
    },
    t: (key: keyof TranslationKeys): string => {
      return getTranslation(key, languageState.current);
    },
  };
}