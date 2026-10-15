import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllClients, getClientById, saveClient, deleteClient, getClientByToken, getSettings } from '../core/dataStore.js';
import { dispatchEmail, getClientsNeedingOverdueAlert, getClientsNeedingPostCare } from '../core/emailScheduler.js';
import { runAllAgents, runAllBusinessAudits, runAgent } from '../core/agentRunner.js';
import { parseReport } from '../core/reportParser.js';
import type { 
  Client, 
  PricingPlan, 
  PipelineStage, 
  TrueBuildVendor, 
  TrueBuildTradeline, 
  TrueBuildPaymentRecord, 
  TrueBuildMetrics 
} from '../../shared/types/credit.js';
import { TRUEBUILD_DEFAULT_VENDORS } from '../../shared/types/credit.js';
import {
  generateCrossBureauDiscrepancies,
  initializeFcraSession,
  generateCfpbComplaint,
  generateIntentToSueLetter,
  BUREAU_ADDRESSES
} from '../core/fcraEngine.js';
import { generateClientCustomDisputeLetters } from '../core/letterCustomizer.js';
import { sendLetterThroughLetterStream } from '../core/letterstream.js';

export const clientRouter = express.Router();

// GET all clients
clientRouter.get('/', (_req, res) => {
  res.json({ success: true, data: getAllClients() });
});

// GET client by ID
clientRouter.get('/:id', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
  res.json({ success: true, data: client });
});

// GET client by intake token (public)
clientRouter.get('/intake/:token', (req, res) => {
  const client = getClientByToken(req.params.token);
  if (!client) return res.status(404).json({ success: false, error: 'Invalid intake link' });
  // Return limited safe fields for public intake
  res.json({ success: true, data: { id: client.id, firstName: client.firstName, companyName: client.companyName, plan: client.plan, stage: client.stage } });
});

// POST create new client (internal onboarding)
clientRouter.post('/', async (req, res) => {
  const body = req.body;
  const plan: PricingPlan = body.plan === 'B' ? 'B' : 'A';
  const invoiceAmount = plan === 'A' ? 1000 : 1500;

  const client: Client = {
    id: uuidv4(),
    firstName: body.firstName ?? '',
    lastName: body.lastName ?? '',
    email: body.email ?? '',
    phone: body.phone ?? '',
    address: body.address ?? '',
    city: body.city ?? '',
    state: body.state ?? '',
    zip: body.zip ?? '',
    companyName: body.companyName ?? '',
    ein: body.ein,
    businessType: body.businessType,
    plan,
    stage: 'NEW',
    signedAt: new Date().toISOString(),
    intakeToken: uuidv4(),
    creditProfile: {
      currentScores: {},
      targetScore: 750,
      reportText: '',
      negativeItems: [],
      debtAccounts: [],
    },
    agentOutputs: {},
    emailLog: [],
    disputes: [],
    invoice: {
      id: uuidv4(),
      clientId: '',
      amount: invoiceAmount,
      lineItem: 'Commercial Underwriting & Business Credit Consulting Services',
      status: 'PENDING',
      issuedAt: '',
      dueAt: '',
      overdueAlertSent: false,
    },
    notes: body.notes ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  client.invoice!.clientId = client.id;

  const saved = saveClient(client);

  // Send welcome email
  try {
    if (saved.email) {
      const emailEntry = await dispatchEmail(saved, 'WELCOME');
      saved.emailLog.push(emailEntry);
      saveClient(saved);
    }
  } catch (e: any) {
    console.error('[clients] Welcome email failed:', e.message);
  }

  res.status(201).json({ success: true, data: saved });
});

// PATCH update client fields
clientRouter.patch('/:id', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
  const updated = { ...client, ...req.body, id: client.id, updatedAt: new Date().toISOString() };
  saveClient(updated);
  res.json({ success: true, data: updated });
});

// POST advance pipeline stage + trigger email
clientRouter.post('/:id/advance', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const stageMap: Partial<Record<PipelineStage, { nextStage: PipelineStage; emailStage?: any }>> = {
    NEW: { nextStage: 'DOCS_VERIFIED', emailStage: 'DOCS_VERIFIED' },
    DOCS_VERIFIED: { nextStage: 'SUBMITTED', emailStage: 'SUBMITTED' },
    SUBMITTED: { nextStage: 'APPROVED', emailStage: 'APPROVED' },
    APPROVED: { nextStage: 'INVOICE_SENT', emailStage: undefined },
    INVOICE_SENT: { nextStage: 'PAID', emailStage: 'PAYMENT_CONFIRMED' },
    PAID: { nextStage: 'POST_CARE', emailStage: undefined },
    DISPUTE_ACTIVE: { nextStage: 'POST_CARE', emailStage: undefined },
  };

  const transition = stageMap[client.stage];
  if (!transition) return res.status(400).json({ success: false, error: 'Cannot advance from current stage' });

  client.stage = transition.nextStage;

  // Set approval date and invoice details
  if (transition.nextStage === 'APPROVED') {
    client.approvedAt = new Date().toISOString();
    if (client.invoice) {
      const due = new Date();
      due.setDate(due.getDate() + 3);
      client.invoice.issuedAt = new Date().toISOString();
      client.invoice.dueAt = due.toISOString();
      client.invoice.status = 'PENDING';
    }
  }
  if (transition.nextStage === 'PAID') {
    if (client.invoice) {
      client.invoice.status = 'PAID';
      client.invoice.paidAt = new Date().toISOString();
    }
  }

  if (transition.emailStage) {
    try {
      const emailEntry = await dispatchEmail(client, transition.emailStage, req.body?.extraData);
      client.emailLog.push(emailEntry);
    } catch (e: any) {
      console.error('[clients] Email send error:', e.message);
    }
  }

  saveClient(client);
  res.json({ success: true, data: client });
});

// POST run all agents (credit + business)
clientRouter.post('/:id/run-agents', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const outputs = await runAllAgents(client);

  // Collect any generated letters
  const newDisputes = Object.values(outputs)
    .flatMap((r) => r?.letters ?? []);

  client.agentOutputs = { ...client.agentOutputs, ...outputs };
  client.disputes = [...client.disputes, ...newDisputes];
  client.stage = 'DOCS_VERIFIED';
  
  if (newDisputes.length > 0) {
    const entry = await dispatchEmail(client, 'LETTERS_READY');
    client.emailLog.push(entry);
  }
  
  saveClient(client);
  res.json({ success: true, data: client });
});

// POST run 5-Prompt Business Underwriting & Funding Readiness Engine
clientRouter.post('/:id/run-business-audit', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  // Update business profile if passed in body
  if (req.body && Object.keys(req.body).length > 0) {
    client.businessProfile = { ...(client.businessProfile || {}), ...req.body };
  }

  const outputs = await runAllBusinessAudits(client);
  client.agentOutputs = { ...client.agentOutputs, ...outputs };
  saveClient(client);
  res.json({ success: true, data: client, auditOutputs: outputs });
});

// POST run single specific agent (credit or business prompt)
clientRouter.post('/:id/run-agent/:agentId', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const agentId = req.params.agentId as any;
  const result = await runAgent(client, agentId);
  client.agentOutputs = { ...client.agentOutputs, [agentId]: result };
  if (result.letters && result.letters.length > 0) {
    client.disputes = [...client.disputes, ...result.letters];
  }
  saveClient(client);
  res.json({ success: true, data: client, result });
});

// POST update business profile parameters
clientRouter.post('/:id/business-profile', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
  client.businessProfile = { ...(client.businessProfile || {}), ...req.body };
  saveClient(client);
  res.json({ success: true, data: client });
});

// POST update credit profile and re-run agents
clientRouter.post('/:id/credit-profile', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
  client.creditProfile = { ...client.creditProfile, ...req.body };
  saveClient(client);
  res.json({ success: true, data: client });
});

// ── TrueBuild Corporate Tradeline & Paydex Engine ──

function calculateTrueBuildMetrics(tradelines: TrueBuildTradeline[] = [], paymentRecords: TrueBuildPaymentRecord[] = []): TrueBuildMetrics {
  const dnbScores: number[] = [];
  const expScores: number[] = [];
  const eqScores: number[] = [];

  for (const p of paymentRecords) {
    const tl = tradelines.find(t => t.id === p.tradelineId);
    const rpts = tl?.reportsTo || '';
    const delta = p.daysRelativeToDue;
    const score = delta <= -30 ? 100 : (delta <= -15 ? 90 : (delta <= 0 ? 80 : (delta <= 15 ? 70 : (delta <= 30 ? 60 : 50))));

    if (rpts.includes('D&B')) dnbScores.push(score);
    if (rpts.includes('Experian')) expScores.push(score);
    if (rpts.includes('Equifax')) eqScores.push(score);
  }

  const paydex = dnbScores.length > 0 ? Math.round(dnbScores.reduce((a, b) => a + b, 0) / dnbScores.length) : null;
  const experian = expScores.length > 0 ? Math.round(expScores.reduce((a, b) => a + b, 0) / expScores.length) : null;
  const equifax = eqScores.length > 0 ? Math.round(eqScores.reduce((a, b) => a + b, 0) / eqScores.length) : null;

  const t1 = tradelines.filter(t => t.tier === 1 && t.status === 'APPROVED').length;
  const t2 = tradelines.filter(t => t.tier === 2 && t.status === 'APPROVED').length;
  const t3 = tradelines.filter(t => t.tier === 3 && t.status === 'APPROVED').length;
  const t4 = tradelines.filter(t => t.tier === 4 && t.status === 'APPROVED').length;

  let unlocked: 1 | 2 | 3 | 4 = 1;
  const eff = paydex || 0;
  if (t1 >= 5 && eff >= 80) unlocked = 2;
  if (unlocked === 2 && t2 >= 3 && eff >= 80) unlocked = 3;
  if (unlocked === 3 && t3 >= 3 && eff >= 80) unlocked = 4;

  const total = tradelines.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + (t.creditLimit || 0), 0);

  return {
    paydexScore: paydex,
    experianIntelliscore: experian,
    equifaxCommercial: equifax,
    unlockedTier: unlocked,
    totalCreditLimit: total,
    tier1Count: t1,
    tier2Count: t2,
    tier3Count: t3,
    tier4Count: t4,
  };
}

// GET client's TrueBuild profile, metrics and vendor matrix
clientRouter.get('/:id/truebuild', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  if (!client.truebuildProfile) {
    client.truebuildProfile = {
      dunsNumber: 'Pending D&B Generation',
      metrics: calculateTrueBuildMetrics([], []),
      tradelines: [],
      paymentRecords: [],
    };
    saveClient(client);
  } else {
    client.truebuildProfile.metrics = calculateTrueBuildMetrics(client.truebuildProfile.tradelines, client.truebuildProfile.paymentRecords);
  }

  const appliedVendorIds = new Set(client.truebuildProfile.tradelines.map(t => t.vendorId));
  const unlockedTier = client.truebuildProfile.metrics.unlockedTier;

  const vendors = TRUEBUILD_DEFAULT_VENDORS.map(v => ({
    ...v,
    applied: appliedVendorIds.has(v.id),
    locked: v.tier > unlockedTier,
  }));

  res.json({
    success: true,
    data: {
      profile: client.truebuildProfile,
      vendors,
      metrics: client.truebuildProfile.metrics,
    }
  });
});

// POST link new tradeline for client
clientRouter.post('/:id/truebuild/link-tradeline', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { vendorId, accountNumber, creditLimit } = req.body;
  const vendor = TRUEBUILD_DEFAULT_VENDORS.find(v => v.id === Number(vendorId));
  if (!vendor) return res.status(400).json({ success: false, error: 'Invalid vendor ID' });

  if (!client.truebuildProfile) {
    client.truebuildProfile = {
      dunsNumber: 'Pending D&B Generation',
      metrics: calculateTrueBuildMetrics([], []),
      tradelines: [],
      paymentRecords: [],
    };
  }

  const newTradeline: TrueBuildTradeline = {
    id: uuidv4(),
    vendorId: vendor.id,
    vendorName: vendor.name,
    tier: vendor.tier,
    creditLimit: Number(creditLimit) || 500,
    accountNumber: accountNumber || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
    openedDate: new Date().toISOString().split('T')[0],
    status: 'APPROVED',
    reportsTo: vendor.reportsTo,
  };

  client.truebuildProfile.tradelines.push(newTradeline);
  client.truebuildProfile.metrics = calculateTrueBuildMetrics(client.truebuildProfile.tradelines, client.truebuildProfile.paymentRecords);
  saveClient(client);

  res.json({ success: true, data: client.truebuildProfile });
});

// POST simulate 30-day corporate credit payment cycle
clientRouter.post('/:id/truebuild/simulate-cycle', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  if (!client.truebuildProfile) {
    client.truebuildProfile = {
      dunsNumber: 'Pending D&B Generation',
      metrics: calculateTrueBuildMetrics([], []),
      tradelines: [],
      paymentRecords: [],
    };
  }

  // If no tradelines exist, auto-seed 3 Tier-1 starter lines to demonstrate progression
  if (client.truebuildProfile.tradelines.length === 0) {
    const starterVendors = TRUEBUILD_DEFAULT_VENDORS.slice(0, 3);
    for (const sv of starterVendors) {
      client.truebuildProfile.tradelines.push({
        id: uuidv4(),
        vendorId: sv.id,
        vendorName: sv.name,
        tier: sv.tier,
        creditLimit: 1000,
        accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        openedDate: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        reportsTo: sv.reportsTo,
      });
    }
  }

  const now = new Date();
  for (const tl of client.truebuildProfile.tradelines) {
    const v = TRUEBUILD_DEFAULT_VENDORS.find(vend => vend.id === tl.vendorId);
    const minAmt = v?.minInvoice || 50;
    const invAmt = minAmt + Math.floor(Math.random() * 45);
    const invDate = new Date(now.getTime() - 25 * 86400000).toISOString().split('T')[0];
    const paidDate = new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0];
    // Paid 20 days early (-20 days delta relative to due date) -> Earns 90-100 Paydex score
    const earlyDelta = -20 - Math.floor(Math.random() * 10);

    client.truebuildProfile.paymentRecords.push({
      id: uuidv4(),
      tradelineId: tl.id,
      vendorName: tl.vendorName,
      invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceAmount: invAmt,
      invoiceDate: invDate,
      paidDate: paidDate,
      daysRelativeToDue: earlyDelta,
      status: 'PAID',
    });
  }

  client.truebuildProfile.metrics = calculateTrueBuildMetrics(client.truebuildProfile.tradelines, client.truebuildProfile.paymentRecords);
  saveClient(client);

  res.json({ success: true, data: client.truebuildProfile });
});

// POST send specific email manually
clientRouter.post('/:id/send-email', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
  const { stage, extraData } = req.body;
  try {
    const emailEntry = await dispatchEmail(client, stage, extraData);
    client.emailLog.push(emailEntry);
    saveClient(client);
    res.json({ success: true, data: emailEntry });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST intake form submission (client-facing)
clientRouter.post('/intake/:token/submit', async (req, res) => {
  const client = getClientByToken(req.params.token);
  if (!client) return res.status(404).json({ success: false, error: 'Invalid intake link' });

  const body = req.body;
  const reportText: string = body.reportText ?? '';

  // AUTO-PARSE the credit report
  if (reportText.length > 100) {
    const parsed = parseReport(reportText);
    client.creditProfile.reportText = reportText;
    client.creditProfile.currentScores = { ...client.creditProfile.currentScores, ...parsed.scores };
    client.creditProfile.negativeItems = parsed.negativeItems;
    client.creditProfile.debtAccounts = parsed.debtAccounts;
    client.creditProfile.totalAvailableCredit = parsed.totalAvailableCredit;
    client.creditProfile.totalDebt = parsed.totalDebt;
    client.creditProfile.currentUtilization = parsed.currentUtilization;
    client.creditProfile.numberOfInquiries = parsed.numberOfInquiries;
    client.creditProfile.oldestAccountAge = parsed.oldestAccountAge;
  }

  if (body.firstName) client.firstName = body.firstName;
  if (body.lastName) client.lastName = body.lastName;
  if (body.email) client.email = body.email;
  if (body.phone) client.phone = body.phone;

  saveClient(client);

  // Auto-run all 8 agents immediately
  runAllAgents(client).then(outputs => {
    const updated = getClientById(client.id);
    if (!updated) return;
    const newDisputes = Object.values(outputs).flatMap(r => r?.letters ?? []);
    updated.agentOutputs = { ...updated.agentOutputs, ...outputs };
    updated.disputes = [...updated.disputes, ...newDisputes];
    updated.stage = 'DOCS_VERIFIED';
    saveClient(updated);
    console.log(`[AutoAgent] ✅ All 8 agents completed for ${client.firstName} ${client.lastName}`);
  }).catch(e => console.error('[AutoAgent] Error:', e.message));

  res.json({ success: true, message: 'Credit report received and being analyzed. All 8 agents are running — you will receive your full dispute package shortly.' });
});

// DELETE client
clientRouter.delete('/:id', (req, res) => {
  const deleted = deleteClient(req.params.id);
  res.json({ success: deleted, error: deleted ? undefined : 'Client not found' });
});

// ── POST: Auto-parse report + run all agents ─────────────────
// The core automation endpoint: paste report → parse → agents → letters
clientRouter.post('/:id/parse-and-run', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { reportText } = req.body;
  if (!reportText || reportText.trim().length < 50) {
    return res.status(400).json({ success: false, error: 'Report text is too short. Paste the full credit report.' });
  }

  // Step 1: Parse
  const parsed = parseReport(reportText);
  client.creditProfile.reportText = reportText;
  client.creditProfile.currentScores = { ...client.creditProfile.currentScores, ...parsed.scores };
  client.creditProfile.negativeItems = parsed.negativeItems;
  client.creditProfile.debtAccounts = parsed.debtAccounts;
  client.creditProfile.totalAvailableCredit = parsed.totalAvailableCredit;
  client.creditProfile.totalDebt = parsed.totalDebt;
  client.creditProfile.currentUtilization = parsed.currentUtilization;
  client.creditProfile.numberOfInquiries = parsed.numberOfInquiries;
  client.creditProfile.oldestAccountAge = parsed.oldestAccountAge;
  saveClient(client);

  // Step 2: Run all 8 agents
  const outputs = await runAllAgents(client);
  const newDisputes = Object.values(outputs).flatMap(r => r?.letters ?? []);
  client.agentOutputs = { ...client.agentOutputs, ...outputs };
  client.disputes = [...(client.disputes ?? []), ...newDisputes];
  if (client.stage === 'NEW') client.stage = 'DOCS_VERIFIED';
  
  if (newDisputes.length > 0) {
    const entry = await dispatchEmail(client, 'LETTERS_READY');
    client.emailLog.push(entry);
  }
  
  saveClient(client);

  res.json({
    success: true,
    data: {
      client,
      parseNotes: parsed.parseNotes,
      summary: {
        scoresFound: Object.keys(parsed.scores).length,
        negativeItems: parsed.negativeItems.length,
        debtAccounts: parsed.debtAccounts.length,
        inquiries: parsed.numberOfInquiries,
        lettersGenerated: newDisputes.length,
        agentsCompleted: Object.keys(outputs).length,
      },
    },
  });
});

// POST run overdue checks (call via cron or manual trigger)
clientRouter.post('/system/check-overdue', async (_req, res) => {
  const clients = getAllClients();
  const overdue = getClientsNeedingOverdueAlert(clients);
  const postCare = getClientsNeedingPostCare(clients);
  const results = [];

  for (const client of overdue) {
    const entry = await dispatchEmail(client, 'OVERDUE_48H');
    client.emailLog.push(entry);
    if (client.invoice) client.invoice.overdueAlertSent = true;
    saveClient(client);
    results.push({ clientId: client.id, action: 'OVERDUE_ALERT_SENT' });
  }

  for (const client of postCare) {
    const entry = await dispatchEmail(client, 'POST_CARE_45DAY');
    client.emailLog.push(entry);
    saveClient(client);
    results.push({ clientId: client.id, action: 'POST_CARE_SENT' });
  }

  res.json({ success: true, data: { processed: results.length, results } });
});

// ============================================================
// FCRA LEGAL STRATEGY & TRI-BUREAU WALKTHROUGH ENDPOINTS
// ============================================================

// GET /api/clients/:id/fcra-session
clientRouter.get('/:id/fcra-session', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
    saveClient(client);
  } else {
    // Refresh discrepancies if negative items changed
    if (client.fcraSession.discrepanciesAudited.length === 0 && client.creditProfile.negativeItems.length > 0) {
      client.fcraSession.discrepanciesAudited = generateCrossBureauDiscrepancies(client, client.creditProfile);
      saveClient(client);
    }
  }

  res.json({
    success: true,
    data: {
      session: client.fcraSession,
      bureauAddresses: BUREAU_ADDRESSES
    }
  });
});

// POST /api/clients/:id/fcra-session/step
clientRouter.post('/:id/fcra-session/step', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { step } = req.body;
  if (!step || step < 1 || step > 5) {
    return res.status(400).json({ success: false, error: 'Step must be between 1 and 5' });
  }

  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
  }

  client.fcraSession.currentStep = step as 1 | 2 | 3 | 4 | 5;
  if (!client.fcraSession.completedSteps.includes(step)) {
    client.fcraSession.completedSteps.push(step);
  }
  client.fcraSession.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({ success: true, data: client.fcraSession });
});

// POST /api/clients/:id/fcra-session/evidence
clientRouter.post('/:id/fcra-session/evidence', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { title, type, bureau, trackingNumber, dateSentOrDelivered, fileNotes, verified } = req.body;
  if (!title || !type) {
    return res.status(400).json({ success: false, error: 'Title and type are required' });
  }

  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
  }

  const newEvidence = {
    id: uuidv4(),
    title,
    type,
    bureau,
    trackingNumber,
    dateSentOrDelivered: dateSentOrDelivered || new Date().toISOString().split('T')[0],
    fileNotes,
    verified: verified ?? true,
    createdAt: new Date().toISOString()
  };

  client.fcraSession.evidenceFiles.push(newEvidence);
  if (!client.fcraSession.completedSteps.includes(4)) {
    client.fcraSession.completedSteps.push(4);
  }
  client.fcraSession.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({ success: true, data: client.fcraSession });
});

// POST /api/clients/:id/fcra-session/deadline
clientRouter.post('/:id/fcra-session/deadline', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { bureau, deliveredDate, trackingNumber, status, outcomeNotes } = req.body;
  if (!bureau) return res.status(400).json({ success: false, error: 'Bureau is required' });

  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
  }

  const existingIdx = client.fcraSession.investigationDeadlines.findIndex(d => d.bureau === bureau);
  
  let day30Deadline: string | undefined = undefined;
  if (deliveredDate) {
    const d = new Date(deliveredDate);
    d.setDate(d.getDate() + 30);
    day30Deadline = d.toISOString().split('T')[0];
  }

  const updatedEntry = {
    bureau: bureau as 'Equifax' | 'Experian' | 'TransUnion',
    trackingNumber: trackingNumber || (existingIdx >= 0 ? client.fcraSession.investigationDeadlines[existingIdx].trackingNumber : undefined),
    deliveredDate: deliveredDate || (existingIdx >= 0 ? client.fcraSession.investigationDeadlines[existingIdx].deliveredDate : undefined),
    day30Deadline: day30Deadline || (existingIdx >= 0 ? client.fcraSession.investigationDeadlines[existingIdx].day30Deadline : undefined),
    status: status || (existingIdx >= 0 ? client.fcraSession.investigationDeadlines[existingIdx].status : 'PENDING_DELIVERY'),
    outcomeNotes: outcomeNotes || (existingIdx >= 0 ? client.fcraSession.investigationDeadlines[existingIdx].outcomeNotes : undefined)
  };

  if (existingIdx >= 0) {
    client.fcraSession.investigationDeadlines[existingIdx] = updatedEntry;
  } else {
    client.fcraSession.investigationDeadlines.push(updatedEntry);
  }

  if (!client.fcraSession.completedSteps.includes(3)) {
    client.fcraSession.completedSteps.push(3);
  }
  client.fcraSession.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({ success: true, data: client.fcraSession });
});

// POST /api/clients/:id/fcra-session/generate-cfpb
clientRouter.post('/:id/fcra-session/generate-cfpb', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { bureau = 'Experian', trackingNumber, deliveryDate } = req.body;
  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
  }

  const draft = generateCfpbComplaint(client, bureau, trackingNumber, deliveryDate);
  client.fcraSession.cfpbComplaintDraft = draft;
  if (!client.fcraSession.completedSteps.includes(5)) {
    client.fcraSession.completedSteps.push(5);
  }
  client.fcraSession.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({ success: true, data: { draft, session: client.fcraSession } });
});

// POST /api/clients/:id/fcra-session/generate-intent-to-sue
clientRouter.post('/:id/fcra-session/generate-intent-to-sue', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { bureau = 'Experian', trackingNumber, deliveryDate } = req.body;
  if (!client.fcraSession) {
    client.fcraSession = initializeFcraSession(client);
  }

  const discrepancies = client.fcraSession.discrepanciesAudited.length > 0
    ? client.fcraSession.discrepanciesAudited
    : generateCrossBureauDiscrepancies(client, client.creditProfile);

  const draft = generateIntentToSueLetter(client, bureau, discrepancies, trackingNumber, deliveryDate);
  client.fcraSession.intentToSueDraft = draft;
  if (!client.fcraSession.completedSteps.includes(5)) {
    client.fcraSession.completedSteps.push(5);
  }
  client.fcraSession.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({ success: true, data: { draft, session: client.fcraSession } });
});

// ============================================================
// FULLY CUSTOMIZED DISPUTE LETTERS & LETTERSTREAM DISPATCH
// ============================================================

// POST /api/clients/:id/generate-custom-disputes
clientRouter.post('/:id/generate-custom-disputes', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { tone, personalContext, targetBureaus } = req.body;
  const newLetters = generateClientCustomDisputeLetters(client, client.creditProfile, {
    tone,
    personalContext,
    targetBureaus
  });

  if (newLetters.length > 0) {
    // Replace or merge with existing disputes
    const existingOther = client.disputes.filter(d => !newLetters.some(nl => nl.bureau === d.bureau));
    client.disputes = [...existingOther, ...newLetters];

    // Also sync to agentOutputs['DISPUTE_LETTER']
    if (client.agentOutputs['DISPUTE_LETTER']) {
      client.agentOutputs['DISPUTE_LETTER'].letters = client.disputes;
    }
    client.updatedAt = new Date().toISOString();
    saveClient(client);
  }

  res.json({
    success: true,
    data: {
      letters: client.disputes,
      generatedCount: newLetters.length,
      client
    }
  });
});

// POST /api/clients/:id/letterstream/send
clientRouter.post('/:id/letterstream/send', async (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

  const { letterId, deliveryType = 'CERTIFIED_ERR' } = req.body;
  const settings = getSettings();

  // Determine which letters to dispatch
  let targetLetters: typeof client.disputes = [];
  if (letterId === 'ALL') {
    targetLetters = client.disputes.filter(l => l.status !== 'SENT');
    if (targetLetters.length === 0) {
      targetLetters = client.disputes; // resend if all were sent
    }
  } else {
    const found = client.disputes.find(l => l.id === letterId);
    if (!found) return res.status(404).json({ success: false, error: 'Dispute letter not found' });
    targetLetters = [found];
  }

  const results = [];

  for (const letter of targetLetters) {
    const bureau = letter.bureau || 'Experian';
    try {
      const jobResult = await sendLetterThroughLetterStream({
        client,
        letter,
        bureau,
        settings,
        deliveryType
      });

      // Update Letter status & tracking
      letter.status = 'SENT';
      letter.sentAt = new Date().toISOString();
      letter.letterstreamJobId = jobResult.jobId;
      letter.trackingNumber = jobResult.trackingNumber;
      letter.certifiedMailStatus = jobResult.status;
      letter.mailingCost = jobResult.cost;
      letter.deliveryType = deliveryType;

      // 1. Automatically register into FCRA Evidence Vault (Step 4)
      if (!client.fcraSession) {
        client.fcraSession = initializeFcraSession(client);
      }

      client.fcraSession.evidenceFiles.push({
        id: uuidv4(),
        title: `LetterStream Certified Mail Dispatch (${bureau})`,
        type: 'CERTIFIED_MAIL_RECEIPT',
        bureau,
        trackingNumber: jobResult.trackingNumber,
        dateSentOrDelivered: new Date().toISOString().split('T')[0],
        fileNotes: `Job ${jobResult.jobId} · USPS Certified Mail with ERR · Delivery to ${bureau}`,
        verified: true,
        createdAt: new Date().toISOString()
      });

      // 2. Automatically initialize or update 30-Day Statutory Clock (Step 3)
      const existingDeadIdx = client.fcraSession.investigationDeadlines.findIndex(d => d.bureau === bureau);
      const estDelivery = jobResult.estimatedDeliveryDate;
      const d30 = new Date(estDelivery);
      d30.setDate(d30.getDate() + 30);

      const deadlineEntry = {
        bureau,
        trackingNumber: jobResult.trackingNumber,
        deliveredDate: estDelivery,
        day30Deadline: d30.toISOString().split('T')[0],
        status: 'UNDER_INVESTIGATION' as const,
        outcomeNotes: `Dispatched via LetterStream (Job ${jobResult.jobId}). 30-day investigation clock active.`
      };

      if (existingDeadIdx >= 0) {
        client.fcraSession.investigationDeadlines[existingDeadIdx] = deadlineEntry;
      } else {
        client.fcraSession.investigationDeadlines.push(deadlineEntry);
      }

      if (!client.fcraSession.completedSteps.includes(2)) client.fcraSession.completedSteps.push(2);
      if (!client.fcraSession.completedSteps.includes(3)) client.fcraSession.completedSteps.push(3);
      if (!client.fcraSession.completedSteps.includes(4)) client.fcraSession.completedSteps.push(4);

      results.push(jobResult);
    } catch (err: any) {
      console.error(`Failed to send letter to ${bureau}:`, err.message);
      results.push({
        success: false,
        bureau,
        error: err.message
      });
    }
  }

  // Set client stage to DISPUTE_ACTIVE if in earlier stage
  if (['NEW', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'INVOICE_SENT', 'PAID'].includes(client.stage)) {
    client.stage = 'DISPUTE_ACTIVE';
  }

  client.updatedAt = new Date().toISOString();
  saveClient(client);

  res.json({
    success: true,
    data: {
      dispatched: results.length,
      results,
      client
    }
  });
});



