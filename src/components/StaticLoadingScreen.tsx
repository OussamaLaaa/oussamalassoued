import React, { useEffect, useRef } from 'react';

interface StaticLoadingScreenProps {
  progress: number;
  isComplete: boolean;
  onFadeComplete: () => void;
}

export const StaticLoadingScreen: React.FC<StaticLoadingScreenProps> = ({
  onFadeComplete,
}) => {
  const onFadeCompleteRef = useRef(onFadeComplete);

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
  }, [onFadeComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFadeCompleteRef.current();
    }, 4200);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#080808' }}>
      <iframe
        src="/static-preloader.html"
        title="Static preloader"
        style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#080808' }}
        loading="eager"
      />
    </div>
  );
};
