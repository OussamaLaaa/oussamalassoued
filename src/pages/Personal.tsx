import React, { useEffect, useState } from 'react';
import PersonalAuthGate from '../components/personal/PersonalAuthGate';
import OpportunitiesLayout from '../components/opportunities/OpportunitiesLayout';
import { useOpportunitiesData } from '../hooks/useOpportunitiesData';
import { PersonalLanguageProvider, usePersonalLanguage } from '../i18n/usePersonalLanguage';

const STORAGE_KEY = 'opportunities-theme';

const PersonalWorkspaceInner: React.FC = () => {
  const opportunitiesData = useOpportunitiesData(true);
  const { language } = usePersonalLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'dark') return 'dark';
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      document.body.classList.add('opportunities-page');
    } catch {
      // ignore
    }

    return () => {
      try {
        document.body.classList.remove('opportunities-page');
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div className="personal-os-root opportunities-shell min-h-screen w-full relative z-[9999] overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <OpportunitiesLayout theme={theme} setTheme={setTheme} data={opportunitiesData} />
    </div>
  );
};

const PersonalPage: React.FC<{ lang?: 'en' | 'ar' }> = ({ lang = 'en' }) => {
  return (
    <PersonalLanguageProvider initialLanguage={lang}>
      <PersonalAuthGate>
        <PersonalWorkspaceInner />
      </PersonalAuthGate>
    </PersonalLanguageProvider>
  );
};

export default PersonalPage;