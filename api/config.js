/**
 * Site Config API Handler - Vercel Serverless Function
 * Handles GET/PUT operations for persistent site configuration storage
 * Supports multiple backends: Vercel KV, Upstash Redis, Local File
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const CONFIG_KEY = 'site:config';
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

const storageConfig = {
  vercelKv: {
    enabled: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  },
  upstashRedis: {
    enabled: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  localFile: {
    enabled: !isProduction,
    path: path.resolve(process.cwd(), 'data', 'site-config.json'),
  },
};

console.log('[API:Config] Storage backends available:', {
  vercelKv: storageConfig.vercelKv.enabled,
  upstashRedis: storageConfig.upstashRedis.enabled,
  localFile: storageConfig.localFile.enabled,
  environment: isProduction ? 'production' : 'development',
  isVercel,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Make HTTP request to Redis/KV backend
 */
const makeRedisRequest = async (url, token, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Redis request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API:Config] Redis request error:', error?.message || error);
    throw error;
  }
};

/**
 * Read config from Vercel KV
 */
const readFromVercelKv = async () => {
  if (!storageConfig.vercelKv.enabled) return null;
  try {
    console.log('[API:Config] Reading from Vercel KV...');
    const url = `${storageConfig.vercelKv.url}/get/${CONFIG_KEY}`;
    const response = await makeRedisRequest(url, storageConfig.vercelKv.token);
    
    if (response.result) {
      return typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
    }
    return null;
  } catch (error) {
    console.error('[API:Config] Failed to read from Vercel KV:', error?.message);
    return null;
  }
};

/**
 * Write config to Vercel KV
 */
const writeToVercelKv = async (data) => {
  if (!storageConfig.vercelKv.enabled) return false;
  try {
    console.log('[API:Config] Writing to Vercel KV...');
    const url = `${storageConfig.vercelKv.url}/set/${CONFIG_KEY}`;
    const payload = {
      value: JSON.stringify(data),
      ex: 31536000, // 1 year TTL
    };
    
    await makeRedisRequest(url, storageConfig.vercelKv.token, 'POST', payload);
    console.log('[API:Config] Successfully wrote to Vercel KV');
    return true;
  } catch (error) {
    console.error('[API:Config] Failed to write to Vercel KV:', error?.message);
    return false;
  }
};

/**
 * Read config from Upstash Redis
 */
const readFromUpstashRedis = async () => {
  if (!storageConfig.upstashRedis.enabled) return null;
  try {
    console.log('[API:Config] Reading from Upstash Redis...');
    const url = `${storageConfig.upstashRedis.url}/get/${CONFIG_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${storageConfig.upstashRedis.token}`,
      },
    });
    
    if (!response.ok) {
      console.error('[API:Config] Upstash read failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data.result) {
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
    return null;
  } catch (error) {
    console.error('[API:Config] Failed to read from Upstash:', error?.message);
    return null;
  }
};

/**
 * Write config to Upstash Redis
 */
const writeToUpstashRedis = async (data) => {
  if (!storageConfig.upstashRedis.enabled) return false;
  try {
    console.log('[API:Config] Writing to Upstash Redis...');
    const configJson = JSON.stringify(data);
    const encodedValue = Buffer.from(configJson).toString('base64');
    
    // Use SET command with EX (expiry in seconds, 1 year)
    const url = `${storageConfig.upstashRedis.url}/set/${CONFIG_KEY}/${encodeURIComponent(configJson)}/EX/31536000`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${storageConfig.upstashRedis.token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[API:Config] Upstash write failed:', response.status, error);
      return false;
    }
    
    console.log('[API:Config] Successfully wrote to Upstash Redis');
    return true;
  } catch (error) {
    console.error('[API:Config] Failed to write to Upstash:', error?.message);
    return false;
  }
};

/**
 * Read config from local file (development only)
 */
const readFromLocalFile = () => {
  if (!storageConfig.localFile.enabled) return null;
  try {
    console.log('[API:Config] Reading from local file...');
    if (!fs.existsSync(storageConfig.localFile.path)) return null;
    
    const raw = fs.readFileSync(storageConfig.localFile.path, 'utf8');
    if (!raw) return null;
    
    return JSON.parse(raw);
  } catch (error) {
    console.error('[API:Config] Failed to read from local file:', error?.message);
    return null;
  }
};

/**
 * Write config to local file (development only)
 */
const writeToLocalFile = (data) => {
  if (!storageConfig.localFile.enabled) return false;
  try {
    console.log('[API:Config] Writing to local file...');
    const dir = path.dirname(storageConfig.localFile.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storageConfig.localFile.path, JSON.stringify(data, null, 2), 'utf8');
    console.log('[API:Config] Successfully wrote to local file');
    return true;
  } catch (error) {
    console.error('[API:Config] Failed to write to local file:', error?.message);
    return false;
  }
};

/**
 * Parse request body
 */
const parseRequestBody = async (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        console.warn('[API:Config] Failed to parse request body:', error?.message);
        resolve({});
      }
    });
  });
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async (req, res) => {
  // Set CORS & content type headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/config - Read configuration
    if (req.method === 'GET') {
      console.log('[API:Config] GET request received');
      
      // Try each backend in priority order
      const kvData = await readFromVercelKv();
      if (kvData) {
        console.log('[API:Config] Returning data from Vercel KV');
        return res.status(200).json({
          success: true,
          data: kvData,
          source: 'vercel-kv',
          timestamp: Date.now(),
        });
      }

      const redisData = await readFromUpstashRedis();
      if (redisData) {
        console.log('[API:Config] Returning data from Upstash Redis');
        return res.status(200).json({
          success: true,
          data: redisData,
          source: 'upstash-redis',
          timestamp: Date.now(),
        });
      }

      const fileData = readFromLocalFile();
      if (fileData) {
        console.log('[API:Config] Returning data from local file');
        return res.status(200).json({
          success: true,
          data: fileData,
          source: 'local-file',
          timestamp: Date.now(),
          warning: 'Using local file storage - not shared across instances',
        });
      }

      console.log('[API:Config] No config found, returning empty data');
      return res.status(200).json({
        success: true,
        data: {},
        source: 'none',
        timestamp: Date.now(),
      });
    }

    // PUT/POST /api/config - Write configuration
    if (req.method === 'PUT' || req.method === 'POST') {
      console.log(`[API:Config] ${req.method} request received`);
      
      const body = await parseRequestBody(req);
      
      if (!body || Object.keys(body).length === 0) {
        console.warn('[API:Config] Empty body received');
        return res.status(400).json({
          success: false,
          error: 'Request body is empty',
        });
      }

      console.log('[API:Config] Request body received, attempting to persist...');

      // Try each backend in priority order
      if (storageConfig.vercelKv.enabled) {
        const kvOk = await writeToVercelKv(body);
        if (kvOk) {
          console.log('[API:Config] Successfully persisted to Vercel KV');
          return res.status(200).json({
            success: true,
            source: 'vercel-kv',
            timestamp: Date.now(),
            message: 'Configuration saved to Vercel KV - visible to all users',
          });
        }
        console.warn('[API:Config] Vercel KV write failed, trying next backend');
      }

      if (storageConfig.upstashRedis.enabled) {
        const redisOk = await writeToUpstashRedis(body);
        if (redisOk) {
          console.log('[API:Config] Successfully persisted to Upstash Redis');
          return res.status(200).json({
            success: true,
            source: 'upstash-redis',
            timestamp: Date.now(),
            message: 'Configuration saved to Upstash Redis - visible to all users',
          });
        }
        console.warn('[API:Config] Upstash Redis write failed, trying next backend');
      }

      if (storageConfig.localFile.enabled) {
        const fileOk = writeToLocalFile(body);
        if (fileOk) {
          console.log('[API:Config] Successfully persisted to local file');
          return res.status(200).json({
            success: true,
            source: 'local-file',
            timestamp: Date.now(),
            warning: 'Configuration saved to local file only - NOT visible to other users. Configure Vercel KV or Upstash Redis for production.',
          });
        }
        console.warn('[API:Config] Local file write failed');
      }

      console.error('[API:Config] All storage backends failed');
      return res.status(503).json({
        success: false,
        error: 'All storage backends failed. Configure Vercel KV or Upstash Redis.',
        availableBackends: {
          vercelKv: storageConfig.vercelKv.enabled,
          upstashRedis: storageConfig.upstashRedis.enabled,
          localFile: storageConfig.localFile.enabled,
        },
      });
    }

    // 405 Method Not Allowed
    console.warn(`[API:Config] Unsupported method: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    });

  } catch (error) {
    console.error('[API:Config] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred',
    });
  }
};
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
