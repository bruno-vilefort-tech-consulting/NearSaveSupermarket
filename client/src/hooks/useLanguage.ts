import { useLanguageGlobal } from '@/contexts/LanguageContextSimple';
import { getAvailableLanguages } from '@shared/translations';

export function useLanguage() {
  const { language, setLanguage, t } = useLanguageGlobal();
  const availableLanguages = getAvailableLanguages();

  return {
    language,
    setLanguage,
    t,
    availableLanguages,
  };
}