import express from 'express';
import { getSettings, saveSettings } from '../core/dataStore.js';

export const settingsRouter = express.Router();

settingsRouter.get('/', (_req, res) => {
  const settings = getSettings();
  // Mask secret key in response
  res.json({ success: true, data: { ...settings, mailjetSecretKey: '***masked***' } });
});

settingsRouter.post('/', (req, res) => {
  const current = getSettings();
  const incoming = req.body;
  // Don't overwrite secret key if masked value sent
  if (incoming.mailjetSecretKey === '***masked***') {
    incoming.mailjetSecretKey = current.mailjetSecretKey;
  }
  const saved = saveSettings({ ...current, ...incoming });
  res.json({ success: true, data: { ...saved, mailjetSecretKey: '***masked***' } });
});
