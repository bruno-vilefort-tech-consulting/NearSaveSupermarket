import * as React from 'react';
import { Language, getTranslation, TranslationKeys } from '@shared/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

// Create context with default values
const LanguageContext = React.createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Use React.useState directly from the namespace
  const [language, setLanguageState] = React.useState<Language>('pt-BR');

  // Load saved language from localStorage
  React.useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      // If localStorage fails, keep default
      console.warn('Failed to load language from localStorage:', error);
    }
  }, []);

  const setLanguage = React.useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('app-language', newLanguage);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  }, []);

  const t = React.useCallback((key: keyof TranslationKeys): string => {
    try {
      return getTranslation(key, language);
    } catch (error) {
      console.warn('Translation failed for key:', key, error);
      return key as string;
    }
  }, [language]);

  const contextValue = React.useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const useLanguageGlobal = useLanguage;