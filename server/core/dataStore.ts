import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DataStore, Client, ProviderSettings } from '../../shared/types/credit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_SETTINGS: ProviderSettings = {
  name: '',
  email: '',
  phone: '',
  address: 'Palm Bay',
  city: 'Palm Bay',
  state: 'FL',
  zip: '32905',
  companyName: 'Credit Acceleration Services',
  mailjetApiKey: '4898b704c0e9979a617c01327b2c5485',
  mailjetSecretKey: '94b374b7f2a3b7fa7f0bfed91d6d81ad',
  fromEmail: '',
  fromName: 'Credit Acceleration Team',
};

const DEFAULT_STORE: DataStore = {
  clients: [],
  settings: DEFAULT_SETTINGS,
  version: '1.0.0',
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): DataStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2));
    return DEFAULT_STORE;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as DataStore;
}

function writeStore(store: DataStore): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

// ── Clients ──────────────────────────────────────────────────
export function getAllClients(): Client[] {
  return readStore().clients;
}

export function getClientById(id: string): Client | undefined {
  return readStore().clients.find((c) => c.id === id);
}

export function getClientByToken(token: string): Client | undefined {
  return readStore().clients.find((c) => c.intakeToken === token);
}

export function saveClient(client: Client): Client {
  const store = readStore();
  const idx = store.clients.findIndex((c) => c.id === client.id);
  client.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    store.clients[idx] = client;
  } else {
    store.clients.push(client);
  }
  writeStore(store);
  return client;
}

export function deleteClient(id: string): boolean {
  const store = readStore();
  const before = store.clients.length;
  store.clients = store.clients.filter((c) => c.id !== id);
  writeStore(store);
  return store.clients.length < before;
}

// ── Settings ─────────────────────────────────────────────────
export function getSettings(): ProviderSettings {
  return readStore().settings;
}

export function saveSettings(settings: ProviderSettings): ProviderSettings {
  const store = readStore();
  store.settings = settings;
  writeStore(store);
  return settings;
}
