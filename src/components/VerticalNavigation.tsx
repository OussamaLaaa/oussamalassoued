  import React, { useEffect, useState, useRef } from 'react';
  import { gsap } from 'gsap';
  import { useSiteConfig } from '../context/SiteConfigContext';
  import { HomeIcon, UserIcon, BriefcaseIcon, MessageSquareIcon, FileTextIcon } from './icons';

interface VerticalNavigationProps {
  isLightMode?: boolean;
}

const PENDING_NAV_SECTION_KEY = 'portfolio.pending-nav-section.v1';

export const VerticalNavigation: React.FC<VerticalNavigationProps> = ({ isLightMode = false }) => {
  const { siteConfig } = useSiteConfig();
  const { persistentUI } = siteConfig;
  const { visibility } = siteConfig;

  const [activeSection, setActiveSection] = useState<string>('home');
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const indicatorRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'about', label: 'About', icon: UserIcon },
    { id: 'projects', label: 'Projects', icon: BriefcaseIcon },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareIcon },
    { id: 'articles', label: 'Articles', icon: FileTextIcon },
  ];

  // Detect current section
  useEffect(() => {
    const detectSection = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const path = window.location.pathname;
      const source = hash && hash !== '/' ? hash : path;

      const section = source
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean)[0]
        ?.toLowerCase() || 'home';

      setActiveSection(section);
    };

    // Listen for navigation events
    const handleNavToSection = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string }>;
      if (customEvent.detail?.section) {
        setActiveSection(customEvent.detail.section);
      }
    };

    const handleNavActiveSection = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string }>;
      if (customEvent.detail?.section) {
        setActiveSection(customEvent.detail.section);
      }
    };

    detectSection();
    window.addEventListener('hashchange', detectSection);
    window.addEventListener('popstate', detectSection);
    window.addEventListener('nav-to-section', handleNavToSection);
    window.addEventListener('nav-active-section', handleNavActiveSection);

    return () => {
      window.removeEventListener('hashchange', detectSection);
      window.removeEventListener('popstate', detectSection);
      window.removeEventListener('nav-to-section', handleNavToSection);
      window.removeEventListener('nav-active-section', handleNavActiveSection);
    };
  }, []);

  // Update indicator position with smooth animation
  useEffect(() => {
    if (!indicatorRef.current || !navItemsRef.current) return;

    const updateIndicator = () => {
      const activeItem = navItemsRef.current?.querySelector(`[data-section="${activeSection}"]`) as HTMLElement;
      if (!activeItem || !navItemsRef.current) return;

      const navRect = navItemsRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      gsap.to(indicatorRef.current, {
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        duration: 0.5,
        ease: 'power2.inOut',
      });
    };

    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSection]);

  // Initial animation
  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { 
        opacity: 0, 
        x: 50,
        scale: 0.9
      },
      { 
        opacity: 1, 
        x: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3
      }
    );
  }, []);

  const isStandaloneRoute = () => {
    return activeSection === 'articles' || activeSection === 'dashboard';
  };

  const handleNav = (e: React.MouseEvent<HTMLButtonElement>, section: string) => {
    e.preventDefault();

    // Update active section immediately for visual feedback
    setActiveSection(section);

    if (section === 'articles') {
      window.location.hash = '/articles';
      return;
    }

    if (isStandaloneRoute()) {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage?.setItem(PENDING_NAV_SECTION_KEY, section);
        } catch {
          console.warn('Unable to set session storage');
        }
      }

      window.location.hash = '/';
      const dispatchNavigation = () => {
        window.dispatchEvent(new CustomEvent('nav-to-section', { detail: { section } }));
      };

      window.setTimeout(dispatchNavigation, 140);
      window.setTimeout(dispatchNavigation, 420);
      return;
    }

    window.dispatchEvent(new CustomEvent('nav-to-section', { detail: { section } }));
  };

  if (!visibility.persistentUI) return null;

  return (
    <>
      <style>
        {`
          @keyframes nav-item-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          @keyframes indicator-glow {
            0%, 100% { 
              box-shadow: 0 0 8px rgba(182, 244, 91, 0.3),
                          0 0 16px rgba(182, 244, 91, 0.2);
            }
            50% { 
              box-shadow: 0 0 12px rgba(182, 244, 91, 0.5),
                          0 0 24px rgba(182, 244, 91, 0.3);
            }
          }

          @keyframes container-float {
            0%, 100% { transform: translateY(-50%) translateX(0); }
            50% { transform: translateY(-50%) translateX(-2px); }
          }

          .vertical-nav-item {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .vertical-nav-item:hover {
            transform: translateX(-4px) scale(1.05);
          }

          .vertical-nav-item.active {
            animation: nav-item-pulse 0.4s ease-out;
          }

          .vertical-nav-indicator {
            animation: indicator-glow 2s ease-in-out infinite;
          }

          .vertical-nav-container {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .vertical-nav-container:hover {
            transform: translateY(-50%) translateX(-4px);
          }

          .vertical-nav-tooltip {
            opacity: 0;
            transform: translateX(8px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
          }

          .vertical-nav-item:hover .vertical-nav-tooltip {
            opacity: 1;
            transform: translateX(0);
          }

          @media (max-width: 768px) {
            .vertical-nav-container {
              display: none;
            }
          }
        `}
      </style>

      {/* Vertical Navigation Sidebar */}
      <div
        ref={containerRef}
        className={`vertical-nav-container fixed right-8 top-1/2 -translate-y-1/2 z-[240] ${
          isLightMode
            ? 'bg-white/20 border-gray-200/30'
            : 'bg-black/10 border-white/5'
        } backdrop-blur-[40px] rounded-2xl border shadow-2xl`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative py-4 px-2" ref={navItemsRef}>
          {/* Active Indicator */}
          <div
            ref={indicatorRef}
            className={`vertical-nav-indicator absolute left-0 w-1 rounded-full ${
              isLightMode ? 'bg-black' : 'bg-[#b6f45b]'
            }`}
            style={{
              top: 0,
              height: 0,
              transition: 'top 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Navigation Items */}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  data-section={item.id}
                  onClick={(e) => handleNav(e, item.id)}
                  className={`vertical-nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive
                      ? isLightMode
                        ? 'bg-gray-100 text-black'
                        : 'bg-white/10 text-white'
                      : isLightMode
                        ? 'text-gray-600 hover:bg-gray-50'
                        : 'text-gray-400 hover:bg-white/5'
                  }`}
                  aria-label={item.label}
                >
                  {/* Icon */}
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  />

                  {/* Tooltip */}
                  <span
                    className={`vertical-nav-tooltip absolute right-full mr-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                      isLightMode
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-black'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};