/**
 * Messages API Handler - Vercel Serverless Function
 * Handles GET/POST operations for contact form messages
 * Enhanced Security: rate limiting, validation, sanitization, encryption
 * Email Notifications: Powered by Resend
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { Resend } from 'resend';
import UAParser from 'ua-parser-js';

// Basic security configuration (defaults for local testing)
const SECURITY_CONFIG = {
  encryptionKey: process.env.MESSAGE_ENCRYPTION_KEY || 'dev_secret_key',
  allowedDomains: [],
  blockedDomains: [],
  blockedIPs: [],
  blockDuration: 1000 * 60 * 60, // 1 hour
  maxMessagesPerDay: 200,
  maxMessageLength: 100000,
  maxMessageAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  rateLimit: { windowMs: 60 * 1000, maxRequests: 6 },
};
const REQUEST_TIMEOUT_MS = 4000;

// Load environment variables (development only)
// Vercel automatically loads from Environment Variables dashboard
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (error) {
    console.log('[API:Messages] dotenv not needed in production');
  }
}

const generateEmailTemplate = (messageData) => {
  const { name, email, subject, message, timestamp, ip, ua, company } = messageData;
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const escapedName = escapeHtml(name || '');
  const escapedEmail = escapeHtml(email || '');
  const escapedSubject = escapeHtml(subject || '');
  const escapedCompany = escapeHtml(company || '');
  const escapedMessage = escapeHtml(message || '').replace(/\n/g, '<br>');
  const brandUrl = process.env.SITE_URL || 'https://www.oussamalassoued.me';
  const logoUrl = `${brandUrl}/logo-black.png`;
  const pageHref = escapeHtml(messageData.referer || brandUrl);
  const replyLabel = escapedName.split(' ')[0] || 'Sender';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body,table,td,a{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img{ -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    table{ border-collapse:collapse !important; }
    body{ width:100% !important; height:100% !important; margin:0; padding:0; }
    @media only screen and (max-width:600px){
      .container{ width:100% !important; padding:12px !important; }
      .stack{ display:block !important; width:100% !important; }
      .button-spacer{ display:block !important; height:10px !important; }
      .footer-right{ text-align:left !important; padding-top:12px !important; }
    }
    .card{ background:#ffffff; border-radius:16px; box-shadow:0 8px 30px rgba(17,24,39,0.06); overflow:hidden; }
    .label{ font-size:11px; text-transform:uppercase; color:#9ca3af; letter-spacing:0.08em; }
    .value{ color:#111827; font-size:15px; line-height:1.45; }
    .muted{ color:#6b7280; }
    .pill{ display:inline-block; padding:7px 12px; border-radius:999px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700; font-size:12px; }
    .btn{ display:inline-block; padding:11px 14px; border-radius:10px; text-decoration:none; font-weight:700; font-size:13px; }
    .btn-primary{ background:#111827; color:#ffffff; }
    .btn-secondary{ background:#ffffff; color:#ffffff; border:1px solid #e5e7eb; }
    .message-box{ background:#fafafa; border:1px solid #eceef3; border-radius:14px; padding:18px 20px; color:#111827; }
    .footer-note{ color:#9ca3af; font-size:12px; line-height:1.5; }
  </style>
</head>
<body style="background:#f3f4f6; margin:0; padding:24px 12px;">
  <center>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; margin:0 auto;" class="container">
      <tr>
        <td style="padding:0 4px 12px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;">
                <a href="${brandUrl}" style="text-decoration:none; color:#111827; display:inline-block; vertical-align:middle;">
                  <img src="${logoUrl}" alt="Oussama Lassoued" width="40" height="40" style="display:inline-block; vertical-align:middle; border-radius:8px; margin-right:12px;">
                  <span style="font-size:15px; font-weight:700; vertical-align:middle; line-height:40px;">oussamalassoued.me</span>
                </a>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span class="pill">New submission</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card">
            <tr>
              <td style="padding:28px 28px 22px 28px;">
                <h1 style="margin:0 0 8px 0; font-size:24px; line-height:1.25; color:#111827; font-weight:700;">New message from ${escapedName || 'a visitor'}</h1>
                <p style="margin:0; color:#6b7280; font-size:15px; line-height:1.55;">You've received a new contact form submission. Reply directly to this email to respond to the sender.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                  <tr>
                    <td class="stack" style="padding-right:10px;">
                      <a href="mailto:${escapedEmail}" class="btn btn-primary">↩ Reply to ${replyLabel}</a>
                    </td>
                    <td class="stack">
                      <a href="${pageHref}" class="btn btn-secondary">↗ View page</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #eef2f7; padding:24px 28px;">
                <p style="margin:0 0 16px 0;" class="label">Sender</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50%" class="stack" style="vertical-align:top; padding-right:12px; padding-bottom:16px;">
                      <div class="label" style="margin-bottom:6px;">Name</div>
                      <div class="value" style="font-size:16px; font-weight:600;">${escapedName || '—'}</div>
                    </td>
                    <td width="50%" class="stack" style="vertical-align:top; padding-left:12px; padding-bottom:16px;">
                      <div class="label" style="margin-bottom:6px;">Email</div>
                      <div class="value" style="font-size:16px; word-break:break-word;">${escapedEmail}</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" class="stack" style="vertical-align:top; padding-right:12px;">
                      <div class="label" style="margin-bottom:6px;">Company</div>
                      <div class="value" style="font-size:16px;">${escapedCompany || '—'}</div>
                    </td>
                    <td width="50%" class="stack" style="vertical-align:top; padding-left:12px;">
                      <div class="label" style="margin-bottom:6px;">Submitted</div>
                      <div class="value" style="font-size:16px;">${formattedDate}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #eef2f7; padding:24px 28px;">
                <p style="margin:0 0 16px 0;" class="label">Message</p>
                <div class="label" style="margin-bottom:8px;">Subject</div>
                <div class="value" style="font-size:16px; font-weight:600; margin-bottom:14px;">${escapedSubject}</div>
                <div class="message-box">
                  <div style="font-size:15px; line-height:1.7; color:#111827;">${escapedMessage}</div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #eef2f7; padding:24px 28px;">
                <p style="margin:0 0 16px 0;" class="label">Technical details</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50%" class="stack" style="vertical-align:top; padding-right:12px; padding-bottom:14px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">IP address</div>
                      <div class="value">${ip || 'unknown'}</div>
                    </td>
                    <td width="50%" class="stack" style="vertical-align:top; padding-left:12px; padding-bottom:14px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">Location</div>
                      <div class="value">${messageData.geo?.city ? `${messageData.geo.city}, ${messageData.geo.country}` : (messageData.geo?.country || 'unknown')}</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" class="stack" style="vertical-align:top; padding-right:12px; padding-bottom:14px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">Device</div>
                      <div class="value">${ua?.browser || 'unknown'} · ${ua?.os || 'unknown'}</div>
                    </td>
                    <td width="50%" class="stack" style="vertical-align:top; padding-left:12px; padding-bottom:14px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">Referrer</div>
                      <div class="value" style="word-break:break-word;">${messageData.referer || '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" class="stack" style="vertical-align:top; padding-right:12px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">Page URL</div>
                      <div class="value" style="word-break:break-word;">${messageData.referer || '-'}</div>
                    </td>
                    <td width="50%" class="stack" style="vertical-align:top; padding-left:12px;">
                      <div class="muted" style="font-size:13px; margin-bottom:4px;">Submission ID</div>
                      <div class="value" style="word-break:break-word;">${messageData.id || messageData.messageId || '-'}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #eef2f7; padding:20px 28px; background:#fafafa;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:top; padding-bottom:12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="vertical-align:top; padding-right:8px;">
                            <img src="${logoUrl}" alt="Oussama Lassoued" width="30" height="30" style="display:block; border-radius:6px;">
                          </td>
                          <td style="vertical-align:top;">
                            <div style="font-weight:700; color:#111827; font-size:13px; line-height:1.3;">Oussama Lassoued</div>
                            <div style="font-size:12px; color:#71717a; line-height:1.3;">Designer & AI builder</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top; text-align:left;">
                      <div class="footer-note">This is an automated notification from your contact form. Replying to this email will respond directly to the sender.</div>
                      <div class="footer-note" style="margin-top:4px;">© ${new Date().getFullYear()} oussamalassoued.com · Sent via Resend</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
};

/**
 * Send email notification via Resend
 */
const sendEmailNotification = async (messageData) => {
  if (!resendClient || !emailConfig.enabled) {
    console.log('[API:Messages] Email notifications disabled - skipping');
    return { success: true, skipped: true };
  }

  try {
    console.log('[API:Messages] Sending email notification...');
    
    const htmlContent = generateEmailTemplate(messageData);
    
    const response = await resendClient.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: emailConfig.toEmail,
      subject: `📨 New Contact: ${messageData.subject}`,
      html: htmlContent,
      replyTo: messageData.email,
    });

    console.log('[API:Messages] Email sent successfully:', response.id);
    return {
      success: true,
      emailId: response.id,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Don't fail the entire message submission if email fails
    console.error('[API:Messages] Email notification failed:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
      note: 'Message saved but email notification failed',
    };
  }
};

// ============================================================================
// SECURITY FUNCTIONS
// ============================================================================

/**
 * Enhanced XOR encryption for message content
 */
const encryptMessage = (data) => {
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
    const key = SECURITY_CONFIG.encryptionKey;
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(result);
  } catch (error) {
    console.error('[API:Messages] Decryption failed:', error);
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

  // Validate company (optional)
  if (data.company && data.company.trim().length > 200) {
    errors.company = 'Company must not exceed 200 characters';
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
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Upstash request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
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
      request.setTimeout(REQUEST_TIMEOUT_MS, () => {
        request.destroy(new Error(`Vercel KV request timed out after ${REQUEST_TIMEOUT_MS}ms`));
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
          lastStorageError = `VercelKV status:${response.statusCode}`;
          return resolve(false);
        });
      });

      request.on('error', (error) => {
        console.error('[API:Messages] Vercel KV write error:', error.message);
        lastStorageError = error?.message || String(error);
        resolve(false);
      });
      request.setTimeout(REQUEST_TIMEOUT_MS, () => {
        request.destroy(new Error(`Vercel KV write timed out after ${REQUEST_TIMEOUT_MS}ms`));
      });
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error('[API:Messages] Failed to write to Vercel KV:', error?.message);
    lastStorageError = error?.message || String(error);
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
    lastStorageError = JSON.stringify(result).slice(0, 1000);
    return false;
  } catch (error) {
    console.error('[API:Messages] Failed to write to Upstash:', error?.message);
    lastStorageError = error?.message || String(error);
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
    lastStorageError = error?.message || String(error);
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
        return res.status(400).json({
          success: false,
          error: 'Request body is empty',
        });
      }

      // Get client IP for rate limiting
      const clientIP = getClientIP(req);
      console.log(`[API:Messages] Request from IP: ${clientIP}`);

      // Check if IP is blocked
      if (isIPBlocked(clientIP)) {
        console.warn(`[API:Messages] Blocked IP attempted to send message: ${clientIP}`);
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // Check rate limit
      const rateLimitCheck = checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        console.warn(`[API:Messages] Rate limit exceeded for IP: ${clientIP}`);
        
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

      // Sanitize input
      const sanitizedData = {
        name: sanitizeInput(body.name || ''),
        email: sanitizeInput(body.email || '').toLowerCase(),
        subject: sanitizeInput(body.subject || ''),
        message: sanitizeInput(body.message || ''),
        company: sanitizeInput(body.company || ''),
      };

      // Validate data
      const validation = validateMessage(sanitizedData);
      if (!validation.isValid) {
        console.warn('[API:Messages] Validation failed:', validation.errors);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        });
      }

      // Check for spam
      if (isSpam(sanitizedData)) {
        console.warn('[API:Messages] Spam detected');
        return res.status(400).json({
          success: false,
          error: 'Message contains spam content',
        });
      }

      // Create message object
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...sanitizedData,
        timestamp: Date.now(),
        ip: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        ua: parseUserAgent(req.headers['user-agent'] || ''),
        referer: req.headers['referer'] || req.headers['origin'] || 'unknown',
        read: false,
      };

      // Try to enrich with geo information (non-blocking but await here to include in saved message)
      try {
        const geo = await fetchGeoForIP(clientIP);
        if (geo) {
          message.geo = geo;
        }
      } catch (e) {
        console.warn('[API:Messages] Geo enrichment error:', e?.message);
      }

      // Encrypt sensitive data
      const encryptedMessage = encryptMessage(message);

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

      // Add new message
      messages.push(encryptedMessage);

      // Write to storage
      let writeSuccess = false;
      let writeSource = 'none';

      if (storageConfig.vercelKv.enabled) {
        writeSuccess = await writeToVercelKv(messages);
        writeSource = 'vercel-kv';
      }

      if (!writeSuccess && storageConfig.upstashRedis.enabled) {
        writeSuccess = await writeToUpstashRedis(messages);
        writeSource = 'upstash-redis';
      }

      if (!writeSuccess && storageConfig.localFile.enabled) {
        writeSuccess = writeToLocalFile(messages);
        writeSource = 'local-file';
      }

      const emailResult = await sendEmailNotification(message);

      if (!writeSuccess) {
        console.warn('[API:Messages] Storage unavailable, but email notification was still attempted.');
        const responseBody = {
          success: Boolean(emailResult?.success),
          message: emailResult?.success
            ? 'Message sent successfully'
            : 'Message received, but email notification failed',
          messageId: message.id,
          source: 'email-only',
          timestamp: message.timestamp,
          rateLimitRemaining: rateLimitCheck.remaining,
          email: emailResult,
          warning: 'Message storage is unavailable in this environment.',
        };

        if (process.env.NODE_ENV !== 'production') {
          responseBody.debug = { lastStorageError, storageConfig, writeSource };
        }

        return res.status(emailResult?.success ? 201 : 202).json(responseBody);
      }

      console.log(`[API:Messages] Message saved successfully to ${writeSource}`);

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        messageId: message.id,
        source: writeSource,
        timestamp: message.timestamp,
        rateLimitRemaining: rateLimitCheck.remaining,
        email: emailResult,
      });
    }

    // 405 Method Not Allowed
    console.warn(`[API:Messages] Unsupported method: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'OPTIONS'],
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

/**
 * Simple User-Agent parser to extract browser, os, and device hints
 */
const parseUserAgent = (uaString = '') => {
  try {
    const parser = new UAParser(uaString || '');
    const r = parser.getResult();
    const device = r.device && r.device.type ? r.device.type : 'desktop';
    return {
      browser: r.browser?.name || 'unknown',
      os: r.os?.name || 'unknown',
      device: device.charAt(0).toUpperCase() + device.slice(1),
    };
  } catch (e) {
    return { browser: 'unknown', os: 'unknown', device: 'unknown' };
  }
};

/**
 * Fetch geo info for IP using ip-api.com (free, rate-limited)
 */
const fetchGeoForIP = async (ip) => {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null;
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,zip,lat,lon,isp,query,message`;
    const resp = await fetch(url, { method: 'GET' });
    const json = await resp.json();
    if (json && json.status === 'success') {
      return {
        country: json.country,
        region: json.regionName,
        city: json.city,
        zip: json.zip,
        lat: json.lat,
        lon: json.lon,
        isp: json.isp,
        query: json.query,
      };
    }
    return null;
  } catch (e) {
    console.warn('[API:Messages] Geo lookup failed:', e?.message);
    return null;
  }
};

// Runtime maps for rate limiting and blocking
const blockedIPs = new Map();
const rateLimiter = new Map();
const dailyMessageCount = new Map();

// Storage key for saved messages
const MESSAGES_KEY = process.env.MESSAGES_KEY || 'messages:v1';

// Basic storage configuration (local-first for development)
const storageConfig = {
  vercelKv: { enabled: Boolean(process.env.VERCEL_KV_URL && process.env.VERCEL_KV_TOKEN), url: process.env.VERCEL_KV_URL || '', token: process.env.VERCEL_KV_TOKEN || '' },
  upstashRedis: { enabled: Boolean(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN), url: process.env.UPSTASH_REDIS_URL || '', token: process.env.UPSTASH_REDIS_TOKEN || '' },
  localFile: { enabled: process.env.DISABLE_LOCAL_FILE === '1' ? false : true, path: path.join(process.cwd(), 'data', 'messages.json') },
};

// Email configuration and Resend client
const emailConfig = {
  enabled: !!process.env.RESEND_API_KEY && !!process.env.CONTACT_EMAIL_TO,
  fromName: process.env.RESEND_FROM_NAME || 'Website Contact',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
  toEmail: process.env.CONTACT_EMAIL_TO || 'owner@example.com',
};

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Last storage error (for debugging; only returned in non-production)
let lastStorageError = null;