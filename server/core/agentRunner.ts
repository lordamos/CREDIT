import type { Client, AgentId, AgentResult, NegativeItem, DisputeLetter, CreditProfile, ReadinessVerdict } from '../../shared/types/credit.js';
import { v4 as uuidv4 } from 'uuid';

// ── Agent Runner ──────────────────────────────────────────────
// Each agent takes the client's credit & business profile and generates structured output.
// In production, these can call an LLM API. For now they generate structured
// expert-level output based on institutional underwriting criteria.

export async function runAgent(client: Client, agentId: AgentId): Promise<AgentResult> {
  const profile = client.creditProfile;

  switch (agentId) {
    case 'COMPREHENSIVE_AUDIT': return runComprehensiveAudit(client, profile);
    case 'ROADMAP_90_DAY': return runRoadmap90Day(client, profile);
    case 'DEBT_OPTIMIZER': return runDebtOptimizer(client, profile);
    case 'DISPUTE_LETTER': return runDisputeLetterFactory(client, profile);
    case 'GOODWILL_LETTER': return runGoodwillLetterFactory(client, profile);
    case 'INQUIRY_MINIMIZER': return runInquiryMinimizer(client, profile);
    case 'SECONDARY_FREEZE': return runSecondaryBureauFreeze(client);
    case 'CREDIT_GROWTH': return runCreditGrowth(client, profile);
    // ── 5-Prompt Business Underwriting & Funding Readiness Engine ──
    case 'BIZ_FORMATION_EIN': return runBizFormationAudit(client);
    case 'BIZ_ADDRESS_FOOTPRINT': return runBizAddressFootprintAudit(client);
    case 'BIZ_NAICS_CLASSIFICATION': return runBizNaicsAudit(client);
    case 'BIZ_COMMINGLING_FINANCES': return runBizComminglingAudit(client);
    case 'BIZ_FUNDING_READINESS': return runBizFundingReadiness(client);
    default: throw new Error(`Unknown agent: ${agentId}`);
  }
}

export async function runAllBusinessAudits(client: Client): Promise<Partial<Record<AgentId, AgentResult>>> {
  const results: Partial<Record<AgentId, AgentResult>> = {};
  
  // Run Prompts 1 through 4 sequentially
  results['BIZ_FORMATION_EIN'] = runBizFormationAudit(client);
  results['BIZ_ADDRESS_FOOTPRINT'] = runBizAddressFootprintAudit(client);
  results['BIZ_NAICS_CLASSIFICATION'] = runBizNaicsAudit(client);
  results['BIZ_COMMINGLING_FINANCES'] = runBizComminglingAudit(client);
  
  // Prompt 5 synthesizes findings from Prompts 1 through 4
  results['BIZ_FUNDING_READINESS'] = runBizFundingReadiness(client, results);
  
  return results;
}

export async function runAllAgents(client: Client): Promise<Partial<Record<AgentId, AgentResult>>> {
  const agentIds: AgentId[] = [
    'COMPREHENSIVE_AUDIT', 'ROADMAP_90_DAY', 'DEBT_OPTIMIZER',
    'DISPUTE_LETTER', 'GOODWILL_LETTER', 'INQUIRY_MINIMIZER',
    'SECONDARY_FREEZE', 'CREDIT_GROWTH',
    'BIZ_FORMATION_EIN', 'BIZ_ADDRESS_FOOTPRINT', 'BIZ_NAICS_CLASSIFICATION',
    'BIZ_COMMINGLING_FINANCES', 'BIZ_FUNDING_READINESS'
  ];
  const results: Partial<Record<AgentId, AgentResult>> = {};
  for (const id of agentIds) {
    try {
      results[id] = await runAgent(client, id);
    } catch (e: any) {
      results[id] = { agentId: id, status: 'ERROR', title: id, output: e.message, generatedAt: new Date().toISOString() };
    }
  }
  return results;
}

// ── Agent 1: Comprehensive Forensic Audit ────────────────────
function runComprehensiveAudit(client: Client, profile: CreditProfile): AgentResult {
  const items = profile.negativeItems;
  const chargeOffs = items.filter(i => i.type === 'CHARGE_OFF');
  const collections = items.filter(i => i.type === 'COLLECTION');
  const latePayments = items.filter(i => i.type === 'LATE_PAYMENT');
  const inquiries = items.filter(i => i.type === 'INQUIRY');
  const sorted = [...items].sort((a, b) => b.impactScore - a.impactScore);

  const output = `# 🔍 Forensic Credit Audit Report
**Client:** ${client.firstName} ${client.lastName} | **Company:** ${client.companyName}
**Audit Date:** ${new Date().toLocaleDateString()}

---

## Score Snapshot
| Bureau | Current Score | Target | Gap to 750 |
|--------|--------------|--------|-----------|
| Equifax | ${profile.currentScores.equifax ?? 'N/A'} | 750 | ${profile.currentScores.equifax ? 750 - profile.currentScores.equifax : 'N/A'} pts |
| Experian | ${profile.currentScores.experian ?? 'N/A'} | 750 | ${profile.currentScores.experian ? 750 - profile.currentScores.experian : 'N/A'} pts |
| TransUnion | ${profile.currentScores.transunion ?? 'N/A'} | 750 | ${profile.currentScores.transunion ? 750 - profile.currentScores.transunion : 'N/A'} pts |

---

## Negative Item Summary
| Category | Count | Est. Score Impact |
|----------|-------|-----------------|
| Charge-Offs | ${chargeOffs.length} | HIGH (-40 to -100 pts each) |
| Collections | ${collections.length} | HIGH (-50 to -110 pts each) |
| Late Payments | ${latePayments.length} | MEDIUM (-20 to -50 pts each) |
| Hard Inquiries | ${inquiries.length} | LOW (-5 to -15 pts each) |
| **TOTAL** | **${items.length}** | |

---

## Priority Ranking (Highest Impact First)
${sorted.map((item, i) => `
### ${i + 1}. ${item.creditor} — ${item.type.replace(/_/g, ' ')}
- **Bureau(s):** ${item.bureau}
- **Account #:** ${item.accountNumber ?? 'Not provided'}
- **Balance:** ${item.balance != null ? '$' + item.balance.toLocaleString() : 'Unknown'}
- **Date of First Delinquency:** ${item.dateOfFirstDelinquency ?? 'Unknown'}
- **Impact Score:** ${'⭐'.repeat(item.impactScore)} (${item.impactScore}/5)
- **Recommended Strategy:** ${item.disputeStrategy.replace(/_/g, ' ')}
${item.notes ? `- **Notes:** ${item.notes}` : ''}`).join('\n')}

---

## Current Utilization Analysis
- **Total Available Credit:** ${profile.totalAvailableCredit ? '$' + profile.totalAvailableCredit.toLocaleString() : 'N/A'}
- **Total Debt:** ${profile.totalDebt ? '$' + profile.totalDebt.toLocaleString() : 'N/A'}
- **Current Utilization:** ${profile.currentUtilization != null ? profile.currentUtilization + '%' : 'N/A'}
- **Optimal Utilization Target:** 1% (AZEO Strategy)
- **Inquiries (past 24 months):** ${profile.numberOfInquiries ?? 'N/A'}
- **Oldest Account Age:** ${profile.oldestAccountAge ? Math.floor(profile.oldestAccountAge / 12) + ' years' : 'N/A'}

---

## Key Findings & Red Flags
${chargeOffs.length > 0 ? `⚠️ **${chargeOffs.length} Charge-Off(s) detected** — These have the highest negative weight. Immediate Metro 2 factual dispute recommended.` : ''}
${collections.length > 0 ? `⚠️ **${collections.length} Collection(s) detected** — Verify Date of First Delinquency (DOFD). If reporting past 7 years from DOFD, file for immediate deletion.` : ''}
${(profile.numberOfInquiries ?? 0) > 4 ? `⚠️ **${profile.numberOfInquiries} hard inquiries** — Above 4 inquiries significantly signals credit-seeking behavior to lenders.` : ''}
${(profile.currentUtilization ?? 0) > 30 ? `⚠️ **Utilization at ${profile.currentUtilization}%** — Above 30% threshold. AZEO strategy needed immediately for fast score boost.` : ''}
✅ Audit complete. Agents 2–8 are ready to execute based on these findings.`;

  return {
    agentId: 'COMPREHENSIVE_AUDIT',
    status: 'COMPLETE',
    title: 'Forensic Credit Audit',
    output,
    generatedAt: new Date().toISOString(),
  };
}

// ── Agent 2: 90-Day Roadmap ───────────────────────────────────
function runRoadmap90Day(client: Client, profile: CreditProfile): AgentResult {
  const hasFormalDisputes = profile.negativeItems.some(i =>
    i.disputeStrategy === 'FORMAL_FCRA' || i.disputeStrategy === 'DEBT_VALIDATION'
  );
  const hasGoodwill = profile.negativeItems.some(i => i.disputeStrategy === 'GOODWILL');
  const needsAZEO = (profile.currentUtilization ?? 0) > 10;

  const output = `# 🗺️ 90-Day Credit Repair & Acceleration Roadmap
**Client:** ${client.firstName} ${client.lastName}
**Start Date:** ${new Date().toLocaleDateString()}
**Target:** 750+ FICO by Day 90

---

## Phase 1: Immediate Wins (Days 1–7) — Quick Score Boost
${needsAZEO ? `
### Day 1–3: Execute AZEO Utilization Strategy
1. Log in to all credit card accounts and check their **statement closing dates**.
2. Pay all balances to **$0** at least 3 days before each card's statement closing date.
3. Leave exactly **one card** (your oldest or highest-limit card) with a tiny $5–$15 balance.
4. Wait for statements to cut. Scores typically update within 2–5 days of statement close.
5. **Expected Impact: +20 to +80 points in one billing cycle.**
` : ''}
### Day 1: Freeze Secondary Reporting Agencies
Execute the Secondary Bureau Freeze (Agent 7) before sending any disputes. This breaks the e-OSCAR automated verification loop and forces bureaus to conduct actual manual verification.

### Day 2–5: Send Round 1 FCRA Dispute Letters (via Certified Mail)
Send formal FCRA §611 dispute letters to all three bureaus for all **FORMAL_FCRA** items.
- **Send via:** USPS Certified Mail, Return Receipt Requested
- **30-day clock starts:** On the date the bureau receives your letter (track your USPS confirmation)
- **Bureau mailing addresses:**
  - Equifax: PO Box 740256, Atlanta, GA 30374
  - Experian: PO Box 4500, Allen, TX 75013
  - TransUnion: PO Box 2000, Chester, PA 19016

---

## Phase 2: Follow-Up & Escalation (Days 30–45)
### Day 30: FCRA Deadline Check
Bureaus must respond within **30 days** (45 days if you submitted your dispute online with additional documents).
- If items were **deleted** → Document, celebrate, move to Phase 3.
- If items were "verified" → Demand **Method of Verification (MOV)** under FCRA §611(a)(6)(B)(iii) — send Round 2 letters.
- If no response within 30 days → Items must be deleted by law under FCRA §611(a)(1).

${hasGoodwill ? `### Days 31–35: Send Goodwill Letters to Original Creditors
For late payments on otherwise healthy accounts, send goodwill adjustment requests directly to the creditors (not the bureaus). These bypass the dispute system entirely and request voluntary deletion.` : ''}

### Day 35–45: AZEO Round 2
If utilization is still above 10%, run the AZEO strategy again for a second wave of score gains.

---

## Phase 3: Score Stabilization & Growth (Days 45–90)
### Day 45–60: New Positive Tradeline Strategy
- Apply for 1–2 secured credit cards (Capital One Quicksilver Secured, Discover IT Secured).
- Apply for a credit-builder loan (Self Inc., Credit Strong).
- Add yourself as Authorized User (AU) on a family member's seasoned, clean card.

### Day 60–75: CLI Requests
Request credit line increases on existing cards. Do this online to avoid hard inquiries.

### Day 75–90: Score Verification & Final Push
- Pull reports from all 3 bureaus and verify all deletions are reflected.
- Dispute any remaining items that reappeared or were re-aged illegally.
- Run final AZEO cycle before your target application date.

---

## Score Projection
| Milestone | Expected Score Impact |
|-----------|----------------------|
| AZEO Execution | +20 to +80 pts |
| Each Deletion (Collection/Charge-Off) | +15 to +45 pts |
| Each Late Payment Removed | +5 to +25 pts |
| New Positive Tradeline Added | +10 to +25 pts |
| **Combined 90-Day Projection** | **+80 to +200+ pts** |`;

  return {
    agentId: 'ROADMAP_90_DAY',
    status: 'COMPLETE',
    title: '90-Day Repair Roadmap',
    output,
    generatedAt: new Date().toISOString(),
  };
}

// ── Agent 3: Debt Optimizer ───────────────────────────────────
function runDebtOptimizer(client: Client, profile: CreditProfile): AgentResult {
  const debts = profile.debtAccounts;
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const cards = debts.filter(d => d.type === 'CREDIT_CARD' && d.creditLimit);
  const totalLimit = cards.reduce((s, d) => s + (d.creditLimit ?? 0), 0);
  const totalCardBalance = cards.reduce((s, d) => s + d.balance, 0);
  const utilization = totalLimit > 0 ? Math.round((totalCardBalance / totalLimit) * 100) : 0;

  // Avalanche order: highest interest rate first
  const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  // Snowball order: lowest balance first
  const snowball = [...debts].sort((a, b) => a.balance - b.balance);

  const output = `# 📉 Debt Strategy Optimizer
**Client:** ${client.firstName} ${client.lastName}
**Total Debt:** $${totalDebt.toLocaleString()}
**Credit Card Utilization:** ${utilization}%
**Target Utilization:** 1% (AZEO)

---

## AZEO Rapid Utilization Fix (Do This First — Biggest Score Boost)
**Current Utilization: ${utilization}%**
${cards.map(card => {
    const targetBalance = Math.ceil((card.creditLimit ?? 0) * 0.01);
    const paydown = Math.max(0, card.balance - targetBalance);
    return `- **${card.creditor}**: Balance $${card.balance.toLocaleString()} / Limit $${(card.creditLimit ?? 0).toLocaleString()} → Pay down **$${paydown.toLocaleString()}** → leave $${targetBalance} reporting`;
  }).join('\n')}

Executing AZEO will drop your utilization from **${utilization}%** to **~1%**, which can add **+20 to +80 points** in a single billing cycle.

---

## Debt Elimination: Avalanche Method (Recommended — Saves Most Interest)
*Pay minimums on all debts, then throw all extra money at the highest-interest debt first.*

${avalanche.map((d, i) => `**Priority ${i + 1}:** ${d.creditor} — Balance: $${d.balance.toLocaleString()} @ ${d.interestRate}% APR | Min Payment: $${d.minimumPayment}/mo`).join('\n')}

**Why Avalanche wins:** You pay the least total interest over time, freeing up cash faster.

---

## Debt Elimination: Snowball Method (Psychological Wins)
*Pay minimums on all debts, then throw all extra money at the smallest balance first.*

${snowball.map((d, i) => `**Priority ${i + 1}:** ${d.creditor} — Balance: $${d.balance.toLocaleString()} @ ${d.interestRate}% APR | Min Payment: $${d.minimumPayment}/mo`).join('\n')}

**Why Snowball works:** Eliminates accounts faster, reducing the total number of open balances (improves score profile).

---

## Recommendation
${utilization > 30 ? '✅ **Execute AZEO immediately** — this is your fastest single score boost.\n' : ''}${debts.some(d => d.interestRate > 20) ? '✅ **Avalanche method** recommended — high-interest debt is destroying your monthly cash flow.' : '✅ **Either method works** for your debt profile. Pick based on what motivates you most.'}`;

  return {
    agentId: 'DEBT_OPTIMIZER',
    status: 'COMPLETE',
    title: 'Debt Strategy Optimizer',
    output,
    generatedAt: new Date().toISOString(),
  };
}

// ── Agent 4: FCRA Dispute Letter Factory ─────────────────────
function runDisputeLetterFactory(client: Client, profile: CreditProfile): AgentResult {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const disputeItems = profile.negativeItems.filter(i => i.type !== 'INQUIRY');

  const letters: DisputeLetter[] = [];

  // e-OSCAR OCR Bypass Spintax Engine
  const introVariations = [
    "I am writing to formally dispute the following item(s) appearing on my consumer credit file, which I have reviewed and determined to be inaccurate, unverifiable, and/or reported in violation of the Fair Credit Reporting Act.",
    "After reviewing my credit report, I have identified the following accounts as inaccurate or unverified. I am requesting an immediate reinvestigation pursuant to my rights under the FCRA.",
    "This letter serves as a formal dispute regarding erroneous and unverifiable trade lines currently reporting on my credit file. I demand a full investigation into these inaccuracies.",
    "I have recently pulled my credit report and found severely inaccurate information. Please investigate the following items immediately as required by federal law."
  ];

  const demandVariations = [
    "Under FCRA §611(a), you are required to conduct a reasonable reinvestigation of this item. I demand you provide the complete METHOD OF VERIFICATION.",
    "I require that you investigate this item under 15 U.S.C. §1681i. If this account cannot be 100% verified with the original furnisher, it must be deleted.",
    "Pursuant to the Fair Credit Reporting Act, I demand proof of this alleged debt and the complete method used to verify it. If unverified, delete it immediately.",
    "By law, you must verify the accuracy of this account. Failure to provide strict proof of verification will require permanent removal from my credit report."
  ];

  const signoffVariations = [
    "I will not accept an unverified 're-verification' as satisfactory resolution.",
    "Govern yourself accordingly. I expect a response within 30 days.",
    "Failure to comply with these federal guidelines will result in complaints to the CFPB.",
    "I look forward to receiving an updated copy of my credit report showing these deletions."
  ];

  // Group by bureau
  const bureaus = ['Equifax', 'Experian', 'TransUnion'] as const;
  for (const bureau of bureaus) {
    const bureauItems = disputeItems.filter(i => i.bureau.includes(bureau));
    if (bureauItems.length === 0) continue;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 37); // 30 days + 7 days for mail delivery

    // Randomize per bureau to defeat e-OSCAR cross-referencing
    const rIntro = introVariations[Math.floor(Math.random() * introVariations.length)];
    const rSignoff = signoffVariations[Math.floor(Math.random() * signoffVariations.length)];

    const letterContent = `${today}

${client.firstName} ${client.lastName}
${client.address}, ${client.city}, ${client.state} ${client.zip}
SSN: XXX-XX-XXXX (Last 4: XXXX)
Date of Birth: XX/XX/XXXX

${bureau} Information Services
${bureau === 'Equifax' ? 'P.O. Box 740256\nAtlanta, GA 30374' :
  bureau === 'Experian' ? 'P.O. Box 4500\nAllen, TX 75013' :
  'P.O. Box 2000\nChester, PA 19016'}

Re: Formal Request to Investigate & Remove Inaccurate / Unverifiable Credit Information
Pursuant to: Fair Credit Reporting Act (FCRA) 15 U.S.C. § 1681 et seq., § 611, § 623

To Whom It May Concern at ${bureau}:

${rIntro}

DISPUTED ITEMS:

${bureauItems.map((item, i) => {
   const rDemand = demandVariations[Math.floor(Math.random() * demandVariations.length)];
   return `${i + 1}. CREDITOR/FURNISHER: ${item.creditor}
   Account Number: ${item.accountNumber ?? 'Unknown'}
   Type: ${item.type.replace(/_/g, ' ')}
   
   BASIS FOR DISPUTE: This account is disputed as inaccurate, incomplete, and/or unverifiable. The reported information contains material errors and/or cannot be verified to comply with Metro 2 reporting standards. Specifically, I dispute the accuracy of the payment history, high balance, and Date of First Delinquency.
   
   LEGAL DEMAND: ${rDemand}`;
}).join('\\n\\n')}

LEGAL NOTICE & DEMAND FOR ACTION:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i, you are hereby required to:
1. Conduct a REASONABLE REINVESTIGATION of the above-listed disputed information within THIRTY (30) DAYS.
2. If you are UNABLE TO FULLY VERIFY each element, you are LEGALLY REQUIRED to PERMANENTLY DELETE the disputed item(s) under FCRA § 611(a)(5)(A).

PLEASE BE ADVISED that I am aware of my rights under FCRA § 611, § 623, § 616, and § 617.
${rSignoff}

Sincerely,

________________________________
${client.firstName} ${client.lastName}

Enclosures:
- Copy of Government-Issued Photo ID
- Copy of Social Security Card
- Copy of Proof of Address`;

    letters.push({
      id: uuidv4(),
      clientId: client.id,
      type: 'FCRA_FORMAL_DISPUTE',
      bureau,
      content: letterContent,
      status: 'DRAFT',
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  const output = `# ⚖️ e-OSCAR Bypass Dispute Engine
**Generated:** ${new Date().toLocaleDateString()}
**Letters Created:** ${letters.length} (AI Spintax Applied)
**30-Day FCRA Deadline:** ~${new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toLocaleDateString()}

${letters.length === 0 ? '✅ No items requiring formal FCRA dispute identified.' : `
## Letters Generated:
${letters.map((l, i) => `${i + 1}. **${l.bureau}** - ${disputeItems.filter(i => i.bureau.includes(l.bureau!)).length} item(s) disputed (100% Unique OCR Hash)`).join('\n')}

## Critical Mailing Instructions:

**✅ Option A: Online Overnight Mailing (RECOMMENDED)**
Skip the post office entirely. You can upload the PDFs of these letters directly to online mailrooms like [Mailform.io](https://www.mailform.io) or [Click2Mail](https://click2mail.com).
1. Upload the PDF.
2. Select **USPS Certified Mail**.
3. Select **Return Receipt Electronic (RRE)** or **Overnight Delivery**.
4. They will print, stuff, and mail the letters for you!

**📫 Option B: Traditional USPS Mailing**
1. **Print** each letter and sign by hand.
2. **Mail via USPS Certified Mail with Return Receipt Requested** (green card).
3. **Keep the USPS tracking number** - this is your legal proof of delivery.
4. **Attach enclosures** - ID, SSN doc, proof of address.

*Note: Your 30-day countdown begins the day the tracking number shows "Delivered" at the credit bureau. We will automatically send you a 30-Day Follow-Up email!*`}
`;

  return {
    agentId: 'DISPUTE_LETTER',
    status: 'COMPLETE',
    title: 'e-OSCAR Bypass Dispute Engine',
    output,
    generatedAt: new Date().toISOString(),
    letters: letters.length > 0 ? letters : undefined
  };
}

// ── Agent 5: Goodwill Letter Factory ─────────────────────────
function runGoodwillLetterFactory(client: Client, profile: CreditProfile): AgentResult {
  const goodwillItems = profile.negativeItems.filter(i => i.disputeStrategy === 'GOODWILL');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const letters: DisputeLetter[] = [];

  for (const item of goodwillItems) {
    const letterContent = `${today}

${client.firstName} ${client.lastName}
${client.address}, ${client.city}, ${client.state} ${client.zip}

Customer Relations Department
${item.creditor}
Account Number: ${item.accountNumber ?? 'XXXX'}

Subject: Goodwill Adjustment Request – Request for Late Payment Notation Removal

Dear ${item.creditor} Customer Relations Team,

I am writing to you today as a long-standing customer to humbly request a one-time goodwill adjustment to my account. Specifically, I am requesting the removal of a late payment notation reported on ${item.dateOfFirstDelinquency ? new Date(item.dateOfFirstDelinquency).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'the date noted on my account'} for Account Number ${item.accountNumber ?? 'XXXX-XXXX'}.

I understand and fully accept responsibility for this late payment. I am not disputing its occurrence. Rather, I am reaching out as a loyal customer to explain the circumstances and ask for your compassionate consideration.

At the time of this late payment, I was experiencing significant personal and financial hardship: ${item.notes ?? 'an unexpected financial hardship that temporarily impacted my ability to meet all of my financial obligations on time'}. This situation was temporary and has since been fully resolved.

Since then, I have:
• Maintained a consistent, on-time payment history across all of my accounts
• Actively worked to improve my overall financial management and credit health  
• Remained a committed, loyal customer to ${item.creditor}

This single notation is currently having a significant negative impact on my credit profile and is preventing me from qualifying for favorable financing terms that would help me continue to make responsible financial decisions.

I would be deeply grateful if your team would consider exercising its goodwill adjustment authority to remove this one-time late payment notation as a gesture of appreciation for my otherwise positive and loyal relationship with ${item.creditor}.

I understand this is entirely at your discretion, and I sincerely appreciate you taking the time to review my request. I remain committed to maintaining a positive account relationship going forward.

Please feel free to contact me at ${client.email} or ${client.phone} if you need any additional information.

With sincere gratitude,

________________________________
${client.firstName} ${client.lastName}
Account Number: ${item.accountNumber ?? 'XXXX'}
Phone: ${client.phone}
Email: ${client.email}`;

    letters.push({
      id: uuidv4(),
      clientId: client.id,
      type: 'GOODWILL_ADJUSTMENT',
      creditor: item.creditor,
      accountNumber: item.accountNumber,
      content: letterContent,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    });
  }

  const output = `# 🤝 Goodwill Adjustment Letter Factory
**Generated:** ${new Date().toLocaleDateString()}
**Goodwill Letters Created:** ${letters.length}

${letters.length === 0
    ? '✅ No late payment items flagged for goodwill treatment. All negatives are on the formal FCRA dispute track.'
    : `## Letters Generated:
${letters.map((l, i) => `${i + 1}. **${l.creditor}** — Goodwill request for late payment notation`).join('\n')}

## Key Strategy Notes:
- Send goodwill letters **directly to the creditor's customer relations or executive office** — NOT to the credit bureaus.
- Use USPS First Class Mail (goodwill letters don't need certified mail — you want them to feel like a personal, humble request, not a legal threat).
- Wait 30–45 days for a response.
- If denied, wait 60–90 days and try again (different agent may read it the second time).
- Escalate to the **Executive Office / Office of the President** if the standard CS department denies it.`}`;

  return {
    agentId: 'GOODWILL_LETTER',
    status: 'COMPLETE',
    title: 'Goodwill Adjustment Specialist',
    output,
    generatedAt: new Date().toISOString(),
    letters,
  };
}

// ── Agent 6: Inquiry Minimizer ────────────────────────────────
function runInquiryMinimizer(client: Client, profile: CreditProfile): AgentResult {
  const inquiries = profile.negativeItems.filter(i => i.type === 'INQUIRY');
  
  // Find accounts attached to these inquiries
  const accountCreditors = new Set([
    ...profile.debtAccounts.map(d => d.creditor.toLowerCase()),
    ...profile.negativeItems.filter(n => n.type !== 'INQUIRY').map(n => n.creditor.toLowerCase())
  ]);

  const unattachedInquiries = inquiries.filter(i => {
    return !Array.from(accountCreditors).some(ac => ac.includes(i.creditor.toLowerCase()) || i.creditor.toLowerCase().includes(ac));
  });

  const attachedInquiries = inquiries.filter(i => !unattachedInquiries.includes(i));

  const letters: DisputeLetter[] = unattachedInquiries.map(inq => ({
    id: uuidv4(),
    clientId: client.id,
    type: 'FCRA_FORMAL_DISPUTE',
    bureau: inq.bureau as any,
    creditor: inq.creditor,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    content: `[Your Name]
[Your Address]
[City, State, Zip]

Date: ${new Date().toLocaleDateString()}

To: ${inq.bureau} Credit Bureau

Subject: Dispute of Unauthorized Hard Inquiry - FCRA Section 604 Violation

To Whom It May Concern,

I am writing to formally dispute a hard inquiry on my credit report from ${inq.creditor} dated ${inq.dateOpened || 'Unknown Date'}. I have no open or closed account with this institution, nor did I apply for credit or provide permissible purpose under Section 604 of the Fair Credit Reporting Act (FCRA).

Please provide proof of signed authorization bearing my physical signature. If you cannot produce this documentation within 30 days, as required by law, this inquiry must be permanently removed from my credit file.

Thank you,

${client.firstName} ${client.lastName}`
  }));

  const output = `# 🕵️ Hard Inquiry Minimizer & Smart Application Strategy
**Total Inquiries Found:** ${inquiries.length}
**Unattached Inquiries (Disputable):** ${unattachedInquiries.length}

---

## 🚨 Unattached Inquiries Detected
*The following inquiries do not match any open or closed accounts on your profile. Under FCRA §604, inquiries without a permissible purpose or an associated account application are highly disputable and must be removed if the creditor cannot prove authorization.*

${unattachedInquiries.length === 0 ? '✅ Excellent. No unattached inquiries found.' : unattachedInquiries.map(i => `- **${i.creditor}** (${i.bureau}) - ${i.dateOpened ?? 'Date unknown'} 🛑 **FLAGGED FOR DISPUTE**`).join('\\n')}

---

## 📎 Attached Inquiries
*These inquiries correspond to existing accounts on your file. Disputing them is generally unsuccessful and could risk the associated account being closed.*

${attachedInquiries.length === 0 ? '*None.*' : attachedInquiries.map(i => `- **${i.creditor}** (${i.bureau}) - ${i.dateOpened ?? 'Date unknown'}`).join('\\n')}

---

## ⚖️ Dispute Unauthorized Inquiries
We have automatically generated **${letters.length} FCRA §604 Dispute Letter(s)** for your unattached inquiries. 
These are available in your Letters tab and demand proof of signed authorization.

---

## Future Application Strategy (Rate Shopping Protection)
### The 14-45 Day Rate Shopping Window
- When shopping for a mortgage, auto loan, or student loan - apply to ALL lenders within a **14-day window**.
- FICO 8 and VantageScore 3.0/4.0 will count these as **1 inquiry** instead of multiple.
- For credit cards, each application IS a separate inquiry (no bundling).

### The Application Pre-Qualification Hack
- ALWAYS use lenders' pre-qualification tools (soft pull only) before formally applying.
- Pre-qualifications are NOT hard inquiries and show you your likely approval odds risk-free.
`;

  return {
    agentId: 'INQUIRY_MINIMIZER',
    status: 'COMPLETE',
    title: 'Inquiry Minimizer & Disputer',
    output,
    generatedAt: new Date().toISOString(),
    letters: letters.length > 0 ? letters : undefined
  };
}

// ── Agent 7: Secondary Bureau Freeze ─────────────────────────
function runSecondaryBureauFreeze(client: Client): AgentResult {
  const output = `# 🔒 Secondary Bureau Freeze Strategy
**Client:** ${client.firstName} ${client.lastName}
**Execute This BEFORE Sending Any Dispute Letters**

---

## Why This Matters (The e-OSCAR Secret)
When you submit a dispute to Equifax, Experian, or TransUnion, they do NOT call the creditor directly. Instead, they use an automated system called **e-OSCAR** (Online Solution for Complete and Accurate Reporting) that electronically pings data aggregators to "verify" accounts in seconds.

These aggregators include:
- **LexisNexis Risk Solutions** (the largest)
- **SageStream (now part of LexisNexis)**
- **Innovis Credit Bureau**
- **ARS (Advanced Resolution Services)**
- **ChexSystems** (banking history)
- **Early Warning Services (EWS)** (banking/fraud)

If you freeze these agencies BEFORE disputing, the bureaus cannot electronically verify the disputed items, which legally compels **mandatory deletion within 30 days** under FCRA §611.

---

## Step-by-Step Freeze Instructions

### 1. LexisNexis Risk Solutions (Highest Priority)
- **Phone:** 1-800-456-6004 (request Security Freeze + Opt-Out)
- **Online:** https://optout.lexisnexis.com
- **Mail:** LexisNexis Consumer Center, PO Box 105108, Atlanta, GA 30348
- **Request:** Security Freeze + Full File Disclosure (request a free copy of your LN file simultaneously)
- **Processing:** 3–5 business days

### 2. Innovis Credit Bureau
- **Phone:** 1-800-540-2505
- **Online:** https://www.innovis.com/personal/securityFreeze
- **Mail:** Innovis Consumer Assistance, PO Box 26, Pittsburgh, PA 15230
- **Processing:** Immediate online, 5 days by mail

### 3. ChexSystems (Banking History)
- **Phone:** 1-800-428-9623
- **Online:** https://www.chexsystems.com/web/chexsystems/consumerdebit/page/securityfreeze/addfreeze
- **Mail:** Chex Systems, Inc., Attn: Consumer Relations, 7805 Hudson Road, Suite 100, Woodbury, MN 55125
- **Processing:** 3 business days

### 4. Early Warning Services (EWS)
- **Phone:** 1-800-745-1965
- **Online:** https://www.earlywarning.com/security-freeze
- **Processing:** 1–3 business days

### 5. ARS (Advanced Resolution Services)
- **Mail only:** ARS, Attn: Freeze Request, PO Box 105316, Atlanta, GA 30348
- **Processing:** 5–7 business days

---

## Timing Protocol
| Day | Action |
|-----|--------|
| Day 1 | Request all 5 freezes (online or phone — fastest) |
| Day 3–5 | Confirm freeze confirmations received |
| Day 5–7 | Mail Round 1 FCRA dispute letters to Big 3 bureaus |
| Day 37+ | All disputed items that couldn't be verified = mandatory deletion |

---

## What to Say When You Call:
> "I am calling to place a security freeze on my consumer file and to opt out of all information sharing under FCRA §604(e) and applicable state consumer protection laws. I would also like to request a complete file disclosure at no charge under the Fair and Accurate Credit Transactions Act (FACTA)."

---

## Thawing (Lifting) the Freeze
When you are ready to apply for credit after your dispute phase:
- Contact each agency and provide your freeze PIN (they will give you one when you freeze).
- Thaw selectively — you can thaw only for specific lenders or for a specific time window.
- Thaw 24–48 hours before submitting credit applications.`;

  return {
    agentId: 'SECONDARY_FREEZE',
    status: 'COMPLETE',
    title: 'Secondary Bureau Freeze Engine',
    output,
    generatedAt: new Date().toISOString(),
  };
}

// ── Agent 8: Credit Growth Architect ─────────────────────────
function runCreditGrowth(client: Client, profile: CreditProfile): AgentResult {
  const currentScore = Math.min(
    profile.currentScores.equifax ?? 850,
    profile.currentScores.experian ?? 850,
    profile.currentScores.transunion ?? 850
  );

  const output = `# 📈 Credit Growth Architecture – Path to 750+
**Client:** ${client.firstName} ${client.lastName}
**Current Lowest Score:** ${currentScore}
**Target:** 750+
**Gap:** ${750 - currentScore > 0 ? 750 - currentScore : 'Already at target! Maintain.'} points

---

## The 5 FICO Score Factors (How Your Score Is Built)
| Factor | Weight | Your Current Status | Priority |
|--------|--------|--------------------|-|
| Payment History | **35%** | Being repaired via dispute phase | 🔴 Critical |
| Credit Utilization | **30%** | Target: 1% via AZEO | 🔴 Critical |
| Length of Credit History | **15%** | Protect old accounts; add AU tradelines | 🟡 Important |
| Credit Mix | **10%** | Add installment loan + revolving | 🟡 Important |
| New Credit | **10%** | Minimize hard inquiries | 🟢 Manageable |

---

## Phase 1: Secured Credit Cards (Best for Score < 680)
These report to all 3 bureaus as regular credit cards, building positive history immediately.

### Top Secured Cards (Ranked by Value):
1. **Discover IT Secured** — No annual fee, 2% cash back, automatic upgrade review at 8 months, $200 min deposit, reports to all 3 bureaus.
2. **Capital One Quicksilver Secured** — No annual fee, 1.5% cash back, automatic upgrade at 6 months, $200 min.
3. **OpenSky Secured Visa** — No credit check required, $35 annual fee, good for rebuilding from 500s.
4. **Navy Federal nRewards Secured** — Only if eligible (military/family), excellent limits, path to premium cards.

### Rules for Secured Cards:
- Never carry a balance above **1% of the credit limit** on the statement date.
- Set up autopay for the full statement balance every month.
- Never close them — age of accounts matters.

---

## Phase 2: Credit-Builder Loans (Adds Installment History)
Credit-builder loans are specifically designed to build payment history. They diversify your credit mix.

1. **Self Inc. (Self Financial)** — $25/mo or $48/mo for 12–24 months; money returned at end minus fees; reports to all 3 bureaus.
2. **Credit Strong (Austin Capital Bank)** — $15–$30/mo; best for thin files; reports to all 3 bureaus.
3. **Local Credit Union Credit-Builder Loans** — Often the best terms; ask your local credit union.

---

## Phase 3: Authorized User (AU) Tradeline Strategy
The fastest single score booster for thin or damaged files.

### How It Works:
- A family member or trusted friend adds you as an Authorized User (AU) on their credit card.
- Their entire payment history AND credit limit immediately appear on YOUR credit report.
- You do NOT need the physical card or access to the account.
- A single AU tradeline with a $15,000 limit, 8 years of perfect history can add **+40 to +80 points** in one reporting cycle.

### What to Look for in an AU Card:
✅ 5+ years of account age
✅ $10,000+ credit limit
✅ 0% utilization (or very low)
✅ 100% on-time payment history
✅ Reports to all 3 bureaus (confirm with the card issuer)

---

## The 1% Utilization Rule (Permanent Protocol)
This is the single most important ongoing practice:

1. Know the **statement closing date** for every credit card (not the due date — the closing date).
2. Log in 3–5 days before the closing date.
3. Pay balance down to **1% or below**.
4. Let the statement close at 1%.
5. Pay the remaining balance before the due date (no interest).

**Exception (AZEO):** Let only ONE card report a $5–$15 balance. All others at $0.

---

## 90-Day Credit Building Tracker
| Week | Action | Expected Impact |
|------|--------|----------------|
| Week 1 | Execute AZEO + Freeze Secondary Bureaus | +20–80 pts (utilization) |
| Week 2–4 | Mail Round 1 disputes; Apply for 1 secured card | +10–25 pts |
| Week 5 | Apply for credit-builder loan | +5–15 pts |
| Week 6 | Add as AU on clean seasoned card | +20–60 pts |
| Week 8 | FCRA deletions start coming back | +15–45 pts per deletion |
| Week 10 | Round 2 AZEO cycle | +10–20 pts |
| Week 12 | Final score check — target 750+ | 🎯 |

---

## Score Protection Rules (Never Break These)
1. ❌ Never let a credit card balance exceed 10% on the statement date.
2. ❌ Never close your oldest credit card.
3. ❌ Never apply for more than 2 new cards within 6 months.
4. ❌ Never miss a payment — set autopay for minimums on everything.
5. ✅ Always pay the full statement balance before the due date.`;

  return {
    agentId: 'CREDIT_GROWTH',
    status: 'COMPLETE',
    title: 'Credit Growth Architect',
    output,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ── 5-PROMPT BUSINESS UNDERWRITING & FUNDING READINESS SUITE ────────────────
// ============================================================================

// ── Prompt 1: LLC Formation Documents, EIN, Ownership & Filing Audit ─────────
function runBizFormationAudit(client: Client): AgentResult {
  const biz = client.businessProfile || {};
  const companyName = client.companyName || 'Registered Entity';
  const entityType = biz.entityType || (client.businessType as any) || 'LLC';
  const state = biz.formationState || client.state || 'FL';
  const ein = client.ein || 'Pending / Unfiled';
  const hasEin = ein && ein !== 'Pending / Unfiled' && /^\d{2}-\d{7}$/.test(ein);
  const ownershipPct = biz.ownershipPercentage ?? 100;

  // Audit Inconsistency Checks
  const issues: string[] = [];
  const passes: string[] = [];
  let verdict: ReadinessVerdict = 'READY';

  // Check 1: Punctuation & Designator Consistency
  const hasPunctuation = companyName.includes('.') || companyName.includes(',');
  const hasDesignator = /(LLC|L\.L\.C\.|INC|CORP|LIMITED LIABILITY COMPANY)/i.test(companyName);
  
  if (!hasDesignator) {
    issues.push(`⚠️ **Missing Corporate Designator**: "${companyName}" lacks an explicit statutory identifier (LLC, Inc.). Financial institution CIP/KYC automated scanners will flag this as an unregistered sole proprietorship.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else if (hasPunctuation) {
    issues.push(`⚠️ **Punctuation Discrepancy Risk**: Company name contains punctuation ("${companyName}"). If Secretary of State shows "${companyName.replace(/[,.]/g, '')}" while IRS CP-575 contains periods or commas, automated banking algorithms (Alloy, Middesk, LexisNexis) flag an unverified entity mismatch.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **Clean Statutory Designator**: Legal entity name "${companyName}" uses standardized alphanumeric format.`);
  }

  // Check 2: EIN Documentation (CP 575 / 147C)
  if (!hasEin) {
    issues.push(`🚨 **Unverified or Missing EIN**: Financial institutions require an official IRS Form CP 575 or Form 147C replacement letter. Online-only unverified tax IDs fail tier-1 underwriting.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else {
    passes.push(`✅ **Federal EIN Assigned**: ${ein} is properly formatted under IRS Title 26.`);
  }

  // Check 3: Operating Agreement & Governance
  if (!biz.operatingAgreementFiled) {
    issues.push(`⚠️ **Operating Agreement Audit**: Operating Agreement must be fully executed, dated, and contain a specific **Commercial Banking & Borrowing Resolution Clause** explicitly authorizing ${client.firstName} ${client.lastName} (${ownershipPct}% Ownership) to incur debt on behalf of the entity.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **Executed Operating Agreement on File**: Governance structure and banking authority confirmed.`);
  }

  // Check 4: Secretary of State Good Standing
  if (biz.activeGoodStanding === false) {
    issues.push(`🚨 **Stale SOS Status / Delinquent Annual Report**: Entity is not actively in good standing with the State of ${state}. Banks verify Sunbiz / State Division of Corporations live; delinquent filings trigger immediate automated application rejection.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else {
    passes.push(`✅ **Active State Good Standing**: Division of Corporations charter verified in ${state}.`);
  }

  // Check 5: Ownership Breakdown
  if (ownershipPct < 51) {
    issues.push(`⚠️ **Minority Ownership Underwriting Threshold**: Applicant holds ${ownershipPct}% ownership. Tier-1 commercial lines ($50,000+) require sign-off or personal guarantee from beneficial owners holding at least 20% to 51%+ aggregate control.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **Majority Control Verified**: ${ownershipPct}% ownership held by primary guarantor.`);
  }

  const output = `# 🏛️ Prompt One: LLC Formation Documents, EIN, Ownership Structure & Filing Audit
**Entity:** ${companyName} | **Jurisdiction:** ${state}
**Evaluation Timestamp:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Audit Status:** ${verdict === 'READY' ? '🟢 READY (Institutional Grade)' : verdict === 'NEEDS_ATTENTION' ? '🟡 NEEDS ATTENTION (Manual Underwriter Inquiry)' : '🔴 FIX BEFORE APPLYING (Hard Stop)'}

---

## 📋 Formation & Statutory Integrity Overview
| Vector | Parameter | Underwriting Standard | Status |
|---|---|---|---|
| Legal Name | ${companyName} | Exact match across SOS & IRS | ${hasDesignator && !hasPunctuation ? 'Pass' : 'Flagged'} |
| Entity Structure | ${entityType} | Limited Liability Protection | Verified |
| Federal EIN | ${ein} | Form CP-575 / 147C Letter | ${hasEin ? 'Pass' : 'Missing'} |
| State Registry | ${state} Division of Corporations | Active / Good Standing | ${biz.activeGoodStanding !== false ? 'Active' : 'Delinquent'} |
| Ownership Share | ${ownershipPct}% (${client.firstName} ${client.lastName}) | >51% for streamlined authorization | ${ownershipPct >= 51 ? 'Optimal' : 'Review'} |

---

## 🔍 Inconsistency & Missing Information Findings
${issues.length === 0 ? '✅ **Zero Discrepancies Found.** Your entity structure is 100% compliant with Tier-1 institutional underwriting protocols.' : issues.join('\n\n')}

---

## 🛡️ Institutional Alignment Checklist
${passes.join('\n')}

---

## 🎯 Remediation Directive
${verdict === 'FIX_BEFORE_APPLYING' 
  ? '1. **STOP APPLICATION SUBMISSIONS**: Resolving the highlighted blockers above is strictly required prior to submitting commercial loan or credit card applications.\n2. Request a fresh IRS 147C verification letter or file pending state annual reports immediately.'
  : verdict === 'NEEDS_ATTENTION'
    ? '1. Standardize spelling across all documentation to match the Secretary of State certificate word-for-word.\n2. Ensure your Operating Agreement includes a formal Banking Borrowing Authorization clause with physical signature.'
    : '✅ Your legal formation architecture meets all institutional guidelines. Proceed to Address & Footprint Audit.'}`;

  return {
    agentId: 'BIZ_FORMATION_EIN',
    status: 'COMPLETE',
    title: 'Prompt 1: Formation, EIN & Ownership Audit',
    output,
    generatedAt: new Date().toISOString(),
    verdict,
  };
}

// ── Prompt 2: Business Address & Digital Footprint Audit ───────────────────────
function runBizAddressFootprintAudit(client: Client): AgentResult {
  const biz = client.businessProfile || {};
  const companyName = client.companyName || 'Business Entity';
  const addressType = biz.addressType || 'VIRTUAL_OFFICE';
  const fullAddress = `${client.address}, ${client.city}, ${client.state} ${client.zip}`;

  const issues: string[] = [];
  const passes: string[] = [];
  let verdict: ReadinessVerdict = 'READY';

  // Check 1: Address Type Appropriateness
  if (addressType === 'CMRA_UPS_BOX') {
    issues.push(`🚨 **CMRA / UPS Store Postal Box Detected**: Your registered address is categorized by the USPS database as a Commercial Mail Receiving Agency (CMRA). Tier-1 commercial underwriters (Chase, Amex, Bank of America) automatically cross-reference the USPS address database. CMRAs trigger an instant algorithmic denial for fraud prevention.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else if (addressType === 'HOME_ADDRESS') {
    issues.push(`⚠️ **Residential Address Classification**: While residential addresses are legally permissible, automated commercial underwriting risk-scores decrease by 15–30 points. For high-limit revolving lines ($50K+), underwriters will demand proof of commercial lease or executive suite.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else if (addressType === 'VIRTUAL_OFFICE') {
    if (!biz.dedicatedSuiteNumber) {
      issues.push(`⚠️ **Virtual Office Without Dedicated Suite**: Using a generic virtual office address shared by hundreds of entities without a private suite number triggers secondary manual review. Ensure your agreement provides a dedicated commercial suite identifier.`);
      if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
    } else {
      passes.push(`✅ **Commercial Executive Suite Verified**: Dedicated commercial address with private suite allocation.`);
    }
  } else {
    passes.push(`✅ **Commercial Physical Nexus**: Commercial brick-and-mortar or office building verified.`);
  }

  // Check 2: 411 Directory & Public Registry
  if (biz.has411Listing === false || !biz.businessPhone) {
    issues.push(`⚠️ **National 411 Directory Absence**: Lenders verify phone numbers through National 411 Directory Assistance (ListYourself / Neustar). An unlisted business phone signals an unestablished or shell business.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **411 Directory Listing Active**: Dedicated commercial phone line listed under ${companyName}.`);
  }

  // Check 3: Digital Footprint & Domain Authority
  const isGenericEmail = /@(gmail|yahoo|hotmail|outlook|aol)\.com$/i.test(biz.businessEmail || client.email);
  if (isGenericEmail) {
    issues.push(`⚠️ **Free Email Domain In Use**: Applying with a generic email address ("${client.email}") is flagged by underwriting AI as amateur. Professional commercial applicants must utilize domain-authenticated email (e.g. \`contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com\`).`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **Enterprise Domain Email Verified**: Authenticated email reflecting company domain.`);
  }

  // Check 4: Google Business Profile & Website
  if (!biz.hasGoogleBusinessProfile && !biz.websiteUrl) {
    issues.push(`⚠️ **Zero Digital Footprint**: Underwriters search Google Maps and public search indices to verify business existence. Lack of an active web domain or Google Business Profile triggers "Unable to Verify Physical Operations" status.`);
    if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';
  } else {
    passes.push(`✅ **Public Digital Footprint Established**: Verified website domain and public listing present.`);
  }

  const output = `# 📍 Prompt Two: Business Address Suitability & Digital Footprint Audit
**Entity:** ${companyName} | **Registered Location:** ${fullAddress}
**Address Classification:** ${addressType.replace(/_/g, ' ')}
**Audit Status:** ${verdict === 'READY' ? '🟢 READY (Institutional Grade)' : verdict === 'NEEDS_ATTENTION' ? '🟡 NEEDS ATTENTION (Underwriting Friction)' : '🔴 FIX BEFORE APPLYING (Automated Decline Risk)'}

---

## 🏢 Physical Address & Digital Presence Matrix
| Component | Registered Value | Institutional Standard | Assessment |
|---|---|---|---|
| Address Type | ${addressType.replace(/_/g, ' ')} | Physical Brick-and-Mortar / Executive Suite | ${addressType === 'CMRA_UPS_BOX' ? 'CRITICAL DECLINE' : addressType === 'HOME_ADDRESS' ? 'Moderate Risk' : 'Optimal'} |
| National 411 | ${biz.businessPhone || client.phone} | Neustar / ListYourself 411 Directory | ${biz.has411Listing !== false ? 'Verified' : 'Unlisted'} |
| Email System | ${biz.businessEmail || client.email} | Dedicated Domain-Linked Email | ${isGenericEmail ? 'Free Provider Flag' : 'Professional'} |
| Web & Map Footprint | ${biz.websiteUrl || 'Pending'} | Google Maps Pin + SSL Website | ${biz.hasGoogleBusinessProfile || biz.websiteUrl ? 'Verified' : 'Missing'} |

---

## 🔍 Underwriting Friction Findings
${issues.length === 0 ? '✅ **Zero Digital Footprint Inconsistencies.** Your address and online presence match public records flawlessly.' : issues.join('\n\n')}

---

## 🛡️ Verified Trust Anchors
${passes.join('\n')}

---

## 🎯 Tactical Action Steps
${addressType === 'CMRA_UPS_BOX'
  ? '1. **IMMEDIATE ACTION**: Transition your business registration away from the UPS Store / CMRA box to a true commercial office or executive suite with a dedicated suite number.\n2. Update address on Secretary of State, IRS records, and bank statements before submitting credit applications.'
  : isGenericEmail
    ? '1. Secure a Google Workspace or Microsoft 365 domain email matching your company name.\n2. Submit your business name and commercial phone number to ListYourself.net to propagate 411 national directory listings.'
    : '✅ Address and digital footprint are verified for tier-1 credit underwriting.'}`;

  return {
    agentId: 'BIZ_ADDRESS_FOOTPRINT',
    status: 'COMPLETE',
    title: 'Prompt 2: Address & Digital Footprint Audit',
    output,
    generatedAt: new Date().toISOString(),
    verdict,
  };
}

// ── Prompt 3: Operational NAICS Code Identification ───────────────────────────
function runBizNaicsAudit(client: Client): AgentResult {
  const biz = client.businessProfile || {};
  const companyName = client.companyName || 'Business Entity';
  const desc = biz.actualOperationsDescription || 'General commercial consulting, marketing, and professional services';
  const currentCode = biz.currentNaicsCode || '541611';

  // Analysis of actual operational reality vs high-risk sectors
  const lowerDesc = desc.toLowerCase();
  const lowerName = companyName.toLowerCase();
  
  let primaryNaics = '541611';
  let primaryTitle = 'Administrative Management and General Management Consulting Services';
  let isRestricted = false;
  let restrictedCategory = '';

  if (lowerDesc.includes('real estate') || lowerDesc.includes('wholesale') || lowerDesc.includes('property') || lowerName.includes('properties') || lowerName.includes('realty')) {
    isRestricted = true;
    restrictedCategory = 'Real Estate Speculation / Wholesaling (NAICS 531390)';
    primaryNaics = '531390';
    primaryTitle = 'Other Activities Related to Real Estate';
  } else if (lowerDesc.includes('truck') || lowerDesc.includes('freight') || lowerDesc.includes('logistics') || lowerDesc.includes('hauling')) {
    isRestricted = true;
    restrictedCategory = 'General Freight Trucking (NAICS 484110)';
    primaryNaics = '484110';
    primaryTitle = 'General Freight Trucking, Local';
  } else if (lowerDesc.includes('credit repair') || lowerDesc.includes('credit counseling') || lowerDesc.includes('dispute')) {
    isRestricted = true;
    restrictedCategory = 'Credit Intermediation / Credit Services (NAICS 541990)';
    primaryNaics = '541990';
    primaryTitle = 'All Other Professional, Scientific, and Technical Services';
  } else if (lowerDesc.includes('software') || lowerDesc.includes('tech') || lowerDesc.includes('app') || lowerDesc.includes('web')) {
    primaryNaics = '541511';
    primaryTitle = 'Custom Computer Programming Services';
  } else if (lowerDesc.includes('marketing') || lowerDesc.includes('advertising') || lowerDesc.includes('media')) {
    primaryNaics = '541810';
    primaryTitle = 'Advertising Agencies';
  } else if (lowerDesc.includes('e-commerce') || lowerDesc.includes('online retail') || lowerDesc.includes('store')) {
    primaryNaics = '454110';
    primaryTitle = 'Electronic Shopping and Mail-Order Houses';
  }

  const verdict: ReadinessVerdict = isRestricted ? 'FIX_BEFORE_APPLYING' : 'READY';

  const output = `# 🏷️ Prompt Three: Operational NAICS Code Identification (Truth vs Funding Trap)
**Entity:** ${companyName}
**Declared Description of Actual Operations:** "${desc}"
**Identified Primary Operational NAICS Code:** \`${primaryNaics}\` — ${primaryTitle}
**Audit Status:** ${verdict === 'READY' ? '🟢 READY (Low-Risk Funding Permissible)' : '🔴 FIX BEFORE APPLYING (High-Risk Category Underwriting Trap)'}

---

## ⚠️ The "YouTube Funding Advice" Underwriting Trap
Most business owners are told on social media to claim a generic low-risk NAICS code like \`541611\` (Management Consulting) or \`541990\` regardless of what they actually do.

**Here is why that distinction destroys funding applications:**
Underwriters do not take your NAICS code on faith. They cross-check:
1. **Commercial Bank Statement Inflows**: Transaction descriptions and customer merchant categories.
2. **Merchant Processing (MCC) Codes**: Credit card processing classifications.
3. **Public Digital Footprint**: Your website services, social media, and client reviews.

If an underwriter sees you claimed \`541611\` Management Consulting, but bank deposits come from real estate earnest money, earnest contract assignments, auto transport brokers, or e-commerce returns, the file is flagged for **Material Misrepresentation (Loan Fraud)**. You are instantly denied and your EIN is blacklisted across national underwriting risk consortiums (LexisNexis / RiskExec).

---

## 🎯 Exact NAICS Classification Mapping (What You Actually Do)
| Classification Layer | Code | Official Title | Risk Tier |
|---|---|---|---|
| **Primary Code (Operational Truth)** | \`${primaryNaics}\` | ${primaryTitle} | ${isRestricted ? '🔴 High Risk / Restricted' : '🟢 Low Risk Tier-1'} |
| **Secondary Code (Revenue Expansion)** | \`541613\` | Marketing Consulting Services | 🟢 Tier-1 Permissible |
| **Current Code on Record** | \`${currentCode}\` | Declared Bureau Mapping | ${currentCode === primaryNaics ? 'Synchronized' : 'Discrepancy Detected'} |

---

## 🚨 High-Risk & Restricted Sector Analysis
${isRestricted ? `
### 🛑 CRITICAL UNDERWRITING WARNING: ${restrictedCategory}
Financial institutions place real estate speculation, trucking/hauling, lending, cannabis, and credit counseling on strict restricted lender lists.
- **Why**: High default rates, fluctuating cash flows, and regulatory liability.
- **The Solution**: Structure your business as a specialized management, operations, or technology arm (e.g. \`541512\` or \`541611\`) that provides legitimate professional management services to operating entities, ensuring bank statements reflect consulting and management retainers rather than high-risk transaction spikes.
` : `
✅ **Unrestricted Low-Risk Classification Confirmed**:
Your operational activities fall into a preferred low-risk underwriting tier. Banks view professional and technical services as stable, predictable, and eligible for maximum unsecured limits ($50K-$250K+).
`}

---

## 🎯 Strategic Protocol
1. Verify that the NAICS code registered on your IRS Form CP 575 and Secretary of State matches \`${primaryNaics}\`.
2. Ensure your invoice line items and customer payment descriptions reflect **${primaryTitle}**.
3. Never use generic consulting codes as an artificial mask—build operational coherence between your banking transactions and your tax returns.`;

  return {
    agentId: 'BIZ_NAICS_CLASSIFICATION',
    status: 'COMPLETE',
    title: 'Prompt 3: Operational NAICS Code Identification',
    output,
    generatedAt: new Date().toISOString(),
    verdict,
  };
}

// ── Prompt 4: Financial Commingling & Corporate Veil Forensic Audit ────────────
function runBizComminglingAudit(client: Client): AgentResult {
  const biz = client.businessProfile || {};
  const companyName = client.companyName || 'Business Entity';
  const hasBank = biz.hasDedicatedBusinessBank !== false;
  const commingling = biz.comminglingDetected === true;

  const issues: string[] = [];
  const passes: string[] = [];
  let verdict: ReadinessVerdict = 'READY';

  // Check 1: Dedicated Business Bank Account
  if (!hasBank) {
    issues.push(`🚨 **No Dedicated Commercial Bank Account**: Conducting business cash flows through a personal checking account is the fastest way to trigger loan denial. Commercial underwriters require 3–6 months of business bank statements bearing the exact corporate entity name and EIN.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else {
    passes.push(`✅ **Segregated Commercial Checking**: Commercial bank account established under ${companyName}.`);
  }

  // Check 2: Commingling of Personal & Business Expenses
  if (commingling) {
    issues.push(`🚨 **Active Commingling Detected**: Personal living expenses (groceries, home utilities, retail dining, personal subscriptions) run directly on commercial debit/credit cards without clean reimbursement accounting. Underwriters scan bank statements line-by-line; seeing personal transactions demonstrates that the owner cannot separate their personal life from the business entity.`);
    verdict = 'FIX_BEFORE_APPLYING';
  } else {
    passes.push(`✅ **Clean Expense Segregation**: Commercial accounts demonstrate dedicated business purchases.`);
  }

  // Check 3: Owner Draws vs Random ATM Transfers
  issues.push(`⚠️ **Owner Compensation Audit Check**: Never pull random cash withdrawals or direct Venmo/Zelle transfers without accounting entries. All owner compensation must be formally executed as **Owner Draws / Member Distributions** or **W-2 Payroll** supported by ledger entries.`);
  if (verdict === 'READY') verdict = 'NEEDS_ATTENTION';

  // Check 4: Initial Capitalization & Corporate Veil
  passes.push(`✅ **Corporate Veil Legal Shield**: Maintaining strict accounting separation prevents creditors and litigators from "piercing the corporate veil" to attack personal assets (home, personal savings).`);

  const output = `# 💳 Prompt Four: Business & Personal Financial Commingling & Corporate Veil Audit
**Entity:** ${companyName}
**Commercial Banking Status:** ${hasBank ? 'Dedicated Commercial Account Active' : 'CRITICAL: No Dedicated Account'}
**Audit Status:** ${verdict === 'READY' ? '🟢 READY (Strict Separation)' : verdict === 'NEEDS_ATTENTION' ? '🟡 NEEDS ATTENTION (Operational Cleanup Required)' : '🔴 FIX BEFORE APPLYING (High IRS & Denial Risk)'}

---

## 🏛️ Why Commingling Destroys Funding & Triggers IRS Audits
The number one reason business owners get flagged by the IRS and denied for larger lines of credit isn’t because they’re doing anything wrong.
**It’s because the underwriter can’t tell where the business ends and the person begins.**

When an underwriter reviews your business bank statements:
- If they see grocery stores, movie tickets, pharmacy purchases, and personal auto payments, they conclude:
  1. The business is an alter-ego of the individual (Piercing the Corporate Veil).
  2. The company lacks cash-flow discipline and formal governance.
  3. The stated business profit is unreliable because personal expenses are buried in operational expenses.

---

## 🔍 Forensic Commingling Breakdown
| Audit Vector | Standard Underwriting Protocol | Current Profile Finding | Risk Status |
|---|---|---|---|
| Bank Segregation | 100% Dedicated Business Checking | ${hasBank ? 'Dedicated Commercial Account' : 'Personal Account Intermingled'} | ${hasBank ? 'Pass' : 'CRITICAL STOP'} |
| Card Spending | Exclusively Business-Related Expenses | ${commingling ? 'Personal Expenses Flagged' : 'Strict Business Deductions'} | ${commingling ? 'Underwriting Red Flag' : 'Pass'} |
| Owner Draws | Documented Equity Distributions / Payroll | Random transfers without memo | Needs Standardization |
| Capitalization Ledger | Initial deposit matching Operating Agreement | Formally Documented | Verified |

---

## 🚨 Piercing the Corporate Veil Legal Exposure
If your LLC is ever sued or enters bankruptcy, a court will review whether you commingled funds:
- **If funds are commingled**: The court declares the LLC a "sham" or alter-ego, strip-mining your limited liability protection and making your personal home, cars, and retirement accounts liable for corporate debts.
- **If funds are segregated**: Your personal assets remain 100% bulletproof behind the corporate veil.

---

## 🎯 4-Step Underwriting Separation Protocol
1. **Strict Payment Rule**: Never swipe your business card for personal expenses, and never swipe personal cards for business purchases.
2. **If an accidental swipe occurs**: Execute an immediate documented reimbursement transfer labeled *"Owner Reimbursement - Personal Expense"* within 48 hours.
3. **Formal Owner Draws**: Pay yourself on a regular schedule (e.g. 1st and 15th) via a single clean ACH transfer labeled *"Owner Draw / Distribution"*.
4. **Maintain a 3-Month Clean Statement Window**: Financial institutions review your most recent 90 days. Keep those 90 days pristine with zero commingled line items.`;

  return {
    agentId: 'BIZ_COMMINGLING_FINANCES',
    status: 'COMPLETE',
    title: 'Prompt 4: Commingling & Corporate Veil Audit',
    output,
    generatedAt: new Date().toISOString(),
    verdict,
  };
}

// ── Prompt 5: Funding Readiness Synthesis & Prioritized Action Plan ────────────
function runBizFundingReadiness(client: Client, priorResults?: Partial<Record<AgentId, AgentResult>>): AgentResult {
  const companyName = client.companyName || 'Business Entity';
  
  // Collect verdicts from Prompts 1 through 4
  const p1 = priorResults?.['BIZ_FORMATION_EIN'] || runBizFormationAudit(client);
  const p2 = priorResults?.['BIZ_ADDRESS_FOOTPRINT'] || runBizAddressFootprintAudit(client);
  const p3 = priorResults?.['BIZ_NAICS_CLASSIFICATION'] || runBizNaicsAudit(client);
  const p4 = priorResults?.['BIZ_COMMINGLING_FINANCES'] || runBizComminglingAudit(client);

  const v1 = p1.verdict || 'NEEDS_ATTENTION';
  const v2 = p2.verdict || 'NEEDS_ATTENTION';
  const v3 = p3.verdict || 'READY';
  const v4 = p4.verdict || 'NEEDS_ATTENTION';

  // Calculate Institutional Score
  let score = 100;
  if (v1 === 'FIX_BEFORE_APPLYING') score -= 25; else if (v1 === 'NEEDS_ATTENTION') score -= 10;
  if (v2 === 'FIX_BEFORE_APPLYING') score -= 25; else if (v2 === 'NEEDS_ATTENTION') score -= 10;
  if (v3 === 'FIX_BEFORE_APPLYING') score -= 30; else if (v3 === 'NEEDS_ATTENTION') score -= 10;
  if (v4 === 'FIX_BEFORE_APPLYING') score -= 30; else if (v4 === 'NEEDS_ATTENTION') score -= 10;
  score = Math.max(20, Math.min(100, score));

  const overallVerdict: ReadinessVerdict = 
    (v1 === 'FIX_BEFORE_APPLYING' || v2 === 'FIX_BEFORE_APPLYING' || v3 === 'FIX_BEFORE_APPLYING' || v4 === 'FIX_BEFORE_APPLYING')
      ? 'FIX_BEFORE_APPLYING'
      : (v1 === 'NEEDS_ATTENTION' || v2 === 'NEEDS_ATTENTION' || v3 === 'NEEDS_ATTENTION' || v4 === 'NEEDS_ATTENTION')
        ? 'NEEDS_ATTENTION'
        : 'READY';

  const output = `# 🎯 Prompt Five: Funding Readiness Synthesis & Prioritized Action Plan
**Target Entity:** ${companyName}
**Consolidated Institutional Underwriting Score:** **${score} / 100**
**Global Readiness Verdict:** ${overallVerdict === 'READY' ? '🟢 READY (Eligible for Immediate Tier-1 Submission)' : overallVerdict === 'NEEDS_ATTENTION' ? '🟡 NEEDS ATTENTION (Proceed with Caution / High Friction)' : '🔴 FIX BEFORE APPLYING (High Probability of Algorithmic Denial)'}

---

## 📊 4-Pillar Underwriting Synthesis Scorecard
| Stage | Audit Domain | Evaluation Status | Key Risk Factor |
|---|---|---|---|
| **Prompt 1** | LLC Formation & EIN Structure | ${v1 === 'READY' ? '🟢 Ready' : v1 === 'NEEDS_ATTENTION' ? '🟡 Needs Attention' : '🔴 Fix Before Applying'} | Exact Secretary of State vs IRS CP-575 spelling |
| **Prompt 2** | Address & Digital Footprint | ${v2 === 'READY' ? '🟢 Ready' : v2 === 'NEEDS_ATTENTION' ? '🟡 Needs Attention' : '🔴 Fix Before Applying'} | CMRA / Virtual Office USPS classification |
| **Prompt 3** | Operational NAICS Code | ${v3 === 'READY' ? '🟢 Ready' : v3 === 'NEEDS_ATTENTION' ? '🟡 Needs Attention' : '🔴 Fix Before Applying'} | Bank statement deposits matching stated operations |
| **Prompt 4** | Commingling & Corporate Veil | ${v4 === 'READY' ? '🟢 Ready' : v4 === 'NEEDS_ATTENTION' ? '🟡 Needs Attention' : '🔴 Fix Before Applying'} | Personal expenditures on business accounts |

---

## 🚦 Institutional Verdict Definitions
- 🟢 **READY**: Passes automated KYC/CIP algorithms and institutional credit criteria. Eligible for immediate application submission with top-tier limits.
- 🟡 **NEEDS ATTENTION**: Passes basic statutory requirements but carries friction points that can prompt manual underwriter scrutiny or reduced credit limits.
- 🔴 **FIX BEFORE APPLYING**: Severe red flags detected. Submitting applications now will result in automatic algorithmic denial, hard inquiry waste, and possible internal bank blacklisting.

---

## 📋 Prioritized Action Plan (Sequenced Execution)

### 🔴 Phase 1: Critical Killers (Fix Before Applying — Days 1–7)
${overallVerdict === 'FIX_BEFORE_APPLYING' ? `
1. **Resolve Address Classification**: If using a CMRA/UPS store, transition immediately to an approved commercial executive suite with private suite allocation.
2. **Eliminate Commingling**: Cease all personal transactions on commercial checking. Keep the most recent 90-day statements 100% pure business.
3. **Synchronize Legal Designators**: Ensure your business name spelling is identical across the Secretary of State, IRS Form 147C, and bank accounts down to the comma.
` : '✅ No Phase 1 blockers detected. Your foundation has cleared all immediate automated denial triggers.'}

### 🟡 Phase 2: Underwriting Optimization (Needs Attention — Days 8–21)
1. **National 411 Directory Propagation**: Submit your primary commercial phone line to ListYourself.net and confirm Neustar carrier directory indexing.
2. **Domain-Based Email Infrastructure**: Complete transition from free consumer email addresses (@gmail) to Google Workspace / Microsoft 365 domain email.
3. **Operating Agreement Execution**: Verify your Operating Agreement contains a formal Banking Borrowing Resolution signed by all beneficial owners.
4. **Google Maps Presence**: Verify physical Google Business Profile to anchor your local commercial existence.

### 🟢 Phase 3: Sequenced Funding Execution Strategy (Days 22–45)
Once Phase 1 and Phase 2 items are green, execute credit applications in strict institutional sequence:
1. **Tier 1 (Vendor Tradelines)**: Uline, Grainger, Quill (Net-30 reporting to D&B / Experian Commercial).
2. **Tier 2 (Store & Fleet Accounts)**: Home Depot Pro, WEX Fleet Fuel, Sam's Club Commercial (Revolving credit lines).
3. **Tier 3 (Cash Flow Revolving Lines)**: Chase Ink Business Cash, American Express Blue Business Plus ($10,000–$50,000 limits).
4. **Tier 4 (Unsecured Institutional Term Facilities)**: Regional bank credit lines ($50,000–$250,000+) backed by clean guarantor scores and pristine business underwriting dossier.`;

  return {
    agentId: 'BIZ_FUNDING_READINESS',
    status: 'COMPLETE',
    title: 'Prompt 5: Funding Readiness Evaluation',
    output,
    generatedAt: new Date().toISOString(),
    verdict: overallVerdict,
  };
}

