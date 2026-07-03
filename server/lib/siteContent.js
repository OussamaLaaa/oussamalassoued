import { createClient } from '@supabase/supabase-js';

const SECTION_FIELD_MAP = {
  about: 'scene05',
  persistent_ui: 'persistentUI',
  articles_page: 'articlesPage',
  contact_page: 'contactPage',
  design_system: 'designSystem',
  cinematic_sequence: 'cinematicSequence',
  global_frame: 'globalFrame',
  experience_marquee: 'experienceMarquee',
  legal_pages: 'legalPages',
};

const PUBLIC_SECTIONS = [
  'intro',
  'featured',
  'projects',
  'experience_marquee',
  'testimonials',
  'about',
  'persistent_ui',
  'footer',
  'legal_pages',
  'articles_page',
  'contact_page',
  'articles',
  'videos',
  'design_system',
  'animation',
  'cinematic_sequence',
  'global_frame',
  'crt',
  'visibility',
];

const createSiteSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};

export async function loadPublicSiteConfig({ debug = false } = {}) {
  const supabase = createSiteSupabaseClient();

  if (!supabase) {
    throw Object.assign(new Error('Supabase not configured'), { code: 'SUPABASE_SITE_CONFIG_NOT_CONFIGURED' });
  }

  const startTime = debug ? Date.now() : 0;

  const { data: rows, error } = await supabase
    .from('site_content')
    .select('section, data, updated_at')
    .eq('is_public', true);

  const queryDurationMs = debug ? Date.now() - startTime : 0;

  if (error) {
    throw Object.assign(error, { code: 'SUPABASE_SITE_CONFIG_READ_FAILED' });
  }

  if (!rows || rows.length === 0) {
    return { config: {}, updatedAt: null, debugInfo: null };
  }

  const config = {};
  let latestUpdatedAt = null;
  const sectionsReturned = [];
  const sectionsFound = [];

  for (const row of rows) {
    sectionsReturned.push(row.section);
    sectionsFound.push(row.section);

    if (row.section === 'intro') {
      if (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) {
        for (const [key, value] of Object.entries(row.data)) {
          config[key] = value;
        }
      }
    } else {
      const fieldName = SECTION_FIELD_MAP[row.section] || row.section;
      config[fieldName] = row.data;
    }

    if (row.updated_at && (!latestUpdatedAt || new Date(row.updated_at) > new Date(latestUpdatedAt))) {
      latestUpdatedAt = row.updated_at;
    }
  }

  const debugInfo = debug
    ? {
        rowCount: rows.length,
        sectionsReturned: sectionsReturned.sort(),
        sectionsMissing: PUBLIC_SECTIONS.filter((s) => !sectionsFound.includes(s)),
        queryDurationMs,
        hasSupabaseUrl: true,
        hasServiceRoleKey: true,
      }
    : null;

  return { config, updatedAt: latestUpdatedAt, debugInfo };
}

const INTRO_FIELDS = [
  'introText',
  'introScrollPrompt',
  'introOverlayBackdropColor',
  'introOverlayBackdropOpacity',
  'reducedMotion',
];

const SECTION_MAPPINGS = [
  ['featured', 'featured'],
  ['projects', 'projects'],
  ['experienceMarquee', 'experience_marquee'],
  ['testimonials', 'testimonials'],
  ['scene05', 'about'],
  ['persistentUI', 'persistent_ui'],
  ['footer', 'footer'],
  ['legalPages', 'legal_pages'],
  ['articlesPage', 'articles_page'],
  ['contactPage', 'contact_page'],
  ['articles', 'articles'],
  ['videos', 'videos'],
  ['designSystem', 'design_system'],
  ['animation', 'animation'],
  ['cinematicSequence', 'cinematic_sequence'],
  ['globalFrame', 'global_frame'],
  ['crt', 'crt'],
  ['visibility', 'visibility'],
];

export function splitSiteConfigIntoSections(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return [];

  const sections = [];

  const introData = {};
  for (const key of INTRO_FIELDS) {
    if (key in config) introData[key] = config[key];
  }
  if (Object.keys(introData).length > 0) {
    sections.push({ section: 'intro', data: introData, is_public: true });
  }

  for (const [field, sectionName] of SECTION_MAPPINGS) {
    if (field in config && config[field] !== undefined) {
      sections.push({ section: sectionName, data: config[field], is_public: true });
    }
  }

  if ('dashboard' in config && config.dashboard !== undefined) {
    sections.push({ section: 'dashboard', data: config.dashboard, is_public: false });
  }

  return sections;
}

export async function saveSiteConfigSections(sections) {
  const supabase = createSiteSupabaseClient();

  if (!supabase) {
    throw Object.assign(new Error('Supabase not configured'), { code: 'SUPABASE_SITE_CONFIG_NOT_CONFIGURED' });
  }

  const now = new Date().toISOString();

  const rows = sections.map((s) => ({
    section: s.section,
    data: s.data,
    is_public: s.is_public,
    updated_at: now,
  }));

  const { error } = await supabase.from('site_content').upsert(rows, {
    onConflict: 'section',
    ignoreDuplicates: false,
  });

  if (error) {
    throw Object.assign(error, { code: 'SITE_CONFIG_SAVE_FAILED' });
  }

  return sections.map((s) => s.section);
}
