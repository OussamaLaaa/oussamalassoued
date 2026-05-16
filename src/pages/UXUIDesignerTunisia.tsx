import React, { useState } from 'react';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useSiteConfig } from '../context/SiteConfigContext';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { PersistentUI } from '../components/PersistentUI';
import CursorAnimationLayer from '../components/CursorAnimationLayer';
import { getButtonClass, getCardClass, getScaledRem } from '../components/designSystem';

export const UXUIDesignerTunisia: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useSeoMeta({
    title: 'Best UX/UI Designer in Tunisia | Oussama Lassoued | User-Centered Design',
    description: 'Expert UX/UI designer in Tunisia specializing in user-centered design & AI product design. Google UX Design Professional Certified. Transform your digital experience today.',
    canonicalUrl: 'https://www.oussamalassoued.me/ux-ui-designer-tunisia',
    robots: 'index, follow',
  });

  const faqItems = [
    {
      question: 'What is UX/UI design and how does it benefit my business?',
      answer:
        'UX (User Experience) design focuses on how users interact with your product, while UI (User Interface) design handles the visual and interactive elements. Together, they create intuitive, engaging products that increase user satisfaction, retention, and conversions. A well-designed user experience can reduce bounce rates by up to 40% and significantly improve customer loyalty.',
    },
    {
      question: 'How long does a typical UX/UI design project take?',
      answer:
        'Project timelines vary based on scope and complexity. A typical UX/UI design engagement includes research (2-3 weeks), wireframing (1-2 weeks), design (2-4 weeks), and testing (1-2 weeks). I work with you to establish clear milestones and deliver iterative results for continuous feedback.',
    },
    {
      question: 'Do you work with startups, agencies, and enterprises?',
      answer:
        'Yes, I work with organizations of all sizes—from ambitious startups to established enterprises. Each project receives customized attention focused on understanding your users, business goals, and technical constraints to deliver solutions that truly resonate.',
    },
    {
      question: 'What is your design process?',
      answer:
        'My process combines research, strategy, and craft: (1) Discovery—understanding your users and business context, (2) Research—user interviews, competitive analysis, (3) Ideation—exploring solutions, (4) Prototyping—creating interactive mockups, (5) Testing—validating designs with real users, (6) Refinement—iterating based on feedback.',
    },
    {
      question: 'Can you help with both web and mobile design?',
      answer:
        'Absolutely. I design across platforms—responsive web applications, iOS, Android, and progressive web apps. Each platform has unique considerations, and I ensure consistent, delightful experiences across all touchpoints.',
    },
  ];

  const services = [
    {
      title: 'User Research & Strategy',
      description: 'Deep user interviews, competitive analysis, and strategic insights to inform design decisions.',
    },
    {
      title: 'UX/UI Design',
      description: 'Wireframes, prototypes, and high-fidelity designs optimized for conversions and user satisfaction.',
    },
    {
      title: 'Design Systems',
      description: 'Scalable design systems and component libraries for consistency and team productivity.',
    },
    {
      title: 'Interaction Design',
      description: 'Micro-interactions, animations, and transitions that enhance usability and delight.',
    },
    {
      title: 'Usability Testing',
      description: 'Validate designs with real users to identify issues and optimize for success.',
    },
    {
      title: 'AI/Product Design',
      description: 'Design experiences that integrate AI and machine learning thoughtfully.',
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
          Best UX/UI Designer in Tunisia
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
          I'm <strong>Oussama Lassoued</strong>, a Google UX Design Professional Certified designer specializing in
          user-centered design and AI product experiences. I transform complex problems into intuitive, beautiful digital
          solutions that engage users and drive business results.
        </p>
        <div style={{ display: 'flex', gap: getScaledRem(16), justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
            Start Your Project
          </a>
          <a href="/#/about-oussama-lassoued" className={getButtonClass('button-2')} style={{ textDecoration: 'none' }}>
            Learn About Me
          </a>
        </div>
      </section>

      {/* Expertise Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Expert UX/UI Design Services
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

      {/* Why Choose Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: getScaledRem(16),
          marginBottom: getScaledRem(40),
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30) }}>
          Why Choose Oussama for UX/UI Design?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            {
              title: 'User-Centered Approach',
              description: 'Every design decision is backed by real user research and data insights.',
            },
            {
              title: 'Google Certified',
              description: 'Completed Google UX Design Professional Certificate with proven expertise.',
            },
            {
              title: 'Proven Results',
              description: 'Delivered 50+ successful projects that increased conversions and user engagement.',
            },
            {
              title: 'Collaborative Process',
              description: 'Work closely with your team, ensuring alignment and ownership throughout.',
            },
            {
              title: 'Technical Knowledge',
              description: 'Understand development constraints and deliver designs that are feasible and scalable.',
            },
            {
              title: 'Innovation Focus',
              description: 'Explore cutting-edge design trends and AI integration for competitive advantage.',
            },
          ].map((point, idx) => (
            <div key={idx}>
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {point.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          My Design Process
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {[
            { step: '01', title: 'Discovery', desc: 'Understand your users, goals, and constraints through interviews and analysis.' },
            { step: '02', title: 'Research', desc: 'Competitive analysis, user interviews, and journey mapping.' },
            { step: '03', title: 'Ideation', desc: 'Brainstorm solutions and explore multiple design directions.' },
            { step: '04', title: 'Design', desc: 'Create wireframes, prototypes, and high-fidelity designs.' },
            { step: '05', title: 'Testing', desc: 'Validate designs with real users and gather actionable feedback.' },
            { step: '06', title: 'Iteration', desc: 'Refine based on testing and prepare for development.' },
          ].map((item, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: getScaledRem(12),
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
              <h3 style={{ fontSize: getScaledRem(20), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {item.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Skills & Expertise */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30), textAlign: 'center' }}>
          Technical & Design Skills
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {[
            'Figma & Design Tools',
            'User Research',
            'Wireframing',
            'Prototyping',
            'Interaction Design',
            'Design Systems',
            'Usability Testing',
            'Information Architecture',
            'Mobile Design',
            'Web Design',
            'AI/Product Design',
            'Accessibility (WCAG)',
          ].map((skill) => (
            <div
              key={skill}
              style={{
                padding: getScaledRem(16),
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: getScaledRem(8),
                textAlign: 'center',
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

      {/* Specializations */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30), textAlign: 'center' }}>
          Specialized in Multiple Domains
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.7,
            maxWidth: '800px',
            margin: `0 auto ${getScaledRem(30)} auto`,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          Beyond traditional UX/UI design, I bring specialized expertise in:
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            {
              title: 'AI Product Design',
              desc: 'Design intuitive experiences for AI-powered products that users trust and understand.',
            },
            {
              title: 'Design Engineering',
              desc: 'Bridge design and development with component libraries and design systems.',
            },
            {
              title: 'Design Leadership',
              desc: 'Lead design strategy and mentor teams for consistent, scalable design practices.',
            },
          ].map((spec, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: getScaledRem(12),
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(12) }}>
                {spec.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{spec.desc}</p>
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
          Ready to Transform Your Digital Experience?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.7,
            marginBottom: getScaledRem(30),
            opacity: 0.9,
          }}
        >
          Let's discuss your project and explore how expert UX/UI design can solve your challenges and create meaningful
          user experiences.
        </p>
        <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
          Schedule a Consultation
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
          Explore More
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: getScaledRem(16),
          }}
        >
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
            href="/#/design-engineer"
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
            Design Engineer
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

export default UXUIDesignerTunisia;
