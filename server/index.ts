import express from 'express';
import cors from 'cors';
import { clientRouter } from './routes/clients.js';
import { settingsRouter } from './routes/settings.js';
import { getAllClients, saveClient } from './core/dataStore.js';
import { getClientsNeedingOverdueAlert, getClientsNeedingPostCare, dispatchEmail } from './core/emailScheduler.js';

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

app.listen(PORT, () => {
  console.log(`\n⚡ Credit Acceleration CRM running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:5174`);
  console.log(`🔒 Jurisdiction: Brevard County, Florida\n`);

  // Start the automated scheduler — runs every hour
  setInterval(async () => {
    try {
      const clients = getAllClients();
      const overdue = getClientsNeedingOverdueAlert(clients);
      const postCare = getClientsNeedingPostCare(clients);
      for (const client of overdue) {
        const entry = await dispatchEmail(client, 'OVERDUE_48H');
        client.emailLog.push(entry);
        if (client.invoice) client.invoice.overdueAlertSent = true;
        saveClient(client);
        console.log(`[Scheduler] ⚠️  Overdue alert sent → ${client.email}`);
      }
      for (const client of postCare) {
        const entry = await dispatchEmail(client, 'POST_CARE_45DAY');
        client.emailLog.push(entry);
        saveClient(client);
        console.log(`[Scheduler] 🚀 Post-care email sent → ${client.email}`);
      }
    } catch (err: any) {
      console.error('[Scheduler] Error:', err.message);
    }
  }, 60 * 60 * 1000); // every hour
});
