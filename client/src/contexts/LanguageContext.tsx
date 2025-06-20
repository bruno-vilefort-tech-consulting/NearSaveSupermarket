// Contexto de idioma ultra-simples para resolver problemas de importação
import * as React from 'react';
import { Language, getTranslation, TranslationKeys } from '@shared/translations';

// Definições de tipos
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

// Contexto simples
const LanguageContext = React.createContext<LanguageContextType>({
  language: 'pt-BR',
  setLanguage: () => { },
  t: (key) => key as string,
});

// Propriedades do provider
interface LanguageProviderProps {
  children: React.ReactNode;
}

// Provider ultra-simples
export function LanguageProvider({ children }: LanguageProviderProps) {
  const value: LanguageContextType = {
    language: 'pt-BR',
    setLanguage: (newLanguage: Language) => {
      localStorage.setItem('app-language', newLanguage);
      console.log('🔧 Idioma definido para:', newLanguage);
    },
    t: (key: keyof TranslationKeys): string => {
      return getTranslation(key, 'pt-BR');
    },
  };

  return React.createElement(
    LanguageContext.Provider,
    { value },
    children
  );
}

// Hook de uso
export function useLanguage(): LanguageContextType {
  return React.useContext(LanguageContext);
}

// Compatibilidade
export const useLanguageGlobal = useLanguage; 