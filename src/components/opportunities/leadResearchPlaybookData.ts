export const LEAD_RESEARCH_NICHES = [
  'SaaS / Software Companies',
  'B2B Service Companies',
  'HealthTech',
  'EdTech',
  'Marketplace',
  'E-commerce',
] as const;

export type LeadResearchNiche = typeof LEAD_RESEARCH_NICHES[number];

export interface LeadResearchStage {
  title: string;
  goal: string;
  target: string;
  places: string[];
  tricks: string[];
  queries: Record<LeadResearchNiche, string[]>;
}

export const LEAD_RESEARCH_STAGES: LeadResearchStage[] = [
  {
    title: 'LinkedIn',
    goal: 'استخراج شركات، founders، posts، و hiring signals داخل نفس النيش.',
    target: '10–20 lead جيد',
    places: ['Companies', 'Posts', 'Jobs', 'People إذا لم يوجد limit'],
    queries: {
      'SaaS / Software Companies': ['SaaS Tunisia', 'software Tunisia', 'logiciel Tunisie', 'ERP Tunisie', 'CRM Tunisie', 'solution digitale Tunisie', 'éditeur logiciel Tunisie'],
      'B2B Service Companies': ['IT consulting Tunisia', 'digital transformation Tunisia', 'cybersécurité Tunisie', 'cabinet conseil Tunisie', 'services informatiques Tunisie'],
      HealthTech: ['HealthTech Tunisia', 'télémédecine Tunisie', 'plateforme santé Tunisie', 'logiciel médical Tunisie'],
      EdTech: ['EdTech Tunisia', 'plateforme e-learning Tunisie', 'centre de formation Tunisie', 'formation en ligne Tunisie'],
      Marketplace: ['marketplace Tunisia', 'booking platform Tunisia', 'plateforme marketplace Tunisie'],
      'E-commerce': ['e-commerce Tunisia', 'boutique en ligne Tunisie', 'vente en ligne Tunisie'],
    },
    tricks: [
      'ابدأ بـ Companies إذا كان People Search محدودًا.',
      'في Posts ابحث عن launch / MVP / beta / demo / partnership.',
      'Jobs ليست للبحث عن عمل؛ هي signal أن الشركة لديها budget ونمو.',
      'لا تفتح profiles كثيرة بلا سبب حتى لا تستهلك limit.',
    ],
  },
  {
    title: 'Google Advanced Search',
    goal: 'البحث المتقدم باستعمال operators لإيجاد شركات لا تظهر بالبحث العادي.',
    target: '10–20 lead جيد',
    places: ['Google Search', 'site:.tn', 'intitle:', 'inurl:', 'filetype:pdf'],
    queries: {
      'SaaS / Software Companies': ['site:.tn "logiciel de gestion" Tunisie', 'site:.tn "ERP" Tunisie', '"éditeur logiciel" "Tunisie"', '"logiciel RH" "Tunisie"', '"software company" "Tunisia" -jobs -career'],
      'B2B Service Companies': ['"cabinet conseil" "Tunisie"', '"IT consulting" "Tunisia"', '"transformation digitale" "Tunisie"', '"services informatiques" "Tunisie"'],
      HealthTech: ['"HealthTech" "Tunisia"', '"télémédecine" "Tunisie"', '"logiciel médical" "Tunisie"'],
      EdTech: ['"EdTech" "Tunisia"', '"plateforme e-learning" "Tunisie"', '"centre de formation" "Tunisie"'],
      Marketplace: ['"marketplace" "Tunisia"', '"plateforme marketplace" "Tunisie"', '"booking platform" "Tunisia"'],
      'E-commerce': ['"e-commerce" "Tunisie"', '"boutique en ligne" "Tunisie"', '"vente en ligne" "Tunisie"'],
    },
    tricks: [
      'استعمل علامات الاقتباس للعبارات الدقيقة.',
      'استعمل -emploi -job -formation لحذف الضجيج.',
      'site:.tn يعطيك نتائج تونسية أكثر.',
      'filetype:pdf قد يكشف brochures لشركات software أو B2B.',
    ],
  },
  {
    title: 'Google Maps',
    goal: 'مفيد خصوصًا لـ B2B services، EdTech، Health، وE-commerce local businesses.',
    target: '10–20 lead حسب النيش',
    places: ['Google Maps', 'Reviews', 'Website', 'Photos', 'Contact'],
    queries: {
      'SaaS / Software Companies': ['société informatique Tunis', 'services informatiques Sfax', 'ERP Tunis'],
      'B2B Service Companies': ['IT consulting Tunis', 'cabinet conseil Tunis', 'cybersécurité Tunis'],
      HealthTech: ['clinique privée Tunis', 'centre médical Tunis', 'laboratoire analyse Tunis'],
      EdTech: ['centre de formation Tunis', 'formation professionnelle Sousse', 'école privée Tunis'],
      Marketplace: ['agence immobilière Tunis', 'plateforme livraison Tunis', 'services à domicile Tunis'],
      'E-commerce': ['boutique en ligne Tunis', 'showroom Tunis', 'vente en ligne Tunisie'],
    },
    tricks: [
      '50+ reviews = business حقيقي غالبًا.',
      'افتح الموقع: إذا النشاط قوي والموقع ضعيف فهذا lead جيد.',
      'وجود أكثر من فرع signal قوي للقدرة على الدفع.',
      'راقب WhatsApp/contact flow: غالبًا فيه مشاكل conversion.',
    ],
  },
  {
    title: 'Directories / B2B Databases',
    goal: 'استخراج أسماء شركات من Kompass, B2B Tunisia, Pages Jaunes, Afrikta ثم التحقق منها.',
    target: '5–15 lead جيد',
    places: ['Kompass', 'B2B Tunisia', 'Pages Jaunes', 'Afrikta', 'Arabic Market'],
    queries: {
      'SaaS / Software Companies': ['logiciel', 'ERP', 'CRM', 'éditeur logiciel', 'informatique'],
      'B2B Service Companies': ['conseil', 'consulting', 'services informatiques', 'ingénierie'],
      HealthTech: ['santé', 'médical', 'clinique', 'laboratoire'],
      EdTech: ['formation', 'école', 'centre de formation', 'formation professionnelle'],
      Marketplace: ['marketplace', 'services', 'réservation', 'immobilier'],
      'E-commerce': ['commerce', 'vente', 'distribution', 'boutique'],
    },
    tricks: [
      'Directories تعطي أسماء فقط؛ لا تعتبرها leads جاهزة.',
      'افتح website ثم LinkedIn/Facebook للتحقق من النشاط.',
      'احذف الشركات القديمة أو المواقع الميتة.',
      'لا تضف duplicate من المصادر السابقة.',
    ],
  },
  {
    title: 'Startup Databases + Incubators',
    goal: 'إيجاد startups ومنتجات رقمية من Startup Tunisia, Founder.tn, F6S, The Dot, Flat6Labs.',
    target: '10–15 lead جيد',
    places: ['Startup Tunisia', 'Founder.tn', 'StartupList Africa', 'F6S', 'The Dot', 'Flat6Labs'],
    queries: {
      'SaaS / Software Companies': ['SaaS', 'Software', 'AI/ML', 'Data', 'B2B'],
      'B2B Service Companies': ['Digital services', 'Consulting', 'B2B', 'AI consulting'],
      HealthTech: ['HealthTech', 'Medical', 'Patient', 'Telemedicine'],
      EdTech: ['EdTech', 'Learning', 'Education', 'Training'],
      Marketplace: ['Marketplace', 'Platform', 'Booking', 'Services'],
      'E-commerce': ['E-commerce', 'Retail', 'Online store', 'Marketplace'],
    },
    tricks: [
      'استبعد ideas فقط أو student projects.',
      'وجود Startup Label أو accelerator = signal جيد، لكنه لا يعني budget دائمًا.',
      'ابحث عن traction: users, revenue, funding, clients, team.',
      'المنتج الموجود أهم من pitch جميل.',
    ],
  },
  {
    title: 'Job Platforms',
    goal: 'استخدام التوظيف كإشارة شراء: الشركة التي توظف لديها نشاط وميزانية.',
    target: '5–10 lead قوي',
    places: ['LinkedIn Jobs', 'Keejob', 'Tanitjobs', 'Indeed', 'Optioncarriere'],
    queries: {
      'SaaS / Software Companies': ['Product Designer', 'UI UX', 'Frontend', 'React', 'Product Manager', 'ERP Consultant'],
      'B2B Service Companies': ['Business Developer B2B', 'Marketing Manager', 'Consultant', 'Digital Project Manager'],
      HealthTech: ['Product Manager santé', 'developer medical', 'marketing santé'],
      EdTech: ['responsable formation', 'digital learning', 'marketing formation', 'developer e-learning'],
      Marketplace: ['operations manager', 'product manager', 'frontend', 'growth'],
      'E-commerce': ['e-commerce manager', 'performance marketing', 'webmaster', 'UX UI'],
    },
    tricks: [
      'لا تسجل شركات recruiting الوسيطة؛ سجل الشركة الأصلية فقط.',
      'Product/UI/Frontend hiring signal أقوى من admin jobs.',
      'إذا توظف Marketing أو Sales، الموقع والتحويل مهمان غالبًا.',
      'استبعد internships فقط إذا لا توجد signals أخرى.',
    ],
  },
  {
    title: 'Facebook + Groups',
    goal: 'مفيد جدًا في تونس خاصة للـ EdTech, E-commerce, founders, وlocal platforms.',
    target: '10 lead بعد فلترة قوية',
    places: ['Facebook Search', 'Pages', 'Groups', 'Posts'],
    queries: {
      'SaaS / Software Companies': ['logiciel Tunisie', 'ERP Tunisie', 'startup Tunisie', 'solution digitale Tunisie'],
      'B2B Service Companies': ['services aux entreprises Tunisie', 'cabinet conseil Tunisie', 'marketing digital Tunisie'],
      HealthTech: ['clinique Tunisie', 'plateforme santé Tunisie', 'télémédecine Tunisie'],
      EdTech: ['centre de formation Tunisie', 'formation en ligne Tunisie', 'bootcamp Tunisie'],
      Marketplace: ['marketplace Tunisie', 'plateforme Tunisie', 'livraison Tunisie'],
      'E-commerce': ['boutique en ligne Tunisie', 'vente en ligne Tunisie', 'e-commerce Tunisie'],
    },
    tricks: [
      'في groups ابحث عن: MVP, application, plateforme, développeur, lancement.',
      'Facebook يعطي leads كثيرة ضعيفة؛ طبق فلتر budget بقوة.',
      'صفحة نشطة + website ضعيف = فرصة جيدة.',
      'لا تضيع وقتك مع من عنده فكرة فقط بدون budget أو timeline.',
    ],
  },
  {
    title: 'Instagram / TikTok',
    goal: 'قوي للـ E-commerce, EdTech, Health, وبعض marketplaces، أضعف للـ SaaS pure.',
    target: '10 lead للقطاعات المناسبة',
    places: ['Hashtags', 'Bio links', 'Ads clues', 'Stories highlights'],
    queries: {
      'SaaS / Software Companies': ['#startupTunisie', '#saas', '#digitalTunisia'],
      'B2B Service Companies': ['#businessTunisie', '#consultingTunisie', '#digitalTunisia'],
      HealthTech: ['#santeTunisie', '#cliniqueTunisie', '#medicalTunisie'],
      EdTech: ['#formationTunisie', '#elearning', '#bootcampTunisie'],
      Marketplace: ['#marketplaceTunisie', '#livraisonTunisie', '#servicesTunisie'],
      'E-commerce': ['#ecommerceTunisie', '#boutiqueTunisie', '#venteenligne'],
    },
    tricks: [
      'Instagram قوي إذا كان النشاط قوي والموقع ضعيف.',
      'افحص link in bio والـ checkout/mobile flow.',
      'followers وحدهم ليسوا دليل budget؛ ابحث عن مبيعات أو ads أو catalog.',
      'لا تستهدف pages صغيرة جدًا إلا إذا لديها traction واضح.',
    ],
  },
  {
    title: 'App Stores / Product Search',
    goal: 'إيجاد apps ومنتجات رقمية لا تظهر في البحث العادي.',
    target: '5–10 lead',
    places: ['Google Play', 'App Store', 'App reviews'],
    queries: {
      'SaaS / Software Companies': ['site:play.google.com "Tunisia" "ERP"', 'site:play.google.com "Tunisie" "gestion"'],
      'B2B Service Companies': ['site:play.google.com "Tunisia" "business"'],
      HealthTech: ['site:play.google.com "Tunisia" "health"', 'site:play.google.com "Tunisie" "santé"'],
      EdTech: ['site:play.google.com "Tunisie" "formation"', 'site:play.google.com "Tunisia" "learning"'],
      Marketplace: ['site:play.google.com "Tunisia" "marketplace"', 'site:play.google.com "Tunisia" "delivery"'],
      'E-commerce': ['site:play.google.com "Tunisia" "shopping"', 'site:play.google.com "Tunisie" "boutique"'],
    },
    tricks: [
      'Reviews تكشف مشاكل UX حقيقية من المستخدمين.',
      'App موجود + website ضعيف = offer واضح.',
      'سجل عدد reviews/downloads كـ traction signal.',
      'ابحث عن الشركة المالكة وليس اسم التطبيق فقط.',
    ],
  },
  {
    title: 'Partner Directories + Competitor Mining',
    goal: 'استخراج شركات من شركاء ERP/CRM/Cloud ومن منافسي leads الجيدة.',
    target: '5–15 lead عالي الجودة',
    places: ['Odoo partners', 'Microsoft partners', 'Zoho partners', 'HubSpot partners', 'Similar companies'],
    queries: {
      'SaaS / Software Companies': ['Odoo partner Tunisia', 'Microsoft partner Tunisia', 'Zoho partner Tunisia', 'ERP partner Tunisia'],
      'B2B Service Companies': ['HubSpot partner Tunisia', 'digital transformation partner Tunisia', 'cloud partner Tunisia'],
      HealthTech: ['medical software partners Tunisia', 'healthcare technology Tunisia'],
      EdTech: ['learning management system Tunisia', 'Moodle partner Tunisia'],
      Marketplace: ['competitors marketplace Tunisia', 'booking platform Tunisia competitors'],
      'E-commerce': ['Shopify Tunisia', 'WooCommerce Tunisia', 'e-commerce agency Tunisia'],
    },
    tricks: [
      'Partner directories تعطي شركات B2B ذات budget أفضل غالبًا.',
      'عند إيجاد شركة جيدة، ابحث عن منافسيها وشركائها.',
      'LinkedIn Similar Pages مفيد لاستخراج شركات شبيهة.',
      'لا تجمع كل المنافسين؛ فقط من لديه UX problem واضح.',
    ],
  },
  {
    title: 'AI Enrichment + Final Qualification',
    goal: 'تحليل leads، استخراج مشاكل UX، كتابة offer angle، وترتيب الأولويات.',
    target: 'Top 20 lead جاهزة للتواصل',
    places: ['Copilot / ChatGPT', 'Perplexity', 'Apollo', 'Hunter', 'Clay لاحقًا'],
    queries: {
      'SaaS / Software Companies': ['حلل website كـ SaaS UX lead', 'استخرج مشاكل onboarding/demo/conversion'],
      'B2B Service Companies': ['حلل موقع B2B من ناحية clarity/conversion', 'استخرج offer angle'],
      HealthTech: ['حلل booking/trust UX', 'استخرج مشاكل patient journey'],
      EdTech: ['حلل enrollment/course landing pages', 'استخرج مشاكل التسجيل'],
      Marketplace: ['حلل buyer/seller flow', 'استخرج friction points'],
      'E-commerce': ['حلل product page/checkout/mobile', 'استخرج conversion issues'],
    },
    tricks: [
      'AI لا يعوض التحقق اليدوي؛ يستعمل للتسريع والتحليل.',
      'اطلب score وbusiness impact وليس رأيًا عامًا في التصميم.',
      'استعمل Hunter/Apollo فقط على leads A وB حتى لا تضيع credits.',
      'قبل outreach اعمل mini audit لـ Top 10 فقط.',
    ],
  },
];

export const LEAD_RESEARCH_QUALIFICATION_RULES = [
  'الشركة داخل النيش المناسب',
  'لديها website أو product واضح',
  'هناك مشكلة UX/UI ظاهرة',
  'توجد إشارات قدرة دفع',
  'يمكن الوصول لصاحب القرار',
];

export const LEAD_RESEARCH_SCORE_GUIDE = [
  '+2 Niche',
  '+2 Website/Product',
  '+2 UX problem',
  '+2 Budget',
  '+2 Decision maker',
];