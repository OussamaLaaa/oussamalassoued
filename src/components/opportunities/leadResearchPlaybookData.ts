export const LEAD_RESEARCH_NICHES = [
  'SaaS / Software Companies',
  'B2B Service Companies',
  'HealthTech',
  'EdTech',
  'Marketplace',
  'E-commerce',
] as const;

export type LeadResearchNiche = typeof LEAD_RESEARCH_NICHES[number];

export type BilingualText = {
  en: string;
  ar: string;
};

export type BilingualList = {
  en: string[];
  ar: string[];
};

export interface LeadResearchStage {
  title: BilingualText;
  goal: BilingualText;
  target: BilingualText;
  places: BilingualList;
  tricks: BilingualList;
  queries: Record<LeadResearchNiche, string[]>;
}

export const LEAD_RESEARCH_STAGES: LeadResearchStage[] = [
  {
    title: { en: 'LinkedIn', ar: 'LinkedIn' },
    goal: { en: 'Extract companies, founders, posts, and hiring signals inside the same niche.', ar: 'استخراج شركات، founders، posts، و hiring signals داخل نفس النيش.' },
    target: { en: '10–20 good leads', ar: '10–20 lead جيد' },
    places: { en: ['Companies', 'Posts', 'Jobs', 'People if limits are low'], ar: ['Companies', 'Posts', 'Jobs', 'People إذا لم يوجد limit'] },
    queries: {
      'SaaS / Software Companies': ['SaaS Tunisia', 'software Tunisia', 'logiciel Tunisie', 'ERP Tunisie', 'CRM Tunisie', 'solution digitale Tunisie', 'éditeur logiciel Tunisie'],
      'B2B Service Companies': ['IT consulting Tunisia', 'digital transformation Tunisia', 'cybersécurité Tunisie', 'cabinet conseil Tunisie', 'services informatiques Tunisie'],
      HealthTech: ['HealthTech Tunisia', 'télémédecine Tunisie', 'plateforme santé Tunisie', 'logiciel médical Tunisie'],
      EdTech: ['EdTech Tunisia', 'plateforme e-learning Tunisie', 'centre de formation Tunisie', 'formation en ligne Tunisie'],
      Marketplace: ['marketplace Tunisia', 'booking platform Tunisia', 'plateforme marketplace Tunisie'],
      'E-commerce': ['e-commerce Tunisia', 'boutique en ligne Tunisie', 'vente en ligne Tunisie'],
    },
    tricks: {
      en: [
        'Start with Companies if People Search is limited.',
        'In Posts, search for launch / MVP / beta / demo / partnership.',
        'Jobs are not for job hunting; they signal budget and growth.',
        'Do not open too many profiles without reason or you will hit limits.',
      ],
      ar: [
        'ابدأ بـ Companies إذا كان People Search محدودًا.',
        'في Posts ابحث عن launch / MVP / beta / demo / partnership.',
        'Jobs ليست للبحث عن عمل؛ هي signal أن الشركة لديها budget ونمو.',
        'لا تفتح profiles كثيرة بلا سبب حتى لا تستهلك limit.',
      ],
    },
  },
  {
    title: { en: 'Google Advanced Search', ar: 'البحث المتقدم في Google' },
    goal: { en: 'Use operators to find companies that do not appear in normal search results.', ar: 'البحث المتقدم باستعمال operators لإيجاد شركات لا تظهر بالبحث العادي.' },
    target: { en: '10–20 good leads', ar: '10–20 lead جيد' },
    places: { en: ['Google Search', 'site:.tn', 'intitle:', 'inurl:', 'filetype:pdf'], ar: ['Google Search', 'site:.tn', 'intitle:', 'inurl:', 'filetype:pdf'] },
    queries: {
      'SaaS / Software Companies': ['site:.tn "logiciel de gestion" Tunisie', 'site:.tn "ERP" Tunisie', '"éditeur logiciel" "Tunisie"', '"logiciel RH" "Tunisie"', '"software company" "Tunisia" -jobs -career'],
      'B2B Service Companies': ['"cabinet conseil" "Tunisie"', '"IT consulting" "Tunisia"', '"transformation digitale" "Tunisie"', '"services informatiques" "Tunisie"'],
      HealthTech: ['"HealthTech" "Tunisia"', '"télémédecine" "Tunisie"', '"logiciel médical" "Tunisie"'],
      EdTech: ['"EdTech" "Tunisia"', '"plateforme e-learning" "Tunisie"', '"centre de formation" "Tunisie"'],
      Marketplace: ['"marketplace" "Tunisia"', '"plateforme marketplace" "Tunisie"', '"booking platform" "Tunisia"'],
      'E-commerce': ['"e-commerce" "Tunisie"', '"boutique en ligne" "Tunisie"', '"vente en ligne" "Tunisie"'],
    },
    tricks: {
      en: [
        'Use quotes for exact phrases.',
        'Use -emploi -job -formation to remove noise.',
        'site:.tn gives you more Tunisian results.',
        'filetype:pdf can reveal brochures from software or B2B companies.',
      ],
      ar: [
        'استعمل علامات الاقتباس للعبارات الدقيقة.',
        'استعمل -emploi -job -formation لحذف الضجيج.',
        'site:.tn يعطيك نتائج تونسية أكثر.',
        'filetype:pdf قد يكشف brochures لشركات software أو B2B.',
      ],
    },
  },
  {
    title: { en: 'Google Maps', ar: 'Google Maps' },
    goal: { en: 'Useful especially for B2B services, EdTech, Health, and local E-commerce businesses.', ar: 'مفيد خصوصًا لـ B2B services، EdTech، Health، وE-commerce local businesses.' },
    target: { en: '10–20 leads depending on the niche', ar: '10–20 lead حسب النيش' },
    places: { en: ['Google Maps', 'Reviews', 'Website', 'Photos', 'Contact'], ar: ['Google Maps', 'Reviews', 'Website', 'Photos', 'Contact'] },
    queries: {
      'SaaS / Software Companies': ['société informatique Tunis', 'services informatiques Sfax', 'ERP Tunis'],
      'B2B Service Companies': ['IT consulting Tunis', 'cabinet conseil Tunis', 'cybersécurité Tunis'],
      HealthTech: ['clinique privée Tunis', 'centre médical Tunis', 'laboratoire analyse Tunis'],
      EdTech: ['centre de formation Tunis', 'formation professionnelle Sousse', 'école privée Tunis'],
      Marketplace: ['agence immobilière Tunis', 'plateforme livraison Tunis', 'services à domicile Tunis'],
      'E-commerce': ['boutique en ligne Tunis', 'showroom Tunis', 'vente en ligne Tunisie'],
    },
    tricks: {
      en: [
        '50+ reviews usually means a real business.',
        'Open the website: strong activity + weak website means a good lead.',
        'Multiple branches are a strong payment ability signal.',
        'Watch the WhatsApp/contact flow; there are often conversion issues.',
      ],
      ar: [
        '50+ reviews = business حقيقي غالبًا.',
        'افتح الموقع: إذا النشاط قوي والموقع ضعيف فهذا lead جيد.',
        'وجود أكثر من فرع signal قوي للقدرة على الدفع.',
        'راقب WhatsApp/contact flow: غالبًا فيه مشاكل conversion.',
      ],
    },
  },
  {
    title: { en: 'Directories / B2B Databases', ar: 'Directories / B2B Databases' },
    goal: { en: 'Extract company names from Kompass, B2B Tunisia, Pages Jaunes, and Afrikta, then verify them.', ar: 'استخراج أسماء شركات من Kompass, B2B Tunisia, Pages Jaunes, Afrikta ثم التحقق منها.' },
    target: { en: '5–15 good leads', ar: '5–15 lead جيد' },
    places: { en: ['Kompass', 'B2B Tunisia', 'Pages Jaunes', 'Afrikta', 'Arabic Market'], ar: ['Kompass', 'B2B Tunisia', 'Pages Jaunes', 'Afrikta', 'Arabic Market'] },
    queries: {
      'SaaS / Software Companies': ['logiciel', 'ERP', 'CRM', 'éditeur logiciel', 'informatique'],
      'B2B Service Companies': ['conseil', 'consulting', 'services informatiques', 'ingénierie'],
      HealthTech: ['santé', 'médical', 'clinique', 'laboratoire'],
      EdTech: ['formation', 'école', 'centre de formation', 'formation professionnelle'],
      Marketplace: ['marketplace', 'services', 'réservation', 'immobilier'],
      'E-commerce': ['commerce', 'vente', 'distribution', 'boutique'],
    },
    tricks: {
      en: [
        'Directories only give names; do not treat them as ready leads.',
        'Open the website, then LinkedIn/Facebook to verify activity.',
        'Remove old companies or dead websites.',
        'Do not add duplicates from previous sources.',
      ],
      ar: [
        'Directories تعطي أسماء فقط؛ لا تعتبرها leads جاهزة.',
        'افتح website ثم LinkedIn/Facebook للتحقق من النشاط.',
        'احذف الشركات القديمة أو المواقع الميتة.',
        'لا تضف duplicate من المصادر السابقة.',
      ],
    },
  },
  {
    title: { en: 'Startup Databases + Incubators', ar: 'Startup Databases + Incubators' },
    goal: { en: 'Find startups and digital products from Startup Tunisia, Founder.tn, F6S, The Dot, and Flat6Labs.', ar: 'إيجاد startups ومنتجات رقمية من Startup Tunisia, Founder.tn, F6S, The Dot, Flat6Labs.' },
    target: { en: '10–15 good leads', ar: '10–15 lead جيد' },
    places: { en: ['Startup Tunisia', 'Founder.tn', 'StartupList Africa', 'F6S', 'The Dot', 'Flat6Labs'], ar: ['Startup Tunisia', 'Founder.tn', 'StartupList Africa', 'F6S', 'The Dot', 'Flat6Labs'] },
    queries: {
      'SaaS / Software Companies': ['SaaS', 'Software', 'AI/ML', 'Data', 'B2B'],
      'B2B Service Companies': ['Digital services', 'Consulting', 'B2B', 'AI consulting'],
      HealthTech: ['HealthTech', 'Medical', 'Patient', 'Telemedicine'],
      EdTech: ['EdTech', 'Learning', 'Education', 'Training'],
      Marketplace: ['Marketplace', 'Platform', 'Booking', 'Services'],
      'E-commerce': ['E-commerce', 'Retail', 'Online store', 'Marketplace'],
    },
    tricks: {
      en: [
        'Exclude pure ideas or student projects.',
        'A startup label or accelerator is a good signal, but not always budget.',
        'Look for traction: users, revenue, funding, clients, team.',
        'An actual product matters more than a polished pitch.',
      ],
      ar: [
        'استبعد ideas فقط أو student projects.',
        'وجود Startup Label أو accelerator = signal جيد، لكنه لا يعني budget دائمًا.',
        'ابحث عن traction: users, revenue, funding, clients, team.',
        'المنتج الموجود أهم من pitch جميل.',
      ],
    },
  },
  {
    title: { en: 'Job Platforms', ar: 'Job Platforms' },
    goal: { en: 'Use hiring as a buying signal: companies that hire have activity and budget.', ar: 'استخدام التوظيف كإشارة شراء: الشركة التي توظف لديها نشاط وميزانية.' },
    target: { en: '5–10 strong leads', ar: '5–10 lead قوي' },
    places: { en: ['LinkedIn Jobs', 'Keejob', 'Tanitjobs', 'Indeed', 'Optioncarriere'], ar: ['LinkedIn Jobs', 'Keejob', 'Tanitjobs', 'Indeed', 'Optioncarriere'] },
    queries: {
      'SaaS / Software Companies': ['Product Designer', 'UI UX', 'Frontend', 'React', 'Product Manager', 'ERP Consultant'],
      'B2B Service Companies': ['Business Developer B2B', 'Marketing Manager', 'Consultant', 'Digital Project Manager'],
      HealthTech: ['Product Manager santé', 'developer medical', 'marketing santé'],
      EdTech: ['responsable formation', 'digital learning', 'marketing formation', 'developer e-learning'],
      Marketplace: ['operations manager', 'product manager', 'frontend', 'growth'],
      'E-commerce': ['e-commerce manager', 'performance marketing', 'webmaster', 'UX UI'],
    },
    tricks: {
      en: [
        'Do not log recruiting intermediaries; log only the original company.',
        'Product/UI/Frontend hiring is a stronger signal than admin jobs.',
        'If they hire Marketing or Sales, website and conversion matter a lot.',
        'Exclude internships only if there are no other signals.',
      ],
      ar: [
        'لا تسجل شركات recruiting الوسيطة؛ سجل الشركة الأصلية فقط.',
        'Product/UI/Frontend hiring signal أقوى من admin jobs.',
        'إذا توظف Marketing أو Sales، الموقع والتحويل مهمان غالبًا.',
        'استبعد internships فقط إذا لا توجد signals أخرى.',
      ],
    },
  },
  {
    title: { en: 'Facebook + Groups', ar: 'Facebook + Groups' },
    goal: { en: 'Very useful in Tunisia, especially for EdTech, E-commerce, founders, and local platforms.', ar: 'مفيد جدًا في تونس خاصة للـ EdTech, E-commerce, founders, وlocal platforms.' },
    target: { en: '10 leads after strong filtering', ar: '10 lead بعد فلترة قوية' },
    places: { en: ['Facebook Search', 'Pages', 'Groups', 'Posts'], ar: ['Facebook Search', 'Pages', 'Groups', 'Posts'] },
    queries: {
      'SaaS / Software Companies': ['logiciel Tunisie', 'ERP Tunisie', 'startup Tunisie', 'solution digitale Tunisie'],
      'B2B Service Companies': ['services aux entreprises Tunisie', 'cabinet conseil Tunisie', 'marketing digital Tunisie'],
      HealthTech: ['clinique Tunisie', 'plateforme santé Tunisie', 'télémédecine Tunisie'],
      EdTech: ['centre de formation Tunisie', 'formation en ligne Tunisie', 'bootcamp Tunisie'],
      Marketplace: ['marketplace Tunisie', 'plateforme Tunisie', 'livraison Tunisie'],
      'E-commerce': ['boutique en ligne Tunisie', 'vente en ligne Tunisie', 'e-commerce Tunisie'],
    },
    tricks: {
      en: [
        'In groups, search for: MVP, application, platform, developer, launch.',
        'Facebook gives many weak leads; apply a strong budget filter.',
        'Active page + weak website = a good opportunity.',
        'Do not spend time on people with only an idea and no budget or timeline.',
      ],
      ar: [
        'في groups ابحث عن: MVP, application, plateforme, développeur, lancement.',
        'Facebook يعطي leads كثيرة ضعيفة؛ طبق فلتر budget بقوة.',
        'صفحة نشطة + website ضعيف = فرصة جيدة.',
        'لا تضيع وقتك مع من عنده فكرة فقط بدون budget أو timeline.',
      ],
    },
  },
  {
    title: { en: 'Instagram / TikTok', ar: 'Instagram / TikTok' },
    goal: { en: 'Strong for E-commerce, EdTech, Health, and some marketplaces; weaker for pure SaaS.', ar: 'قوي للـ E-commerce, EdTech, Health، وبعض marketplaces، أضعف للـ SaaS pure.' },
    target: { en: '10 leads for the right sectors', ar: '10 lead للقطاعات المناسبة' },
    places: { en: ['Hashtags', 'Bio links', 'Ads clues', 'Story highlights'], ar: ['Hashtags', 'Bio links', 'Ads clues', 'Stories highlights'] },
    queries: {
      'SaaS / Software Companies': ['#startupTunisie', '#saas', '#digitalTunisia'],
      'B2B Service Companies': ['#businessTunisie', '#consultingTunisie', '#digitalTunisia'],
      HealthTech: ['#santeTunisie', '#cliniqueTunisie', '#medicalTunisie'],
      EdTech: ['#formationTunisie', '#elearning', '#bootcampTunisie'],
      Marketplace: ['#marketplaceTunisie', '#livraisonTunisie', '#servicesTunisie'],
      'E-commerce': ['#ecommerceTunisie', '#boutiqueTunisie', '#venteenligne'],
    },
    tricks: {
      en: [
        'Instagram is strong when activity is high and the website is weak.',
        'Check the link in bio and the checkout/mobile flow.',
        'Followers alone are not a budget signal; look for sales, ads, or a catalog.',
        'Do not target very small pages unless they have clear traction.',
      ],
      ar: [
        'Instagram قوي إذا كان النشاط قوي والموقع ضعيف.',
        'افحص link in bio والـ checkout/mobile flow.',
        'followers وحدهم ليسوا دليل budget؛ ابحث عن مبيعات أو ads أو catalog.',
        'لا تستهدف pages صغيرة جدًا إلا إذا لديها traction واضح.',
      ],
    },
  },
  {
    title: { en: 'App Stores / Product Search', ar: 'App Stores / Product Search' },
    goal: { en: 'Find apps and digital products that do not appear in normal search.', ar: 'إيجاد apps ومنتجات رقمية لا تظهر في البحث العادي.' },
    target: { en: '5–10 leads', ar: '5–10 lead' },
    places: { en: ['Google Play', 'App Store', 'App reviews'], ar: ['Google Play', 'App Store', 'App reviews'] },
    queries: {
      'SaaS / Software Companies': ['site:play.google.com "Tunisia" "ERP"', 'site:play.google.com "Tunisie" "gestion"'],
      'B2B Service Companies': ['site:play.google.com "Tunisia" "business"'],
      HealthTech: ['site:play.google.com "Tunisia" "health"', 'site:play.google.com "Tunisie" "santé"'],
      EdTech: ['site:play.google.com "Tunisie" "formation"', 'site:play.google.com "Tunisia" "learning"'],
      Marketplace: ['site:play.google.com "Tunisia" "marketplace"', 'site:play.google.com "Tunisia" "delivery"'],
      'E-commerce': ['site:play.google.com "Tunisia" "shopping"', 'site:play.google.com "Tunisie" "boutique"'],
    },
    tricks: {
      en: [
        'Reviews reveal real UX problems from users.',
        'An app plus a weak website = a clear offer.',
        'Log review/download counts as traction signals.',
        'Search for the owning company, not only the app name.',
      ],
      ar: [
        'Reviews تكشف مشاكل UX حقيقية من المستخدمين.',
        'App موجود + website ضعيف = offer واضح.',
        'سجل عدد reviews/downloads كـ traction signal.',
        'ابحث عن الشركة المالكة وليس اسم التطبيق فقط.',
      ],
    },
  },
  {
    title: { en: 'Partner Directories + Competitor Mining', ar: 'Partner Directories + Competitor Mining' },
    goal: { en: 'Extract companies from ERP/CRM/Cloud partners and from competitors of good leads.', ar: 'استخراج شركات من شركاء ERP/CRM/Cloud ومن منافسي leads الجيدة.' },
    target: { en: '5–15 high-quality leads', ar: '5–15 lead عالي الجودة' },
    places: { en: ['Odoo partners', 'Microsoft partners', 'Zoho partners', 'HubSpot partners', 'Similar companies'], ar: ['Odoo partners', 'Microsoft partners', 'Zoho partners', 'HubSpot partners', 'Similar companies'] },
    queries: {
      'SaaS / Software Companies': ['Odoo partner Tunisia', 'Microsoft partner Tunisia', 'Zoho partner Tunisia', 'ERP partner Tunisia'],
      'B2B Service Companies': ['HubSpot partner Tunisia', 'digital transformation partner Tunisia', 'cloud partner Tunisia'],
      HealthTech: ['medical software partners Tunisia', 'healthcare technology Tunisia'],
      EdTech: ['learning management system Tunisia', 'Moodle partner Tunisia'],
      Marketplace: ['competitors marketplace Tunisia', 'booking platform Tunisia competitors'],
      'E-commerce': ['Shopify Tunisia', 'WooCommerce Tunisia', 'e-commerce agency Tunisia'],
    },
    tricks: {
      en: [
        'Partner directories often give stronger B2B companies with better budgets.',
        'When you find a strong company, look up its competitors and partners.',
        'LinkedIn Similar Pages is useful for finding lookalike companies.',
        'Do not collect every competitor; only the ones with a clear UX problem.',
      ],
      ar: [
        'Partner directories تعطي شركات B2B ذات budget أفضل غالبًا.',
        'عند إيجاد شركة جيدة، ابحث عن منافسيها وشركائها.',
        'LinkedIn Similar Pages مفيد لاستخراج شركات شبيهة.',
        'لا تجمع كل المنافسين؛ فقط من لديه UX problem واضح.',
      ],
    },
  },
  {
    title: { en: 'AI Enrichment + Final Qualification', ar: 'AI Enrichment + Final Qualification' },
    goal: { en: 'Analyze leads, extract UX problems, write the offer angle, and rank priorities.', ar: 'تحليل leads، استخراج مشاكل UX، كتابة offer angle، وترتيب الأولويات.' },
    target: { en: 'Top 20 ready-to-contact leads', ar: 'Top 20 lead جاهزة للتواصل' },
    places: { en: ['Copilot / ChatGPT', 'Perplexity', 'Apollo', 'Hunter', 'Clay later'], ar: ['Copilot / ChatGPT', 'Perplexity', 'Apollo', 'Hunter', 'Clay لاحقًا'] },
    queries: {
      'SaaS / Software Companies': ['حلل website كـ SaaS UX lead', 'استخرج مشاكل onboarding/demo/conversion'],
      'B2B Service Companies': ['حلل موقع B2B من ناحية clarity/conversion', 'استخرج offer angle'],
      HealthTech: ['حلل booking/trust UX', 'استخرج مشاكل patient journey'],
      EdTech: ['حلل enrollment/course landing pages', 'استخرج مشاكل التسجيل'],
      Marketplace: ['حلل buyer/seller flow', 'استخرج friction points'],
      'E-commerce': ['حلل product page/checkout/mobile', 'استخرج conversion issues'],
    },
    tricks: {
      en: [
        'AI does not replace manual verification; use it for speed and analysis.',
        'Ask for score and business impact, not a generic design opinion.',
        'Use Hunter/Apollo only on A and B leads so you do not waste credits.',
        'Before outreach, run mini audits on the Top 10 only.',
      ],
      ar: [
        'AI لا يعوض التحقق اليدوي؛ يستعمل للتسريع والتحليل.',
        'اطلب score وbusiness impact وليس رأيًا عامًا في التصميم.',
        'استعمل Hunter/Apollo فقط على leads A وB حتى لا تضيع credits.',
        'قبل outreach اعمل mini audit لـ Top 10 فقط.',
      ],
    },
  },
];

export const LEAD_RESEARCH_QUALIFICATION_RULES = {
  en: [
    'Company fits the selected niche',
    'Has a clear website or product',
    'Visible UX/UI problem',
    'Payment ability signal exists',
    'Decision maker is reachable',
  ],
  ar: [
    'الشركة داخل النيش المناسب',
    'لديها website أو product واضح',
    'هناك مشكلة UX/UI ظاهرة',
    'توجد إشارات قدرة دفع',
    'يمكن الوصول لصاحب القرار',
  ],
};

export const LEAD_RESEARCH_SCORE_GUIDE = [
  '+2 Niche',
  '+2 Website/Product',
  '+2 UX problem',
  '+2 Budget',
  '+2 Decision maker',
];