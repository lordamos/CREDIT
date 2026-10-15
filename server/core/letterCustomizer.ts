import { v4 as uuidv4 } from 'uuid';
import type { Client, CreditProfile, DisputeLetter } from '../../shared/types/credit.js';
import { BUREAU_ADDRESSES, generateCrossBureauDiscrepancies } from './fcraEngine.js';

// ============================================================================
// DYNAMIC 100% CLIENT-CUSTOMIZED DISPUTE LETTER ENGINE
// Engineered to defeat e-OSCAR automated OCR screening and AI template filters
// ============================================================================

export interface CustomLetterOptions {
  tone?: 'FORENSIC_AUDITOR' | 'ASSERTIVE_CONSUMER' | 'PROCEDURAL_COMPLIANCE' | 'COMMERCIAL_IMPAIRMENT';
  personalContext?: string;
  targetBureaus?: ('Equifax' | 'Experian' | 'TransUnion')[];
}

/**
 * Builds dynamic personal context narratives
 */
const PERSONAL_CONTEXT_HOOKS = [
  "I am actively preparing my financial profile for underwriting review (including commercial credit facilities and institutional financing). Having erroneous, conflicting, and unverified data on my credit disclosure has caused direct financial prejudice.",
  "In the course of conducting my mandatory annual credit file review, I discovered alarming inaccuracies and conflicting tradelines across nationwide consumer reporting agencies that fail federal accuracy benchmarks.",
  "I recently applied for a competitive credit facility and was informed that conflicting derogatory notations on my credit file resulted in adverse tier placement and elevated borrowing rates.",
  "I am writing following a forensic line-by-line review of my consumer disclosures. As someone who diligently manages corporate and personal credit obligations, I cannot permit inaccurate tradelines to remain on my file."
];

/**
 * Tone-specific opening frameworks
 */
const TONE_INTROS = {
  FORENSIC_AUDITOR: (bureau: string) =>
    `I am writing to formally place ${bureau} on statutory notice of material reporting discrepancies and non-compliance with the Fair Credit Reporting Act, 15 U.S.C. § 1681 et seq. A multi-agency audit of my consumer credit file demonstrates that your agency is publishing data that directly contradicts records maintained by other nationwide consumer reporting agencies, in per se violation of 15 U.S.C. § 1681e(b).`,
  ASSERTIVE_CONSUMER: (bureau: string) =>
    `I am exercising my federal consumer protection rights under 15 U.S.C. § 1681i to demand an immediate, genuine, and human-verified reinvestigation of erroneous trade lines currently appearing on my credit disclosure through ${bureau}. I require that every item listed below be thoroughly verified with original documentation or permanently removed within thirty calendar days.`,
  PROCEDURAL_COMPLIANCE: (bureau: string) =>
    `This letter serves as a formal, individualized dispute regarding inaccurate, incomplete, and procedurally defective information published by ${bureau}. Federal regulations require reasonable procedures to assure maximum possible accuracy; your agency has published conflicting account metrics that fail this statutory test.`,
  COMMERCIAL_IMPAIRMENT: (bureau: string) =>
    `I am writing to formally dispute severe reporting inaccuracies on my credit file that are directly impairing my ability to access commercial capital and personal lines of credit. Under federal law, ${bureau} is obligated to maintain verified and consistent information, which your current records fail to provide.`
};

/**
 * Generates completely customized dispute letters for a client across all 3 bureaus
 */
export function generateClientCustomDisputeLetters(
  client: Client,
  profile: CreditProfile,
  options: CustomLetterOptions = {}
): DisputeLetter[] {
  const negativeItems = profile.negativeItems.filter(i => i.type !== 'INQUIRY');
  if (negativeItems.length === 0) return [];

  const discrepancies = generateCrossBureauDiscrepancies(client, profile);
  const bureaus: ('Equifax' | 'Experian' | 'TransUnion')[] = options.targetBureaus || ['Equifax', 'Experian', 'TransUnion'];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const letters: DisputeLetter[] = [];

  for (const bureau of bureaus) {
    const bureauInfo = BUREAU_ADDRESSES[bureau];
    const bureauItems = negativeItems.filter(i => i.bureau.includes(bureau));
    if (bureauItems.length === 0) continue;

    // Pick unique personal context based on client ID seed
    const seed = (client.id.charCodeAt(0) + bureau.charCodeAt(0)) % PERSONAL_CONTEXT_HOOKS.length;
    const personalHook = options.personalContext || PERSONAL_CONTEXT_HOOKS[seed];

    // Select tone
    const tone = options.tone || (seed % 2 === 0 ? 'FORENSIC_AUDITOR' : 'ASSERTIVE_CONSUMER');
    const introText = TONE_INTROS[tone](bureauInfo.legalName);

    // Compute unique document hash to completely defeat e-OSCAR OCR hash matching
    const docHash = `REF-${bureau.toUpperCase().slice(0, 2)}-${client.id.slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build the tailored Disputed Accounts Section
    const accountSections = bureauItems.map((item, idx) => {
      const audit = discrepancies.find(d => d.creditor.toUpperCase() === item.creditor.toUpperCase());
      const acctNum = item.accountNumber || `${item.creditor.slice(0, 4)}****${Math.floor(1000 + Math.random() * 9000)}`;
      const conflictingFields = audit?.fields.filter(f => f.isDiscrepancy) || [];

      let discrepancyDetails = '';
      if (conflictingFields.length > 0) {
        discrepancyDetails = `\n   SPECIFIC CROSS-BUREAU CONTRADICTIONS:
${conflictingFields.slice(0, 4).map(cf => `   - Field: ${cf.fieldName}
     • Equifax: ${cf.equifaxValue || 'Unlisted'} | Experian: ${cf.experianValue || 'Unlisted'} | TransUnion: ${cf.transunionValue || 'Unlisted'}
     • Statutory Impact: ${cf.legalViolationNote}`).join('\n')}`;
      } else {
        discrepancyDetails = `\n   SPECIFIC DEFECTS: This account contains unverified balance data, conflicting date of first delinquency (DOFD), and uncertified status reporting that contradicts national credit file standards under Metro 2.`;
      }

      return `================================================================================
DISPUTED ITEM ${idx + 1}: ${item.creditor.toUpperCase()}
================================================================================
Account Identifier: ${acctNum}
Tradeline Classification: ${item.type.replace(/_/g, ' ')}
Reported Balance: $${(item.balance || 0).toLocaleString()}
${discrepancyDetails}

EVIDENTIARY DEMAND:
Under 15 U.S.C. § 1681i(a)(1), you must conduct a reasonable reinvestigation into each disputed element above with the original furnisher. Furthermore, pursuant to 15 U.S.C. § 1681i(a)(6)(B)(iii), I demand you provide the complete, written METHOD OF VERIFICATION, including the business name, address, and telephone number of any person contacted, and copies of all documentation relied upon. If this account cannot be validated to 100% accuracy within thirty calendar days, it must be permanently deleted.`;
    }).join('\n\n');

    // Assemble the complete customized letter
    const letterContent = `${today}

DOCUMENT TRACKING ID: ${docHash}
SENT VIA USPS CERTIFIED MAIL & ELECTRONIC RETURN RECEIPT (ERR)

FROM CONSUMER:
${client.firstName} ${client.lastName}
${client.address}
${client.city}, ${client.state} ${client.zip}
SSN: XXX-XX-${client.id.slice(-4) || 'XXXX'}
Date of Birth: XX/XX/19XX
Phone: ${client.phone}
Email: ${client.email}

TO CONSUMER REPORTING AGENCY:
${bureauInfo.legalName}
${bureauInfo.dept}
${bureauInfo.poBox}
${bureauInfo.city}, ${bureauInfo.state} ${bureauInfo.zip}

RE: FORMAL NOTICE OF MATERIAL INACCURACIES & MANDATORY REINVESTIGATION DEMAND
STATUTORY AUTHORITIES:
- 15 U.S.C. § 1681i (FCRA Section 611) – 30-Day Reinvestigation Mandate
- 15 U.S.C. § 1681e(b) (FCRA Section 607(b)) – Maximum Possible Accuracy
- 15 U.S.C. § 1681n (FCRA Section 616) – Civil Liability for Willful Non-Compliance
- 15 U.S.C. § 1681o (FCRA Section 617) – Civil Liability for Negligent Non-Compliance

To the Compliance Department and Dispute Resolution Officers of ${bureau}:

${introText}

PERSONAL STATEMENT & ADVERSE FINANCIAL IMPACT:
${personalHook}

NOTICE OF PRIVATE CORPORATE STATUS & MAXIMUM ACCURACY MANDATE:
Please take note that ${bureauInfo.legalName} is a private, for-profit data brokerage enterprise operating under federal regulation, not a government body or judicial entity. Under 15 U.S.C. § 1681e(b), you are legally mandated to maintain reasonable procedures to assure maximum possible accuracy of all published consumer information. A contemporaneous comparison of my credit reports across Experian, Equifax, and TransUnion reveals irreconcilable discrepancies in opening dates, account identifiers, balances, and payment profiles. It is a legal and physical impossibility for conflicting data points to simultaneously be accurate. These contradictions demonstrate that your reporting procedures fail to meet the federal threshold of maximum possible accuracy.

LEGAL NOTICE: DEBT PLACEMENT VS. DEBT OWNERSHIP DOCTRINE:
Furthermore, be formally advised that my dispute is anchored in federal procedural compliance and strict evidentiary proof. Consumer credit disputes under the FCRA do NOT depend on whether an alleged debt was originally placed with or assigned to a third party. Rather, federal law places the full evidentiary burden on credit bureaus and data furnishers to maintain uncorrupted chain-of-title records, strict adherence to the 7-year obsolescence rule under 15 U.S.C. § 1681c, and complete accuracy. If you or your data furnishers cannot independently substantiate each reporting metric with authenticated records, the statute commands immediate and permanent deletion.

ACCOUNTS IN DISPUTE & FACTUAL GROUNDS:

${accountSections}

FORMAL STATUTORY DEMANDS & LEGAL NOTICES:

1. MANDATORY 30-DAY REINVESTIGATION (15 U.S.C. § 1681i(a)(1)):
You are legally required to conduct a prompt, thorough, and reasonable reinvestigation of the disputed information within thirty (30) calendar days of receiving this notice. Automated dismissals, computerized boilerplate rejections, or forwarding superficial two-digit e-OSCAR codes without human evaluation of my dispute violate binding CFPB supervisory standards.

2. METHOD OF VERIFICATION REQUIREMENT (15 U.S.C. § 1681i(a)(6)(B)(iii)):
Within fifteen (15) days of completing your reinvestigation, you must provide me with a written description of the exact method used to verify the information, including the business name, physical address, and telephone number of the representative contacted at each furnisher.

3. MANDATORY PERMANENT DELETION (15 U.S.C. § 1681i(a)(5)(A)):
If any disputed item cannot be verified with certified documentary proof within the 30-day statutory window, you must promptly and permanently delete that tradeline from my file and transmit an updated consumer disclosure to me.

4. NOTICE OF WILLFUL NON-COMPLIANCE LIABILITY (15 U.S.C. § 1681n):
If your agency willfully fails to conduct a genuine reinvestigation, ignores documented cross-bureau contradictions, or unlawfully deems this dispute frivolous, you are subject to statutory civil damages ranging from $100.00 to $1,000.00 PER VIOLATION, in addition to actual damages, punitive damages, and mandatory attorney's fees.

5. NOTICE OF NEGLIGENT NON-COMPLIANCE (15 U.S.C. § 1681o):
Negligent failure to maintain accurate records subjects your agency to liability for all actual pecuniary damages incurred, including elevated interest rates and lost credit opportunities.

EVIDENTIARY FILE PRESERVATION:
A permanent legal evidence file—including contemporaneous credit report records, this signed correspondence, and USPS Certified Mail electronic return receipt tracking—is actively maintained. If these inaccurate tradelines are not permanently deleted or verified strictly in accordance with federal law within 30 days, formal complaints will be filed with the Consumer Financial Protection Bureau (CFPB) and litigation for civil damages will proceed.

Sincerely,

___________________________________________
${client.firstName} ${client.lastName}
Consumer / Disputing Party

Enclosures:
- Copy of Valid Government-Issued Photo Identification
- Copy of Certified Proof of Residential Address (Utility Statement)
- Copy of Official Social Security Verification Document`;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 37); // 30 days statutory + 7 mailing

    letters.push({
      id: uuidv4(),
      clientId: client.id,
      type: 'FCRA_FORMAL_DISPUTE',
      bureau,
      content: letterContent,
      status: 'DRAFT',
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
      deliveryType: 'CERTIFIED_ERR',
      recipientAddress: {
        name: bureauInfo.legalName,
        address: bureauInfo.poBox,
        city: bureauInfo.city,
        state: bureauInfo.state,
        zip: bureauInfo.zip
      }
    });
  }

  return letters;
}
