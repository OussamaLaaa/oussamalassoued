import React from 'react';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useSiteConfig } from '../context/SiteConfigContext';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { PersistentUI } from '../components/PersistentUI';
import CursorAnimationLayer from '../components/CursorAnimationLayer';
import { getButtonClass, getCardClass, getScaledRem } from '../components/designSystem';

export const AboutOussama: React.FC = () => {
  const { siteConfig } = useSiteConfig();

  useSeoMeta({
    title: 'About Oussama Lassoued | UX/UI Designer & Design Engineer | Tunisia',
    description: 'Meet Oussama Lassoued, Google UX Design Professional Certified designer and design engineer from Tunisia. Specializing in user-centered design, AI products, and design systems.',
    canonicalUrl: 'https://www.oussamalassoued.me/about-oussama-lassoued',
    robots: 'index, follow',
  });

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
          About Oussama Lassoued
        </h1>
        <p
          style={{
            fontSize: getScaledRem(18),
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto',
            opacity: 0.9,
            marginBottom: getScaledRem(15),
          }}
        >
          UX/UI Designer | AI Product Builder | Design Engineer | Google UX Design Professional Certified
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto',
            opacity: 0.75,
            marginBottom: getScaledRem(30),
            fontStyle: 'italic',
          }}
        >
          "Understanding your user, Designing your success 🚀" — from Tunisia to the world
        </p>
        <div style={{ display: 'flex', gap: getScaledRem(16), justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
            Let's Work Together
          </a>
          <a
            href="/#/ux-ui-designer-tunisia"
            className={getButtonClass('button-2')}
            style={{ textDecoration: 'none' }}
          >
            View My Services
          </a>
        </div>
      </section>

      {/* Who I Am */}
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
          Who I Am
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            marginBottom: getScaledRem(16),
            opacity: 0.9,
          }}
        >
          I'm Oussama Lassoued, a design professional based in Tunisia with a passion for creating user-centered
          experiences that solve real problems. For years, I've been transforming complex challenges into intuitive,
          beautiful digital products that users love.
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            marginBottom: getScaledRem(16),
            opacity: 0.9,
          }}
        >
          My journey in design started with a simple belief: great products come from deep understanding of users. I've
          spent countless hours researching user behavior, testing designs, and iterating based on feedback. This
          user-centered approach is at the core of everything I do.
        </p>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.8,
            opacity: 0.9,
          }}
        >
          Today, I work across three complementary disciplines: UX/UI Design (crafting delightful user experiences),
          AI Product Design (designing for artificial intelligence), and Design Engineering (building scalable design
          systems). This unique blend allows me to deliver comprehensive solutions that work at every level.
        </p>
      </section>

      {/* Expertise Areas */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          What I Specialize In
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: getScaledRem(24),
          }}
        >
          {[
            {
              title: 'UX/UI Design',
              description:
                'User-centered design for web and mobile applications. From research to high-fidelity designs, I create experiences that users understand and love.',
              keywords: 'wireframing, prototyping, usability testing, design systems',
            },
            {
              title: 'AI Product Design',
              description:
                'Designing intuitive experiences for AI-powered products. I help teams build AI that users trust and understand.',
              keywords: 'AI/ML, conversational AI, generative AI, predictive analytics',
            },
            {
              title: 'Design Engineering',
              description:
                'Building scalable design systems and component libraries. I bridge design and development for faster, more consistent products.',
              keywords: 'design systems, component libraries, design tokens, Storybook',
            },
          ].map((specialty, idx) => (
            <article
              key={idx}
              className={getCardClass('card-1')}
              style={{
                padding: getScaledRem(24),
                borderRadius: getScaledRem(12),
              }}
            >
              <h3 style={{ fontSize: getScaledRem(20), fontWeight: 600, marginBottom: getScaledRem(12) }}>
                {specialty.title}
              </h3>
              <p style={{ fontSize: getScaledRem(16), lineHeight: 1.6, marginBottom: getScaledRem(12), opacity: 0.85 }}>
                {specialty.description}
              </p>
              <p style={{ fontSize: getScaledRem(13), opacity: 0.6 }}>
                <strong>Keywords:</strong> {specialty.keywords}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Certifications & Achievements */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Credentials & Recognition
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
              title: 'Google UX Design Professional Certified',
              description:
                'Completed Google UX Design Professional Certificate through Coursera, covering the full design process from research to prototyping.',
              icon: '🎓',
            },
            {
              title: '50+ Successful Projects',
              description:
                'Delivered over 50 design projects spanning web, mobile, and AI products for startups, agencies, and enterprises.',
              icon: '✅',
            },
            {
              title: 'Design Leadership',
              description: 'Led design teams, established design systems, and mentored junior designers throughout my career.',
              icon: '🚀',
            },
            {
              title: 'User Research Expert',
              description: 'Conducted 100+ user interviews and usability testing sessions, translating insights into product improvements.',
              icon: '🔍',
            },
            {
              title: 'AI Innovation',
              description:
                'Pioneered AI product design approaches, helping teams navigate the emerging field of human-AI interaction.',
              icon: '🤖',
            },
            {
              title: 'Continuous Learner',
              description:
                'Deeply committed to staying current with design trends, technologies, and best practices through courses and communities.',
              icon: '📚',
            },
          ].map((credential, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: getScaledRem(12),
              }}
            >
              <p style={{ fontSize: getScaledRem(32), marginBottom: getScaledRem(12) }}>{credential.icon}</p>
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {credential.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{credential.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Design Philosophy */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30), textAlign: 'center' }}>
          My Design Philosophy
        </h2>
        <div
          style={{
            display: 'grid',
            gap: getScaledRem(24),
          }}
        >
          {[
            {
              title: 'User First, Always',
              content:
                'Every design decision should be guided by user needs, not assumptions. I conduct thorough research, test with real users, and iterate based on feedback.',
            },
            {
              title: 'Clarity Over Complexity',
              content:
                'Great design is often invisible—it solves problems quietly and intuitively. I remove friction, simplify processes, and make the complex feel simple.',
            },
            {
              title: 'Beautiful & Functional',
              content:
                'Design should be both aesthetically pleasing and highly functional. Beauty without function is art; function without beauty is engineering. Great design is both.',
            },
            {
              title: 'Inclusive by Design',
              content:
                'Products should work for everyone. I design with accessibility in mind, ensuring inclusive experiences for users of all abilities.',
            },
            {
              title: 'Sustainability & Scalability',
              content:
                'Design systems and processes should be built to last. I focus on creating solutions that scale across teams, products, and time.',
            },
            {
              title: 'Continuous Improvement',
              content:
                'The best product today won't be the best tomorrow. I monitor metrics, gather feedback, and iterate continuously to improve user experience.',
            },
          ].map((philosophy, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: getScaledRem(12),
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {philosophy.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.7, opacity: 0.8 }}>{philosophy.content}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Skills & Tools */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Skills & Tools
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
              category: 'Design Tools',
              skills: 'Figma, Adobe Creative Suite, Framer, Sketch, Miro, Whimsical',
            },
            {
              category: 'UX Research',
              skills: 'User Interviews, Surveys, Usability Testing, Analytics, Heatmaps, Session Recording',
            },
            {
              category: 'Frontend Development',
              skills: 'React, TypeScript, CSS, Tailwind, HTML5, JavaScript',
            },
            {
              category: 'Design Systems',
              skills: 'Storybook, Design Tokens, Component Libraries, Style Dictionary',
            },
            {
              category: 'Collaboration',
              skills: 'Figma Handoff, Design Documentation, Stakeholder Communication, User Testing Moderation',
            },
            {
              category: 'Emerging Tech',
              skills: 'AI/ML Design, ChatGPT Prompting, Generative AI UX, Web3 Design Patterns',
            },
          ].map((skillGroup, idx) => (
            <article
              key={idx}
              style={{
                padding: getScaledRem(24),
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: getScaledRem(12),
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: getScaledRem(16), fontWeight: 600, marginBottom: getScaledRem(12) }}>
                {skillGroup.category}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{skillGroup.skills}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Core Values */}
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
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(30) }}>
          Core Values
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: getScaledRem(20),
          }}
        >
          {[
            { value: 'Excellence', desc: 'Strive for excellence in every project, detail, and interaction.' },
            { value: 'Honesty', desc: 'Be transparent about capabilities, limitations, and recommendations.' },
            { value: 'Collaboration', desc: 'Work closely with teams to achieve shared goals and visions.' },
            { value: 'Innovation', desc: 'Explore new ideas and push boundaries responsibly.' },
            { value: 'Accessibility', desc: 'Design inclusively so everyone can benefit from good design.' },
            { value: 'Lifelong Learning', desc: 'Stay curious and committed to continuous improvement.' },
          ].map((item, idx) => (
            <div key={idx}>
              <h3 style={{ fontSize: getScaledRem(16), fontWeight: 600, marginBottom: getScaledRem(6) }}>
                {item.value}
              </h3>
              <p style={{ fontSize: getScaledRem(13), lineHeight: 1.6, opacity: 0.75 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Work With Me */}
      <section
        style={{
          padding: `${getScaledRem(60)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: getScaledRem(36), fontWeight: 700, marginBottom: getScaledRem(40), textAlign: 'center' }}>
          Why Work With Oussama?
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
              title: 'Proven Track Record',
              desc: 'Delivered 50+ successful projects that increased conversions, engagement, and user satisfaction.',
            },
            {
              title: 'Comprehensive Expertise',
              desc: 'UX/UI Design, AI Product Design, and Design Engineering means I understand the full picture.',
            },
            {
              title: 'User-Centric Approach',
              desc: 'Every decision backed by research, testing, and real user insights.',
            },
            {
              title: 'Strategic Thinking',
              desc: 'I don't just make things pretty—I solve business problems and create competitive advantages.',
            },
            {
              title: 'Collaborative Partnership',
              desc: 'Work with me as a strategic partner, not just a vendor. Your success is my success.',
            },
            {
              title: 'Current & Future-Ready',
              desc: 'Stay ahead with expertise in emerging tech: AI, design systems, and modern web development.',
            },
          ].map((reason, idx) => (
            <article key={idx}>
              <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(8) }}>
                {reason.title}
              </h3>
              <p style={{ fontSize: getScaledRem(14), lineHeight: 1.6, opacity: 0.8 }}>{reason.desc}</p>
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
          Ready to Create Something Great?
        </h2>
        <p
          style={{
            fontSize: getScaledRem(16),
            lineHeight: 1.7,
            marginBottom: getScaledRem(30),
            opacity: 0.9,
          }}
        >
          Whether you need UX/UI design, AI product strategy, or a design system, I'm here to help. Let's explore how I
          can contribute to your success.
        </p>
        <div style={{ display: 'flex', gap: getScaledRem(16), justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#/contact" className={getButtonClass('button-1')} style={{ textDecoration: 'none' }}>
            Start Conversation
          </a>
          <a href="/#/" className={getButtonClass('button-2')} style={{ textDecoration: 'none' }}>
            Back Home
          </a>
        </div>
      </section>

      {/* Related Services */}
      <section
        style={{
          padding: `${getScaledRem(40)} ${getScaledRem(20)}`,
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h3 style={{ fontSize: getScaledRem(18), fontWeight: 600, marginBottom: getScaledRem(20) }}>
          Explore Services
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
            UX/UI Design Services
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
            AI Product Design
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
            Design Engineering
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutOussama;
