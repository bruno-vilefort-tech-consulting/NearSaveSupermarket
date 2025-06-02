import { useState, useEffect } from 'react';
import { Language, TranslationKeys, getTranslation, getAvailableLanguages } from '@shared/translations';

export function useLanguage() {
  // Default to Brazilian Portuguese
  const [language, setLanguageState] = useState<Language>('pt-BR');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
  };

  // Translation function
  const t = (key: keyof TranslationKeys): string => {
    return getTranslation(key, language);
  };

  const availableLanguages = getAvailableLanguages();

  return {
    language,
    setLanguage,
    t,
    availableLanguages,
  };
}