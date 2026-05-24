import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const BUCKET_NAME = 'generated-documents';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) => {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
};

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});
};

const isAuthenticated = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] === COOKIE_VALUE;
};

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch { return {}; }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const toSafeJson = (res, status, body) => res.status(status).json(body);

const buildInvoiceHTML = (invoice, items, brand) => {
  const currency = invoice.currency || brand?.defaultCurrency || 'MYR';

  const formatMoney = (amount) => {
    const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return `${currency} ${value.toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const subtotal = invoice.subtotal ?? items.reduce((sum, item) => sum + (Number(item.amount) || Number(item.quantity) * Number(item.rate) || 0), 0);
  const discountAmount = invoice.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = invoice.taxRate ?? 0;
  const taxAmount = invoice.taxAmount ?? Math.round(taxableAmount * taxRate) / 100;
  const total = invoice.total ?? Math.max(0, taxableAmount + taxAmount);

  const itemsRows = items
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => {
      const lineTotal = Number(item.amount) || Number(item.quantity) * Number(item.rate) || 0;
      return `<tr>
        <td style="padding: 12px 8px 12px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #0f172a;">${escapeHtml(item.description || '')}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #334155;">${Number(item.quantity || 0).toFixed(2)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #334155;">${formatMoney(item.rate || 0)}</td>
        <td style="padding: 12px 0 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #0f172a;">${formatMoney(lineTotal)}</td>
      </tr>`;
    }).join('');

  const terms = invoice.terms?.trim() || brand?.paymentNotes?.trim() || '';
  const sellerLogo = invoice.sellerLogoUrl || brand?.logoUrl || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${escapeHtml(invoice.invoiceNumber || '')}</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
  .page { width: 800px; margin: 0 auto; padding: 40px; }
</style>
</head>
<body>
<div class="page">
  <table style="width:100%;">
    <tr>
      <td style="vertical-align:top;">
        <h1 style="font-size:28px; font-weight:700; color:#0f172a; margin:0;">${escapeHtml(invoice.sellerName || brand?.brandName || 'Your Company')}</h1>
        <div style="margin-top:8px; font-size:13px; line-height:1.6; color:#334155;">
          ${invoice.sellerAddress ? `<div style="white-space:pre-wrap;">${escapeHtml(invoice.sellerAddress)}</div>` : ''}
          ${invoice.sellerCity || invoice.sellerState || invoice.sellerZip ? `<div style="color:#64748b;">${[invoice.sellerCity, invoice.sellerState, invoice.sellerZip].filter(Boolean).join(', ')}</div>` : ''}
          ${invoice.sellerEmail ? `<div>${escapeHtml(invoice.sellerEmail)}</div>` : ''}
          ${invoice.sellerPhone ? `<div>${escapeHtml(invoice.sellerPhone)}</div>` : ''}
          ${invoice.sellerTaxId ? `<div style="font-size:12px; color:#64748b;">Tax ID: ${escapeHtml(invoice.sellerTaxId)}</div>` : ''}
        </div>
      </td>
      <td style="vertical-align:top; text-align:right;">
        ${sellerLogo ? `<img src="${escapeHtml(sellerLogo)}" alt="Logo" style="max-height:64px; max-width:90px; margin-bottom:16px; object-fit:contain;" />` : ''}
        <div style="min-width:200px; text-align:right;">
          <div style="font-size:18px; font-weight:700; color:#0f172a; margin-bottom:8px;">INVOICE</div>
          <table style="margin-left:auto; border-collapse:collapse;">
            <tr><td style="font-weight:600; color:#64748b; padding:2px 8px 2px 0; text-align:left;">Invoice #</td><td style="color:#0f172a; padding:2px 0;">${escapeHtml(invoice.invoiceNumber || '—')}</td></tr>
            <tr><td style="font-weight:600; color:#64748b; padding:2px 8px 2px 0; text-align:left;">Date</td><td style="color:#0f172a; padding:2px 0;">${formatDate(invoice.issueDate)}</td></tr>
            <tr><td style="font-weight:600; color:#64748b; padding:2px 8px 2px 0; text-align:left;">Due Date</td><td style="color:#0f172a; padding:2px 0;">${formatDate(invoice.dueDate)}</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <div style="margin-top:48px;">
    <div style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#64748b;">Bill To</div>
    <div style="margin-top:8px; font-size:14px; line-height:1.6; color:#334155;">
      <div style="font-size:16px; font-weight:600; color:#0f172a;">${escapeHtml(invoice.clientName || 'Client name')}</div>
      ${invoice.clientAddress ? `<div style="white-space:pre-wrap;">${escapeHtml(invoice.clientAddress)}</div>` : ''}
      ${invoice.clientCity || invoice.clientState || invoice.clientZip ? `<div style="color:#64748b;">${[invoice.clientCity, invoice.clientState, invoice.clientZip].filter(Boolean).join(', ')}</div>` : ''}
      ${invoice.clientEmail ? `<div>${escapeHtml(invoice.clientEmail)}</div>` : ''}
      ${invoice.clientPhone ? `<div>${escapeHtml(invoice.clientPhone)}</div>` : ''}
    </div>
  </div>

  <table style="width:100%; margin-top:48px; border-collapse:collapse; font-size:14px;">
    <thead>
      <tr style="border-bottom:2px solid #d1d5db;">
        <th style="padding-bottom:12px; text-align:left; font-weight:600; color:#0f172a;">Description</th>
        <th style="padding-bottom:12px; text-align:center; font-weight:600; color:#0f172a;">Qty</th>
        <th style="padding-bottom:12px; text-align:right; font-weight:600; color:#0f172a;">Rate</th>
        <th style="padding-bottom:12px; text-align:right; font-weight:600; color:#0f172a;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="4" style="padding:40px 0; text-align:center; color:#64748b;">No items</td></tr>'}
    </tbody>
  </table>

  <table style="margin-left:auto; margin-top:32px; width:280px; border-collapse:collapse; font-size:14px;">
    <tr><td style="color:#64748b; padding:4px 0;">Subtotal</td><td style="font-weight:500; color:#0f172a; text-align:right; padding:4px 0;">${formatMoney(subtotal)}</td></tr>
    ${discountAmount > 0 ? `<tr><td style="color:#64748b; padding:4px 0;">Discount</td><td style="font-weight:500; color:#dc2626; text-align:right; padding:4px 0;">-${formatMoney(discountAmount)}</td></tr>` : ''}
    <tr><td style="color:#64748b; padding:4px 0;">Tax${taxRate > 0 ? ` (${Number(taxRate).toFixed(0)}%)` : ''}</td><td style="font-weight:500; color:#0f172a; text-align:right; padding:4px 0;">${formatMoney(taxAmount)}</td></tr>
    <tr><td style="border-top:2px solid #d1d5db; padding-top:12px; font-weight:700; color:#0f172a;">Total</td><td style="border-top:2px solid #d1d5db; padding-top:12px; text-align:right; font-size:18px; font-weight:700; color:#0f172a;">${formatMoney(total)}</td></tr>
  </table>

  ${terms ? `
  <div style="margin-top:48px;">
    <div style="font-size:14px; font-weight:700; color:#0f172a;">Terms &amp; Conditions</div>
    <div style="margin-top:8px; max-width:560px; white-space:pre-wrap; font-size:14px; line-height:1.6; color:#334155;">${escapeHtml(terms)}</div>
  </div>` : ''}

  ${brand?.signatureUrl ? `
  <div style="margin-top:48px; border-top:1px solid #e5e7eb; padding-top:24px;">
    <div style="font-size:14px; font-weight:700; color:#0f172a;">Authorized Signature</div>
    <img src="${escapeHtml(brand.signatureUrl)}" alt="Signature" style="margin-top:8px; height:56px; object-fit:contain;" />
    ${brand.signatureName ? `<div style="margin-top:4px; font-size:14px; color:#475569;">${escapeHtml(brand.signatureName)}</div>` : ''}
  </div>` : ''}
</div>
</body>
</html>`;
};

const buildDocumentHTML = (doc, brand) => {
  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const content = doc.content || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(doc.title || 'Document')}</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
  .page { width: 800px; margin: 0 auto; padding: 40px; }
</style>
</head>
<body>
<div class="page">
  <table style="width:100%;">
    <tr>
      <td style="vertical-align:top;">
        <h1 style="font-size:28px; font-weight:700; color:#0f172a; margin:0;">${escapeHtml(brand?.brandName || 'Your Company')}</h1>
        ${brand?.address ? `<div style="margin-top:8px; font-size:13px; color:#334155; white-space:pre-wrap;">${escapeHtml(brand.address)}</div>` : ''}
      </td>
      <td style="vertical-align:top; text-align:right;">
        ${brand?.logoUrl ? `<img src="${escapeHtml(brand.logoUrl)}" alt="Logo" style="max-height:64px; max-width:90px; margin-bottom:16px; object-fit:contain;" />` : ''}
      </td>
    </tr>
  </table>

  <div style="margin-top:48px;">
    <h2 style="font-size:24px; font-weight:700; color:#0f172a;">${escapeHtml(doc.title || 'Document')}</h2>
    <div style="margin-top:8px; color:#64748b; font-size:13px;">
      ${doc.issueDate ? `<span>Date: ${formatDate(doc.issueDate)}</span>` : ''}
      ${doc.issueDate && doc.dueDate ? ' &nbsp;|&nbsp; ' : ''}
      ${doc.dueDate ? `<span>Due: ${formatDate(doc.dueDate)}</span>` : ''}
    </div>
  </div>

  <div style="margin-top:32px; font-size:14px; line-height:1.8; color:#334155; white-space:pre-wrap;">${escapeHtml(content)}</div>

  ${doc.amount != null ? `
  <div style="margin-top:48px; border-top:1px solid #e5e7eb; padding-top:24px; text-align:right; font-size:18px; font-weight:700; color:#0f172a;">
    Total: ${doc.currency || 'MYR'} ${Number(doc.amount).toFixed(2)}
  </div>` : ''}

  ${brand?.signatureUrl ? `
  <div style="margin-top:48px; border-top:1px solid #e5e7eb; padding-top:24px;">
    <div style="font-size:14px; font-weight:700; color:#0f172a;">Authorized Signature</div>
    <img src="${escapeHtml(brand.signatureUrl)}" alt="Signature" style="margin-top:8px; height:56px; object-fit:contain;" />
    ${brand.signatureName ? `<div style="margin-top:4px; font-size:14px; color:#475569;">${escapeHtml(brand.signatureName)}</div>` : ''}
  </div>` : ''}
</div>
</body>
</html>`;
};

const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const generatePdf = async (html) => {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 800, height: 1100 },
    });

    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return toSafeJson(res, 500, { success: false, error: 'Storage configuration is unavailable.' });
  }

  const body = readBody(req);
  const sourceType = String(body?.sourceType || '').trim().toLowerCase();
  const invoiceId = String(body?.invoiceId || '').trim();
  const documentId = String(body?.documentId || '').trim();

  if (!sourceType || !['invoice', 'generated_document'].includes(sourceType)) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid sourceType. Must be "invoice" or "generated_document".' });
  }

  if (sourceType === 'invoice') {
    if (!isValidUuid(invoiceId)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid invoiceId. Save the invoice before generating PDF.' });
    }
  } else {
    if (!isValidUuid(documentId)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid documentId.' });
    }
  }

  const resourceId = sourceType === 'invoice' ? invoiceId : documentId;
  const table = sourceType === 'invoice' ? 'invoices' : 'generated_documents';

  const { data: brandSettings, error: brandError } = await supabase
    .from('document_brand_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (brandError) {
    console.error('[Generate PDF] Failed to fetch brand settings', brandError);
  }

  let invoiceData;
  let invoiceItems;
  let documentData;

  if (sourceType === 'invoice') {
    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle();

    if (invError || !inv) {
      return toSafeJson(res, 404, { success: false, error: 'Invoice not found.' });
    }
    invoiceData = inv;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', resourceId)
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error('[Generate PDF] Failed to fetch invoice items', itemsError);
    }
    invoiceItems = items || [];
  } else {
    const { data: doc, error: docError } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle();

    if (docError || !doc) {
      return toSafeJson(res, 404, { success: false, error: 'Document not found.' });
    }
    documentData = doc;
  }

  const html = sourceType === 'invoice'
    ? buildInvoiceHTML(invoiceData, invoiceItems, brandSettings)
    : buildDocumentHTML(documentData, brandSettings);

  let pdfBuffer;
  try {
    pdfBuffer = await generatePdf(html);
  } catch (pdfError) {
    console.error('[Generate PDF] Playwright PDF generation failed', pdfError);
    return toSafeJson(res, 500, { success: false, error: 'PDF generation failed.' });
  }

  const timestamp = Date.now();
  const safeName = `${(sourceType === 'invoice' ? (invoiceData?.invoiceNumber || 'invoice') : (documentData?.title || 'document')).replace(/[^a-z0-9.-]+/gi, '-').toLowerCase()}.pdf`;
  const storagePath = `${sourceType}/${resourceId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('[Generate PDF] Storage upload failed', uploadError);
    return toSafeJson(res, 500, { success: false, error: 'Unable to store PDF. Ensure the "generated-documents" bucket exists.' });
  }

  const { error: updateError } = await supabase
    .from(table)
    .update({ pdf_storage_path: storagePath })
    .eq('id', resourceId);

  if (updateError) {
    console.error('[Generate PDF] Database update failed', updateError);
    return toSafeJson(res, 500, { success: false, error: 'PDF uploaded but database update failed.' });
  }

  return toSafeJson(res, 200, {
    success: true,
    storagePath,
  });
}
