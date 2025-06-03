import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation, TranslationKeys } from '@shared/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'pt-BR',
  setLanguage: () => {},
  t: (key: keyof TranslationKeys) => key as string,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt-BR');

  // Load language from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load language from localStorage:', error);
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      localStorage.setItem('app-language', newLanguage);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
      setLanguageState(newLanguage);
    }
  };

  // Translation function
  const t = (key: keyof TranslationKeys): string => {
    try {
      return getTranslation(key, language);
    } catch (error) {
      console.warn('Translation error:', error);
      return key as string;
    }
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
};

export function useLanguageGlobal(): LanguageContextType {
  return useContext(LanguageContext);
}