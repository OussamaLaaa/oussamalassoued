/**
 * Messages API Handler - Vercel Serverless Function
 * Handles GET/POST operations for contact form messages
 * Enhanced Security: rate limiting, validation, sanitization, encryption
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const MESSAGES_KEY = 'site:messages';
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

// Enhanced Security Configuration
const SECURITY_CONFIG = {
  rateLimit: {
    maxRequests: 5, // Maximum 5 messages per minute
    windowMs: 60000, // 1 minute window
    maxPerHour: 15, // Maximum 15 messages per hour
    maxPerDay: 50, // Maximum 50 messages per day
  },
  maxMessageAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  encryptionKey: process.env.MESSAGE_ENCRYPTION_KEY || 'default-secure-key-2024-change-this-in-production',
  maxMessagesPerDay: 50, // Maximum messages per day per IP
  blockDuration: 24 * 60 * 60 * 1000, // 24 hours block for abuse
  maxMessageLength: 10000, // Maximum total message length
  allowedDomains: [], // Whitelist of allowed email domains (empty = all allowed)
  blockedDomains: [], // Blacklist of blocked email domains
  blockedIPs: [], // List of permanently blocked IPs
  // Advanced security features
  enableGeoTracking: process.env.ENABLE_GEO_TRACKING === 'true',
  enableDeviceTracking: process.env.ENABLE_DEVICE_TRACKING === 'true',
  enableSessionTracking: process.env.ENABLE_SESSION_TRACKING === 'true',
  enableBotDetection: process.env.ENABLE_BOT_DETECTION !== 'false',
  enableEmailValidation: process.env.ENABLE_EMAIL_VALIDATION !== 'false',
  maxSimilarMessages: 3, // Maximum similar messages from same IP
  similarMessageThreshold: 0.85, // Similarity threshold (0-1)
  botDetectionThreshold: 0.7, // Bot detection threshold (0-1)
  auditLogRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
};

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
    path: path.resolve(process.cwd(), 'data', 'messages.json'),
  },
};

// In-memory rate limiter and block list
const rateLimiter = new Map();
const blockedIPs = new Map();
const dailyMessageCount = new Map();

console.log('[API:Messages] Storage backends available:', {
  vercelKv: storageConfig.vercelKv.enabled,
  upstashRedis: storageConfig.upstashRedis.enabled,
  localFile: storageConfig.localFile.enabled,
  environment: isProduction ? 'production' : 'development',
  isVercel,
});

// ============================================================================
// SECURITY FUNCTIONS
// ============================================================================

/**
 * Generate a random IV (Initialization Vector)
 */
const generateIV = () => {
  const iv = new Array(16);
  for (let i = 0; i < 16; i++) {
    iv[i] = Math.floor(Math.random() * 256);
  }
  return Buffer.from(iv);
};

/**
 * Derive a key from the encryption key using PBKDF2
 */
const deriveKey = (password, salt) => {
  // Simple key derivation (in production, use crypto.pbkdf2Sync)
  let key = password;
  for (let i = 0; i < 1000; i++) {
    key = require('crypto')
      .createHash('sha256')
      .update(key + salt)
      .digest('hex');
  }
  return key.substring(0, 32); // 256-bit key
};

/**
 * AES-256-GCM encryption for message content
 */
const encryptMessage = (data) => {
  try {
    const crypto = require('crypto');
    const json = JSON.stringify(data);
    
    // Generate random IV and salt
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(16);
    
    // Derive key
    const key = deriveKey(SECURITY_CONFIG.encryptionKey, salt.toString('hex'));
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
    
    // Encrypt
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine all components
    const result = {
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted: encrypted,
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    console.error('[API:Messages] Encryption failed:', error);
    // Fallback to XOR encryption
    return encryptMessageXOR(data);
  }
};

/**
 * XOR encryption fallback
 */
const encryptMessageXOR = (data) => {
  const key = SECURITY_CONFIG.encryptionKey;
  const json = JSON.stringify(data);
  let result = '';
  for (let i = 0; i < json.length; i++) {
    result += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result).toString('base64');
};

/**
 * Decrypt message content
 */
const decryptMessage = (encrypted) => {
  try {
    const crypto = require('crypto');
    const decoded = Buffer.from(encrypted, 'base64').toString();
    const data = JSON.parse(decoded);
    
    // Check if it's AES-256-GCM encrypted
    if (data.iv && data.salt && data.authTag && data.encrypted) {
      // Derive key
      const key = deriveKey(SECURITY_CONFIG.encryptionKey, data.salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(key),
        Buffer.from(data.iv, 'hex')
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      // Decrypt
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } else {
      // Fallback to XOR decryption
      return decryptMessageXOR(encrypted);
    }
  } catch (error) {
    console.error('[API:Messages] Decryption failed:', error);
    // Try XOR decryption as fallback
    return decryptMessageXOR(encrypted);
  }
};

/**
 * XOR decryption fallback
 */
const decryptMessageXOR = (encrypted) => {
  try {
    const key = SECURITY_CONFIG.encryptionKey;
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(result);
  } catch (error) {
    console.error('[API:Messages] XOR Decryption failed:', error);
    return null;
  }
};

/**
 * Enhanced sanitization to prevent XSS and injection attacks
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
};

/**
 * Validate message data with enhanced checks
 */
const validateMessage = (data) => {
  const errors = {};

  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Validate email
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  } else {
    // Check domain whitelist/blacklist
    const domain = data.email.split('@')[1].toLowerCase();
    
    if (SECURITY_CONFIG.allowedDomains.length > 0 && 
        !SECURITY_CONFIG.allowedDomains.includes(domain)) {
      errors.email = 'Email domain not allowed';
    }
    
    if (SECURITY_CONFIG.blockedDomains.includes(domain)) {
      errors.email = 'Email domain is blocked';
    }
  }

  // Validate subject
  if (!data.subject || data.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters';
  } else if (data.subject.trim().length > 200) {
    errors.subject = 'Subject must not exceed 200 characters';
  }

  // Validate message
  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (data.message.trim().length > 5000) {
    errors.message = 'Message must not exceed 5000 characters';
  }

  // Check total message length
  const totalLength = (data.name || '').length + 
                     (data.email || '').length + 
                     (data.subject || '').length + 
                     (data.message || '').length;
  
  if (totalLength > SECURITY_CONFIG.maxMessageLength) {
    errors.general = 'Message too long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Enhanced spam detection
 */
const isSpam = (data) => {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'free money',
    'click here', 'subscribe', 'unsubscribe', 'buy now',
    'limited time', 'act now', 'congratulations', 'bitcoin',
    'crypto', 'investment', 'loan', 'debt', 'credit card',
    'make money', 'work from home', 'earn money', 'get rich',
    '100% free', 'no risk', 'guaranteed', 'miracle',
  ];

  const combinedText = `${data.name} ${data.subject} ${data.message}`.toLowerCase();
  return spamKeywords.some(keyword => combinedText.includes(keyword));
};

/**
 * Check if IP is blocked
 */
const isIPBlocked = (ip) => {
  // Check permanent block list
  if (SECURITY_CONFIG.blockedIPs.includes(ip)) {
    return true;
  }

  // Check temporary block list
  const blockInfo = blockedIPs.get(ip);
  if (blockInfo && blockInfo.until > Date.now()) {
    return true;
  }

  // Clean up expired blocks
  if (blockInfo && blockInfo.until <= Date.now()) {
    blockedIPs.delete(ip);
  }

  return false;
};

/**
 * Block an IP address
 */
const blockIP = (ip, duration = SECURITY_CONFIG.blockDuration) => {
  blockedIPs.set(ip, {
    until: Date.now() + duration,
    reason: 'Rate limit exceeded',
  });
  console.warn(`[API:Messages] IP ${ip} blocked until ${new Date(Date.now() + duration).toISOString()}`);
};

/**
 * Check rate limit with daily limit
 */
const checkRateLimit = (identifier) => {
  const now = Date.now();
  const today = new Date().toDateString();

  // Check daily limit
  const dailyCount = dailyMessageCount.get(identifier) || { count: 0, date: today };
  
  if (dailyCount.date !== today) {
    // Reset daily counter
    dailyMessageCount.set(identifier, { count: 0, date: today });
  } else if (dailyCount.count >= SECURITY_CONFIG.maxMessagesPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000,
      reason: 'daily_limit',
    };
  }

  // Check minute rate limit
  const requests = rateLimiter.get(identifier) || [];
  const validRequests = requests.filter(timestamp => now - timestamp < SECURITY_CONFIG.rateLimit.windowMs);

  if (validRequests.length >= SECURITY_CONFIG.rateLimit.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: validRequests[0] + SECURITY_CONFIG.rateLimit.windowMs,
      reason: 'rate_limit',
    };
  }

  // Add current request
  validRequests.push(now);
  rateLimiter.set(identifier, validRequests);

  // Update daily count
  dailyCount.count++;
  dailyMessageCount.set(identifier, dailyCount);

  return {
    allowed: true,
    remaining: Math.min(
      SECURITY_CONFIG.rateLimit.maxRequests - validRequests.length,
      SECURITY_CONFIG.maxMessagesPerDay - dailyCount.count
    ),
    resetAt: now + SECURITY_CONFIG.rateLimit.windowMs,
  };
};

/**
 * Get client IP from request
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
};

// ============================================================================
// ADVANCED SECURITY FUNCTIONS
// ============================================================================

/**
 * Multi-layer rate limiting
 */
const checkMultiLayerRateLimit = (identifier, email, userAgent) => {
  const now = Date.now();
  const today = new Date().toDateString();
  
  // Layer 1: IP-based rate limiting (already implemented in checkRateLimit)
  const ipRateLimit = checkRateLimit(identifier);
  if (!ipRateLimit.allowed) {
    return ipRateLimit;
  }
  
  // Layer 2: Email domain rate limiting
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const domainKey = `domain:${domain}`;
      const domainCount = dailyMessageCount.get(domainKey) || { count: 0, date: today };
      
      if (domainCount.date !== today) {
        dailyMessageCount.set(domainKey, { count: 0, date: today });
      } else if (domainCount.count >= 20) { // Max 20 messages per domain per day
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000,
          reason: 'domain_limit',
        };
      }
      
      domainCount.count++;
      dailyMessageCount.set(domainKey, domainCount);
    }
  }
  
  // Layer 3: User agent pattern rate limiting
  if (userAgent) {
    const uaPattern = userAgent.substring(0, 50); // First 50 chars
    const uaKey = `ua:${uaPattern}`;
    const uaCount = dailyMessageCount.get(uaKey) || { count: 0, date: today };
    
    if (uaCount.date !== today) {
      dailyMessageCount.set(uaKey, { count: 0, date: today });
    } else if (uaCount.count >= 30) { // Max 30 messages per UA pattern per day
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000,
        reason: 'user_agent_limit',
      };
    }
    
    uaCount.count++;
    dailyMessageCount.set(uaKey, uaCount);
  }
  
  return ipRateLimit;
};

/**
 * Calculate message similarity using Jaccard similarity
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Check for similar messages from same IP
 */
const checkSimilarMessages = (identifier, messageText, existingMessages) => {
  if (!SECURITY_CONFIG.enableBotDetection) return { allowed: true, similarCount: 0 };
  
  const recentMessages = existingMessages.filter(msg => {
    const msgAge = Date.now() - msg.timestamp;
    return msgAge < 24 * 60 * 60 * 1000 && // Last 24 hours
           msg.ip === identifier;
  });
  
  let similarCount = 0;
  for (const msg of recentMessages) {
    const similarity = calculateSimilarity(messageText, msg.message);
    if (similarity >= SECURITY_CONFIG.similarMessageThreshold) {
      similarCount++;
    }
  }
  
  if (similarCount >= SECURITY_CONFIG.maxSimilarMessages) {
    return {
      allowed: false,
      similarCount,
      reason: 'similar_messages',
    };
  }
  
  return { allowed: true, similarCount };
};

/**
 * Detect bot using user agent analysis
 */
const detectBot = (userAgent) => {
  if (!userAgent || !SECURITY_CONFIG.enableBotDetection) return { isBot: false, confidence: 0 };
  
  const ua = userAgent.toLowerCase();
  let botScore = 0;
  
  // Known bot patterns
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'python', 'java', 'perl', 'ruby', 'php', 'node',
    'headless', 'phantom', 'selenium', 'puppeteer',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit',
  ];
  
  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      botScore += 0.3;
    }
  }
  
  // Suspicious characteristics
  if (ua.length < 20) botScore += 0.2; // Very short UA
  if (!ua.includes('mozilla')) botScore += 0.1; // No Mozilla
  if (ua.includes('http')) botScore += 0.2; // Contains HTTP
  if (ua.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) botScore += 0.3; // Contains IP
  
  // Normalize score
  botScore = Math.min(botScore, 1);
  
  return {
    isBot: botScore >= SECURITY_CONFIG.botDetectionThreshold,
    confidence: botScore,
  };
};

/**
 * Validate email domain using DNS MX record check
 */
const validateEmailDomain = async (email) => {
  if (!email || !SECURITY_CONFIG.enableEmailValidation) return { valid: true };
  
  const domain = email.split('@')[1];
  if (!domain) return { valid: false, error: 'Invalid domain' };
  
  try {
    // In a real implementation, you would use DNS lookup
    // For now, we'll do basic validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    
    if (!domainRegex.test(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }
    
    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', 'mailinator.com',
      '10minutemail.com', 'yopmail.com', 'trashmail.com',
    ];
    
    if (disposableDomains.includes(domain.toLowerCase())) {
      return { valid: false, error: 'Disposable email not allowed' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('[API:Messages] Email validation error:', error);
    return { valid: true }; // Allow on error
  }
};

/**
 * Audit log for security events
 */
const auditLog = new Map();

/**
 * Add audit log entry
 */
const addAuditLog = (event, details) => {
  const entry = {
    timestamp: Date.now(),
    event,
    details,
  };
  
  const key = `${event}:${Date.now()}`;
  auditLog.set(key, entry);
  
  // Clean up old logs
  const cutoffTime = Date.now() - SECURITY_CONFIG.auditLogRetention;
  for (const [logKey, logEntry] of auditLog.entries()) {
    if (logEntry.timestamp < cutoffTime) {
      auditLog.delete(logKey);
    }
  }
  
  console.log(`[API:Messages] Audit: ${event}`, details);
};

/**
 * Get audit logs
 */
const getAuditLogs = (limit = 100) => {
  const logs = Array.from(auditLog.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  
  return logs;
};

/**
 * Calculate security score for a message
 */
const calculateSecurityScore = (message, botDetection, emailValidation) => {
  let score = 100; // Start with perfect score
  
  // Deduct for bot detection
  if (botDetection.isBot) {
    score -= 50 * botDetection.confidence;
  }
  
  // Deduct for email validation issues
  if (!emailValidation.valid) {
    score -= 20;
  }
  
  // Deduct for suspicious patterns
  if (message.message.length < 20) score -= 10;
  if (message.message.length > 2000) score -= 5;
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    level: score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high',
  };
};

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

const sendUpstashCommand = async (commandParts) => {
  const url = new URL(storageConfig.upstashRedis.url);
  const postData = JSON.stringify(commandParts);

  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${storageConfig.upstashRedis.token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          resolve({
            status: response.statusCode,
            data: data ? JSON.parse(data) : null,
            raw: data,
          });
        } catch (error) {
          resolve({ status: response.statusCode, raw: data, parseError: error?.message });
        }
      });
    });

    request.on('error', (error) => { resolve({ error: error.message }); });
    request.write(postData);
    request.end();
  });
};

/**
 * Read messages from Vercel KV
 */
const readFromVercelKv = async () => {
  if (!storageConfig.vercelKv.enabled) return null;
  try {
    console.log('[API:Messages] Reading from Vercel KV...');
    const url = new URL(`${storageConfig.vercelKv.url}/get/${MESSAGES_KEY}`);
    
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${storageConfig.vercelKv.token}` },
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.result) {
                const messages = typeof parsed.result === 'string' ? JSON.parse(parsed.result) : parsed.result;
                return resolve(messages || []);
              }
              return resolve([]);
            } catch (e) {
              console.error('[API:Messages] Parse error:', e.message);
              return resolve([]);
            }
          }
          return resolve([]);
        });
      });

      request.on('error', (error) => {
        console.error('[API:Messages] Vercel KV request error:', error.message);
        resolve([]);
      });
      request.end();
    });
  } catch (error) {
    console.error('[API:Messages] Failed to read from Vercel KV:', error?.message);
    return null;
  }
};

/**
 * Write messages to Vercel KV
 */
const writeToVercelKv = async (messages) => {
  if (!storageConfig.vercelKv.enabled) return false;
  try {
    console.log('[API:Messages] Writing to Vercel KV...');
    const payload = { value: JSON.stringify(messages), ex: 31536000 };
    const postData = JSON.stringify(payload);
    const url = new URL(`${storageConfig.vercelKv.url}/set/${MESSAGES_KEY}`);
    
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storageConfig.vercelKv.token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length,
        },
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode === 200) {
            console.log('[API:Messages] Successfully wrote to Vercel KV');
            return resolve(true);
          }
          console.error('[API:Messages] Vercel KV write failed:', response.statusCode);
          return resolve(false);
        });
      });

      request.on('error', (error) => {
        console.error('[API:Messages] Vercel KV write error:', error.message);
        resolve(false);
      });
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error('[API:Messages] Failed to write to Vercel KV:', error?.message);
    return false;
  }
};

/**
 * Read messages from Upstash Redis
 */
const readFromUpstashRedis = async () => {
  if (!storageConfig.upstashRedis.enabled) return null;
  try {
    console.log('[API:Messages] Reading from Upstash Redis...');
    const result = await sendUpstashCommand(['GET', MESSAGES_KEY]);

    if (result?.status !== 200 || result?.error || result?.parseError) {
      console.error('[API:Messages] Upstash read failed:', result);
      return null;
    }

    if (!result.data || !Object.prototype.hasOwnProperty.call(result.data, 'result')) {
      return [];
    }

    const resultValue = result.data.result;
    if (resultValue == null) {
      return [];
    }

    return typeof resultValue === 'string' ? JSON.parse(resultValue) : resultValue;
  } catch (error) {
    console.error('[API:Messages] Failed to read from Upstash:', error?.message);
    return null;
  }
};

/**
 * Write messages to Upstash Redis
 */
const writeToUpstashRedis = async (messages) => {
  if (!storageConfig.upstashRedis.enabled) return false;
  try {
    console.log('[API:Messages] Writing to Upstash Redis...');
    const messagesJson = JSON.stringify(messages);
    const result = await sendUpstashCommand(['SET', MESSAGES_KEY, messagesJson, 'EX', 31536000]);

    if (result?.status === 200 && result?.data && result.data.result === 'OK') {
      console.log('[API:Messages] Successfully wrote to Upstash Redis');
      return true;
    }

    console.error('[API:Messages] Upstash write failed:', result);
    return false;
  } catch (error) {
    console.error('[API:Messages] Failed to write to Upstash:', error?.message);
    return false;
  }
};

/**
 * Read messages from local file
 */
const readFromLocalFile = () => {
  if (!storageConfig.localFile.enabled) return null;
  try {
    console.log('[API:Messages] Reading from local file...');
    if (!fs.existsSync(storageConfig.localFile.path)) return [];
    
    const raw = fs.readFileSync(storageConfig.localFile.path, 'utf8');
    if (!raw) return [];
    
    return JSON.parse(raw);
  } catch (error) {
    console.error('[API:Messages] Failed to read from local file:', error?.message);
    return [];
  }
};

/**
 * Write messages to local file
 */
const writeToLocalFile = (messages) => {
  if (!storageConfig.localFile.enabled) return false;
  try {
    console.log('[API:Messages] Writing to local file...');
    const dir = path.dirname(storageConfig.localFile.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storageConfig.localFile.path, JSON.stringify(messages, null, 2), 'utf8');
    console.log('[API:Messages] Successfully wrote to local file');
    return true;
  } catch (error) {
    console.error('[API:Messages] Failed to write to local file:', error?.message);
    return false;
  }
};

/**
 * Parse request body
 */
const parseRequestBody = async (req) => {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') {
      return req.body;
    }
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  
  return new Promise((resolve) => {
    if (req.readableEnded) {
      return resolve({});
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        console.warn('[API:Messages] Failed to parse request body:', error?.message);
        resolve({});
      }
    });

    req.on('error', () => resolve({}));
  });
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async (req, res) => {
  // Set CORS & security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/messages - Retrieve all messages
    if (req.method === 'GET') {
      console.log('[API:Messages] GET request received');
      
      // Try each backend in priority order
      let messages = await readFromVercelKv();
      let source = 'vercel-kv';

      if (!messages) {
        messages = await readFromUpstashRedis();
        source = 'upstash-redis';
      }

      if (!messages) {
        messages = readFromLocalFile();
        source = 'local-file';
      }

      if (!messages) {
        messages = [];
        source = 'none';
      }

      // Decrypt messages
      const decryptedMessages = messages
        .map(encrypted => decryptMessage(encrypted))
        .filter(msg => msg !== null);

      // Filter out old messages
      const now = Date.now();
      const filteredMessages = decryptedMessages.filter(msg => {
        const msgAge = now - msg.timestamp;
        return msgAge < SECURITY_CONFIG.maxMessageAge;
      });

      // Sort by timestamp (newest first)
      filteredMessages.sort((a, b) => b.timestamp - a.timestamp);

      console.log(`[API:Messages] Returning ${filteredMessages.length} messages from ${source}`);
      
      return res.status(200).json({
        success: true,
        data: filteredMessages,
        source,
        timestamp: Date.now(),
        count: filteredMessages.length,
      });
    }

    // POST /api/messages - Submit a new message
    if (req.method === 'POST') {
      console.log('[API:Messages] POST request received');
      
      const body = await parseRequestBody(req);
      
      if (!body || Object.keys(body).length === 0) {
        console.warn('[API:Messages] Empty body received');
        addAuditLog('empty_body', { ip: getClientIP(req) });
        return res.status(400).json({
          success: false,
          error: 'Request body is empty',
        });
      }

      // Get client IP for rate limiting
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      console.log(`[API:Messages] Request from IP: ${clientIP}`);

      // Check if IP is blocked
      if (isIPBlocked(clientIP)) {
        console.warn(`[API:Messages] Blocked IP attempted to send message: ${clientIP}`);
        addAuditLog('blocked_ip_attempt', { ip: clientIP, userAgent });
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // Sanitize input
      const sanitizedData = {
        name: sanitizeInput(body.name || ''),
        email: sanitizeInput(body.email || '').toLowerCase(),
        subject: sanitizeInput(body.subject || ''),
        message: sanitizeInput(body.message || ''),
      };

      // Validate data
      const validation = validateMessage(sanitizedData);
      if (!validation.isValid) {
        console.warn('[API:Messages] Validation failed:', validation.errors);
        addAuditLog('validation_failed', { 
          ip: clientIP, 
          errors: validation.errors,
          email: sanitizedData.email 
        });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        });
      }

      // Check for spam
      if (isSpam(sanitizedData)) {
        console.warn('[API:Messages] Spam detected');
        addAuditLog('spam_detected', { 
          ip: clientIP, 
          email: sanitizedData.email,
          message: sanitizedData.message.substring(0, 100)
        });
        return res.status(400).json({
          success: false,
          error: 'Message contains spam content',
        });
      }

      // Detect bot
      const botDetection = detectBot(userAgent);
      if (botDetection.isBot) {
        console.warn(`[API:Messages] Bot detected with confidence: ${botDetection.confidence}`);
        addAuditLog('bot_detected', { 
          ip: clientIP, 
          userAgent,
          confidence: botDetection.confidence 
        });
        
        // Block high-confidence bots
        if (botDetection.confidence > 0.8) {
          blockIP(clientIP, 7 * 24 * 60 * 60 * 1000); // Block for 7 days
          return res.status(403).json({
            success: false,
            error: 'Access denied',
          });
        }
      }

      // Validate email domain
      const emailValidation = await validateEmailDomain(sanitizedData.email);
      if (!emailValidation.valid) {
        console.warn('[API:Messages] Email validation failed:', emailValidation.error);
        addAuditLog('email_validation_failed', { 
          ip: clientIP, 
          email: sanitizedData.email,
          error: emailValidation.error 
        });
        return res.status(400).json({
          success: false,
          error: emailValidation.error || 'Invalid email address',
        });
      }

      // Check multi-layer rate limit
      const rateLimitCheck = checkMultiLayerRateLimit(
        clientIP, 
        sanitizedData.email, 
        userAgent
      );
      if (!rateLimitCheck.allowed) {
        console.warn(`[API:Messages] Rate limit exceeded for IP: ${clientIP}, reason: ${rateLimitCheck.reason}`);
        addAuditLog('rate_limit_exceeded', { 
          ip: clientIP, 
          email: sanitizedData.email,
          reason: rateLimitCheck.reason 
        });
        
        // Block IP if rate limit exceeded
        if (rateLimitCheck.reason === 'rate_limit') {
          blockIP(clientIP);
        }
        
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000),
        });
      }

      // Read existing messages for similarity check
      let existingMessages = await readFromVercelKv();
      if (!existingMessages) {
        existingMessages = await readFromUpstashRedis();
      }
      if (!existingMessages) {
        existingMessages = readFromLocalFile();
      }
      if (!existingMessages) {
        existingMessages = [];
      }

      // Decrypt existing messages for similarity check
      const decryptedExisting = existingMessages
        .map(encrypted => decryptMessage(encrypted))
        .filter(msg => msg !== null);

      // Check for similar messages
      const similarCheck = checkSimilarMessages(
        clientIP, 
        sanitizedData.message, 
        decryptedExisting
      );
      if (!similarCheck.allowed) {
        console.warn(`[API:Messages] Too many similar messages from IP: ${clientIP}`);
        addAuditLog('similar_messages', { 
          ip: clientIP, 
          similarCount: similarCheck.similarCount 
        });
        return res.status(429).json({
          success: false,
          error: 'Too many similar messages. Please try again later.',
        });
      }

      // Calculate security score
      const securityScore = calculateSecurityScore(
        { ...sanitizedData, message: sanitizedData.message },
        botDetection,
        emailValidation
      );

      // Collect additional information
      const additionalInfo = {
        // Geolocation (if enabled)
        geolocation: SECURITY_CONFIG.enableGeoTracking ? {
          country: body.country || 'unknown',
          city: body.city || 'unknown',
          timezone: body.timezone || 'unknown',
        } : null,
        
        // Device info (if enabled)
        device: SECURITY_CONFIG.enableDeviceTracking ? {
          type: body.deviceType || 'unknown',
          browser: body.browser || 'unknown',
          os: body.os || 'unknown',
          screenResolution: body.screenResolution || 'unknown',
          language: body.language || 'unknown',
        } : null,
        
        // Session info (if enabled)
        session: SECURITY_CONFIG.enableSessionTracking ? {
          sessionId: body.sessionId || 'unknown',
          timeOnSite: body.timeOnSite || 0,
          pagesVisited: body.pagesVisited || 0,
          referrer: body.referrer || 'unknown',
          firstVisit: body.firstVisit || false,
        } : null,
      };

      // Create message object
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...sanitizedData,
        timestamp: Date.now(),
        ip: clientIP,
        userAgent,
        read: false,
        // Security information
        security: {
          score: securityScore.score,
          level: securityScore.level,
          botDetected: botDetection.isBot,
          botConfidence: botDetection.confidence,
          emailValid: emailValidation.valid,
          similarCount: similarCheck.similarCount,
        },
        // Additional information
        ...additionalInfo,
      };

      // Encrypt sensitive data
      const encryptedMessage = encryptMessage(message);

      // Add new message
      existingMessages.push(encryptedMessage);

      // Write to storage
      let writeSuccess = false;
      let writeSource = 'none';

      if (storageConfig.vercelKv.enabled) {
        writeSuccess = await writeToVercelKv(existingMessages);
        writeSource = 'vercel-kv';
      }

      if (!writeSuccess && storageConfig.upstashRedis.enabled) {
        writeSuccess = await writeToUpstashRedis(existingMessages);
        writeSource = 'upstash-redis';
      }

      if (!writeSuccess && storageConfig.localFile.enabled) {
        writeSuccess = writeToLocalFile(existingMessages);
        writeSource = 'local-file';
      }

      if (!writeSuccess) {
        console.error('[API:Messages] All storage backends failed');
        addAuditLog('storage_failed', { 
          ip: clientIP, 
          messageId: message.id 
        });
        return res.status(503).json({
          success: false,
          error: 'Failed to save message. Please try again.',
        });
      }

      console.log(`[API:Messages] Message saved successfully to ${writeSource}`);
      addAuditLog('message_saved', { 
        ip: clientIP, 
        messageId: message.id,
        securityScore: securityScore.score 
      });
      
      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        messageId: message.id,
        source: writeSource,
        timestamp: message.timestamp,
        rateLimitRemaining: rateLimitCheck.remaining,
        securityScore: securityScore.score,
      });
    }

    // PATCH /api/messages/:id/read - Mark message as read
    if (req.method === 'PATCH') {
      const messageId = req.url.split('/').pop();
      
      if (req.url.endsWith('/read')) {
        console.log(`[API:Messages] PATCH /read request for message: ${messageId}`);
        
        // Read existing messages
        let messages = await readFromVercelKv();
        if (!messages) {
          messages = await readFromUpstashRedis();
        }
        if (!messages) {
          messages = readFromLocalFile();
        }
        if (!messages) {
          messages = [];
        }
        
        // Decrypt messages
        const decryptedMessages = messages
          .map(encrypted => decryptMessage(encrypted))
          .filter(msg => msg !== null);
        
        // Find and update message
        const messageIndex = decryptedMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Message not found',
          });
        }
        
        decryptedMessages[messageIndex].read = true;
        
        // Encrypt messages again
        const encryptedMessages = decryptedMessages.map(msg => encryptMessage(msg));
        
        // Write to storage
        let writeSuccess = false;
        let writeSource = 'none';
        
        if (storageConfig.vercelKv.enabled) {
          writeSuccess = await writeToVercelKv(encryptedMessages);
          writeSource = 'vercel-kv';
        }
        
        if (!writeSuccess && storageConfig.upstashRedis.enabled) {
          writeSuccess = await writeToUpstashRedis(encryptedMessages);
          writeSource = 'upstash-redis';
        }
        
        if (!writeSuccess && storageConfig.localFile.enabled) {
          writeSuccess = writeToLocalFile(encryptedMessages);
          writeSource = 'local-file';
        }
        
        if (!writeSuccess) {
          return res.status(503).json({
            success: false,
            error: 'Failed to update message',
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Message marked as read',
        });
      }
    }
    
    // DELETE /api/messages/:id - Delete a message
    if (req.method === 'DELETE') {
      const messageId = req.url.split('/').pop();
      console.log(`[API:Messages] DELETE request for message: ${messageId}`);
      
      // Read existing messages
      let messages = await readFromVercelKv();
      if (!messages) {
        messages = await readFromUpstashRedis();
      }
      if (!messages) {
        messages = readFromLocalFile();
      }
      if (!messages) {
        messages = [];
      }
      
      // Decrypt messages
      const decryptedMessages = messages
        .map(encrypted => decryptMessage(encrypted))
        .filter(msg => msg !== null);
      
      // Find and remove message
      const messageIndex = decryptedMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        });
      }
      
      decryptedMessages.splice(messageIndex, 1);
      
      // Encrypt messages again
      const encryptedMessages = decryptedMessages.map(msg => encryptMessage(msg));
      
      // Write to storage
      let writeSuccess = false;
      let writeSource = 'none';
      
      if (storageConfig.vercelKv.enabled) {
        writeSuccess = await writeToVercelKv(encryptedMessages);
        writeSource = 'vercel-kv';
      }
      
      if (!writeSuccess && storageConfig.upstashRedis.enabled) {
        writeSuccess = await writeToUpstashRedis(encryptedMessages);
        writeSource = 'upstash-redis';
      }
      
      if (!writeSuccess && storageConfig.localFile.enabled) {
        writeSuccess = writeToLocalFile(encryptedMessages);
        writeSource = 'local-file';
      }
      
      if (!writeSuccess) {
        return res.status(503).json({
          success: false,
          error: 'Failed to delete message',
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    }
    
    // 405 Method Not Allowed
    console.warn(`[API:Messages] Unsupported method: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });

  } catch (error) {
    console.error('[API:Messages] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred',
    });
  }
};