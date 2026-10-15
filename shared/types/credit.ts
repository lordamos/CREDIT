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
  | 'CREDIT_GROWTH'
  // ── 5-Prompt Business Underwriting & Funding Readiness Engine ──
  | 'BIZ_FORMATION_EIN'
  | 'BIZ_ADDRESS_FOOTPRINT'
  | 'BIZ_NAICS_CLASSIFICATION'
  | 'BIZ_COMMINGLING_FINANCES'
  | 'BIZ_FUNDING_READINESS'
  // ── FCRA Tri-Bureau Discrepancy & Statutory Action Engine ──
  | 'FCRA_STATUTORY_AUDIT';

export type AddressType =
  | 'BRICK_AND_MORTAR'
  | 'EXECUTIVE_SUITE'
  | 'VIRTUAL_OFFICE'
  | 'HOME_ADDRESS'
  | 'CMRA_UPS_BOX';

export type ReadinessVerdict = 'READY' | 'NEEDS_ATTENTION' | 'FIX_BEFORE_APPLYING';

export interface BusinessProfile {
  formationState?: string;
  formationYear?: number;
  entityType?: 'LLC' | 'C-Corp' | 'S-Corp' | 'Sole Proprietor' | 'Partnership';
  operatingAgreementFiled?: boolean;
  activeGoodStanding?: boolean;
  einLetterStatus?: 'VERIFIED_CP575' | 'VERIFIED_147C' | 'ONLINE_CONFIRMATION' | 'UNVERIFIED';
  ownershipPercentage?: number;
  addressType?: AddressType;
  dedicatedSuiteNumber?: string;
  websiteUrl?: string;
  businessEmail?: string;
  businessPhone?: string;
  has411Listing?: boolean;
  hasGoogleBusinessProfile?: boolean;
  actualOperationsDescription?: string;
  currentNaicsCode?: string;
  hasDedicatedBusinessBank?: boolean;
  businessBankName?: string;
  monthsInBusiness?: number;
  averageMonthlyRevenue?: number;
  comminglingDetected?: boolean;
  comminglingNotes?: string;
}

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'ERROR';

export interface AgentResult {
  agentId: AgentId;
  status: AgentStatus;
  title: string;
  output: string;
  generatedAt?: string;
  letters?: DisputeLetter[];
  verdict?: ReadinessVerdict;
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
  | 'POST_CARE_45DAY'
  | 'LETTERS_READY'
  | 'DISPUTE_30DAY_FOLLOWUP';

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
  businessProfile?: BusinessProfile;
  truebuildProfile?: TrueBuildProfile;
  // Contract
  plan: PricingPlan;
  stage: PipelineStage;
  signedAt?: string;
  approvedAt?: string;
  intakeToken: string; // unique URL token for public intake form
  // Credit Data
  creditProfile: CreditProfile;
  fcraSession?: FcraWalkthroughSession;
  // Operations
  agentOutputs: Partial<Record<AgentId, AgentResult>>;
  emailLog: EmailLogEntry[];
  disputes: DisputeLetter[];
  invoice?: Invoice;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// FCRA LEGAL STRATEGY & TRI-BUREAU WALKTHROUGH TYPES
// ============================================================

export interface CrossBureauFieldComparison {
  fieldName: string;
  equifaxValue?: string;
  experianValue?: string;
  transunionValue?: string;
  isDiscrepancy: boolean;
  legalViolationNote?: string;
}

export interface CrossBureauAccountAudit {
  id: string;
  creditor: string;
  accountNumberMasked: string;
  accountType: string;
  fields: CrossBureauFieldComparison[];
  hasDiscrepancy: boolean;
  accuracyViolationCited: boolean; // 15 U.S.C. § 1681e(b)
  disputeGrounds: string[];
}

export interface FcraEvidenceFile {
  id: string;
  title: string;
  type:
    | 'INITIAL_REPORT'
    | 'SIGNED_DISPUTE'
    | 'CERTIFIED_MAIL_RECEIPT'
    | 'USPS_DELIVERY_CONFIRMATION'
    | 'BUREAU_RESPONSE'
    | 'CFPB_CONFIRMATION';
  bureau?: 'Equifax' | 'Experian' | 'TransUnion';
  trackingNumber?: string;
  dateSentOrDelivered?: string;
  fileNotes?: string;
  verified: boolean;
  createdAt: string;
}

export interface BureauInvestigationDeadline {
  bureau: 'Equifax' | 'Experian' | 'TransUnion';
  trackingNumber?: string;
  deliveredDate?: string;
  day30Deadline?: string;
  status:
    | 'PENDING_DELIVERY'
    | 'UNDER_INVESTIGATION'
    | '30_DAYS_EXPIRED'
    | 'DELETED'
    | 'VERIFIED_WITHOUT_METHOD'
    | 'UPDATED';
  outcomeNotes?: string;
}

export interface FcraWalkthroughSession {
  currentStep: 1 | 2 | 3 | 4 | 5;
  discrepanciesAudited: CrossBureauAccountAudit[];
  evidenceFiles: FcraEvidenceFile[];
  investigationDeadlines: BureauInvestigationDeadline[];
  cfpbComplaintDraft?: string;
  intentToSueDraft?: string;
  completedSteps: number[];
  updatedAt: string;
}

export interface TrueBuildVendor {
  id: number;
  name: string;
  tier: 1 | 2 | 3 | 4;
  category: string;
  terms: string;
  minInvoice: number;
  reportsTo: string;
  pgRequired: boolean;
  applicationUrl: string;
  underwritingTips: string;
  applied?: boolean;
  locked?: boolean;
}

export interface TrueBuildTradeline {
  id: string;
  vendorId: number;
  vendorName: string;
  tier: number;
  creditLimit: number;
  accountNumber: string;
  openedDate: string;
  status: 'APPROVED' | 'PENDING';
  reportsTo: string;
}

export interface TrueBuildPaymentRecord {
  id: string;
  tradelineId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  paidDate: string;
  daysRelativeToDue: number;
  status: 'PAID';
}

export interface TrueBuildMetrics {
  paydexScore: number | null;
  experianIntelliscore: number | null;
  equifaxCommercial: number | null;
  unlockedTier: 1 | 2 | 3 | 4;
  totalCreditLimit: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  tier4Count: number;
}

export interface TrueBuildProfile {
  dunsNumber?: string;
  metrics: TrueBuildMetrics;
  tradelines: TrueBuildTradeline[];
  paymentRecords: TrueBuildPaymentRecord[];
}

export const TRUEBUILD_DEFAULT_VENDORS: TrueBuildVendor[] = [
  { id: 1, name: 'Uline', tier: 1, category: 'Shipping Supplies', terms: 'Net 30', minInvoice: 50.0, reportsTo: 'Experian, D&B', pgRequired: false, applicationUrl: 'https://www.uline.com/CustomerService/CreditApplication', underwritingTips: "Check 'Invoice My Account' at checkout." },
  { id: 2, name: 'Grainger', tier: 1, category: 'Industrial/MRO', terms: 'Net 30', minInvoice: 50.0, reportsTo: 'D&B', pgRequired: false, applicationUrl: 'https://www.grainger.com/content/credit-services', underwritingTips: 'Requires active state LLC registration.' },
  { id: 3, name: 'Quill', tier: 1, category: 'Office Supplies', terms: 'Net 30', minInvoice: 100.0, reportsTo: 'D&B', pgRequired: false, applicationUrl: 'https://www.quill.com/account/net30terms', underwritingTips: 'Place 1-2 small pre-paid orders first.' },
  { id: 4, name: 'Nav Prime', tier: 1, category: 'Financial Monitoring', terms: 'Net 30', minInvoice: 49.99, reportsTo: 'D&B, Experian, Equifax', pgRequired: false, applicationUrl: 'https://www.nav.com', underwritingTips: 'Reports monthly to all three corporate credit bureaus.' },
  { id: 5, name: 'The CEO Creative', tier: 1, category: 'Office Supplies', terms: 'Net 30', minInvoice: 60.0, reportsTo: 'Equifax, CreditSafe', pgRequired: false, applicationUrl: 'https://theceocreative.com/net-30-application/', underwritingTips: 'Requires min $60 initial catalog purchase.' },
  { id: 6, name: 'Home Depot Pro Commercial', tier: 2, category: 'Hardware & Building', terms: 'Revolving / Net 30', minInvoice: 100.0, reportsTo: 'Experian, D&B', pgRequired: false, applicationUrl: 'https://www.homedepot.com/c/Credit_Center', underwritingTips: 'Apply under Commercial Revolving account.' },
  { id: 7, name: 'WEX Fleet Fuel Card', tier: 2, category: 'Fuel Services', terms: 'Net 15 / Net 30', minInvoice: 75.0, reportsTo: 'Experian, D&B', pgRequired: false, applicationUrl: 'https://www.wexinc.com/solutions/fleet-cards/', underwritingTips: 'Fleet card; strictly reports early payment velocity.' },
  { id: 8, name: 'Staples Business Advantage', tier: 2, category: 'Commercial Supplies', terms: 'Revolving', minInvoice: 100.0, reportsTo: 'D&B', pgRequired: false, applicationUrl: 'https://www.staples.com/credit', underwritingTips: 'Requires 3+ reporting tradelines on D&B.' },
  { id: 9, name: 'Amazon Business American Express', tier: 3, category: 'General Purchasing', terms: 'Net 60 / Revolving', minInvoice: 250.0, reportsTo: 'Experian, D&B', pgRequired: false, applicationUrl: 'https://www.amazon.com/businesscredit', underwritingTips: "Select 'Company Liability Only' option." },
  { id: 10, name: "Sam's Club Business Mastercard", tier: 3, category: 'Club Store / Equipment', terms: 'Revolving', minInvoice: 250.0, reportsTo: 'D&B, Experian, Equifax', pgRequired: false, applicationUrl: 'https://www.samsclub.com/credit', underwritingTips: 'Synchrony Bank commercial underwriting rules.' },
  { id: 11, name: 'Chase Ink Business Preferred', tier: 4, category: 'Commercial Bank Card', terms: 'Revolving', minInvoice: 500.0, reportsTo: 'Equifax, Experian', pgRequired: true, applicationUrl: 'https://creditcards.chase.com/business', underwritingTips: 'Requires personal guarantor credit score 680+.' },
  { id: 12, name: 'Bank of America Business Advantage', tier: 4, category: 'Credit Line / Card', terms: 'Revolving', minInvoice: 1000.0, reportsTo: 'Experian, Equifax', pgRequired: true, applicationUrl: 'https://www.bankofamerica.com/smallbusiness/credit-cards/', underwritingTips: 'Established commercial bank deposits accelerate limit increases.' },
];

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
  // ── 5-Prompt Business Underwriting & Funding Readiness Engine ──
  BIZ_FORMATION_EIN: { title: 'LLC Formation & EIN Audit', icon: '🏛️', description: 'Prompt 1: Articles, EIN CP575, ownership & SOS registry consistency' },
  BIZ_ADDRESS_FOOTPRINT: { title: 'Address & Digital Footprint', icon: '📍', description: 'Prompt 2: Address type industry fit, Google profile & 411 registry' },
  BIZ_NAICS_CLASSIFICATION: { title: 'Operational NAICS Code', icon: '🏷️', description: 'Prompt 3: Actual operations classification vs underwriter risk trap' },
  BIZ_COMMINGLING_FINANCES: { title: 'Commingling & Corporate Veil', icon: '💳', description: 'Prompt 4: Forensic personal vs business funds & IRS/veil protection' },
  BIZ_FUNDING_READINESS: { title: 'Funding Readiness Evaluation', icon: '🎯', description: 'Prompt 5: Synthesis score, Ready/Attention/Fix badges & action plan' },
  // ── FCRA Tri-Bureau Discrepancy & Statutory Action Engine ──
  FCRA_STATUTORY_AUDIT: { title: 'FCRA Statutory Audit & Tri-Bureau Discrepancy', icon: '⚖️', description: 'Cross-bureau comparison across 15 fields, 15 U.S.C. § 1681i/e(b)/n/o & 5-step playbook' },
};

export const EMAIL_STAGE_META: Record<EmailStage, { subject: string; trigger: string; icon: string }> = {
  WELCOME: { subject: 'Welcome to Your Credit Acceleration Program', trigger: 'On agreement signing', icon: '👋' },
  DOCS_VERIFIED: { subject: 'Status Update: Underwriting Package Approved', trigger: 'On docs verified', icon: '✅' },
  SUBMITTED: { subject: 'Applications Submitted – Real-Time Underwriting in Progress', trigger: 'On submission', icon: '📤' },
  APPROVED: { subject: '🎉 CONGRATULATIONS! Your First Business Credit Facility is Approved!', trigger: 'On approval', icon: '🎉' },
  PAYMENT_CONFIRMED: { subject: 'Payment Confirmed: Card Activation & 1% Utilization Guide', trigger: 'On payment received', icon: '💳' },
  OVERDUE_48H: { subject: 'URGENT NOTICE: Outstanding Success Fee – Action Required', trigger: '48hrs after approval if unpaid', icon: '⚠️' },
  POST_CARE_45DAY: { subject: '45-Day Check-In: Scaling Your Lines to $50,000+', trigger: '45 days after payment', icon: '🚀' },
  LETTERS_READY: { subject: 'Action Required', trigger: 'On gen', icon: 'x' },
  DISPUTE_30DAY_FOLLOWUP: { subject: '30 days', trigger: '30 days', icon: 'x' },
};
