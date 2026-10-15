import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { clientRouter } from './routes/clients.js';
import { settingsRouter } from './routes/settings.js';
import { getAllClients, saveClient } from './core/dataStore.js';
import { getClientsNeedingOverdueAlert, getClientsNeedingPostCare, getClientsNeeding30DayFollowup, dispatchEmail } from './core/emailScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/clients', clientRouter);
app.use('/api/settings', settingsRouter);

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'Credit Acceleration CRM', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Serve static frontend
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Credit Acceleration CRM running at http://localhost:${PORT}`);
  console.log(`🌍 Jurisdiction: Brevard County, Florida\n`);

  // Start the automated scheduler - runs every hour
  setInterval(async () => {
    try {
      const clients = getAllClients();
      const overdue = getClientsNeedingOverdueAlert(clients);
      const postCare = getClientsNeedingPostCare(clients);
      const followUp30 = getClientsNeeding30DayFollowup(clients);
      for (const client of overdue) {
        const entry = await dispatchEmail(client, 'OVERDUE_48H');
        client.emailLog.push(entry);
        if (client.invoice) client.invoice.overdueAlertSent = true;
        saveClient(client);
        console.log(`[Scheduler] ✉️  Overdue alert sent -> ${client.email}`);
      }
      for (const client of postCare) {
        const entry = await dispatchEmail(client, 'POST_CARE_45DAY');
        client.emailLog.push(entry);
        saveClient(client);
        console.log(`[Scheduler] ✉️ Post-care email sent -> ${client.email}`);
      }
      for (const client of followUp30) {
        const entry = await dispatchEmail(client, 'DISPUTE_30DAY_FOLLOWUP');
        client.emailLog.push(entry);
        saveClient(client);
        console.log(`[Scheduler] ✉️ 30-Day Follow-Up email sent -> ${client.email}`);
      }
    } catch (err: any) {
      console.error('[Scheduler] Error:', err.message);
    }
  }, 60 * 60 * 1000); // every hour
});
