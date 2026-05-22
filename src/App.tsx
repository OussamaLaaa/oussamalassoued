import React, { useEffect, useState, Suspense, lazy } from 'react';
import { SiteConfigProvider } from './context/SiteConfigContext';

// Lazy load all pages including Home for better initial load performance
const Home = lazy(() => import('./pages/Home'));
const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Articles = lazy(() => import('./pages/Articles'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const UXUIDesignerTunisia = lazy(() => import('./pages/UXUIDesignerTunisia'));
const AIProductBuilder = lazy(() => import('./pages/AIProductBuilder'));
const DesignEngineer = lazy(() => import('./pages/DesignEngineer'));
const AboutOussama = lazy(() => import('./pages/AboutOussama'));

type AppRoute =
  | { page: 'home' }
  | { page: 'dashboard' }
  | { page: 'opportunities' }
  | { page: 'contact' }
  | { page: 'terms' }
  | { page: 'privacy' }
  | { page: 'ux-ui-designer-tunisia' }
  | { page: 'ai-product-builder' }
  | { page: 'design-engineer' }
  | { page: 'about-oussama' }
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

  if (section === 'opportunities') {
    return { page: 'opportunities' };
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

  if (section === 'terms-of-service') {
    return { page: 'terms' };
  }

  if (section === 'privacy-policy') {
    return { page: 'privacy' };
  }

  if (section === 'ux-ui-designer-tunisia') {
    return { page: 'ux-ui-designer-tunisia' };
  }

  if (section === 'ai-product-builder') {
    return { page: 'ai-product-builder' };
  }

  if (section === 'design-engineer') {
    return { page: 'design-engineer' };
  }

  if (section === 'about-oussama-lassoued') {
    return { page: 'about-oussama' };
  }

  return { page: 'home' };
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#000', minHeight: '100vh' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#888', marginTop: '10px' }}>{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Early route detection for isolated pages (Opportunities)
  // This runs BEFORE any hooks so we can return a fully isolated render
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '');
    const path = window.location.pathname;
    const routeSource = hash && hash !== '/' ? hash : path;
    const firstSeg = routeSource.replace(/^\/+/, '').split('/')[0]?.toLowerCase();
    if (firstSeg === 'opportunities') {
      return (
        <>
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Opportunities />
          </Suspense>
        </>
      );
    }
  }

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
    <ErrorBoundary>
      <SiteConfigProvider>
        {route.page === 'dashboard' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Dashboard />
          </Suspense>
        ) : route.page === 'opportunities' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Opportunities />
          </Suspense>
        ) : route.page === 'contact' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Contact />
          </Suspense>
        ) : route.page === 'articles' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Articles slug={route.slug} />
          </Suspense>
        ) : route.page === 'terms' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <TermsOfService />
          </Suspense>
        ) : route.page === 'privacy' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <PrivacyPolicy />
          </Suspense>
        ) : route.page === 'ux-ui-designer-tunisia' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <UXUIDesignerTunisia />
          </Suspense>
        ) : route.page === 'ai-product-builder' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <AIProductBuilder />
          </Suspense>
        ) : route.page === 'design-engineer' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <DesignEngineer />
          </Suspense>
        ) : route.page === 'about-oussama' ? (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <AboutOussama />
          </Suspense>
        ) : (
          <Suspense fallback={<div style={{ height: '100vh', background: 'var(--bg-color, #000)' }} />}>
            <Home />
          </Suspense>
        )}
      </SiteConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
