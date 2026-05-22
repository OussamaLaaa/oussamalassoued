import React, { useEffect, useState } from 'react';
import OpportunitiesLayout from '../components/opportunities/OpportunitiesLayout';

const STORAGE_KEY = 'opportunities-theme';

const OpportunitiesPage: React.FC = () => {
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
      document.body.classList.add('opportunities-page');
    } catch {}
    return () => {
      try {
        document.body.classList.remove('opportunities-page');
      } catch {}
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    // update shell class if present
    const shell = document.querySelector('.opportunities-shell');
    if (shell) {
      shell.classList.remove('opportunities-light', 'opportunities-dark');
      shell.classList.add(theme === 'light' ? 'opportunities-light' : 'opportunities-dark');
    }
  }, [theme]);

  return (
    <div className={`opportunities-shell min-h-screen w-full relative z-[9999] overflow-x-hidden ${theme === 'light' ? 'opportunities-light' : 'opportunities-dark'}`}>
      <OpportunitiesLayout theme={theme} setTheme={setTheme} />
    </div>
  );
};

export default OpportunitiesPage;
