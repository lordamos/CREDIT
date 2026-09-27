// ============================================================
// CREDIT ACCELERATION CRM – Complete TypeScript Type System
// ============================================================

export type PipelineStage =
  | 'NEW'
  | 'DOCS_VERIFIED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'INVOICE_SENT'
  | 'PAID'
  | 'DISPUTE_ACTIVE'
  | 'POST_CARE'
  | 'CLOSED';

export type PricingPlan = 'A' | 'B';

export type AgentId =
  | 'COMPREHENSIVE_AUDIT'
  | 'ROADMAP_90_DAY'
  | 'DEBT_OPTIMIZER'
  | 'DISPUTE_LETTER'
  | 'GOODWILL_LETTER'
  | 'INQUIRY_MINIMIZER'
  | 'SECONDARY_FREEZE'
  | 'CREDIT_GROWTH';

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'ERROR';

export interface AgentResult {
  agentId: AgentId;
  status: AgentStatus;
  title: string;
  output: string;
  generatedAt?: string;
  letters?: DisputeLetter[];
}

export type DisputeType =
  | 'FCRA_FORMAL_DISPUTE'
  | 'GOODWILL_ADJUSTMENT'
  | 'METHOD_OF_VERIFICATION'
  | 'SECONDARY_BUREAU_FREEZE'
  | 'DEBT_VALIDATION';

export interface DisputeLetter {
  id: string;
  clientId: string;
  type: DisputeType;
  bureau?: 'Equifax' | 'Experian' | 'TransUnion';
  creditor?: string;
  accountName?: string;
  accountNumber?: string;
  content: string;
  status: 'DRAFT' | 'SENT' | 'RESPONDED' | 'DELETED';
  deadline?: string; // 30-day FCRA deadline
  createdAt: string;
  sentAt?: string;
}

export type EmailStage =
  | 'WELCOME'
  | 'DOCS_VERIFIED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PAYMENT_CONFIRMED'
  | 'OVERDUE_48H'
  | 'POST_CARE_45DAY';

export interface EmailLogEntry {
  id: string;
  stage: EmailStage;
  subject: string;
  body: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SCHEDULED';
  scheduledFor?: string;
  mailjetMessageId?: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  lineItem: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  overdueAlertSent: boolean;
}

export interface NegativeItem {
  id: string;
  type: 'LATE_PAYMENT' | 'COLLECTION' | 'CHARGE_OFF' | 'INQUIRY' | 'BANKRUPTCY' | 'JUDGMENT';
  bureau: string;
  creditor: string;
  accountNumber?: string;
  balance?: number;
  dateOpened?: string;
  dateOfFirstDelinquency?: string;
  impactScore: 1 | 2 | 3 | 4 | 5; // 5 = highest negative impact
  disputeStrategy: 'FORMAL_FCRA' | 'GOODWILL' | 'DEBT_VALIDATION' | 'WAIT_SEVEN_YEARS';
  notes?: string;
}

export interface DebtAccount {
  id: string;
  creditor: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  creditLimit?: number;
  type: 'CREDIT_CARD' | 'PERSONAL_LOAN' | 'AUTO' | 'STUDENT' | 'MEDICAL' | 'OTHER';
}

export interface CreditProfile {
  currentScores: {
    equifax?: number;
    experian?: number;
    transunion?: number;
  };
  targetScore: number;
  reportText: string;
  negativeItems: NegativeItem[];
  debtAccounts: DebtAccount[];
  currentUtilization?: number;
  totalAvailableCredit?: number;
  totalDebt?: number;
  oldestAccountAge?: number; // months
  numberOfInquiries?: number;
}

export interface Client {
  id: string;
  // Contact Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  // Business Info
  companyName: string;
  ein?: string;
  businessType?: string;
  // Contract
  plan: PricingPlan;
  stage: PipelineStage;
  signedAt?: string;
  intakeToken: string; // unique URL token for public intake form
  // Credit Data
  creditProfile: CreditProfile;
  // Operations
  agentOutputs: Partial<Record<AgentId, AgentResult>>;
  emailLog: EmailLogEntry[];
  disputes: DisputeLetter[];
  invoice?: Invoice;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  companyName: string;
  mailjetApiKey: string;
  mailjetSecretKey: string;
  fromEmail: string;
  fromName: string;
}

export interface DataStore {
  clients: Client[];
  settings: ProviderSettings;
  version: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const PIPELINE_STAGES: Record<PipelineStage, { label: string; color: string; description: string }> = {
  NEW: { label: 'New Client', color: 'blue', description: 'Agreement signed, awaiting docs' },
  DOCS_VERIFIED: { label: 'Docs Verified', color: 'indigo', description: 'Identity & business docs confirmed' },
  SUBMITTED: { label: 'Submitted', color: 'purple', description: 'Applications submitted to lenders' },
  APPROVED: { label: 'Approved ✓', color: 'emerald', description: 'Credit facility approved' },
  INVOICE_SENT: { label: 'Invoice Sent', color: 'yellow', description: 'Success fee invoice delivered' },
  PAID: { label: 'Paid ✓', color: 'green', description: 'Success fee received' },
  DISPUTE_ACTIVE: { label: 'Dispute Active', color: 'orange', description: 'FCRA dispute letters sent' },
  POST_CARE: { label: 'Post-Care', color: 'teal', description: '90-day maintenance & growth phase' },
  CLOSED: { label: 'Closed', color: 'gray', description: 'File closed' },
};

export const AGENT_META: Record<AgentId, { title: string; icon: string; description: string }> = {
  COMPREHENSIVE_AUDIT: { title: 'Forensic Credit Audit', icon: '🔍', description: 'Identify every negative item ranked by score impact' },
  ROADMAP_90_DAY: { title: '90-Day Repair Roadmap', icon: '🗺️', description: 'Step-by-step dispute & recovery timeline' },
  DEBT_OPTIMIZER: { title: 'Debt Strategy Optimizer', icon: '📉', description: 'Snowball vs. Avalanche + AZEO utilization plan' },
  DISPUTE_LETTER: { title: 'FCRA Dispute Letter Factory', icon: '⚖️', description: 'FCRA §611/623 compliant bureau dispute letters' },
  GOODWILL_LETTER: { title: 'Goodwill Adjustment Specialist', icon: '🤝', description: 'Creditor goodwill deletion request letters' },
  INQUIRY_MINIMIZER: { title: 'Hard Inquiry Minimizer', icon: '🛡️', description: 'Inquiry damage control & timing strategy' },
  SECONDARY_FREEZE: { title: 'Secondary Bureau Freeze Engine', icon: '🔒', description: 'LexisNexis, SageStream & Innovis freeze guide' },
  CREDIT_GROWTH: { title: 'Credit Growth Architect', icon: '📈', description: '1% utilization strategy & credit-builder roadmap' },
};

export const EMAIL_STAGE_META: Record<EmailStage, { subject: string; trigger: string; icon: string }> = {
  WELCOME: { subject: 'Welcome to Your Credit Acceleration Program', trigger: 'On agreement signing', icon: '👋' },
  DOCS_VERIFIED: { subject: 'Status Update: Underwriting Package Approved', trigger: 'On docs verified', icon: '✅' },
  SUBMITTED: { subject: 'Applications Submitted – Real-Time Underwriting in Progress', trigger: 'On submission', icon: '📤' },
  APPROVED: { subject: '🎉 CONGRATULATIONS! Your First Business Credit Facility is Approved!', trigger: 'On approval', icon: '🎉' },
  PAYMENT_CONFIRMED: { subject: 'Payment Confirmed: Card Activation & 1% Utilization Guide', trigger: 'On payment received', icon: '💳' },
  OVERDUE_48H: { subject: 'URGENT NOTICE: Outstanding Success Fee – Action Required', trigger: '48hrs after approval if unpaid', icon: '⚠️' },
  POST_CARE_45DAY: { subject: '45-Day Check-In: Scaling Your Lines to $50,000+', trigger: '45 days after payment', icon: '🚀' },
};
