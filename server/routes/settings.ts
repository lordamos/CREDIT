import express from 'express';
import { getSettings, saveSettings } from '../core/dataStore.js';
import { testLetterStreamConnection } from '../core/letterstream.js';

export const settingsRouter = express.Router();

settingsRouter.get('/', (_req, res) => {
  const settings = getSettings();
  // Mask secret keys in response
  res.json({
    success: true,
    data: {
      ...settings,
      mailjetSecretKey: settings.mailjetSecretKey ? '***masked***' : '',
      letterstreamApiSecret: settings.letterstreamApiSecret ? '***masked***' : ''
    }
  });
});

settingsRouter.post('/', (req, res) => {
  const current = getSettings();
  const incoming = req.body;
  // Don't overwrite secret keys if masked value sent
  if (incoming.mailjetSecretKey === '***masked***') {
    incoming.mailjetSecretKey = current.mailjetSecretKey;
  }
  if (incoming.letterstreamApiSecret === '***masked***') {
    incoming.letterstreamApiSecret = current.letterstreamApiSecret;
  }
  const saved = saveSettings({ ...current, ...incoming });
  res.json({
    success: true,
    data: {
      ...saved,
      mailjetSecretKey: saved.mailjetSecretKey ? '***masked***' : '',
      letterstreamApiSecret: saved.letterstreamApiSecret ? '***masked***' : ''
    }
  });
});

settingsRouter.post('/test-letterstream', async (_req, res) => {
  const settings = getSettings();
  const result = await testLetterStreamConnection(settings);
  res.json({ success: result.success, message: result.message, status: result.accountStatus });
});
