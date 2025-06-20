import * as React from 'react';
import { Language, getTranslation, TranslationKeys } from '@shared/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<Language>('pt-BR');

  // Force Portuguese language always
  React.useEffect(() => {
    // Force Portuguese and clear any English cache
    localStorage.setItem('app-language', 'pt-BR');
    localStorage.removeItem('en-US-cache');
    localStorage.removeItem('language-cache');
    setLanguageState('pt-BR');
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('app-language', newLanguage);
  };

  // Translation function
  const t = (key: keyof TranslationKeys): string => {
    return getTranslation(key, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Keep backwards compatibility
export const useLanguageGlobal = useLanguage;