import React, { useEffect, useState, Suspense, lazy } from 'react';
import { SiteConfigProvider } from './context/SiteConfigContext';
import Home from './pages/Home';

const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Articles = lazy(() => import('./pages/Articles'));

type AppRoute =
  | { page: 'home' }
  | { page: 'dashboard' }
  | { page: 'contact' }
  | {
      page: 'articles';
      slug?: string;
    };

const getRoute = (): AppRoute => {
  if (typeof window === 'undefined') return { page: 'home' };

  const hash = window.location.hash.replace(/^#/, '');
  const path = window.location.pathname;
  const routeSource = hash && hash !== '/' ? hash : path;
  const routeSegments = routeSource
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean);

  const section = routeSegments[0]?.toLowerCase() ?? 'home';

  if (section === 'dashboard') {
    return { page: 'dashboard' };
  }

  if (section === 'contact') {
    return { page: 'contact' };
  }

  if (section === 'articles') {
    const slug = routeSegments[1] ? decodeURIComponent(routeSegments[1].toLowerCase()) : undefined;
    return {
      page: 'articles',
      slug,
    };
  }

  return { page: 'home' };
};

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRoute());

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getRoute());
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    if (route.page === 'dashboard') {
      document.body.classList.add('dashboard-page');
    } else {
      document.body.classList.remove('dashboard-page');
    }
  }, [route.page]);

  return (
    <SiteConfigProvider>
      {route.page === 'dashboard' ? (
        <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
          <Dashboard />
        </Suspense>
      ) : route.page === 'contact' ? (
        <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
          <Contact />
        </Suspense>
      ) : route.page === 'articles' ? (
        <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
          <Articles slug={route.slug} />
        </Suspense>
      ) : (
        <Home />
      )}
    </SiteConfigProvider>
  );
}

export default App;