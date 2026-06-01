import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PersonalLanguage, translations } from './personalTranslations';

interface PersonalLanguageContextType {
  language: PersonalLanguage;
  setLanguage: (lang: PersonalLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const PersonalLanguageContext = createContext<PersonalLanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'personalOS.language';

export const PersonalLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<PersonalLanguage>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: PersonalLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language];
    if (dict && key in dict) {
      return dict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <PersonalLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </PersonalLanguageContext.Provider>
  );
};

export const usePersonalLanguage = (): PersonalLanguageContextType => {
  const context = useContext(PersonalLanguageContext);
  if (!context) {
    throw new Error('usePersonalLanguage must be used within a PersonalLanguageProvider');
  }
  return context;
};
