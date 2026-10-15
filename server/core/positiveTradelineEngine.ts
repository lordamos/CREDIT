import { v4 as uuidv4 } from 'uuid';
import type {
  Client,
  PositiveTradeline,
  RentReportingProfile,
  MonthlyScoreProjectionPoint,
  CreditFactorDiagnostic,
  CreditBuilderProductRecommendation,
  PositiveReportingSuite
} from '../../shared/types/credit.js';

// ============================================================================
// CURATED CREDIT-BUILDER PRODUCT MARKETPLACE
// ============================================================================

export const CREDIT_BUILDER_PRODUCTS: CreditBuilderProductRecommendation[] = [
  {
    id: 'prod-self',
    name: 'Self Credit Builder Account',
    provider: 'Self Financial (Lead Bank / Sunrise Banks)',
    type: 'INSTALLMENT_BUILDER',
    minDepositOrFee: '$25/month installment',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: true,
    approvalOdds: 'GUARANTEED',
    targetScoreTier: 'Any Score (Under 580 Welcome)',
    applicationUrl: 'https://www.self.inc',
    highlightBenefit: 'Builds forced savings while reporting 12-24 months of on-time installment payments without hard inquiry.'
  },
  {
    id: 'prod-kikoff',
    name: 'Kikoff Credit Line ($750)',
    provider: 'Kikoff Inc.',
    type: 'REVOLVING_LINE',
    minDepositOrFee: '$5/month service fee',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: true,
    approvalOdds: 'GUARANTEED',
    targetScoreTier: 'No Credit / Rebuilding (< 620)',
    applicationUrl: 'https://kikoff.com',
    highlightBenefit: 'Instant $750 revolving credit line at 0% APR. Lowers overall utilization ratio instantly.'
  },
  {
    id: 'prod-opensky',
    name: 'OpenSky® Secured Visa®',
    provider: 'Capital Bank, N.A.',
    type: 'SECURED_CARD',
    minDepositOrFee: '$200 refundable deposit',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: true,
    approvalOdds: 'GUARANTEED',
    targetScoreTier: 'No Credit Check Required (300 - 600)',
    applicationUrl: 'https://www.openskycc.com',
    highlightBenefit: 'Zero credit check required. Reports to all 3 credit bureaus monthly as a primary revolving tradeline.'
  },
  {
    id: 'prod-discover-secured',
    name: 'Discover it® Secured Credit Card',
    provider: 'Discover Bank',
    type: 'SECURED_CARD',
    minDepositOrFee: '$200 refundable deposit',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: false,
    approvalOdds: 'EXCELLENT',
    targetScoreTier: 'Rebuilding (560 - 660)',
    applicationUrl: 'https://www.discover.com/credit-cards/secured/',
    highlightBenefit: '2% cash back at gas stations & restaurants. Automatic monthly review starting at month 7 to transition to unsecured.'
  },
  {
    id: 'prod-credit-strong',
    name: 'Credit Strong MAGNUM ($10,000)',
    provider: 'Austin Capital Bank',
    type: 'INSTALLMENT_BUILDER',
    minDepositOrFee: '$55/month',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: true,
    approvalOdds: 'VERY_HIGH',
    targetScoreTier: 'Commercial & Personal Scaling (600+)',
    applicationUrl: 'https://www.creditstrong.com',
    highlightBenefit: 'Large $10,000 installment tradeline. Perfect for positioning for high-limit commercial funding.'
  },
  {
    id: 'prod-ava',
    name: 'Ava Credit Builder & Card',
    provider: 'Ava Financial',
    type: 'REVOLVING_LINE',
    minDepositOrFee: '$0 annual fee ($6/mo builder)',
    reportsTo: 'Equifax, Experian, TransUnion',
    noHardPull: true,
    approvalOdds: 'GUARANTEED',
    targetScoreTier: 'Thin File / Rebuilding (< 650)',
    applicationUrl: 'https://meetava.com',
    highlightBenefit: 'Revolving card dedicated exclusively for subscriptions (Netflix, Spotify) ensuring 0% missed payment risk.'
  }
];

// ============================================================================
// SIMULATION ENGINE: DUAL-ACTION 6-MONTH TRAJECTORY
// ============================================================================

export interface SimulationInput {
  startingScore: number;
  monthlyRent: number;
  monthlyUtilities: number;
  backdatedRentMonths?: number;
  disputesPendingCount?: number;
  disputesResolvedCount?: number;
  creditUtilizationPercent?: number;
  profileSituation?: 'THIN_FILE' | 'REBUILDING' | 'ERRORS_ONLY' | 'OPTIMIZING';
}

/**
 * Calculates a month-by-month dual-action projection trajectory
 * comparing flat/monitoring status (+0) vs TrueBuild active positive reporting + FCRA dispute deletions
 */
export function calculateScoreProjection(params: SimulationInput): MonthlyScoreProjectionPoint[] {
  const {
    startingScore = 545,
    monthlyRent = 1450,
    monthlyUtilities = 240,
    backdatedRentMonths = 24,
    disputesPendingCount = 4,
    creditUtilizationPercent = 55,
    profileSituation = 'REBUILDING'
  } = params;

  // Multiplier adjustments based on situation
  const situationFactor = profileSituation === 'THIN_FILE'
    ? 1.25 // Thin files gain massive points from rent & utilities
    : profileSituation === 'ERRORS_ONLY'
    ? 1.15 // Dispute deletions create quick surges
    : profileSituation === 'OPTIMIZING'
    ? 0.85 // High starting score has smaller ceiling headroom
    : 1.0;

  // Calculate dynamic gains
  const rentLift = Math.round((backdatedRentMonths >= 12 ? 34 : 20) * (monthlyRent > 1200 ? 1.1 : 1.0) * situationFactor);
  const utilLift = Math.round((monthlyUtilities > 150 ? 18 : 12) * situationFactor);
  const disputeWave1Lift = Math.round(Math.min(disputesPendingCount * 9, 36) * situationFactor);
  const utilDropLift = creditUtilizationPercent > 30 ? Math.round(22 * situationFactor) : 10;
  const disputeWave2Lift = Math.round(24 * situationFactor);
  const matureTradelineLift = Math.round(28 * situationFactor);

  const points: MonthlyScoreProjectionPoint[] = [];

  // Month 0: Now
  points.push({
    month: 0,
    label: 'Now',
    baselineScore: startingScore,
    projectedScore: startingScore,
    scoreGain: 0,
    milestoneReached: 'Current Baseline',
    keyDrivers: ['Credit profile under initial FCRA forensic audit']
  });

  // Month 1: 24-Month Rent Injected
  const m1Score = Math.min(850, startingScore + rentLift);
  points.push({
    month: 1,
    label: 'Month 1',
    baselineScore: startingScore,
    projectedScore: m1Score,
    scoreGain: m1Score - startingScore,
    milestoneReached: m1Score >= 620 ? 'Fair Tier (620+)' : 'Seasoned History Established',
    keyDrivers: [
      `Up to ${backdatedRentMonths} consecutive on-time rent payments ($${monthlyRent.toLocaleString()}/mo) verified`,
      'Instant account age seasoning injected into Equifax, Experian & TransUnion'
    ]
  });

  // Month 2: Utility & Telecom Reporting Lands
  const m2Score = Math.min(850, m1Score + utilLift);
  points.push({
    month: 2,
    label: 'Month 2',
    baselineScore: startingScore + 1,
    projectedScore: m2Score,
    scoreGain: m2Score - startingScore,
    milestoneReached: m2Score >= 640 ? 'Moderate Credit Profile' : 'Multi-Tradeline Velocity',
    keyDrivers: [
      'Electric, Gas, Water & High-Speed Internet tradelines confirmed reporting',
      'Positive payment stream added without a single hard credit inquiry'
    ]
  });

  // Month 3: First Wave FCRA Dispute Deletions
  const m3Score = Math.min(850, m2Score + disputeWave1Lift);
  points.push({
    month: 3,
    label: 'Month 3',
    baselineScore: startingScore + 2,
    projectedScore: m3Score,
    scoreGain: m3Score - startingScore,
    milestoneReached: m3Score >= 660 ? 'Near-Prime Threshold' : 'Derogatory Tradelines Removed',
    keyDrivers: [
      '30-Day FCRA § 1681i statutory countdown expires on initial dispute batch',
      'Unverified collections & charge-offs permanently deleted across tri-bureau files'
    ]
  });

  // Month 4: Utilization Drop (AZEO) & Primary Builders
  const m4Score = Math.min(850, m3Score + utilDropLift);
  points.push({
    month: 4,
    label: 'Month 4',
    baselineScore: startingScore + 3,
    projectedScore: m4Score,
    scoreGain: m4Score - startingScore,
    milestoneReached: m4Score >= 680 ? 'Prime Borrower Tier (680+)' : 'Utilization Optimized',
    keyDrivers: [
      'Revolving balance optimization drops aggregate utilization below 28.9%',
      'Self / Kikoff installment builders report 4th clean monthly cycle'
    ]
  });

  // Month 5: Secondary Bureaus & Residual Corrections
  const m5Score = Math.min(850, m4Score + disputeWave2Lift);
  points.push({
    month: 5,
    label: 'Month 5',
    baselineScore: startingScore + 3,
    projectedScore: m5Score,
    scoreGain: m5Score - startingScore,
    milestoneReached: m5Score >= 700 ? 'Super-Prime Tier (700+)' : 'Tri-Bureau Parity Achieved',
    keyDrivers: [
      'CFPB / Intent-to-Sue escalation forces bureau compliance on stubborn tradelines',
      'Zero delinquent accounts remaining on Experian & Equifax files'
    ]
  });

  // Month 6: Full Maturation & Prime Commercial Eligibility
  const m6Score = Math.min(850, m5Score + matureTradelineLift);
  points.push({
    month: 6,
    label: 'Month 6',
    baselineScore: startingScore + 4,
    projectedScore: m6Score,
    scoreGain: m6Score - startingScore,
    milestoneReached: m6Score >= 720 ? 'Tier 4 Commercial & Mortgage Ready' : 'Prime Credit Standing',
    keyDrivers: [
      '6 consecutive months of multi-tradeline reporting + 24 months seasoned backdating',
      'Qualified for Tier 4 Unsecured Commercial Credit Lines ($50k+) and Prime Mortgage Rates'
    ]
  });

  return points;
}

// ============================================================================
// FICO 5-FACTOR DIAGNOSTIC ENGINE
// ============================================================================

export function calculateFactorDiagnostic(client: Client, tradelines: PositiveTradeline[]): CreditFactorDiagnostic {
  const scores = client.creditProfile.currentScores;
  const currentScore = scores.experian || scores.transunion || scores.equifax || 580;
  const negativeCount = client.creditProfile.negativeItems.length;
  const totalPositiveCount = tradelines.filter(t => t.status === 'REPORTING' || t.status === 'VERIFIED').length;
  const hasRent = tradelines.some(t => t.type === 'RENT');
  const utilization = client.creditProfile.currentUtilization || 48;

  // 1. Payment History (35%)
  const paymentScore = Math.min(100, Math.max(30, 85 - negativeCount * 12 + totalPositiveCount * 5));
  const paymentRating = paymentScore >= 85 ? 'EXCELLENT' : paymentScore >= 70 ? 'GOOD' : paymentScore >= 55 ? 'FAIR' : 'POOR';

  // 2. Credit Utilization (30%)
  const utilScore = Math.min(100, Math.max(25, 100 - utilization));
  const utilRating = utilScore >= 85 ? 'EXCELLENT' : utilScore >= 70 ? 'GOOD' : utilScore >= 50 ? 'FAIR' : 'POOR';

  // 3. Length of Credit History (15%)
  const ageScore = hasRent ? 82 : 55;
  const ageRating = ageScore >= 75 ? 'GOOD' : 'FAIR';

  // 4. Credit Mix (10%)
  const hasRevolving = client.creditProfile.debtAccounts.some(d => d.type === 'CREDIT_CARD');
  const hasInstallment = client.creditProfile.debtAccounts.some(d => d.type === 'AUTO' || d.type === 'PERSONAL_LOAN' || d.type === 'STUDENT');
  const mixScore = (hasRent ? 35 : 0) + (hasRevolving ? 35 : 15) + (hasInstallment ? 30 : 15);
  const mixRating = mixScore >= 80 ? 'EXCELLENT' : mixScore >= 60 ? 'GOOD' : 'FAIR';

  // 5. New Credit & Inquiries (10%)
  const inquiries = client.creditProfile.numberOfInquiries || 2;
  const newCreditScore = Math.max(30, 100 - inquiries * 15);
  const newCreditRating = newCreditScore >= 80 ? 'EXCELLENT' : newCreditScore >= 65 ? 'GOOD' : 'FAIR';

  return {
    paymentHistory: {
      name: 'Payment History',
      weight: 35,
      score: paymentScore,
      rating: paymentRating,
      detail: `${negativeCount} negative items reported vs. ${totalPositiveCount} verified positive tradelines reporting on-time marks.`,
      actionRecommendation: hasRent
        ? 'Maintain 24-month backdated rent ledger to counterbalance historical late items.'
        : 'Connect verified rent reporting immediately to add 24 positive monthly ticks.'
    },
    creditUtilization: {
      name: 'Credit Utilization (Amounts Owed)',
      weight: 30,
      score: utilScore,
      rating: utilRating,
      detail: `Current aggregate revolving utilization is ${utilization.toFixed(1)}%. Optimal threshold is under 9.9%.`,
      actionRecommendation: 'Deploy AZEO (All Zero Except One) strategy to target an immediate +25 to +40 point increase.'
    },
    accountAge: {
      name: 'Length of Credit History',
      weight: 15,
      score: ageScore,
      rating: ageRating,
      detail: hasRent
        ? '24-month backdated lease ledger provides instant 2-year account seasoning.'
        : 'Average account age is thin. Backdating rental tradelines will immediately boost average age.',
      actionRecommendation: 'Activate 24-month lease verification to instantly season your credit profile.'
    },
    creditMix: {
      name: 'Credit Mix',
      weight: 10,
      score: mixScore,
      rating: mixRating,
      detail: `Profile contains ${hasRevolving ? 'revolving cards' : 'no revolving cards'}, ${hasInstallment ? 'installment loans' : 'no installment loans'}, and ${totalPositiveCount} recurring utility/rent lines.`,
      actionRecommendation: 'Add an installment builder (Self or Credit Strong) to complete your multi-asset credit mix.'
    },
    newCredit: {
      name: 'New Credit & Hard Inquiries',
      weight: 10,
      score: newCreditScore,
      rating: newCreditRating,
      detail: `${inquiries} hard inquiries detected in the past 12 months.`,
      actionRecommendation: 'Use only no-hard-pull positive tradelines (Rent, Utilities, Kikoff) while disputes are active.'
    },
    overallScoreEstimate: currentScore
  };
}

// ============================================================================
// INITIALIZATION HELPER
// ============================================================================

export function initializePositiveReportingSuite(client: Client): PositiveReportingSuite {
  const startingScore = client.creditProfile.currentScores.experian
    || client.creditProfile.currentScores.transunion
    || client.creditProfile.currentScores.equifax
    || 545;

  // Rent Profile default
  const rentProfile: RentReportingProfile = {
    landlordName: 'Highland Ridge Residential Partners',
    propertyAddress: `${client.address || '1048 Ocean Breeze Blvd'}, ${client.city || 'Palm Bay'}, ${client.state || 'FL'} ${client.zip || '32905'}`,
    monthlyRent: 1450,
    leaseStartDate: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    verificationMethod: 'BANK_PLAID',
    backdatingRequested: true,
    backdatedMonths: 24,
    status: 'REPORTING',
    verifiedAt: new Date().toISOString()
  };

  // Seed default 4 positive tradelines (Rent, Electric, Internet, Mobile)
  const defaultTradelines: PositiveTradeline[] = [
    {
      id: uuidv4(),
      type: 'RENT',
      providerName: 'Highland Ridge Residential / Property Management',
      accountNumberMasked: '****4819',
      monthlyAmount: 1450,
      startDate: rentProfile.leaseStartDate,
      backdatedMonths: 24,
      reportingBureaus: ['Equifax', 'Experian', 'TransUnion'],
      status: 'REPORTING',
      lastReportedDate: new Date().toISOString().split('T')[0],
      onTimePaymentCount: 24,
      notes: '24 months retroactive rent verification confirmed via bank ledger.',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      type: 'ELECTRIC',
      providerName: 'Florida Power & Light (FPL) / Duke Energy',
      accountNumberMasked: '****7204',
      monthlyAmount: 115,
      startDate: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      backdatedMonths: 18,
      reportingBureaus: ['Equifax', 'TransUnion'],
      status: 'REPORTING',
      lastReportedDate: new Date().toISOString().split('T')[0],
      onTimePaymentCount: 18,
      notes: 'Primary residential electric utility with 18 consecutive on-time marks.',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      type: 'INTERNET',
      providerName: 'Comcast Xfinity / AT&T Fiber',
      accountNumberMasked: '****9931',
      monthlyAmount: 75,
      startDate: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      backdatedMonths: 24,
      reportingBureaus: ['Experian', 'TransUnion'],
      status: 'REPORTING',
      lastReportedDate: new Date().toISOString().split('T')[0],
      onTimePaymentCount: 24,
      notes: 'High-speed internet recurring bill; 24-month backdating verified.',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      type: 'MOBILE',
      providerName: 'Verizon Wireless / T-Mobile',
      accountNumberMasked: '****3852',
      monthlyAmount: 85,
      startDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      backdatedMonths: 12,
      reportingBureaus: ['Equifax', 'Experian'],
      status: 'REPORTING',
      lastReportedDate: new Date().toISOString().split('T')[0],
      onTimePaymentCount: 12,
      notes: 'Postpaid wireless telecom monthly reporting.',
      createdAt: new Date().toISOString()
    }
  ];

  const projection = calculateScoreProjection({
    startingScore,
    monthlyRent: rentProfile.monthlyRent,
    monthlyUtilities: 275,
    backdatedRentMonths: 24,
    disputesPendingCount: client.creditProfile.negativeItems.length || 4,
    creditUtilizationPercent: client.creditProfile.currentUtilization || 55,
    profileSituation: 'REBUILDING'
  });

  const factorDiagnostic = calculateFactorDiagnostic(client, defaultTradelines);

  const totalMonthlyReporting = defaultTradelines.reduce((acc, t) => acc + t.monthlyAmount, 0);
  const totalSeasoned = defaultTradelines.reduce((acc, t) => acc + t.backdatedMonths, 0);
  const projected6MonthGain = projection[projection.length - 1].scoreGain;

  return {
    tradelines: defaultTradelines,
    rentProfile,
    projection,
    factorDiagnostic,
    recommendedProducts: CREDIT_BUILDER_PRODUCTS,
    totalMonthlyReportingAmount: totalMonthlyReporting,
    totalSeasonedMonthsAdded: totalSeasoned,
    projected6MonthGain,
    updatedAt: new Date().toISOString()
  };
}
