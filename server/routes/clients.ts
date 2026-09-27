import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllClients, getClientById, saveClient, deleteClient, getClientByToken } from '../core/dataStore.js';
import { dispatchEmail, getClientsNeedingOverdueAlert, getClientsNeedingPostCare } from '../core/emailScheduler.js';
import { runAllAgents } from '../core/agentRunner.js';
import { parseReport } from '../core/reportParser.js';
import type { Client, PricingPlan, PipelineStage } from '../../shared/types/credit.js';

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

// POST run all 8 agents for a client
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

