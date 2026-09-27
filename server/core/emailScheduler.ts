import type { Client, EmailStage, EmailLogEntry, PricingPlan } from '../../shared/types/credit.js';
import { sendEmail } from './mailer.js';
import { getSettings } from './dataStore.js';
import { v4 as uuidv4 } from 'uuid';

// ── Shared Email Layout ───────────────────────────────────────
function wrapEmailHtml(content: string, clientName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#0f172a; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrapper { max-width:620px; margin:0 auto; background:#1e293b; border-radius:12px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#1d4ed8,#7c3aed); padding:32px 40px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px; }
  .header p { color:#bfdbfe; margin:6px 0 0; font-size:13px; }
  .body { padding:32px 40px; color:#e2e8f0; font-size:15px; line-height:1.7; }
  .body h2 { color:#f1f5f9; font-size:17px; margin:0 0 12px; }
  .step { background:#0f172a; border-left:4px solid #3b82f6; border-radius:6px; padding:14px 18px; margin:16px 0; }
  .step strong { color:#60a5fa; }
  .badge { display:inline-block; background:#1d4ed8; color:#fff; border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; margin-bottom:12px; }
  .badge.green { background:#059669; }
  .badge.yellow { background:#d97706; }
  .badge.red { background:#dc2626; }
  .cta { display:block; background:linear-gradient(135deg,#2563eb,#7c3aed); color:#fff; text-decoration:none; text-align:center; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; margin:24px 0; }
  .divider { border:none; border-top:1px solid #334155; margin:24px 0; }
  .footer { background:#0f172a; padding:20px 40px; text-align:center; color:#64748b; font-size:12px; }
  .warning-box { background:#431407; border:1px solid #ef4444; border-radius:8px; padding:16px 20px; margin:16px 0; color:#fca5a5; }
  .success-box { background:#052e16; border:1px solid #22c55e; border-radius:8px; padding:16px 20px; margin:16px 0; color:#86efac; }
  .info-box { background:#0c1a3d; border:1px solid #3b82f6; border-radius:8px; padding:16px 20px; margin:16px 0; color:#93c5fd; }
  ul { padding-left:20px; margin:8px 0; }
  li { margin:6px 0; }
</style>
</head>
<body>
<div style="padding:20px;">
  <div class="wrapper">
    <div class="header">
      <h1>⚡ Credit Acceleration Services</h1>
      <p>Palm Bay, Brevard County, Florida</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Credit Acceleration Services | Palm Bay, FL 32905 | Brevard County</p>
      <p>This is an automated message from your credit consulting team. Questions? Reply directly to this email.</p>
      <p style="margin-top:8px;color:#475569;">© ${new Date().getFullYear()} Credit Acceleration Services. All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Email Template Builders ───────────────────────────────────
export function buildWelcomeEmail(client: Client): { subject: string; html: string } {
  const plan = client.plan === 'A'
    ? '$250 Upfront Retainer + $1,000 Success Fee'
    : '$0 Upfront + $1,500 Success Fee on Approval';
  return {
    subject: `Welcome to Your Credit Acceleration Program – Next Steps Inside`,
    html: wrapEmailHtml(`
      <span class="badge">New Client Onboarding</span>
      <h2>Hi ${client.firstName}, welcome aboard! 🎉</h2>
      <p>We have officially received your signed <strong>Personal Guarantor & Credit Consulting Agreement</strong>. Your file is now active and your profile preparation begins immediately.</p>
      <div class="info-box">
        <strong>📋 Your Selected Plan:</strong><br>${plan}<br>
        <strong>📍 Jurisdiction:</strong> Brevard County, Florida
      </div>
      <h2>What Happens Next</h2>
      <div class="step"><strong>Step 1 – Profile Review & Intake (Next 24–48 hrs)</strong><br>Our underwriting team is reviewing your business documentation and credit profile.</div>
      <div class="step"><strong>Step 2 – Target Lender Selection</strong><br>We are identifying optimal Tier-1 and Tier-2 business credit facilities for maximum initial approval limits.</div>
      <div class="step"><strong>Step 3 – Secondary Bureau Suppression</strong><br>We are freezing secondary reporting agencies (LexisNexis, SageStream, Innovis) to protect your file during underwriting.</div>
      <div class="warning-box">
        ⚠️ <strong>Critical Action Required:</strong> Do NOT apply for any personal loans, credit cards, or auto financing during this process. Every hard inquiry reduces your approval odds.
      </div>
      <p>You will receive your next status update within <strong>48 business hours</strong>.</p>
      <hr class="divider">
      <p style="color:#94a3b8;font-size:13px;">Questions? Simply reply to this email and your dedicated credit strategist will respond within 4 business hours.</p>
    `, client.firstName),
  };
}

export function buildDocsVerifiedEmail(client: Client): { subject: string; html: string } {
  return {
    subject: `Status Update: Underwriting Package Approved – Preparing Applications`,
    html: wrapEmailHtml(`
      <span class="badge green">Docs Verified ✓</span>
      <h2>Great news, ${client.firstName}!</h2>
      <p>Your business compliance review and personal guarantor qualification packet are <strong>complete and approved</strong>.</p>
      <div class="success-box">
        ✅ Corporate entity & EIN verification: <strong>Passed</strong><br>
        ✅ Personal Guarantor backing: <strong>Confirmed</strong><br>
        ✅ Targeted application sequence: <strong>Finalized</strong>
      </div>
      <p>We will begin submitting applications on your behalf within the next <strong>24–48 hours</strong>.</p>
      <div class="warning-box">
        ⚠️ <strong>Do NOT apply for any credit</strong> during this window. This protects your profile's hard inquiry count and keeps your approval odds at maximum.
      </div>
      <p>You will receive a notification the moment any lender decision is rendered.</p>
    `, client.firstName),
  };
}

export function buildSubmittedEmail(client: Client): { subject: string; html: string } {
  return {
    subject: `Update: Applications Submitted – Real-Time Underwriting in Progress`,
    html: wrapEmailHtml(`
      <span class="badge" style="background:#7c3aed;">Submitted 📤</span>
      <h2>Your applications are live, ${client.firstName}!</h2>
      <p>Your business credit applications have been officially submitted to our target lenders and are currently in active underwriting review.</p>
      <div class="info-box">
        <strong>📊 Current Status:</strong> Under Review with Senior Underwriting<br>
        <strong>⏱️ Decision Window:</strong> 3 to 7 Business Days
      </div>
      <div class="step"><strong>🔔 Action: Watch for Bank Verification</strong><br>If you receive any automated verification SMS codes or identity confirmation emails from issuing banks, <strong>enter them immediately</strong> or forward them to us. Delays in responding can cause application cancellations.</div>
      <p>We are monitoring underwriting feeds daily and will notify you the moment an approval is rendered.</p>
    `, client.firstName),
  };
}

export function buildApprovalEmail(client: Client, approvedAmount?: number, bankName?: string): { subject: string; html: string } {
  const successFee = client.plan === 'A' ? 1000 : 1500;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  return {
    subject: `🎉 CONGRATULATIONS! Your First Business Credit Facility is Approved!`,
    html: wrapEmailHtml(`
      <span class="badge green">APPROVED ✓</span>
      <h2>🎉 Congratulations, ${client.firstName}! You're approved!</h2>
      <p>We are thrilled to inform you that your business credit application has been <strong>APPROVED</strong>!</p>
      ${approvedAmount ? `
      <div class="success-box">
        🏦 <strong>Issuing Institution:</strong> ${bankName || 'See welcome packet'}<br>
        💳 <strong>Approved Credit Limit:</strong> $${approvedAmount.toLocaleString()}<br>
        📅 <strong>Effective Date:</strong> ${new Date().toLocaleDateString()}
      </div>` : ''}
      <div class="warning-box">
        <strong>💰 Success Fee Due – Action Required</strong><br>
        Per Section 3 of your signed agreement:<br>
        <strong>Plan:</strong> Option ${client.plan}<br>
        <strong>Total Success Fee Due:</strong> <span style="font-size:20px;font-weight:800;">$${successFee.toLocaleString()}</span><br>
        <strong>Due Date:</strong> ${dueDate.toLocaleDateString()} (3 Business Days)
      </div>
      <p>Once your payment is confirmed, you will receive your <strong>Card Activation Protocol & 1% Utilization Scaling Guide</strong> to protect and grow your new credit line immediately.</p>
      <hr class="divider">
      <p style="color:#94a3b8;font-size:13px;">Questions about payment? Reply directly to this email within 24 hours.</p>
    `, client.firstName),
  };
}

export function buildPaymentConfirmedEmail(client: Client): { subject: string; html: string } {
  const successFee = client.plan === 'A' ? 1000 : 1500;
  return {
    subject: `Payment Confirmed ✓ – Card Activation & 1% Utilization Guide`,
    html: wrapEmailHtml(`
      <span class="badge green">Payment Received ✓</span>
      <h2>You're all set, ${client.firstName}! 💳</h2>
      <p>We have received your payment of <strong>$${successFee.toLocaleString()}</strong>. Your account is officially settled and marked in good standing.</p>
      <div class="success-box">✅ Payment received and confirmed<br>✅ Account status: Good Standing<br>✅ File archived: Brevard County, Florida</div>
      <h2>Card Activation & Protection Protocol</h2>
      <div class="step"><strong>Step 1 – Activate Your Card</strong><br>Call the number on the back of your card or use the bank's mobile app to activate it now.</div>
      <div class="step"><strong>Step 2 – Set Statement Date Alerts</strong><br>Set a recurring calendar reminder <strong>5 days before your statement closing date</strong> (not the due date — the closing date).</div>
      <div class="step"><strong>Step 3 – The 1% Rule (Critical)</strong><br>Never let a balance over <strong>1% of your credit limit</strong> appear on your statement date. Pay it down before the statement cuts — zero interest, maximum score impact.</div>
      <div class="step"><strong>Step 4 – The AZEO Strategy</strong><br>If you have multiple cards: pay all cards to $0 before their statement date, but leave one card reporting a tiny $5–$15 balance. This signals active credit usage to the scoring algorithms and typically boosts scores 20–40 points.</div>
      <div class="info-box">🚀 Ready for Round 2? You may be eligible for a credit line increase (CLI) in 60–90 days. Reply and we will prepare your next funding wave.</div>
    `, client.firstName),
  };
}

export function buildOverdueAlertEmail(client: Client): { subject: string; html: string } {
  const successFee = client.plan === 'A' ? 1000 : 1500;
  return {
    subject: `⚠️ URGENT: Outstanding Success Fee – Immediate Action Required`,
    html: wrapEmailHtml(`
      <span class="badge red">ACTION REQUIRED ⚠️</span>
      <h2>Dear ${client.firstName},</h2>
      <p>This is a priority compliance notice regarding the approved credit facility secured under your Personal Guarantor Agreement.</p>
      <div class="warning-box">
        <strong>Outstanding Balance:</strong> $${successFee.toLocaleString()}<br>
        <strong>Original Due Date:</strong> 3 business days after approval<br>
        <strong>Status:</strong> OVERDUE – Immediate Action Required
      </div>
      <p>As outlined in <strong>Sections 3.4 and 4.4</strong> of your signed Agreement, failure to settle within <strong>the next 24 hours</strong> authorizes our team to:</p>
      <ul>
        <li>Contact the issuing bank's risk department to <strong>freeze or close</strong> the guaranteed facility</li>
        <li>Report the unpaid amount to collections under Florida Statutes Chapter 687</li>
        <li>Pursue recovery of all fees plus attorney costs through Brevard County arbitration</li>
      </ul>
      <p><strong>To resolve this immediately, please remit payment via ACH, wire transfer, or certified bank draft and reply with your payment confirmation number.</strong></p>
      <p style="color:#94a3b8;font-size:13px;">If you have already sent payment, please reply with your transaction confirmation number to halt this notice.</p>
    `, client.firstName),
  };
}

export function buildPostCareEmail(client: Client): { subject: string; html: string } {
  return {
    subject: `45-Day Check-In: Ready to Scale Your Credit Lines to $50,000+?`,
    html: wrapEmailHtml(`
      <span class="badge" style="background:#0d9488;">45-Day Post-Care Check-in 🚀</span>
      <h2>It's been 45 days, ${client.firstName}!</h2>
      <p>Your payment history is reporting on time, and your business credit entity is actively seasoning. Here is where you stand and what to do next.</p>
      <div class="success-box">
        ✅ Payment history: On-time reporting confirmed<br>
        ✅ Entity seasoning: Active with 45 days of history<br>
        ✅ Credit profile: Building positive trajectory
      </div>
      <h2>Your Next Growth Opportunities</h2>
      <div class="step"><strong>💳 Credit Line Increase (CLI) Requests</strong><br>You are now eligible to request an automatic credit line increase on your existing card. Many issuers approve CLIs at 60–90 days with zero hard inquiry if requested online.</div>
      <div class="step"><strong>📦 Tier-2 Vendor Credit Accounts</strong><br>Net-30 vendor accounts (Uline, Quill, Grainger, HD Supply) report to Dun & Bradstreet and help establish your D&B Paydex score — critical for the next tier of no-PG business funding.</div>
      <div class="step"><strong>💰 0% APR Business Card Stacking</strong><br>With 45+ days of clean history, you are now positioned for a second round of 0% APR business cards, adding $15K–$50K in additional no-interest business capital without increasing personal debt-to-income ratio.</div>
      <div class="info-box">
        🎯 <strong>Target in 90 Days:</strong> $50,000+ in total business credit lines at 0% APR.<br>
        Reply to this email to start your Round 2 application sequence.
      </div>
    `, client.firstName),
  };
}

// ── Email Dispatcher ──────────────────────────────────────────
export async function dispatchEmail(
  client: Client,
  stage: EmailStage,
  extraData?: Record<string, any>
): Promise<EmailLogEntry> {
  let emailContent: { subject: string; html: string };

  switch (stage) {
    case 'WELCOME': emailContent = buildWelcomeEmail(client); break;
    case 'DOCS_VERIFIED': emailContent = buildDocsVerifiedEmail(client); break;
    case 'SUBMITTED': emailContent = buildSubmittedEmail(client); break;
    case 'APPROVED': emailContent = buildApprovalEmail(client, extraData?.approvedAmount, extraData?.bankName); break;
    case 'PAYMENT_CONFIRMED': emailContent = buildPaymentConfirmedEmail(client); break;
    case 'OVERDUE_48H': emailContent = buildOverdueAlertEmail(client); break;
    case 'POST_CARE_45DAY': emailContent = buildPostCareEmail(client); break;
    default: throw new Error(`Unknown email stage: ${stage}`);
  }

  const entry: EmailLogEntry = {
    id: uuidv4(),
    stage,
    subject: emailContent.subject,
    body: emailContent.html,
    status: 'PENDING',
    sentAt: undefined,
    mailjetMessageId: undefined,
  };

  const result = await sendEmail({
    toEmail: client.email,
    toName: `${client.firstName} ${client.lastName}`,
    subject: emailContent.subject,
    htmlBody: emailContent.html,
  });

  if (result.success) {
    entry.status = 'SENT';
    entry.sentAt = new Date().toISOString();
    entry.mailjetMessageId = result.messageId;
  } else {
    entry.status = 'FAILED';
  }

  return entry;
}

// ── Overdue Invoice Scheduler Check (call periodically) ───────
export function getClientsNeedingOverdueAlert(clients: Client[]): Client[] {
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  return clients.filter((client) => {
    if (!client.invoice) return false;
    if (client.invoice.status !== 'PENDING') return false;
    if (client.invoice.overdueAlertSent) return false;
    const approvedAt = client.approvedAt ? new Date(client.approvedAt).getTime() : 0;
    return now - approvedAt > FORTY_EIGHT_HOURS;
  });
}

export function getClientsNeedingPostCare(clients: Client[]): Client[] {
  const now = Date.now();
  const FORTY_FIVE_DAYS = 45 * 24 * 60 * 60 * 1000;
  return clients.filter((client) => {
    if (!client.invoice?.paidAt) return false;
    const hasPostCare = client.emailLog.some((e) => e.stage === 'POST_CARE_45DAY' && e.status === 'SENT');
    if (hasPostCare) return false;
    const paidAt = new Date(client.invoice.paidAt).getTime();
    return now - paidAt >= FORTY_FIVE_DAYS;
  });
}
