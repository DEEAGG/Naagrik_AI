import type { AnalysisResult, ComplaintDraft, IssueCategory, LocationData } from '../types';
import { resolveLocationPriority } from './locationService';
import { resolveCivicAuthority } from './civicRoutingService';
import { getAuthorityPortal } from '../data/authorityPortals';

export interface AnalyzeInput {
  text: string;
  evidenceCount?: number;
  userLocation?: string;
  userLocationData?: LocationData;
  contextChoice?: string;
}

export interface AIProvider {
  name: string;
  analyze(input: AnalyzeInput): Promise<AnalysisResult>;
}

export interface AuthorityInfo {
  authority: string;
  website: string;
  confidence: number;
}

export interface AuthorityResolver {
  name: string;
  resolve(category: string, issue: string, location?: string, authorityKey?: string): AuthorityInfo;
}

/**
 * Model normalization helper to ensure currently supported Gemini API model.
 */
export function normalizeGeminiModel(model?: string): string {
  if (!model || typeof model !== 'string') return 'gemini-3.6-flash';
  const trimmed = model.trim().toLowerCase();

  // Map obsolete or invalid versions to currently supported model
  if (trimmed.includes('2.0') || trimmed.includes('3.5')) {
    return 'gemini-3.6-flash';
  }
  return trimmed;
}

/**
 * Centralized Government Authority & Verified Official Website Repository.
 */
export class FallbackAuthorityResolver implements AuthorityResolver {
  name = 'Verified Authority & Government Portal Resolver';

  resolve(category: string, issue: string, location?: string, authorityKey?: string): AuthorityInfo {
    const keyLower = (authorityKey || '').toLowerCase();
    const categoryLower = (category || '').toLowerCase();
    const issueLower = (issue || '').toLowerCase();
    const textLower = (categoryLower + ' ' + issueLower + ' ' + (location || '')).toLowerCase();

    // Direct authorityKey Mapping
    if (keyLower === 'djb' || keyLower === 'water') {
      return {
        authority: 'Delhi Jal Board (DJB)',
        website: 'https://delhijalboard.delhi.gov.in/',
        confidence: 0.95,
      };
    }
    if (keyLower === 'mcd') {
      return {
        authority: 'Municipal Corporation of Delhi (MCD)',
        website: 'https://mcdonline.nic.in/',
        confidence: 0.95,
      };
    }
    if (keyLower === 'pwd') {
      return {
        authority: 'Public Works Department (PWD) Delhi',
        website: 'https://pwd.delhigovt.nic.in/',
        confidence: 0.9,
      };
    }
    if (keyLower === 'bses') {
      return {
        authority: 'BSES Yamuna / Rajdhani Power Limited',
        website: 'https://www.bsesdelhi.com/',
        confidence: 0.95,
      };
    }
    if (keyLower === 'traffic_police') {
      return {
        authority: 'Delhi Traffic Police',
        website: 'https://traffic.delhipolice.gov.in/',
        confidence: 0.95,
      };
    }
    if (keyLower === 'dda') {
      return {
        authority: 'Horticulture Department / DDA',
        website: 'https://dda.gov.in/',
        confidence: 0.9,
      };
    }
    if (keyLower === 'nhai') {
      return {
        authority: 'National Highways Authority of India (NHAI)',
        website: 'https://nhai.gov.in/',
        confidence: 0.95,
      };
    }

    // 1. Electricity / Power Infrastructure
    if (
      categoryLower.includes('electricity') ||
      textLower.includes('bijli') ||
      textLower.includes('power') ||
      textLower.includes('transformer') ||
      textLower.includes('pole')
    ) {
      return {
        authority: 'BSES Yamuna / Rajdhani Power Limited',
        website: 'https://www.bsesdelhi.com/',
        confidence: 0.9,
      };
    }

    // 2. Water / Sewer / Drainage Infrastructure
    if (
      categoryLower.includes('water') ||
      categoryLower.includes('drainage') ||
      categoryLower.includes('sewer') ||
      issueLower.includes('sewer') ||
      issueLower.includes('drain') ||
      issueLower.includes('water supply') ||
      issueLower.includes('water leakage') ||
      issueLower.includes('discolored') ||
      textLower.includes('pani ganda') ||
      textLower.includes('paani ganda')
    ) {
      return {
        authority: 'Delhi Jal Board (DJB)',
        website: 'https://delhijalboard.delhi.gov.in/',
        confidence: 0.95,
      };
    }

    // 3. National Highways
    if (categoryLower.includes('highway') || textLower.includes('expressway') || textLower.includes('nhai')) {
      return {
        authority: 'National Highways Authority of India (NHAI)',
        website: 'https://nhai.gov.in/',
        confidence: 0.9,
      };
    }

    // 4. Roads / PWD
    if (
      categoryLower.includes('road') ||
      issueLower.includes('pothole') ||
      issueLower.includes('road damage') ||
      textLower.includes('sadak') ||
      textLower.includes('footpath') ||
      textLower.includes('pavement')
    ) {
      return {
        authority: 'Public Works Department (PWD) Delhi',
        website: 'https://pwd.delhigovt.nic.in/',
        confidence: 0.85,
      };
    }

    // 5. Traffic & Transport
    if (categoryLower.includes('traffic') || issueLower.includes('traffic signal') || textLower.includes('signal jam')) {
      return {
        authority: 'Delhi Traffic Police',
        website: 'https://traffic.delhipolice.gov.in/',
        confidence: 0.9,
      };
    }

    // 6. Parks / Horticulture / Public Infrastructure
    if (
      categoryLower.includes('park') ||
      categoryLower.includes('infrastructure') ||
      issueLower.includes('park') ||
      issueLower.includes('gate') ||
      textLower.includes('garden') ||
      textLower.includes('horticulture')
    ) {
      return {
        authority: 'Horticulture Department / DDA',
        website: 'https://dda.gov.in/',
        confidence: 0.85,
      };
    }

    // 7. Sanitation / MCD / Animal Services
    if (
      categoryLower.includes('sanitation') ||
      categoryLower.includes('animal') ||
      categoryLower.includes('encroachment') ||
      categoryLower.includes('noise') ||
      textLower.includes('garbage') ||
      textLower.includes('kachra') ||
      textLower.includes('kuda') ||
      textLower.includes('dead animal') ||
      textLower.includes('carcass') ||
      textLower.includes('horn')
    ) {
      return {
        authority: 'Municipal Corporation of Delhi (MCD)',
        website: 'https://mcdonline.nic.in/',
        confidence: 0.95,
      };
    }

    return {
      authority: 'Municipal Corporation of Delhi (MCD)',
      website: 'https://mcdonline.nic.in/',
      confidence: 0.7,
    };
  }
}

/**
 * Sanitizer Pass: Replaces residual Hinglish/raw Hindi leaks and removes generic filler lines.
 */
export function sanitizeHinglishLeaks(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/\b4\s*din\b/gi, 'four consecutive days')
    .replace(/\bchaar\s*din\b/gi, 'four consecutive days')
    .replace(/\bteen\s*din\b/gi, 'three days')
    .replace(/\b(\d+)\s*din\b/gi, '$1 days')
    .replace(/\bmar gya|mar gaya\b/gi, 'deceased animal')
    .replace(/\bpaani peela|pani peela\b/gi, 'discolored water supply')
    .replace(/\bpaani ganda|pani ganda\b/gi, 'discolored / contaminated water supply')
    .replace(/\b(kooda|kuda)\b/gi, 'garbage')
    .replace(/\bbadbu\b/gi, 'foul odor')
    .replace(/\bgali\b/gi, 'street')
    .replace(/\bwaha\b/gi, 'locality')
    .replace(/\bgandagi\b/gi, 'unsanitary conditions')
    .replace(/\b(gaddha|gadda)\b/gi, 'pothole')
    .replace(/\bmachhar\b/gi, 'mosquitoes')
    .replace(/\bkachra\b/gi, 'garbage')
    .replace(/\bbijli\b/gi, 'electricity')
    .replace(/\b(paani|pani)\b/gi, 'water')
    .replace(/\bnali|naali\b/gi, 'drain')
    .replace(/\bsadak\b/gi, 'road')
    .replace(/\bbaarish\b/gi, 'rain')
    .replace(/\btotedha|tedha\b/gi, 'tilted')
    .replace(/\bsafai\b/gi, 'sanitation')
    .replace(/\bsubah\b/gi, 'morning')
    .replace(/\braat\b/gi, 'night')
    .replace(/\bsamaan\b/gi, 'goods')
    .replace(/\bdukaan|dukandar\b/gi, 'shopkeepers')
    .replace(/\bkala\b/gi, 'dark')
    .replace(/\bdoob\b/gi, 'waterlogged')
    .replace(/\bsaamne\b/gi, 'outside')
    .replace(/\bawaaz|awaz\b/gi, 'noise')
    .replace(/^Civic issue reported by (local )?resident:\s*/gi, '')
    .replace(/^User reported:\s*/gi, '')
    .replace(/^The resident said:\s*/gi, '')
    .replace(/^Civic issue reported:\s*/gi, '')
    .trim();

  return cleaned;
}

/**
 * Formal Complaint Letter Formatter
 */
export function generateOfficialComplaintLetter(payload: {
  authority: string;
  issueTitle: string;
  location: string;
  description: string;
}): string {
  const sanitizedDesc = sanitizeHinglishLeaks(payload.description);
  const loc = (payload.location || '').trim();
  const isValidLoc =
    loc.length > 0 &&
    loc !== 'Location Not Specified' &&
    loc !== 'Not specified (Optional)' &&
    loc !== 'unspecified';

  const locationText = isValidLoc ? loc : 'Location required before submission.';

  return `To,
The Concerned Officer,
${payload.authority}

Subject: ${payload.issueTitle}

Location:
${locationText}

Respected Sir/Madam,

${sanitizedDesc}

Kindly arrange an inspection and necessary action at the earliest to resolve this matter for local residents.

Regards,
Naagrik AI Citizen Complaint`;
}

/**
 * Combined Formal Complaint Letter Formatter
 */
export function generateCombinedComplaintLetter(
  drafts: ComplaintDraft[],
  location: string
): string {
  const loc = (location || '').trim();
  const isValidLoc =
    loc.length > 0 &&
    loc !== 'Location Not Specified' &&
    loc !== 'Not specified (Optional)' &&
    loc !== 'unspecified';

  const locationText = isValidLoc ? loc : 'Location required before submission.';

  const itemized = drafts
    .map(
      (d, idx) =>
        `${idx + 1}. ${d.title} (${d.category} — Responsible Authority: ${d.authority}):\n${sanitizeHinglishLeaks(d.description)}`
    )
    .join('\n\n');

  return `To,
The Concerned Municipal Authorities

Subject: Multiple Civic Issues Requiring Immediate Attention

Location:
${locationText}

Respected Sir/Madam,

The following civic issues have been observed at the reported location:

${itemized}

The concerned authorities are requested to inspect these issues and take appropriate corrective action at the earliest.

Regards,
Naagrik AI Citizen Complaint`;
}

/**
 * Reusable Grouping Utility by Authority
 */
export function groupIssuesByAuthority(drafts: ComplaintDraft[]) {
  const map = new Map<string, { authority: string; authorityWebsite?: string; drafts: ComplaintDraft[] }>();

  drafts.forEach((d) => {
    const key = d.authority || 'Local Authority';
    if (!map.has(key)) {
      map.set(key, {
        authority: key,
        authorityWebsite: d.authorityWebsite,
        drafts: [d],
      });
    } else {
      map.get(key)!.drafts.push(d);
    }
  });

  return Array.from(map.values());
}

/**
 * Deterministic Fallback AI Engine with Object-First Reasoning.
 */
export class FallbackAIProvider implements AIProvider {
  name = 'Semantic Natural Language Engine (Fallback)';
  private authorityResolver: AuthorityResolver;

  constructor(authorityResolver?: AuthorityResolver) {
    this.authorityResolver = authorityResolver || new FallbackAuthorityResolver();
  }

  async analyze(input: AnalyzeInput): Promise<AnalysisResult> {
    const rawText = input.text.trim();
    const lower = rawText.toLowerCase();

    // 1. Multi-issue Detection
    const multiIssueMatches = this.detectMultipleIssues(rawText);
    if (multiIssueMatches && multiIssueMatches.length > 1) {
      return {
        issueTitle: 'Multiple civic issues detected',
        issue: 'Multiple civic issues detected',
        category: 'Multiple Issues',
        authority: 'Various Responsible Authorities',
        authorityWebsite: 'https://mcdonline.nic.in/',
        location: input.userLocation || 'Location Not Specified',
        locationData: input.userLocationData,
        description: 'Multiple distinct civic issues identified in user submission.',
        complaintLetter: generateCombinedComplaintLetter(multiIssueMatches, input.userLocation || 'Location Not Specified'),
        status: 'multi_issue',
        isSufficient: false,
        needsClarification: true,
        multiIssueDetected: true,
        detectedIssues: multiIssueMatches,
        clarificationQuestion: `I noticed you described ${multiIssueMatches.length} separate problems. How would you like to handle them?`,
        suggestedOptions: [
          `Create ${multiIssueMatches.length} separate complaints`,
          'Combine into single report',
          'Let me edit the text',
        ],
        confidence: 'high',
        providerUsed: this.name,
      };
    }

    // 2. Strict Location Isolation: Location comes ONLY from user input / GPS / manual selection
    let activeLocationData: LocationData;
    if (
      input.userLocationData &&
      input.userLocationData.source !== 'unspecified' &&
      input.userLocationData.address &&
      input.userLocationData.address !== 'Location Not Specified' &&
      input.userLocationData.address !== 'Not specified (Optional)'
    ) {
      activeLocationData = input.userLocationData;
    } else if (
      input.userLocation &&
      input.userLocation !== 'Location Not Specified' &&
      input.userLocation !== 'Not specified (Optional)' &&
      input.userLocation.trim().length > 0
    ) {
      activeLocationData = {
        address: input.userLocation.trim(),
        source: 'manual',
      };
    } else {
      activeLocationData = {
        address: 'Location Not Specified',
        source: 'unspecified',
      };
    }

    // 3. Object-First Semantic Intent Interpretation
    const parsed = this.parseProblem(rawText, lower);
    const sanitizedDesc = sanitizeHinglishLeaks(parsed.professionalDescription);

    // 4. Ambiguity / Clarification Check
    if (parsed.isAmbiguous) {
      return {
        issueTitle: parsed.issueTitle,
        issue: parsed.issueTitle,
        category: parsed.category,
        authority: '',
        location: activeLocationData.address,
        locationData: activeLocationData,
        description: sanitizedDesc,
        status: 'needs_clarification',
        isSufficient: false,
        needsClarification: true,
        clarificationQuestion: parsed.clarificationQuestion,
        suggestedOptions: parsed.suggestedOptions,
        confidence: 'low',
        providerUsed: this.name,
      };
    }

    // 5. Verified Civic Routing Determination
    const routingResult = resolveCivicAuthority({
      issueTitle: parsed.issueTitle,
      category: parsed.category,
      description: sanitizedDesc,
      rawText: rawText,
      authorityKey: parsed.authorityKey,
    });

    const portal = getAuthorityPortal(routingResult.authorityKey);
    const resolvedCategory = (routingResult.category || parsed.category) as IssueCategory;
    const isLocationMissing = activeLocationData.source === 'unspecified' || activeLocationData.address === 'Location Not Specified';
    const needsClarification = routingResult.needsConfirmation;

    const letter = generateOfficialComplaintLetter({
      authority: routingResult.authorityName,
      issueTitle: parsed.issueTitle,
      location: activeLocationData.address,
      description: sanitizedDesc,
    });

    return {
      issueTitle: parsed.issueTitle,
      issue: parsed.issueTitle,
      category: resolvedCategory,
      subcategory: parsed.subcategory,
      authority: routingResult.authorityName,
      authorityKey: routingResult.authorityKey,
      authorityWebsite: portal.complaintUrl,
      location: activeLocationData.address,
      locationData: activeLocationData,
      description: sanitizedDesc,
      complaintLetter: letter,
      status: needsClarification ? 'needs_clarification' : 'sufficient',
      isSufficient: !needsClarification,
      needsClarification: needsClarification,
      isOptionalEnhancement: isLocationMissing,
      missingOptionalDetails: isLocationMissing ? ['Locality / Address', 'Nearby Landmark'] : [],
      clarificationQuestion: needsClarification ? routingResult.explanation : undefined,
      suggestedOptions: needsClarification && routingResult.suggestedAuthorities
        ? routingResult.suggestedAuthorities.map((a) => a.name)
        : isLocationMissing
        ? ['Use my current location', 'Enter location manually', 'Choose saved location']
        : undefined,
      confidence: routingResult.confidence,
      providerUsed: this.name,
      routingExplanation: routingResult.explanation,
      isVerifiedRouting: routingResult.isVerifiedRouting,
      matchedRuleId: routingResult.matchedRule,
      suggestedAuthorities: routingResult.suggestedAuthorities,
    };
  }

  private detectMultipleIssues(text: string): ComplaintDraft[] | null {
    const lower = text.toLowerCase();
    const hasConjunction = lower.includes(' and ') || lower.includes(' & ') || lower.includes(' as well as ') || lower.includes(' aur ') || lower.includes(', ');

    if (!hasConjunction) return null;

    const parts = text.split(/\s*(?:and|&|aur|as well as|,)\s*/i).map((p) => p.trim()).filter((p) => p.length > 8);
    if (parts.length < 2) return null;

    const drafts: ComplaintDraft[] = parts.map((part, idx) => {
      const parsed = this.parseProblem(part, part.toLowerCase());
      const sanitizedDesc = sanitizeHinglishLeaks(parsed.professionalDescription);
      const routing = resolveCivicAuthority({
        issueTitle: parsed.issueTitle,
        category: parsed.category,
        description: sanitizedDesc,
        rawText: part,
        authorityKey: parsed.authorityKey,
      });
      const portal = getAuthorityPortal(routing.authorityKey);
      return {
        id: `draft-${idx + 1}`,
        title: parsed.issueTitle,
        description: sanitizedDesc,
        complaintLetter: generateOfficialComplaintLetter({
          authority: routing.authorityName,
          issueTitle: parsed.issueTitle,
          location: 'Location Not Specified',
          description: sanitizedDesc,
        }),
        category: routing.category || parsed.category,
        authority: routing.authorityName,
        authorityWebsite: portal.complaintUrl,
        location: 'Location Not Specified',
      };
    });

    return drafts;
  }

  private parseProblem(text: string, lower: string): {
    category: IssueCategory;
    subcategory?: string;
    issueTitle: string;
    professionalDescription: string;
    authorityKey?: string;
    isAmbiguous: boolean;
    clarificationQuestion?: string;
    suggestedOptions?: string[];
  } {
    // Extract duration facts
    const durationMatch = text.match(/(\d+|\b(one|two|three|four|five|six|seven|chaar|teen)\b)\s*(din|day|days|raat|hours|hour)/i);
    let durationFact = '';
    if (durationMatch) {
      const rawDur = durationMatch[0].toLowerCase();
      if (rawDur.includes('chaar') || rawDur.includes('4')) durationFact = ' for four consecutive days';
      else if (rawDur.includes('teen') || rawDur.includes('3')) durationFact = ' for three days';
      else durationFact = ` for ${durationMatch[0].replace(/din/gi, 'days')}`;
    }

    // 1. Water Vague Input
    if (lower === 'water' || lower === 'problem with water' || lower === 'water problem' || lower === 'paani ki problem' || lower === 'paani problem' || lower === 'paani ka issue hai' || lower === 'water problem hai' || lower === 'problem hai') {
      return {
        category: 'Water',
        authorityKey: 'djb',
        issueTitle: 'Water Supply Issue',
        professionalDescription: 'A water supply issue has been reported in the locality requiring inspection from the municipal water board.',
        isAmbiguous: true,
        clarificationQuestion: 'What kind of water problem are you experiencing?',
        suggestedOptions: [
          'No water supply',
          'Dirty / discolored water',
          'Water leakage / Pipeline burst',
          'Low water pressure',
        ],
      };
    }

    // 2. Light Vague Input (Electricity vs Streetlight)
    if (lower === 'light' || lower === 'light problem' || lower === 'problem with light' || lower === 'light ka problem hai') {
      return {
        category: 'Electricity',
        authorityKey: 'bses',
        issueTitle: 'Light / Power Issue',
        professionalDescription: 'A lighting or electricity supply problem has been reported in the area.',
        isAmbiguous: true,
        clarificationQuestion: 'What kind of lighting or power problem are you experiencing?',
        suggestedOptions: [
          'Power outage / Electricity failure',
          'Streetlight not working',
          'Frequent power cuts / Voltage issue',
          'Transformer issue',
        ],
      };
    }

    // 3. Contaminated / Discolored / Dirty Tap Water (High Priority Rule)
    if (
      lower.includes('pani ganda') ||
      lower.includes('paani ganda') ||
      lower.includes('ganda pani') ||
      lower.includes('ganda paani') ||
      lower.includes('paani peela') ||
      lower.includes('dirty water') ||
      lower.includes('contaminated water') ||
      lower.includes('brown') ||
      lower.includes('kala paani')
    ) {
      return {
        category: 'Water',
        authorityKey: 'djb',
        issueTitle: 'Discolored / Contaminated Water Supply',
        professionalDescription: 'The tap water supply is reported to be discolored or contaminated with odor. Urgent water testing and pipeline inspection is requested from the Delhi Jal Board.',
        isAmbiguous: false,
      };
    }

    // 4. OBJECT = Vehicle Horn / Noise Disturbance
    if (lower.includes('horn') || lower.includes('awaaz') || lower.includes('awaz') || lower.includes('noise') || lower.includes('loudspeaker')) {
      return {
        category: 'Noise Pollution',
        authorityKey: 'mcd',
        issueTitle: 'Excessive Vehicle Horn Noise',
        professionalDescription: 'Excessive vehicle horn noise is occurring near the residence every morning, causing significant noise disturbance to local residents. Inspection and appropriate noise abatement measures are requested.',
        isAmbiguous: false,
      };
    }

    // 5. OBJECT = Park Gate / Park Bench / Park Infrastructure
    if (lower.includes('park') && (lower.includes('gate') || lower.includes('bench') || lower.includes('boundary') || lower.includes('toot') || lower.includes('wall'))) {
      return {
        category: 'Public Infrastructure',
        authorityKey: 'dda',
        issueTitle: 'Damaged Park Gate',
        professionalDescription: 'The gate of the public park in the reported locality is damaged and broken, creating an open hazard and safety risk for park visitors. Inspection and prompt repair work by the horticulture/municipal infrastructure division is requested.',
        isAmbiguous: false,
      };
    }

    // 6. OBJECT = Footpath Encroachment / Shopkeepers
    if (lower.includes('stall') || lower.includes('encroachment') || lower.includes('illegal shop') || lower.includes('footpath') || lower.includes('dukandar') || lower.includes('samaan')) {
      return {
        category: 'Encroachment',
        authorityKey: 'mcd',
        issueTitle: 'Illegal Footpath Encroachment',
        professionalDescription: 'Commercial encroachments and unauthorized structures have blocked the public footpath, restricting pedestrian movement. Prompt anti-encroachment clearing and enforcement by municipal authorities is requested.',
        isAmbiguous: false,
      };
    }

    // 7. OBJECT = Park Garbage / Sanitation
    if (lower.includes('park') && (lower.includes('kachra') || lower.includes('kuda') || lower.includes('safai'))) {
      return {
        category: 'Sanitation',
        authorityKey: 'dda',
        issueTitle: 'Park Garbage & Sanitation Failure',
        professionalDescription: 'Garbage and uncleaned waste have accumulated inside the public park area due to lack of regular sanitation services. The horticulture and municipal sanitation department is requested to arrange thorough cleaning and maintenance.',
        isAmbiguous: false,
      };
    }

    // 8. OBJECT = Road Surface / Pothole
    if (lower.includes('sadak toot') || lower.includes('road toot') || lower.includes('road damaged') || lower.includes('broken road') || lower.includes('gadda') || lower.includes('gaddha') || lower.includes('pothole') || lower.includes('baarish') || lower.includes('waterlogging') || lower.includes('doob')) {
      return {
        category: 'Roads',
        authorityKey: 'pwd',
        issueTitle: 'Pothole / Road Damage',
        professionalDescription: 'The road surface has broken and damaged, causing severe waterlogging during rain and impairing traffic flow. Inspection, drain clearance, and resurfacing is requested from the public works department.',
        isAmbiguous: false,
      };
    }

    // 9. OBJECT = Mosquito Infestation
    if (lower.includes('machhar') || lower.includes('mosquito')) {
      return {
        category: 'Public Health',
        authorityKey: 'mcd',
        issueTitle: 'Mosquito Infestation / Vector Breeding',
        professionalDescription: 'An increase in mosquito activity and potential vector breeding has been reported in the area due to stagnant water or unsanitary conditions. The concerned municipal public health department is requested to conduct fogging and vector control measures.',
        isAmbiguous: false,
      };
    }

    // 10. OBJECT = Dead animal / carcass removal
    if (lower.includes('kutta mar') || lower.includes('dog died') || lower.includes('dead animal') || lower.includes('carcass') || lower.includes('animal body') || (lower.includes('kutta') && lower.includes('pada')) || (lower.includes('kutta') && lower.includes('mar'))) {
      return {
        category: 'Animal Control',
        authorityKey: 'mcd',
        issueTitle: 'Dead Animal / Carcass Removal',
        professionalDescription: 'A deceased animal has been reported in the residential area requiring prompt removal and proper disposal by municipal animal control and sanitation services to maintain public hygiene.',
        isAmbiguous: false,
      };
    }

    // 11. OBJECT = Garbage Collection
    if (lower.includes('kuda') || lower.includes('kachra') || lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || lower.includes('dustbin') || lower.includes('safai') || lower.includes('badbu')) {
      return {
        category: 'Sanitation',
        authorityKey: 'mcd',
        issueTitle: 'Garbage Collection Failure',
        professionalDescription: `Garbage has accumulated in the street${durationFact}, resulting in an unpleasant odor and unsanitary conditions for local residents. The concerned municipal authority is requested to arrange immediate waste collection and cleaning.`,
        isAmbiguous: false,
      };
    }

    // 12. OBJECT = Electricity Outage / Pole / Transformer
    if (lower.includes('light nhi') || lower.includes('light nahi') || lower.includes('bijli') || lower.includes('power cut') || lower.includes('power outage') || lower.includes('no power') || lower.includes('pole') || lower.includes('transformer')) {
      return {
        category: 'Electricity',
        authorityKey: 'bses',
        issueTitle: 'Electricity Outage',
        professionalDescription: `Electricity supply has been unavailable in the resident's locality${durationFact}. The user is requesting immediate inspection of the supply line/transformer and restoration of power by the responsible electricity distribution company.`,
        isAmbiguous: false,
      };
    }

    // 13. OBJECT = Sewer / Drain Overflow
    if (lower.includes('sewer') || lower.includes('nali') || lower.includes('naali') || lower.includes('drain') || lower.includes('overflow')) {
      return {
        category: 'Drainage',
        authorityKey: 'djb',
        issueTitle: 'Sewer / Drain Overflow',
        professionalDescription: 'Drainage blockage and sewage overflow reported on the public street, causing stagnant waste water and foul odor. Urgent drain desilting, pipe clearing, and sanitization is requested.',
        isAmbiguous: false,
      };
    }

    // 14. OBJECT = Water Supply Disruption
    if (lower.includes('paani') || lower.includes('pani') || lower.includes('water supply') || lower.includes('water leak') || lower.includes('pipeline burst')) {
      return {
        category: 'Water',
        authorityKey: 'djb',
        issueTitle: 'Water Supply Disruption',
        professionalDescription: `A disruption in clean tap water supply or pipeline leakage has been reported in the locality${durationFact}. The resident requests immediate intervention and restoration from the municipal water board.`,
        isAmbiguous: false,
      };
    }

    // 15. OBJECT = Streetlight Malfunction
    if (lower.includes('street light') || lower.includes('streetlight') || lower.includes('light pole') || lower.includes('street lamp') || lower.includes('light band') || lower.includes('lights nahi jalti')) {
      return {
        category: 'Street Lighting',
        authorityKey: 'mcd',
        issueTitle: 'Streetlight Malfunction',
        professionalDescription: `The streetlight in the locality is non-functional${durationFact}, leaving the street dark at night and posing public safety risks. Immediate repair or bulb replacement is requested from the street lighting division.`,
        isAmbiguous: false,
      };
    }

    // 16. OBJECT = Traffic Signal Failure
    if (lower.includes('signal') || lower.includes('traffic light') || lower.includes('traffic jam') || lower.includes('congestion')) {
      return {
        category: 'Traffic & Transport',
        authorityKey: 'traffic_police',
        issueTitle: 'Traffic Signal Failure',
        professionalDescription: 'Faulty traffic signals or severe traffic bottleneck causing daily congestion and pedestrian risk. Traffic police intervention and signal repair is requested.',
        isAmbiguous: false,
      };
    }

    // 17. General Fallback with Object Detection
    const capTitle = text.slice(0, 40).replace(/^[a-z]/, (c) => c.toUpperCase()) + (text.length > 40 ? '…' : '');
    return {
      category: 'Public Civic Issue',
      authorityKey: 'mcd',
      issueTitle: capTitle,
      professionalDescription: `A civic infrastructure problem has been reported in the residential area. Inspection and appropriate resolution from responsible municipal authorities is requested.`,
      isAmbiguous: false,
    };
  }
}

/**
 * Real LLM Gemini Provider with Enhanced Diagnostics & Model Validation.
 */
export class GeminiAIProvider implements AIProvider {
  name = 'GeminiAIProvider';
  private apiKey: string;
  private model: string;
  private authorityResolver: AuthorityResolver;
  private fallbackProvider: FallbackAIProvider;

  constructor(apiKey: string, model?: string, authorityResolver?: AuthorityResolver) {
    this.apiKey = apiKey;
    this.model = normalizeGeminiModel(model);
    this.authorityResolver = authorityResolver || new FallbackAuthorityResolver();
    this.fallbackProvider = new FallbackAIProvider(this.authorityResolver);
  }

  async analyze(input: AnalyzeInput): Promise<AnalysisResult> {
    if (!this.apiKey) {
      if (import.meta.env.DEV) {
        console.log('[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: VITE_GEMINI_API_KEY is missing');
      }
      return this.fallbackProvider.analyze(input);
    }

    try {
      const prompt = `You are Naagrik AI, an expert AI civic action assistant in India.
Analyze this user complaint written in Hindi, Hinglish, English, or casual conversational speech:
"${input.text}"

Understand the user's intent semantically:
1. Identify the affected civic OBJECT (e.g. tap water, sewer line, streetlight, road surface, garbage, park gate, vehicle horn, stray animal).
2. Normalize the issue into a short professional English title (e.g. Discolored / Contaminated Water Supply, Sewer Overflow, Streetlight Malfunction, Pothole / Road Damage, Garbage Collection Failure, Damaged Park Gate, Excessive Vehicle Horn Noise, Dead Animal / Carcass Removal).
3. Select the correct civic category: Water, Drainage, Sanitation, Roads, Street Lighting, Animal Control, Public Infrastructure, Noise Pollution, Traffic & Transport, Electricity, Encroachment.
4. Select the correct authorityKey from this strict list:
   - "djb" for Water, Sewerage, Pipeline leakage, Contaminated tap water.
   - "mcd" for Sanitation, Garbage, Streetlights, Animal control, Noise pollution, Encroachment.
   - "pwd" for PWD Roads, Potholes, Waterlogging on major roads.
   - "bses" for Power cuts, Electricity poles, Transformers.
   - "traffic_police" for Traffic signals, Traffic congestion.
   - "nhai" for National highways.
   - "dda" for Parks, DDA horticulture, DDA property.
5. Generate a complete 2-3 sentence professional English complaint description. NEVER start with 'Civic issue reported:', NEVER copy raw Hinglish words verbatim, NEVER invent unprovided facts.
6. DO NOT extract or infer any location or landmark from the complaint text. Always set "extractedLandmark": "".

Return ONLY a single valid JSON object (no markdown, no backticks):
{
  "issueTitle": "short standardized professional English title",
  "category": "specific civic category",
  "description": "2-3 sentence professional English narrative without filler lines or raw Hinglish",
  "authorityKey": "djb | mcd | pwd | bses | traffic_police | nhai | dda",
  "confidence": 0.95,
  "needsClarification": false,
  "clarificationQuestion": "",
  "clarificationOptions": []
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        let errBody = '';
        try {
          const errJson = await response.json();
          errBody = errJson?.error?.message || JSON.stringify(errJson);
        } catch {
          errBody = await response.text().catch(() => '');
        }

        console.warn(`[Naagrik AI Pipeline] Gemini API HTTP ${response.status} (${response.statusText}) Model: [${this.model}]: ${errBody}`);
        if (import.meta.env.DEV) {
          console.log(`[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: Gemini API HTTP ${response.status} - ${errBody}`);
        }
        return this.fallbackProvider.analyze(input);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        if (import.meta.env.DEV) {
          console.log('[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: Empty text in Gemini response candidate');
        }
        return this.fallbackProvider.analyze(input);
      }

      let parsed: any;
      try {
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (jsonErr) {
        console.warn('[Naagrik AI Pipeline] Failed to parse JSON from Gemini response. Falling back:', jsonErr);
        if (import.meta.env.DEV) {
          console.log('[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: Malformed JSON from Gemini response');
        }
        return this.fallbackProvider.analyze(input);
      }

      // Strict Location Isolation: Location comes ONLY from userLocation / GPS / manual selection
      let activeLocationData: LocationData;
      if (
        input.userLocationData &&
        input.userLocationData.source !== 'unspecified' &&
        input.userLocationData.address &&
        input.userLocationData.address !== 'Location Not Specified' &&
        input.userLocationData.address !== 'Not specified (Optional)'
      ) {
        activeLocationData = input.userLocationData;
      } else if (
        input.userLocation &&
        input.userLocation !== 'Location Not Specified' &&
        input.userLocation !== 'Not specified (Optional)' &&
        input.userLocation.trim().length > 0
      ) {
        activeLocationData = {
          address: input.userLocation.trim(),
          source: 'manual',
        };
      } else {
        activeLocationData = {
          address: 'Location Not Specified',
          source: 'unspecified',
        };
      }

      const sanitizedDesc = sanitizeHinglishLeaks(parsed.description || input.text);

      const routingResult = resolveCivicAuthority({
        issueTitle: parsed.issueTitle,
        category: parsed.category,
        description: sanitizedDesc,
        rawText: input.text,
        authorityKey: parsed.authorityKey,
      });

      const portal = getAuthorityPortal(routingResult.authorityKey);
      const resolvedCategory = (routingResult.category || parsed.category || 'General Civic Issue') as IssueCategory;
      const isLocationMissing =
        activeLocationData.source === 'unspecified' || activeLocationData.address === 'Location Not Specified';
      const needsClarification = Boolean(parsed.needsClarification || routingResult.needsConfirmation);

      const letter = generateOfficialComplaintLetter({
        authority: routingResult.authorityName,
        issueTitle: parsed.issueTitle || 'Civic Issue',
        location: activeLocationData.address,
        description: sanitizedDesc,
      });

      const result: AnalysisResult = {
        issueTitle: parsed.issueTitle || 'Civic Issue',
        issue: parsed.issueTitle || 'Civic Issue',
        category: resolvedCategory,
        authority: routingResult.authorityName,
        authorityKey: routingResult.authorityKey,
        authorityWebsite: portal.complaintUrl,
        location: activeLocationData.address,
        locationData: activeLocationData,
        description: sanitizedDesc,
        complaintLetter: letter,
        status: needsClarification ? 'needs_clarification' : 'sufficient',
        isSufficient: !needsClarification,
        needsClarification: needsClarification,
        isOptionalEnhancement: isLocationMissing,
        missingOptionalDetails: isLocationMissing ? ['Locality / Address', 'Nearby Landmark'] : [],
        clarificationQuestion: routingResult.needsConfirmation
          ? routingResult.explanation
          : parsed.clarificationQuestion || 'Could you provide a few more details about the issue?',
        suggestedOptions: routingResult.needsConfirmation && routingResult.suggestedAuthorities
          ? routingResult.suggestedAuthorities.map((a) => a.name)
          : parsed.clarificationOptions || parsed.suggestedOptions || (isLocationMissing
              ? ['Use my current location', 'Enter location manually', 'Choose saved location']
              : undefined),
        confidence: routingResult.confidence,
        providerUsed: this.name,
        routingExplanation: routingResult.explanation,
        isVerifiedRouting: routingResult.isVerifiedRouting,
        matchedRuleId: routingResult.matchedRule,
        suggestedAuthorities: routingResult.suggestedAuthorities,
      };

      if (import.meta.env.DEV) {
        console.log('[Naagrik AI Pipeline] Provider: GeminiAIProvider | Model:', this.model, '| Output:', result);
      }
      return result;
    } catch (error) {
      console.warn('[Naagrik AI Pipeline] Gemini error, falling back:', error);
      if (import.meta.env.DEV) {
        console.log('[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: Exception during API call');
      }
      return this.fallbackProvider.analyze(input);
    }
  }
}

/**
 * Main Dispatcher: Dynamically resolves VITE_GEMINI_API_KEY on every call and normalizes model name.
 */
export async function analyzeComplaintWithAI(input: AnalyzeInput): Promise<AnalysisResult> {
  const apiKey =
    (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY : '');
  const rawModel = (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-3.6-flash';
  const model = normalizeGeminiModel(rawModel);

  let provider: AIProvider;
  if (apiKey) {
    provider = new GeminiAIProvider(apiKey, model);
  } else {
    provider = new FallbackAIProvider();
    if (import.meta.env.DEV) {
      console.log('[Naagrik AI Pipeline] Provider: FallbackAIProvider | Reason: VITE_GEMINI_API_KEY is missing');
    }
  }

  return provider.analyze(input);
}
