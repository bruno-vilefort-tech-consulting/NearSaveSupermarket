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
  // Usando uma constante fixa para evitar problemas com hooks
  const language: Language = 'pt-BR';

  const setLanguage = React.useCallback((newLanguage: Language) => {
    // Apenas salva no localStorage sem estado React
    localStorage.setItem('app-language', newLanguage);
    console.log('🔧 Idioma definido para:', newLanguage);
  }, []);

  // Função de tradução
  const t = React.useCallback((key: keyof TranslationKeys): string => {
    return getTranslation(key, language);
  }, [language]);

  const value = React.useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

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

export const useLanguageGlobal = useLanguage; 