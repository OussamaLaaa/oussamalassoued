import React, { useState } from 'react';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useSiteConfig } from '../context/SiteConfigContext';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { PersistentUI } from '../components/PersistentUI';
import CursorAnimationLayer from '../components/CursorAnimationLayer';
import { getButtonClass, getCardClass, getScaledRem } from '../components/designSystem';

export const DesignEngineer: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useSeoMeta({
    title: 'Design Engineer | Oussama Lassoued | Design Systems & Component Libraries',
    description: 'Design Engineer bridging design and development. Expert in design systems, component libraries, and scalable UI solutions. Build faster with design-to-code excellence.',
    canonicalUrl: 'https://www.oussamalassoued.me/design-engineer',
    robots: 'index, follow',
  });

  const faqItems = [
    {
      question: 'What is a Design Engineer?',
      answer:
        'A Design Engineer bridges design and development by creating scalable design systems, component libraries, and documentation that teams use to build products faster and more consistently. Unlike designers or developers alone, Design Engineers understand both sides and optimize for collaboration.',
    },
    {
      question: 'How do design systems accelerate development?',
      answer:
        'Design systems reduce time spent on repetitive design decisions and pixel-pushing. Teams follow established patterns, reusable components, and clear guidelines. Result: faster prototyping, fewer bugs, better consistency, and happier developers and designers working from shared truth.',
    },
    {
      question: 'What technologies do you work with?',
      answer:
        'I specialize in: Figma for design, React/TypeScript for components, Storybook for documentation, design tokens systems, CSS-in-JS solutions, and build tools. I can work with your tech stack—Vue, Angular, Svelte—and create solutions that integrate seamlessly.',
    },
    {
      question: 'Can you improve an existing design system?',
      answer:
        'Absolutely. I audit existing systems, identify gaps and inconsistencies, refactor components for better reusability, improve documentation, optimize token systems, and establish processes for maintaining design system health. Many systems are living, breathing products requiring continuous evolution.',
    },
    {
      question: 'How do you ensure design systems scale?',
      answer:
        'Scalable systems are built on clear principles, atomic components, well-defined tokens, and comprehensive documentation. I design systems with growth in mind—modular structures that accommodate new components, platforms, and teams without breaking existing implementations.',
    },
    {
      question: 'What\'s the typical timeline for building a design system?',
      answer:
        'MVPs typically take 6-12 weeks: audit existing work (2 weeks), define foundations (2 weeks), build components (4-6 weeks), document (1-2 weeks). Ongoing maintenance is part of the model. I recommend starting with a focused MVP and iterating based on adoption.',
    },
  ];

  const services = [
    {
      title: 'Design System Architecture',
      description: 'Build scalable design systems from the ground up, defining tokens, components, and patterns.',
    },
    {
      title: 'Component Library Development',
      description: 'Create production-ready component libraries with full documentation and Storybook integration.',
    },
    {
      title: 'Design System Audit & Improvement',
      description: 'Evaluate existing systems, identify issues, and optimize for developer experience and consistency.',
    },
    {
      title: 'Design Token Systems',
      description: 'Implement token-based design systems that scale across platforms and products.',
    },
    {
      title: 'Figma-to-Code Workflows',
      description: 'Establish seamless workflows that transform Figma designs into production code automatically.',
    },
    {
      title: 'Design System Documentation',
      description: 'Create comprehensive, accessible documentation that teams actually use and maintain.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg-color, #000)', color: 'var(--text-color, #fff)' }}>
      <AdvancedNavbar />
      <PersistentUI />
      <CursorAnimationLayer />

      {/* Hero Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: getScaledRem(48),
            fontWeight: 700,
            marginBottom: getScaledRem(20),
            lineHeight: 1.2,
          }}
        >
          Design Engineer & Systems Builder
        </h1>
        <p
          style={{
            fontSize: getScaledRem(18),
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto',
            opacity: 0.9,
            marginBottom: getScaledRem(30),
          }}
        >
          I bridge design and engineering to create scalable design systems and component libraries that teams love.
          Build faster, more consistently, and with less friction through thoughtfully architected design solutions.
        </p>
        <div style={{ display: 'flex', gap: getScaledRem(16), justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
            Build Your Design System
          </a>
          <a href="/#/ux-ui-designer-tunisia" className={getButtonClass('button-2')} style={{ textDecoration: 'none' }}>
            See UX/UI Services
          </a>
        </div>
      </section>

      {/* What is Design Engineering */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1000px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: getScaledRem(16),
          marginBottom: getScaledRem(40),
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(20) }}>
          What is Design Engineering?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            marginBottom: getScaledRem(16),
            opacity: 0.9,
          }}
        >
          Design Engineering is the discipline of applying engineering rigor to design problems. It's about creating
          scalable, maintainable design solutions that teams can build upon. Design Engineers excel at bridging design
          and development, ensuring consistency, and optimizing for collaboration.
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            marginBottom: getScaledRem(16),
            opacity: 0.9,
          }}
        >
          Rather than one-off designs, I build systems. Design systems provide a shared language for designers and
          developers, reduce duplicated work, improve product consistency, and enable teams to move faster without
          sacrificing quality.
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            opacity: 0.9,
          }}
        >
          Think of design systems as products too. They have users (your design and engineering teams), require
          maintenance, need versioning, and must evolve as your business grows.
        </p>
      </section>

      {/* Services */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Design Engineering Services
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {services.map((service, idx) => (
            <article
              key={idx}
              className={getCardClass('card-1')}
              style={{
                padding: getScaledRem(24),
                borderRadius: getScaledRem(12),
              }}
            >
              <h3 style={{ fontSize: getScaledRem(20), fontWeight: 600, marginBottom: getScaledRem(12) }}>
                {service.title}
              </h3>
              <p style={{ fontSize: getScaledRem(16), lineHeight: 1.6, opacity: 0.85 }}>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Design System Components */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          What's in a Design System
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {[
            {
              title: 'Design Tokens',
              desc: 'Centralized, single source of truth for colors, typography, spacing, and other design decisions.',
            },
            {
              title: 'Component Library',
              desc: 'Reusable, well-documented components (buttons, cards, forms, etc.) that teams build with.',
            },
            {
              title: 'Guidelines & Patterns',
              desc: 'Design principles, usage guidelines, and patterns for solving common problems.',
            },
            {
              title: 'Typography System',
              desc: 'Carefully curated font scales, line heights, and text styles that ensure visual hierarchy.',
            },
            {
              title: 'Color System',
              desc: 'Comprehensive color palettes, semantic naming, and accessibility-first color contrast.',
            },
            {
              title: 'Documentation Site',
              desc: 'Searchable, discoverable documentation that helps teams find and use components correctly.',
            },
          ].map((item, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: getScaledRem(12),
              }}
            >
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {item.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Process */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Design System Implementation Process
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            {
              step: '01',
              title: 'Audit & Assessment',
              desc: 'Evaluate existing design work and code to identify patterns and inconsistencies.',
            },
            {
              step: '02',
              title: 'Define Foundations',
              desc: 'Establish design tokens, typography, color systems, and spacing rules.',
            },
            {
              step: '03',
              title: 'Component Architecture',
              desc: 'Plan component hierarchy, props, and composition patterns.',
            },
            {
              step: '04',
              title: 'Build Components',
              desc: 'Implement components in Figma and code, ensuring parity.',
            },
            {
              step: '05',
              title: 'Documentation',
              desc: 'Create comprehensive guides, usage examples, and governance policies.',
            },
            {
              step: '06',
              title: 'Launch & Support',
              desc: 'Release system, train teams, and establish maintenance processes.',
            },
          ].map((item, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: getScaledRem(12),
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p
                style={{
                  fontSize: getScaledRem(28),
                  fontWeight: 700,
                  opacity: 0.5,
                  marginBottom: getScaledRem(12),
                }}
              >
                {item.step}
              </p>
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {item.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Technical Stack */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: getScaledRem(16),
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30), textAlign: 'center' }}>
          Technical Expertise
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            'Figma Design Systems',
            'React Component Libraries',
            'TypeScript / JavaScript',
            'Storybook',
            'Design Tokens (Style Dictionary)',
            'CSS-in-JS (Styled Components)',
            'Tailwind CSS',
            'Build Tools (Vite, Webpack)',
            'Git & Version Control',
            'Documentation (MDX, Next.js)',
            'Accessibility (WCAG/A11y)',
            'Design System Governance',
          ].map((skill) => (
            <div
              key={skill}
              style={{
                padding: getScaledRem(16),
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: getScaledRem(8),
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p style={{ fontSize: getScaledRem(14), fontWeight: 500 }}>{skill}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'grid', gap: getScaledRem(16) }}>
          {faqItems.map((item, idx) => (
            <article
              key={idx}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: getScaledRem(8),
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: getScaledRem(20),
                  background: 'transparent',
                  color: 'inherit',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: getScaledRem(16),
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{item.question}</span>
                <span style={{ marginLeft: getScaledRem(16), opacity: 0.6, minWidth: '20px' }}>
                  {expandedFaq === idx ? '−' : '+'}
                </span>
              </button>
              {expandedFaq === idx && (
                <div
                  style={{
                    padding: `0 ${getScaledRem(20)} ${getScaledRem(20)} ${getScaledRem(20)}`,
                    background: 'rgba(255, 255, 255, 0.02)',
                    lineHeight: 1.7,
                    opacity: 0.85,
                  }}
                >
                  {item.answer}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30), textAlign: 'center' }}>
          Why Invest in a Design System?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {[
            {
              title: 'Faster Development',
              description: 'Developers build faster using pre-built components instead of building from scratch.',
            },
            {
              title: 'Consistency',
              description: 'Unified design language across all products and touchpoints builds brand recognition.',
            },
            {
              title: 'Quality & Reliability',
              description: 'Well-tested components mean fewer bugs and more predictable behavior.',
            },
            {
              title: 'Scalability',
              description: 'Easy to scale across teams, products, and platforms without losing coherence.',
            },
            {
              title: 'Reduced Maintenance',
              description: 'Single source of truth reduces technical debt and makes updates easier.',
            },
            {
              title: 'Team Productivity',
              description: 'Designers and developers collaborate better with shared understanding and tools.',
            },
          ].map((benefit, idx) => (
            <article key={idx}>
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {benefit.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: getScaledRem(16),
          marginBottom: getScaledRem(60),
        }}
      >
        <h2 style={{ fontSize: getScaledRem(32), fontWeight: 700, marginBottom: getScaledRem(20) }}>
          Ready to Build Your Design System?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.7,
            marginBottom: getScaledRem(30),
            opacity: 0.9,
          }}
        >
          Let's create a scalable, maintainable design system that your team will love to use. Whether starting from
          scratch or improving an existing system, I'll help you build something sustainable.
        </p>
        <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
          Schedule a System Audit
        </a>
      </section>

      {/* Related Pages Navigation */}
      <section
        style={{
          padding: `${getScaledRem(40)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(20) }}>
          Explore More Services
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: getScaledRem(16),
          }}
        >
          <a
            href="/#/ux-ui-designer-tunisia"
            style={{
              padding: getScaledRem(16),
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: getScaledRem(8),
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            UX/UI Design
          </a>
          <a
            href="/#/ai-product-builder"
            style={{
              padding: getScaledRem(16),
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: getScaledRem(8),
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            AI Product Builder
          </a>
          <a
            href="/#/about-oussama-lassoued"
            style={{
              padding: getScaledRem(16),
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: getScaledRem(8),
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            About Oussama
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DesignEngineer;
