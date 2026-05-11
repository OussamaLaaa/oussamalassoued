import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';

const STORAGE_PATH = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(STORAGE_PATH, 'site-config.json');
const CONFIG_KEY = 'site:config';
const isProduction = process.env.NODE_ENV === 'production';

const hasVercelKvConfig =
  typeof process.env.KV_REST_API_URL === 'string' &&
  process.env.KV_REST_API_URL.length > 0 &&
  typeof process.env.KV_REST_API_TOKEN === 'string' &&
  process.env.KV_REST_API_TOKEN.length > 0;

const hasUpstashConfig =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

// Log storage availability on startup
if (typeof process !== 'undefined' && process.env.NODE_ENV) {
  const storageStatus = {
    vercel_kv: hasVercelKvConfig,
    upstash_redis: hasUpstashConfig,
    file: !isProduction,
    environment: isProduction ? 'production' : 'development',
  };
  console.log('[Config API] Storage availability:', JSON.stringify(storageStatus));
}

const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ensureStorageDir = () => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }
    return true;
  } catch (e) {
    console.warn('Storage dir not available:', e?.message || e);
    return false;
  }
};

const readStoredConfig = () => {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return null;
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read stored config:', e?.message || e);
    return null;
  }
};

const writeStoredConfig = (data) => {
  try {
    if (!ensureStorageDir()) return false;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write stored config:', e?.message || e);
    return false;
  }
};

const readFromVercelKv = async () => {
  if (!hasVercelKvConfig) return null;
  try {
    const value = await kv.get(CONFIG_KEY);
    if (!value || typeof value !== 'object') return null;
    return value;
  } catch (e) {
    console.error('Failed to read config from Vercel KV:', e?.message || e);
    return null;
  }
};

const writeToVercelKv = async (data) => {
  if (!hasVercelKvConfig) return false;
  try {
    await kv.set(CONFIG_KEY, data);
    return true;
  } catch (e) {
    console.error('Failed to write config to Vercel KV:', e?.message || e);
    return false;
  }
};

const readFromRedis = async () => {
  if (!redis) return null;
  try {
    const value = await redis.get(CONFIG_KEY);
    if (!value || typeof value !== 'object') return null;
    return value;
  } catch (e) {
    console.error('Failed to read config from Redis:', e?.message || e);
    return null;
  }
};

const writeToRedis = async (data) => {
  if (!redis) return false;
  try {
    await redis.set(CONFIG_KEY, data);
    return true;
  } catch (e) {
    console.error('Failed to write config to Redis:', e?.message || e);
    return false;
  }
};

export default (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // GET /api/config/status - check storage availability
  if (req.method === 'GET' && req.url && req.url.includes('/status')) {
    return res.status(200).json({
      success: true,
      storage: {
        vercel_kv: {
          available: hasVercelKvConfig,
          description: 'Vercel KV - Primary persistent storage'
        },
        upstash_redis: {
          available: hasUpstashConfig,
          description: 'Upstash Redis - Secondary persistent storage'
        },
        file: {
          available: !isProduction,
          description: 'Local file - Development only'
        }
      },
      environment: isProduction ? 'production' : 'development',
      message: hasVercelKvConfig || hasUpstashConfig ? 'Persistent storage configured' : 'No persistent storage - configure Upstash/Vercel KV'
    });
  }

  // GET - return stored config if available
  if (req.method === 'GET') {
    return (async () => {
      const vercelKvData = await readFromVercelKv();
      if (vercelKvData) {
        return res.status(200).json({ success: true, data: vercelKvData, source: 'vercel-kv' });
      }

      const redisData = await readFromRedis();
      if (redisData) {
        return res.status(200).json({ success: true, data: redisData, source: 'upstash' });
      }

      if (!isProduction) {
        const stored = readStoredConfig();
        if (stored) {
          return res.status(200).json({ success: true, data: stored, source: 'file' });
        }
      }

      // Fallback: empty but successful response
      return res.status(200).json({ success: true, data: {} });
    })();
  }

  // PUT/POST - persist incoming config
  if (req.method === 'PUT' || req.method === 'POST') {
    return (async () => {
      let body = {};
      try {
        if (req.body && typeof req.body === 'string') {
          body = JSON.parse(req.body);
        } else if (req.body && typeof req.body === 'object') {
          body = req.body;
        }
      } catch (e) {
        console.warn('[Config API] Invalid JSON body for config update');
        return res.status(400).json({ success: false, error: 'Invalid JSON body' });
      }

      console.log('[Config API] Attempting to persist config...');
      
      // Try Vercel KV first
      if (hasVercelKvConfig) {
        console.log('[Config API] Trying Vercel KV...');
        const kvOk = await writeToVercelKv(body);
        if (kvOk) {
          console.log('[Config API] Successfully saved to Vercel KV');
          return res.status(200).json({ 
            success: true, 
            lastUpdated: Date.now(), 
            source: 'vercel-kv',
            message: 'Saved to Vercel KV - visible to all users'
          });
        }
        console.warn('[Config API] Vercel KV write failed');
      } else {
        console.warn('[Config API] Vercel KV not configured');
      }

      // Try Upstash Redis
      if (hasUpstashConfig) {
        console.log('[Config API] Trying Upstash Redis...');
        const redisOk = await writeToRedis(body);
        if (redisOk) {
          console.log('[Config API] Successfully saved to Upstash Redis');
          return res.status(200).json({ 
            success: true, 
            lastUpdated: Date.now(), 
            source: 'upstash',
            message: 'Saved to Upstash Redis - visible to all users'
          });
        }
        console.warn('[Config API] Upstash Redis write failed');
      } else {
        console.warn('[Config API] Upstash Redis not configured');
      }

      // Fallback for local development only
      if (!isProduction) {
        console.log('[Config API] Falling back to local file storage (development only)');
        const fileOk = writeStoredConfig(body);
        if (fileOk) {
          console.log('[Config API] Successfully saved to local file');
          return res.status(200).json({ 
            success: true, 
            lastUpdated: Date.now(), 
            source: 'file',
            warning: 'Saved to local file only - not visible to other users'
          });
        }
        console.error('[Config API] Local file write also failed');
      }

      console.error('[Config API] All storage methods failed');
      return res.status(500).json({
        success: false,
        error: 'No persistent storage available. Configure Upstash/Vercel KV environment variables for production.',
        availableStorages: {
          vercel_kv: hasVercelKvConfig,
          upstash_redis: hasUpstashConfig,
          file_storage: !isProduction
        }
      });
    })();
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
