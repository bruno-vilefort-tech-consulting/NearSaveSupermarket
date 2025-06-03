import { useState, useEffect } from 'react';
import { Language, getTranslation, TranslationKeys, getAvailableLanguages } from '@shared/translations';

export function useLanguage() {
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

  const availableLanguages = getAvailableLanguages();

  return {
    language,
    setLanguage,
    t,
    availableLanguages,
  };
}