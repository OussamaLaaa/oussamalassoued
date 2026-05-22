import type { MessageTemplate } from '../types/opportunities';

export type TemplateAudience =
  | 'founder'
  | 'recruiter'
  | 'product_manager'
  | 'senior_designer'
  | 'marketing_lead'
  | 'agency_partner';

export type TemplateGoal =
  | 'portfolio_feedback'
  | 'internship_inquiry'
  | 'junior_role_inquiry'
  | 'ux_audit_offer'
  | 'follow_up_1'
  | 'follow_up_2';

export type TemplateLanguage = 'english' | 'french' | 'arabic';

export const messageTemplates: MessageTemplate[] = [
  {
    id: 'founder-ux-audit-en',
    name: 'Founder / UX audit offer / English',
    audience: 'founder',
    goal: 'ux_audit_offer',
    language: 'english',
    subject: 'Quick UX audit idea for {{companyName}}',
    body: `Hi {{personName}},

I took a quick look at {{companyName}} and noticed an opportunity around {{observation}}.

I’m {{myName}}, and I help teams improve product clarity and conversion with focused UX audits. If useful, I can share a short breakdown of quick wins for {{companyName}}.

Best,
{{myName}}`,
  },
  {
    id: 'founder-ux-audit-fr',
    name: 'Founder / UX audit offer / French',
    audience: 'founder',
    goal: 'ux_audit_offer',
    language: 'french',
    subject: 'Idée rapide d’audit UX pour {{companyName}}',
    body: `Bonjour {{personName}},

J’ai regardé rapidement {{companyName}} et j’ai remarqué une opportunité autour de {{observation}}.

Je suis {{myName}} et j’aide les équipes à améliorer la clarté du produit et la conversion grâce à des audits UX ciblés. Si cela vous intéresse, je peux partager un aperçu rapide des gains possibles pour {{companyName}}.

Bien à vous,
{{myName}}`,
  },
  {
    id: 'founder-ux-audit-ar',
    name: 'Founder / UX audit offer / Arabic',
    audience: 'founder',
    goal: 'ux_audit_offer',
    language: 'arabic',
    subject: 'فكرة سريعة لتدقيق تجربة المستخدم لـ {{companyName}}',
    body: `مرحباً {{personName}}،

اطلعت بسرعة على {{companyName}} ولاحظت فرصة مرتبطة بـ {{observation}}.

أنا {{myName}} وأساعد الفرق على تحسين وضوح المنتج ورفع التحويل من خلال تدقيقات UX مركزة. إذا كان مناسباً، يمكنني مشاركة ملاحظات سريعة حول أفضل التحسينات الممكنة لـ {{companyName}}.

تحياتي،
{{myName}}`,
  },
  {
    id: 'recruiter-internship-en',
    name: 'Recruiter / internship inquiry / English',
    audience: 'recruiter',
    goal: 'internship_inquiry',
    language: 'english',
    subject: 'Internship interest at {{companyName}}',
    body: `Hi {{personName}},

I’m reaching out because I’m interested in internship opportunities at {{companyName}}.

My background is in {{observation}}, and I’d love to contribute while learning from your team. If you’re open to it, I’d be grateful to share a short intro and portfolio.

Best,
{{myName}}`,
  },
  {
    id: 'recruiter-internship-fr',
    name: 'Recruiter / internship inquiry / French',
    audience: 'recruiter',
    goal: 'internship_inquiry',
    language: 'french',
    subject: 'Demande de stage chez {{companyName}}',
    body: `Bonjour {{personName}},

Je me permets de vous contacter car je suis intéressé(e) par une opportunité de stage chez {{companyName}}.

Mon parcours est lié à {{observation}}, et j’aimerais beaucoup contribuer tout en apprenant auprès de votre équipe. Si vous êtes ouvert(e), je serais ravi(e) de partager une courte présentation et mon portfolio.

Bien cordialement,
{{myName}}`,
  },
  {
    id: 'senior-designer-portfolio-en',
    name: 'Senior Designer / portfolio feedback / English',
    audience: 'senior_designer',
    goal: 'portfolio_feedback',
    language: 'english',
    subject: 'Quick portfolio feedback request',
    body: `Hi {{personName}},

I’ve been following your work and would really value your feedback on my portfolio.

I’m {{myName}}, and I’m refining how I present {{observation}} across my case studies. If you have a moment, I’d love to hear what stands out or feels unclear.

Thanks,
{{myName}}`,
  },
  {
    id: 'senior-designer-portfolio-fr',
    name: 'Senior Designer / portfolio feedback / French',
    audience: 'senior_designer',
    goal: 'portfolio_feedback',
    language: 'french',
    subject: 'Retour rapide sur mon portfolio',
    body: `Bonjour {{personName}},

Je suis votre travail depuis un moment et j’aimerais beaucoup avoir votre retour sur mon portfolio.

Je suis {{myName}} et j’essaie d’améliorer la présentation de {{observation}} dans mes études de cas. Si vous avez un moment, je serais très reconnaissant(e) de savoir ce qui ressort clairement ou non.

Merci,
{{myName}}`,
  },
  {
    id: 'product-manager-product-ux-en',
    name: 'Product Manager / product UX observation / English',
    audience: 'product_manager',
    goal: 'ux_audit_offer',
    language: 'english',
    subject: 'UX observation for {{companyName}}',
    body: `Hi {{personName}},

I noticed something in {{companyName}} related to {{observation}}.

I’m {{myName}}, and I help teams turn product friction into clearer user journeys. If you’d like, I can send a short screen-by-screen note with practical improvements.

Best,
{{myName}}`,
  },
  {
    id: 'marketing-lead-landing-page-en',
    name: 'Marketing Lead / landing page audit / English',
    audience: 'marketing_lead',
    goal: 'ux_audit_offer',
    language: 'english',
    subject: 'Landing page improvement idea',
    body: `Hi {{personName}},

I took a look at {{companyName}} and noticed a possible improvement around {{observation}}.

I’m {{myName}}, and I help teams improve landing page clarity and conversion with quick UX audits. If useful, I can share a concise audit and a few fast wins.

Best,
{{myName}}`,
  },
  {
    id: 'agency-partner-white-label-en',
    name: 'Agency Partner / white-label UX collaboration / English',
    audience: 'agency_partner',
    goal: 'ux_audit_offer',
    language: 'english',
    subject: 'White-label UX support for {{companyName}}',
    body: `Hi {{personName}},

I’m reaching out to see whether {{companyName}} ever needs white-label UX support.

I’m {{myName}}, and I can help with audits, user flows, and product design work around {{observation}}. If you have current projects that need extra UX capacity, I’d be happy to discuss a lightweight collaboration.

Best,
{{myName}}`,
  },
  {
    id: 'follow-up-1-en',
    name: 'Follow-up 1 / English',
    audience: 'founder',
    goal: 'follow_up_1',
    language: 'english',
    subject: 'Following up on my last message',
    body: `Hi {{personName}},

Just following up on my previous note about {{observation}} at {{companyName}}.

If now isn’t the right time, no problem. I just wanted to keep the door open in case the topic becomes relevant.

Best,
{{myName}}`,
  },
  {
    id: 'follow-up-2-en',
    name: 'Follow-up 2 / English',
    audience: 'founder',
    goal: 'follow_up_2',
    language: 'english',
    subject: 'Last follow-up from my side',
    body: `Hi {{personName}},

I’ll make this my last follow-up for now.

If {{observation}} becomes a priority at {{companyName}}, feel free to reply here and I can send something useful right away.

Best,
{{myName}}`,
  },
];

export const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'founder', label: 'Founder' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'senior_designer', label: 'Senior Designer' },
  { value: 'marketing_lead', label: 'Marketing Lead' },
  { value: 'agency_partner', label: 'Agency Partner' },
];

export const goalOptions: Array<{ value: TemplateGoal; label: string }> = [
  { value: 'portfolio_feedback', label: 'Portfolio Feedback' },
  { value: 'internship_inquiry', label: 'Internship Inquiry' },
  { value: 'junior_role_inquiry', label: 'Junior Role Inquiry' },
  { value: 'ux_audit_offer', label: 'UX Audit Offer' },
  { value: 'follow_up_1', label: 'Follow-up 1' },
  { value: 'follow_up_2', label: 'Follow-up 2' },
];

export const languageOptions: Array<{ value: TemplateLanguage; label: string }> = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'arabic', label: 'Arabic' },
];
