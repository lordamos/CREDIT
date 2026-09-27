import { v4 as uuidv4 } from 'uuid';
import type { NegativeItem, DebtAccount, CreditProfile } from '../../shared/types/credit.js';

// ═══════════════════════════════════════════════════════════════
// AUTOMATED CREDIT REPORT PARSER
// Handles: Credit Karma, AnnualCreditReport, Experian, Equifax,
//          TransUnion, IdentityIQ, SmartCredit, MyFICO, plain text
// ═══════════════════════════════════════════════════════════════

export interface ParsedReport {
  scores: { equifax?: number; experian?: number; transunion?: number };
  negativeItems: NegativeItem[];
  debtAccounts: DebtAccount[];
  inquiries: NegativeItem[];
  totalAvailableCredit: number;
  totalDebt: number;
  currentUtilization: number;
  numberOfInquiries: number;
  oldestAccountAge: number; // months
  raw: string;
  parseNotes: string[];
}

// ── Main Parse Entry Point ────────────────────────────────────
export function parseReport(rawText: string): ParsedReport {
  const text = rawText.trim();
  const notes: string[] = [];

  const scores = extractScores(text, notes);
  const negativeItems = extractNegativeItems(text, notes);
  const debtAccounts = extractDebtAccounts(text, notes);
  const inquiries = extractInquiries(text, notes);
  const totalAvailableCredit = calcTotalAvailableCredit(debtAccounts);
  const totalDebt = calcTotalDebt(debtAccounts, negativeItems);
  const currentUtilization = calcUtilization(debtAccounts);
  const oldestAccountAge = estimateOldestAge(text, debtAccounts, notes);

  notes.push(`Parsing complete: ${negativeItems.length} negative items, ${debtAccounts.length} accounts, ${inquiries.length} inquiries detected.`);

  return {
    scores,
    negativeItems: [...negativeItems],
    debtAccounts,
    inquiries,
    totalAvailableCredit,
    totalDebt,
    currentUtilization,
    numberOfInquiries: inquiries.length,
    oldestAccountAge,
    raw: text,
    parseNotes: notes,
  };
}

// ── Score Extraction ──────────────────────────────────────────
function extractScores(text: string, notes: string[]): ParsedReport['scores'] {
  const scores: ParsedReport['scores'] = {};

  // Patterns:  "Equifax: 620", "EQUIFAX SCORE 620", "EQ 620", etc.
  const patterns: Array<[keyof ParsedReport['scores'], RegExp[]]> = [
    ['equifax', [
      /equifax[^0-9]{0,30}(\d{3})/i,
      /\beq[:\s]+(\d{3})\b/i,
      /fico.*equifax[^0-9]{0,20}(\d{3})/i,
      /equifax\s*credit\s*score[^0-9]{0,10}(\d{3})/i,
    ]],
    ['experian', [
      /experian[^0-9]{0,30}(\d{3})/i,
      /\bex[:\s]+(\d{3})\b/i,
      /fico.*experian[^0-9]{0,20}(\d{3})/i,
      /experian\s*credit\s*score[^0-9]{0,10}(\d{3})/i,
    ]],
    ['transunion', [
      /trans\s*union[^0-9]{0,30}(\d{3})/i,
      /\btu[:\s]+(\d{3})\b/i,
      /fico.*trans\s*union[^0-9]{0,20}(\d{3})/i,
      /transunion\s*credit\s*score[^0-9]{0,10}(\d{3})/i,
    ]],
  ];

  for (const [bureau, regexps] of patterns) {
    for (const re of regexps) {
      const m = text.match(re);
      if (m) {
        const score = parseInt(m[1]);
        if (score >= 300 && score <= 850) {
          scores[bureau] = score;
          notes.push(`✅ ${bureau} score detected: ${score}`);
          break;
        }
      }
    }
  }

  // Fallback: look for 3 consecutive 3-digit numbers between 300-850
  if (!scores.equifax && !scores.experian && !scores.transunion) {
    const allScores = [...text.matchAll(/\b([3-8]\d{2})\b/g)]
      .map(m => parseInt(m[1]))
      .filter(n => n >= 300 && n <= 850);
    if (allScores.length >= 3) {
      [scores.equifax, scores.experian, scores.transunion] = allScores.slice(0, 3);
      notes.push(`⚠️ Scores guessed from context: ${allScores.slice(0, 3).join(', ')}`);
    } else if (allScores.length === 1) {
      scores.equifax = scores.experian = scores.transunion = allScores[0];
      notes.push(`⚠️ Single score found, applied to all bureaus: ${allScores[0]}`);
    }
  }

  return scores;
}

// ── Negative Item Extraction ──────────────────────────────────
function extractNegativeItems(text: string, notes: string[]): NegativeItem[] {
  const items: NegativeItem[] = [];
  const seen = new Set<string>();

  // Charge-off patterns
  const chargeOffPatterns = [
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*charge.?off[^\n]*/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})[^\n]*written.?off[^\n]*/gi,
    /charge.?off[^\n]*\n?[^\n]*([A-Z][A-Z\s&'/\-,\.]{2,40})/gi,
  ];

  for (const pattern of chargeOffPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1] || m[2] || '');
      if (!creditor || seen.has(`co:${creditor}`)) continue;
      seen.add(`co:${creditor}`);
      const balance = extractBalance(text, creditor);
      const dofd = extractDate(text, creditor, 'delinquency|charge|opened');
      const bureau = detectBureau(text, creditor);
      items.push({
        id: uuidv4(),
        type: 'CHARGE_OFF',
        creditor,
        bureau,
        accountNumber: extractAccountNumber(text, creditor),
        balance,
        dateOfFirstDelinquency: dofd,
        impactScore: 5,
        disputeStrategy: 'FORMAL_FCRA',
        notes: 'Charge-off detected in report',
      });
    }
  }

  // Collection patterns
  const collectionPatterns = [
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(collection|collections|debt collector|assigned to collection)[^\n]*/gi,
    /(collection|collections)[^\n]*\n?[^\n]*([A-Z][A-Z\s&'/\-,\.]{2,40})/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*in collection[^\n]*/gi,
  ];

  for (const pattern of collectionPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1] || m[2] || '');
      if (!creditor || seen.has(`col:${creditor}`)) continue;
      seen.add(`col:${creditor}`);
      const balance = extractBalance(text, creditor);
      const dofd = extractDate(text, creditor, 'delinquency|opened|placed');
      const bureau = detectBureau(text, creditor);
      items.push({
        id: uuidv4(),
        type: 'COLLECTION',
        creditor,
        bureau,
        accountNumber: extractAccountNumber(text, creditor),
        balance,
        dateOfFirstDelinquency: dofd,
        impactScore: 5,
        disputeStrategy: 'FORMAL_FCRA',
        notes: 'Collection account detected',
      });
    }
  }

  // Late payment patterns (30/60/90/120 day)
  const latePatterns = [
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(30|60|90|120)[- ]day[s]? late[^\n]*/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*late payment[^\n]*/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*payment.*30\s*days?[^\n]*/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*past due[^\n]*/gi,
  ];

  for (const pattern of latePatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1] || '');
      if (!creditor || seen.has(`late:${creditor}`)) continue;
      seen.add(`late:${creditor}`);
      const dofd = extractDate(text, creditor, 'late|delinquency|payment');
      const bureau = detectBureau(text, creditor);
      // Determine if goodwill vs formal based on age
      const isOld = dofd ? isOlderThan(dofd, 24) : false;
      items.push({
        id: uuidv4(),
        type: 'LATE_PAYMENT',
        creditor,
        bureau,
        accountNumber: extractAccountNumber(text, creditor),
        dateOfFirstDelinquency: dofd,
        impactScore: 3,
        disputeStrategy: isOld ? 'GOODWILL' : 'GOODWILL',
        notes: 'Late payment notation detected',
      });
    }
  }

  // Bankruptcy
  if (/chapter\s*(7|11|13)\s*bankruptcy|filed\s*bankruptcy|discharged/i.test(text)) {
    const m = text.match(/chapter\s*(7|11|13)/i);
    if (!seen.has('bankruptcy')) {
      seen.add('bankruptcy');
      const dofd = extractDate(text, '', 'filed|discharge|bankruptcy');
      items.push({
        id: uuidv4(),
        type: 'BANKRUPTCY',
        creditor: `Bankruptcy (Chapter ${m ? m[1] : '7/13'})`,
        bureau: 'Equifax / Experian / TransUnion',
        dateOfFirstDelinquency: dofd,
        impactScore: 5,
        disputeStrategy: dofd && isOlderThan(dofd, 120) ? 'FORMAL_FCRA' : 'WAIT_SEVEN_YEARS',
        notes: 'Bankruptcy detected — verify reporting date, 10-year limit',
      });
    }
  }

  // Repossession
  const repoPatterns = [/([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*repossess/gi];
  for (const pattern of repoPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1]);
      if (!creditor || seen.has(`repo:${creditor}`)) continue;
      seen.add(`repo:${creditor}`);
      items.push({
        id: uuidv4(),
        type: 'CHARGE_OFF',
        creditor: `${creditor} (Repossession)`,
        bureau: detectBureau(text, creditor),
        accountNumber: extractAccountNumber(text, creditor),
        balance: extractBalance(text, creditor),
        dateOfFirstDelinquency: extractDate(text, creditor, 'repossess|opened'),
        impactScore: 5,
        disputeStrategy: 'FORMAL_FCRA',
        notes: 'Repossession detected',
      });
    }
  }

  notes.push(`📋 Extracted ${items.length} negative items from report`);
  return items;
}

// ── Inquiry Extraction ────────────────────────────────────────
function extractInquiries(text: string, notes: string[]): NegativeItem[] {
  const inquiries: NegativeItem[] = [];
  const seen = new Set<string>();

  const inquiryPatterns = [
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(hard inquiry|hard pull|credit inquiry)[^\n]*/gi,
    /(hard inquiry|hard pull|credit inquiry)[^\n]*\n?[^\n]*([A-Z][A-Z\s&'/\-,\.]{2,40})/gi,
    /inquir(?:y|ies)[^\n]*\n([A-Z][A-Z\s&'/\-,\.]{2,40})/gi,
  ];

  for (const pattern of inquiryPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1] || m[2] || '');
      if (!creditor || seen.has(creditor)) continue;
      seen.add(creditor);
      const dateStr = extractDate(text, creditor, 'inquir|date');
      inquiries.push({
        id: uuidv4(),
        type: 'INQUIRY',
        creditor,
        bureau: detectBureau(text, creditor),
        dateOpened: dateStr ?? undefined,
        impactScore: 1,
        disputeStrategy: 'FORMAL_FCRA',
        notes: 'Hard inquiry detected',
      });
    }
  }

  notes.push(`🔍 Found ${inquiries.length} hard inquiries`);
  return inquiries;
}

// ── Debt Account Extraction ───────────────────────────────────
function extractDebtAccounts(text: string, notes: string[]): DebtAccount[] {
  const accounts: DebtAccount[] = [];
  const seen = new Set<string>();

  // Credit card pattern: account name + balance + limit
  const ccPatterns = [
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(credit card|visa|mastercard|amex|american express|discover)[^\n]*/gi,
    /([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*revolving[^\n]*/gi,
  ];

  for (const pattern of ccPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1]);
      if (!creditor || seen.has(creditor)) continue;
      seen.add(creditor);
      const balance = extractBalance(text, creditor) ?? 0;
      const limit = extractLimit(text, creditor);
      accounts.push({
        id: uuidv4(),
        creditor,
        balance,
        creditLimit: limit,
        interestRate: 24.99, // default — will be corrected if found
        minimumPayment: Math.max(25, Math.round(balance * 0.02)),
        type: 'CREDIT_CARD',
      });
    }
  }

  // Auto loan
  const autoPatterns = [/([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(auto|car loan|vehicle|motor)[^\n]*/gi];
  for (const pattern of autoPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1]);
      if (!creditor || seen.has(creditor)) continue;
      seen.add(creditor);
      const balance = extractBalance(text, creditor) ?? 0;
      accounts.push({ id: uuidv4(), creditor, balance, interestRate: 7.5, minimumPayment: 350, type: 'AUTO' });
    }
  }

  // Student loans
  const studentPatterns = [/([A-Z][A-Z\s&'/\-,\.]{2,40})\n?[^\n]*(student loan|navient|sallie mae|mohela|fedloan|dept of ed)[^\n]*/gi];
  for (const pattern of studentPatterns) {
    for (const m of text.matchAll(pattern)) {
      const creditor = cleanName(m[1]);
      if (!creditor || seen.has(creditor)) continue;
      seen.add(creditor);
      const balance = extractBalance(text, creditor) ?? 0;
      accounts.push({ id: uuidv4(), creditor, balance, interestRate: 5.5, minimumPayment: Math.max(50, Math.round(balance * 0.01)), type: 'STUDENT' });
    }
  }

  notes.push(`💳 Extracted ${accounts.length} open accounts/debts`);
  return accounts;
}

// ── Helper Functions ──────────────────────────────────────────
function cleanName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^A-Z0-9\s&'/\-,\.]/gi, '')
    .trim()
    .substring(0, 60);
}

function extractBalance(text: string, creditor: string): number | undefined {
  // Find creditor context window (200 chars)
  const idx = text.search(new RegExp(escapeRegex(creditor.substring(0, 15)), 'i'));
  if (idx < 0) return undefined;
  const ctx = text.substring(idx, idx + 400);
  const m = ctx.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  const m2 = ctx.match(/balance[^0-9$]{0,20}([\d,]+)/i);
  if (m2) return parseFloat(m2[1].replace(/,/g, ''));
  return undefined;
}

function extractLimit(text: string, creditor: string): number | undefined {
  const idx = text.search(new RegExp(escapeRegex(creditor.substring(0, 15)), 'i'));
  if (idx < 0) return undefined;
  const ctx = text.substring(idx, idx + 400);
  const m = ctx.match(/(?:credit limit|limit|high balance)[^0-9$]{0,20}\$?\s*([\d,]+)/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return undefined;
}

function extractAccountNumber(text: string, creditor: string): string | undefined {
  const idx = text.search(new RegExp(escapeRegex(creditor.substring(0, 15)), 'i'));
  if (idx < 0) return undefined;
  const ctx = text.substring(idx, idx + 300);
  const m = ctx.match(/(?:account|acct|#)\s*[:#]?\s*([X*\d]{4,20})/i);
  return m ? m[1] : undefined;
}

function extractDate(text: string, creditor: string, contextKeyword: string): string | undefined {
  const creditorIdx = creditor
    ? text.search(new RegExp(escapeRegex(creditor.substring(0, 15)), 'i'))
    : 0;
  const startIdx = Math.max(0, creditorIdx);
  const ctx = text.substring(startIdx, startIdx + 500);

  // Try keyword context first
  const keywordRe = new RegExp(`(?:${contextKeyword})[^0-9]{0,30}(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s*\\d{1,2},?\\s*\\d{4}|\\d{4}[/\\-]\\d{1,2}[/\\-]\\d{1,2})`, 'i');
  let m = ctx.match(keywordRe);
  if (m) return normalizeDate(m[1]);

  // Generic date in context
  const dateRe = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,2},?\s*\d{4})\b/i;
  m = ctx.match(dateRe);
  if (m) return normalizeDate(m[1]);
  return undefined;
}

function normalizeDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {}
  return raw;
}

function isOlderThan(dateStr: string, months: number): boolean {
  try {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return d < cutoff;
  } catch { return false; }
}

function detectBureau(text: string, creditor: string): string {
  const idx = text.search(new RegExp(escapeRegex(creditor.substring(0, 15)), 'i'));
  if (idx < 0) return 'Equifax / Experian / TransUnion';
  const ctx = text.substring(Math.max(0, idx - 100), idx + 200).toLowerCase();
  const bureaus: string[] = [];
  if (ctx.includes('equifax')) bureaus.push('Equifax');
  if (ctx.includes('experian')) bureaus.push('Experian');
  if (ctx.includes('transunion') || ctx.includes('trans union')) bureaus.push('TransUnion');
  return bureaus.length > 0 ? bureaus.join(' / ') : 'Equifax / Experian / TransUnion';
}

function calcTotalAvailableCredit(accounts: DebtAccount[]): number {
  return accounts.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
}

function calcTotalDebt(accounts: DebtAccount[], negativeItems: NegativeItem[]): number {
  const accountDebt = accounts.reduce((s, a) => s + a.balance, 0);
  const collectionDebt = negativeItems
    .filter(i => i.type === 'COLLECTION' || i.type === 'CHARGE_OFF')
    .reduce((s, i) => s + (i.balance ?? 0), 0);
  return accountDebt + collectionDebt;
}

function calcUtilization(accounts: DebtAccount[]): number {
  const cards = accounts.filter(a => a.type === 'CREDIT_CARD' && a.creditLimit);
  if (cards.length === 0) return 0;
  const totalBalance = cards.reduce((s, a) => s + a.balance, 0);
  const totalLimit = cards.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
  return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
}

function estimateOldestAge(text: string, accounts: DebtAccount[], notes: string[]): number {
  const allDates: Date[] = [];
  const dateMatches = text.matchAll(/(?:opened|date opened|member since)[^0-9]{0,20}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4})/gi);
  for (const m of dateMatches) {
    try {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1980) allDates.push(d);
    } catch {}
  }
  if (allDates.length === 0) return 0;
  const oldest = Math.min(...allDates.map(d => d.getTime()));
  const months = Math.round((Date.now() - oldest) / (30 * 24 * 60 * 60 * 1000));
  notes.push(`📅 Oldest account estimated: ${Math.floor(months / 12)} years ${months % 12} months`);
  return months;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
