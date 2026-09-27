import type { Client, AgentId, AgentResult, NegativeItem, DisputeLetter, CreditProfile } from '../../shared/types/credit.js';
import { v4 as uuidv4 } from 'uuid';

// ── Agent Runner ──────────────────────────────────────────────
// Each agent takes the client's credit profile and generates structured output.
// In production, these can call an LLM API. For now they generate structured
// expert-level output based on the provided credit report data.

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
    default: throw new Error(`Unknown agent: ${agentId}`);
  }
}

export async function runAllAgents(client: Client): Promise<Partial<Record<AgentId, AgentResult>>> {
  const agentIds: AgentId[] = [
    'COMPREHENSIVE_AUDIT', 'ROADMAP_90_DAY', 'DEBT_OPTIMIZER',
    'DISPUTE_LETTER', 'GOODWILL_LETTER', 'INQUIRY_MINIMIZER',
    'SECONDARY_FREEZE', 'CREDIT_GROWTH'
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
  const disputeItems = profile.negativeItems.filter(i =>
    i.disputeStrategy === 'FORMAL_FCRA' || i.disputeStrategy === 'DEBT_VALIDATION'
  );

  const letters: DisputeLetter[] = [];

  // Group by bureau
  const bureaus = ['Equifax', 'Experian', 'TransUnion'] as const;
  for (const bureau of bureaus) {
    const bureauItems = disputeItems.filter(i => i.bureau.includes(bureau));
    if (bureauItems.length === 0) continue;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 37); // 30 days + 7 days for mail delivery

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
Pursuant to: Fair Credit Reporting Act (FCRA) 15 U.S.C. §1681 et seq., §611, §623

To Whom It May Concern at ${bureau}:

I am writing to formally dispute the following item(s) appearing on my consumer credit file, which I have reviewed and determined to be inaccurate, unverifiable, and/or reported in violation of the Fair Credit Reporting Act.

DISPUTED ITEMS:

${bureauItems.map((item, i) => `${i + 1}. CREDITOR/FURNISHER: ${item.creditor}
   Account Number: ${item.accountNumber ?? 'Unknown'}
   Type: ${item.type.replace(/_/g, ' ')}
   Reported Balance: ${item.balance != null ? '$' + item.balance.toLocaleString() : 'Unknown'}
   Date of First Delinquency: ${item.dateOfFirstDelinquency ?? 'Unknown'}
   
   BASIS FOR DISPUTE: This account is disputed as inaccurate, incomplete, and/or unverifiable. The reported information contains material errors and/or cannot be verified to comply with Metro 2 reporting standards. Specifically, I dispute:
   (a) The accuracy and completeness of the reported payment history
   (b) The reported balance and/or high balance amounts
   (c) The Date of First Delinquency as reported
   (d) The method by which this account was verified in any prior dispute
   
   LEGAL DEMAND: Under FCRA §611(a), you are required to conduct a reasonable reinvestigation of this item. Under §611(a)(6)(B)(iii), I demand you provide the complete METHOD OF VERIFICATION, including the name, address, and telephone number of the person contacted to verify this information.`).join('\n\n')}

LEGAL NOTICE & DEMAND FOR ACTION:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. §1681i, you are hereby required to:

1. Conduct a REASONABLE REINVESTIGATION of the above-listed disputed information within THIRTY (30) DAYS of receipt of this letter.

2. If you are UNABLE TO FULLY VERIFY each and every element of the disputed information with the original creditor/data furnisher, you are LEGALLY REQUIRED to PERMANENTLY DELETE the disputed item(s) from my credit file under FCRA §611(a)(5)(A).

3. Provide me with written notice of the results of your reinvestigation, including a free updated copy of my credit report, pursuant to FCRA §611(a)(6)(A).

4. Cease and desist from sharing, selling, or transmitting my disputed consumer information to any third party, including credit card issuers, employers, landlords, or insurers, during the pendency of this reinvestigation.

PLEASE BE ADVISED that I am aware of my rights under:
- FCRA §611 (Consumer's right to dispute inaccurate information)
- FCRA §623 (Responsibilities of furnishers of information)  
- FCRA §616 (Civil liability for willful noncompliance — up to $1,000 + punitive damages)
- FCRA §617 (Civil liability for negligent noncompliance)
- The Consumer Financial Protection Bureau (CFPB) enforcement authority

If the disputed item(s) cannot be fully, completely, and verifiably confirmed within thirty (30) calendar days, the law requires their PERMANENT DELETION. I will not accept an unverified "re-verification" as satisfactory resolution.

Sincerely,

________________________________
${client.firstName} ${client.lastName}

Enclosures:
- Copy of Government-Issued Photo ID
- Copy of Social Security Card or SSN document
- Copy of Proof of Address (utility bill or bank statement, dated within 60 days)
- Copy of relevant account statements showing discrepancies (if applicable)

[SEND VIA USPS CERTIFIED MAIL – RETURN RECEIPT REQUESTED]
[KEEP TRACKING NUMBER AND GREEN CARD FOR YOUR LEGAL RECORDS]`;

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

  const output = `# ⚖️ FCRA Dispute Letter Factory
**Generated:** ${new Date().toLocaleDateString()}
**Letters Created:** ${letters.length} (one per bureau with reportable items)
**30-Day FCRA Deadline:** ~${new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toLocaleDateString()}

${letters.length === 0 ? '✅ No items requiring formal FCRA dispute identified. Consider Goodwill letters for late payment removals.' : `
## Letters Generated:
${letters.map((l, i) => `${i + 1}. **${l.bureau}** — ${disputeItems.filter(i => i.bureau.includes(l.bureau!)).length} item(s) disputed`).join('\n')}

## Critical Mailing Instructions:
1. **Print** each letter and sign by hand.
2. **Mail via USPS Certified Mail with Return Receipt Requested** (green card).
3. **Keep the USPS tracking number** — this is your legal proof of delivery.
4. **Start your 30-day countdown** from the date the bureau receives the letter (check tracking).
5. **Attach enclosures** — ID, SSN doc, proof of address.

All letters are available in the Dispute Center tab for download and printing.`}`;

  return {
    agentId: 'DISPUTE_LETTER',
    status: 'COMPLETE',
    title: 'FCRA Dispute Letter Factory',
    output,
    generatedAt: new Date().toISOString(),
    letters,
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
  const output = `# 🛡️ Hard Inquiry Minimizer & Smart Application Strategy
**Total Inquiries Found:** ${inquiries.length}
**High Risk Threshold:** 4+ inquiries (you are ${(profile.numberOfInquiries ?? 0) >= 4 ? '⚠️ ABOVE' : '✅ BELOW'} this threshold)

---

## Understanding Hard Inquiries
- Hard inquiries remain on your credit report for **24 months**.
- They only impact your score for **12 months**.
- After **12 months**, they are visible but score-neutral.
- The average single inquiry costs **5 to 15 points**.
- Multiple inquiries in a short window for the same type of credit (mortgage, auto) are typically "deduplicated" by scoring models within a **14–45 day window** and count as a single inquiry.

---

## Inquiries Found on Your File
${inquiries.length === 0 ? '✅ No hard inquiries detected or identified.' : inquiries.map(i => `- **${i.creditor}** (${i.bureau}) — ${i.dateOpened ?? 'Date unknown'}`).join('\n')}

---

## Dispute Unauthorized Inquiries
If you did not authorize any of the above inquiries, you have the right to dispute them:

### How to Dispute Unauthorized Inquiries:
1. Send a letter to each bureau where the unauthorized inquiry appears.
2. State: "I did not authorize this inquiry. Please provide the signed authorization form or remove this inquiry immediately."
3. Under FCRA §604, only permissible-purpose inquiries may appear on your file.
4. Unauthorized inquiries must be removed if the creditor cannot produce a signed authorization.

---

## Future Application Strategy (Rate Shopping Protection)
### The 14–45 Day Rate Shopping Window
- When shopping for a mortgage, auto loan, or student loan — apply to ALL lenders within a **14-day window**.
- FICO 8 and VantageScore 3.0/4.0 will count these as **1 inquiry** instead of multiple.
- For credit cards, each application IS a separate inquiry (no bundling).

### The Application Pre-Qualification Hack
- ALWAYS use lenders' pre-qualification tools (soft pull only) before formally applying.
- Pre-qualifications are NOT hard inquiries and show you your likely approval odds risk-free.
- Only submit a formal application when you have strong pre-qualification confidence.

### Priority Application Timing (After Dispute Phase)
1. Wait until disputed negative items are deleted (typically 30–45 days).
2. Run the AZEO strategy to maximize utilization score.
3. Allow 48–72 hours after AZEO for scores to update.
4. Apply within a tight 72-hour window for maximum score snapshot.`;

  return {
    agentId: 'INQUIRY_MINIMIZER',
    status: 'COMPLETE',
    title: 'Hard Inquiry Minimizer',
    output,
    generatedAt: new Date().toISOString(),
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
