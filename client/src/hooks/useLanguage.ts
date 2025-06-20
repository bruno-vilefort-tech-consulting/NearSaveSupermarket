// import { useLanguageGlobal } from '@/contexts/LanguageContext';
import { getAvailableLanguages } from '@shared/translations';

export function useLanguage() {
  // Temporary fallback while fixing React import issue
  const language = 'pt-BR';
  const setLanguage = () => {};
  const t = (key: string) => key;
  const availableLanguages = getAvailableLanguages();

  return {
    language,
    setLanguage,
    t,
    availableLanguages,
  };
}