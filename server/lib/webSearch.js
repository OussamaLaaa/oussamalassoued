const toCleanString = (value) => (value == null ? '' : String(value).trim());

const normalizeHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
};

const normalizeResults = (items, provider = 'serper') => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const title = toCleanString(item?.title || item?.name || item?.heading);
      const url = toCleanString(item?.link || item?.url || item?.website || item?.sourceUrl);
      const snippet = toCleanString(item?.snippet || item?.description || item?.content || item?.text);
      if (!title && !url && !snippet) return null;

      return {
        title,
        url,
        snippet,
        sourceProvider: provider,
        score: Number.isFinite(Number(item?.position)) ? Number(item.position) : index + 1,
      };
    })
    .filter(Boolean);
};

const dedupeResults = (items) => {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const key = toCleanString(item?.url).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

export const searchWeb = async (query, options = {}) => {
  const cleanQuery = toCleanString(query);
  const maxResults = Math.max(1, Math.min(Number(options.maxResults) || 10, 10));

  if (!cleanQuery) {
    return { results: [], providerUsed: null, warning: 'Live AI web research is not configured.' };
  }

  const apiKey = toCleanString(process.env.SERPER_API_KEY);
  if (!apiKey) {
    return { results: [], providerUsed: null, warning: 'Live AI web research is not configured.' };
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: cleanQuery, num: maxResults }),
    });

    if (!response.ok) {
      return {
        results: [],
        providerUsed: 'serper',
        warning: 'Live AI web research failed. Results may be incomplete.',
      };
    }

    const data = await response.json().catch(() => null);
    const organicResults = normalizeResults(data?.organic, 'serper');
    const knowledgeGraphResults = normalizeResults(data?.knowledgeGraph ? [data.knowledgeGraph] : [], 'serper');
    const relatedResults = normalizeResults(data?.relatedSearches, 'serper');

    const results = dedupeResults([...knowledgeGraphResults, ...organicResults, ...relatedResults]);

    return {
      results,
      providerUsed: 'serper',
      warning: results.length === 0 ? 'AI research ran, but no reliable public sources were found.' : null,
    };
  } catch {
    return {
      results: [],
      providerUsed: 'serper',
      warning: 'Live AI web research failed. Results may be incomplete.',
    };
  }
};

export const normalizeHostname = normalizeHost;

export default {
  searchWeb,
  normalizeHostname,
};