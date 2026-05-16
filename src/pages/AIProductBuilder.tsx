import React, { useState } from 'react';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useSiteConfig } from '../context/SiteConfigContext';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { PersistentUI } from '../components/PersistentUI';
import CursorAnimationLayer from '../components/CursorAnimationLayer';
import { getButtonClass, getCardClass, getScaledRem } from '../components/designSystem';

export const AIProductBuilder: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useSeoMeta({
    title: 'AI Product Builder & Designer | Oussama Lassoued | AI UX/UI Expert',
    description: 'AI Product Builder specializing in designing intuitive AI/ML-powered products. Build user-centered AI experiences that users trust. Explore design for artificial intelligence.',
    canonicalUrl: 'https://www.oussamalassoued.me/ai-product-builder',
    robots: 'index, follow',
  });

  const faqItems = [
    {
      question: 'What makes AI product design different from traditional UI/UX design?',
      answer:
        'AI product design requires special consideration for: (1) Explainability—helping users understand why AI made certain decisions, (2) Trust—building confidence in AI recommendations, (3) Error handling—graceful degradation when AI is uncertain, (4) Feedback loops—allowing users to correct and improve AI, (5) Progressive disclosure—avoiding overwhelming users with AI complexity.',
    },
    {
      question: 'How do you ensure AI products are user-friendly?',
      answer:
        'I combine rigorous user research with iterative testing. We interview potential users, map their mental models, prototype AI interactions, and test with real users. Key principles include: clear affordances, visible confidence levels, simple ways to provide feedback, and transparent documentation of limitations.',
    },
    {
      question: 'Can you design for machine learning models?',
      answer:
        'Yes. I understand ML concepts and can design interfaces that effectively present model outputs, gather training data, and help users understand model behavior. This includes designing feedback mechanisms, data labeling interfaces, and model performance visualizations.',
    },
    {
      question: 'What AI technologies have you worked with?',
      answer:
        'I have experience designing for: Natural Language Processing (NLP), Computer Vision, Recommendation Systems, Predictive Analytics, Large Language Models, and Generative AI. My focus is designing human-AI interactions that maximize value while minimizing friction.',
    },
    {
      question: 'How do you handle AI uncertainty in product design?',
      answer:
        'Transparency is key. I design confidence indicators, alternative suggestions, and clear explanations of uncertainty. Rather than hiding AI complexity, I surface relevant information in digestible, actionable ways that empower users to make informed decisions.',
    },
    {
      question: 'What is the timeline for designing an AI product?',
      answer:
        'AI product design requires extra research and validation phases. Typical timeline: Discovery (2-3 weeks), AI capability analysis (1-2 weeks), interaction design (2-3 weeks), prototype & testing (2-3 weeks), iteration (1-2 weeks). Timelines scale with product complexity.',
    },
  ];

  const designPrinciples = [
    {
      title: 'Explainability First',
      description: 'Users must understand why AI made a decision. Design clear explanations and confidence indicators.',
    },
    {
      title: 'Trust Through Transparency',
      description: 'Be honest about AI limitations, failure modes, and data usage. Transparency builds user confidence.',
    },
    {
      title: 'Human in the Loop',
      description: 'Allow users to override, correct, and improve AI decisions. Collaboration, not replacement.',
    },
    {
      title: 'Progressive Complexity',
      description: 'Start simple, reveal advanced options gradually. Avoid overwhelming users with AI complexity.',
    },
    {
      title: 'Feedback Mechanisms',
      description: 'Collect user feedback to improve AI models and continuously refine user experience.',
    },
    {
      title: 'Ethical Considerations',
      description: 'Design for fairness, privacy, and responsible AI use. Avoid bias and unintended consequences.',
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
          AI Product Builder & Designer
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
          I design human-centered experiences for AI-powered products. From natural language interfaces to predictive
          analytics, I help you build AI products that users trust, understand, and love.
        </p>
        <div style={{ display: 'flex', gap: getScaledRem(16), justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
            Start Your AI Product
          </a>
          <a href="/#/ux-ui-designer-tunisia" className={getButtonClass('button-2')} style={{ textDecoration: 'none' }}>
            Back to UX/UI Design
          </a>
        </div>
      </section>

      {/* What is AI Product Design */}
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
          What is AI Product Design?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            marginBottom: getScaledRem(16),
            opacity: 0.9,
          }}
        >
          AI product design is the discipline of creating intuitive, trustworthy experiences around artificial
          intelligence. It bridges the gap between powerful AI/ML capabilities and human users who need to understand,
          trust, and effectively use those capabilities.
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            opacity: 0.9,
          }}
        >
          Unlike traditional software design, AI product design must address unique challenges: explaining complex
          decisions, handling uncertainty gracefully, enabling user feedback loops, and building trust in automated
          systems. The goal is to augment human capability, not replace human judgment.
        </p>
      </section>

      {/* Design Principles */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          AI Design Principles
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {designPrinciples.map((principle, idx) => (
            <article
              key={idx}
              className={getCardClass('card-1')}
              style={{
                padding: getScaledRem(24),
                borderRadius: getScaledRem(12),
              }}
            >
              <h3 style={{ fontSize: getScaledRem(20), fontWeight: 600, marginBottom: getScaledRem(12) }}>
                {principle.title}
              </h3>
              <p style={{ fontSize: getScaledRem(16), lineHeight: 1.6, opacity: 0.85 }}>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* AI Design Domains */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          AI Application Domains I Design For
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
              title: 'Conversational AI / Chatbots',
              description: 'Design natural, helpful dialogue flows that guide users and manage expectations.',
              examples: 'Customer support bots, virtual assistants, knowledge assistants',
            },
            {
              title: 'Generative AI Interfaces',
              description: 'Create intuitive prompting systems and explore result presentation strategies.',
              examples: 'Content generation, code assistants, creative tools',
            },
            {
              title: 'Predictive Analytics',
              description: 'Visualize model outputs, confidence levels, and actionable insights clearly.',
              examples: 'Forecasting dashboards, recommendation systems, pattern detection',
            },
            {
              title: 'Computer Vision',
              description: 'Design interfaces for image recognition, object detection, and visual analysis.',
              examples: 'Medical imaging, quality control, autonomous systems interfaces',
            },
            {
              title: 'Recommendation Systems',
              description: 'Balance personalization with transparency and user control over recommendations.',
              examples: 'Content discovery, product recommendations, personalized experiences',
            },
            {
              title: 'Decision Support Systems',
              description: 'Empower users to make informed decisions with AI-assisted insights.',
              examples: 'Clinical decision support, financial advisory, business intelligence',
            },
          ].map((domain, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: getScaledRem(12),
              }}
            >
              <h3 style={{ fontSize: getScaledRem(20), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {domain.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, marginBottom: getScaledRem(10), opacity: 0.85 }}>
                {domain.description}
              </p>
              <p style={{ fontSize: getScaledRem(13), opacity: 0.6, fontStyle: 'italic' }}>
                <strong>Examples:</strong> {domain.examples}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Design Process */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          AI Product Design Process
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
              title: 'AI Capability Audit',
              desc: 'Understand your AI/ML models, their capabilities, limitations, and performance metrics.',
            },
            {
              step: '02',
              title: 'User Research',
              desc: 'Interview users to understand their mental models and needs around AI assistance.',
            },
            {
              step: '03',
              title: 'Interaction Design',
              desc: 'Design how users interact with AI—prompting, interpreting results, providing feedback.',
            },
            {
              step: '04',
              title: 'Prototype & Test',
              desc: 'Create interactive prototypes and validate with real users and domain experts.',
            },
            {
              step: '05',
              title: 'Iterate & Refine',
              desc: 'Gather feedback, identify friction points, and optimize the AI-human interaction.',
            },
            {
              step: '06',
              title: 'Launch & Monitor',
              desc: 'Release and track user behavior to continuously improve the AI product experience.',
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

      {/* Technical Skills */}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            'AI/ML Fundamentals',
            'NLP Interface Design',
            'Computer Vision UX',
            'ML Model Explainability',
            'Prompt Engineering UX',
            'Uncertainty Visualization',
            'User Feedback Systems',
            'Performance Metrics Design',
            'A/B Testing for AI',
            'Data Visualization',
            'Ethical AI Design',
            'Human-in-the-Loop Design',
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
          Ready to Build Better AI Products?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.7,
            marginBottom: getScaledRem(30),
            opacity: 0.9,
          }}
        >
          Let's transform your AI capabilities into experiences users love. I'll help you design interfaces that make
          AI accessible, trustworthy, and valuable.
        </p>
        <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
          Schedule a Strategy Session
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

export default AIProductBuilder;
