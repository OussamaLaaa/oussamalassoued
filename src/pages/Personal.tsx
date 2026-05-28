import React, { useEffect, useState } from 'react';
import PersonalAuthGate from '../components/personal/PersonalAuthGate';
import OpportunitiesLayout from '../components/opportunities/OpportunitiesLayout';
import { useOpportunitiesData } from '../hooks/useOpportunitiesData';

const STORAGE_KEY = 'opportunities-theme';

const PersonalWorkspace: React.FC = () => {
  const opportunitiesData = useOpportunitiesData(true);
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
    <div className="personal-os-root opportunities-shell min-h-screen w-full relative z-[9999] overflow-x-hidden">
      <OpportunitiesLayout theme={theme} setTheme={setTheme} data={opportunitiesData} />
    </div>
  );
};

const PersonalPage: React.FC = () => {
  return (
    <PersonalAuthGate>
      <PersonalWorkspace />
    </PersonalAuthGate>
  );
};

export default PersonalPage;