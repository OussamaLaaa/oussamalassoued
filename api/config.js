/**
 * API Endpoint for Site Configuration
 * Vercel Serverless Function
 * Handles GET (read) and PUT (update) operations for site config
 * Uses Upstash Redis for persistent storage
 */

const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Load default config
const defaultConfig = {};

// Authentication password (should be in environment variables in production)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '00000008';
const DASHBOARD_SESSION_SECRET = process.env.DASHBOARD_SESSION_SECRET || DASHBOARD_PASSWORD;
const AUTH_COOKIE_NAME = 'dashboard_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

// Initialize Redis client
let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

/**
 * Get site config from Redis or return default
 */
async function getSiteConfig() {
  if (!redis) {
    console.warn('Redis not initialized, returning default config');
    return defaultConfig;
  }

  try {
    const config = await redis.get('site-config');
    if (config) {
      return config;
    }
    return defaultConfig;
  } catch (error) {
    console.error('Failed to get config from Redis:', error);
    return defaultConfig;
  }
}

/**
 * Save site config to Redis
 */
async function saveSiteConfig(config) {
  if (!redis) {
    console.warn('Redis not initialized, config not saved');
    return false;
  }

  try {
    await redis.set('site-config', config);
    return true;
  } catch (error) {
    console.error('Failed to save config to Redis:', error);
    return false;
  }
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) return accumulator;
      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  const [issuedAt, signature] = token.split('.');
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', DASHBOARD_SESSION_SECRET)
    .update(issuedAt)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) return false;

  const isSignatureValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!isSignatureValid) return false;

  const issuedAtNumber = Number.parseInt(issuedAt, 10);
  if (!Number.isFinite(issuedAtNumber)) return false;

  return Date.now() - issuedAtNumber <= SESSION_MAX_AGE_SECONDS * 1000;
}

function isAuthenticatedRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[AUTH_COOKIE_NAME]);
}

/**
 * GET /api/config
 * Returns the current site configuration
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const config = await getSiteConfig();
      return res.status(200).json({
        success: true,
        data: config,
        lastUpdated: Date.now(),
        version: '1.0.0',
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration',
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({
          success: false,
          error: 'Missing or invalid dashboard session',
        });
      }

      // Parse request body
      const body = req.body;
      
      // Validate the config structure
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
        });
      }

      // Save to Redis
      const saved = await saveSiteConfig(body);
      if (!saved) {
        return res.status(500).json({
          success: false,
          error: 'Failed to save configuration to database',
        });
      }

      console.log('Site config updated at:', new Date().toISOString());

      return res.status(200).json({
        success: true,
        lastUpdated: Date.now(),
        version: '1.0.0',
      });
    } catch (error) {
      console.error('Error updating config:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
};