import { CIVIC_ROUTING_RULES, type CivicRoutingRule } from '../data/civicRoutingRules';
import { getAuthorityPortal } from '../data/authorityPortals';

export interface StructuredIssue {
  issueTitle?: string;
  category?: string;
  description?: string;
  rawText?: string;
  authorityKey?: string;
}

export interface CivicRoutingResult {
  authorityKey: string;
  authorityName: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  matchedRule?: string;
  explanation: string;
  needsConfirmation: boolean;
  isVerifiedRouting: boolean;
  suggestedAuthorities?: Array<{ key: string; name: string }>;
}

export function resolveCivicAuthority(issue: StructuredIssue): CivicRoutingResult {
  const rawText = (issue.rawText || '').toLowerCase();
  const issueTitle = (issue.issueTitle || '').toLowerCase();
  const category = (issue.category || '').toLowerCase();
  const description = (issue.description || '').toLowerCase();
  const combinedText = `${rawText} ${issueTitle} ${category} ${description}`.trim();

  // 1. Direct PWD / NHAI explicit marker check for roads
  const hasExplicitPwdMarker =
    combinedText.includes('pwd road') ||
    combinedText.includes('pwd flyover') ||
    combinedText.includes('arterial road') ||
    combinedText.includes('pwd drain');

  const hasExplicitNhaiMarker =
    combinedText.includes('nhai') ||
    combinedText.includes('national highway') ||
    combinedText.includes('expressway') ||
    combinedText.includes('nh-') ||
    combinedText.includes('highway');

  if (hasExplicitNhaiMarker) {
    const nhaiRule = CIVIC_ROUTING_RULES.find((r) => r.id === 'national_highway_nhai');
    if (nhaiRule) {
      const portal = getAuthorityPortal('nhai');
      return {
        authorityKey: portal.authorityKey,
        authorityName: portal.authority,
        category: nhaiRule.category,
        confidence: 'high',
        matchedRule: nhaiRule.id,
        explanation: nhaiRule.explanation,
        needsConfirmation: false,
        isVerifiedRouting: true,
      };
    }
  }

  if (hasExplicitPwdMarker) {
    const pwdRule = CIVIC_ROUTING_RULES.find((r) => r.id === 'pwd_arterial_road');
    if (pwdRule) {
      const portal = getAuthorityPortal('pwd');
      return {
        authorityKey: portal.authorityKey,
        authorityName: portal.authority,
        category: pwdRule.category,
        confidence: 'high',
        matchedRule: pwdRule.id,
        explanation: pwdRule.explanation,
        needsConfirmation: false,
        isVerifiedRouting: true,
      };
    }
  }

  // 2. Rule matching based on signal frequency & priority
  let bestMatch: CivicRoutingRule | null = null;
  let highestPriority = -1;

  for (const rule of CIVIC_ROUTING_RULES) {
    // Skip explicit PWD / NHAI rules if markers were not met
    if (rule.id === 'pwd_arterial_road' || rule.id === 'national_highway_nhai') {
      continue;
    }

    const matchesSignal = rule.issueSignals.some((signal) => combinedText.includes(signal));
    if (matchesSignal) {
      if (rule.priority > highestPriority) {
        highestPriority = rule.priority;
        bestMatch = rule;
      }
    }
  }

  // 3. Process Best Match
  if (bestMatch) {
    const portal = getAuthorityPortal(bestMatch.authorityKey);

    if (bestMatch.isAmbiguousRoadRule) {
      return {
        authorityKey: portal.authorityKey,
        authorityName: portal.authority,
        category: bestMatch.category,
        confidence: 'medium',
        matchedRule: bestMatch.id,
        explanation:
          'Road complaints can depend on who maintains the road. Please confirm the responsible authority before continuing.',
        needsConfirmation: true,
        isVerifiedRouting: true,
        suggestedAuthorities: [
          { key: 'pwd', name: 'Public Works Department (PWD) Delhi' },
          { key: 'mcd', name: 'Municipal Corporation of Delhi (MCD)' },
          { key: 'nhai', name: 'National Highways Authority of India (NHAI)' },
        ],
      };
    }

    return {
      authorityKey: portal.authorityKey,
      authorityName: portal.authority,
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      matchedRule: bestMatch.id,
      explanation: bestMatch.explanation,
      needsConfirmation: false,
      isVerifiedRouting: true,
    };
  }

  // 4. Fallback if Gemini or structured input provided an authorityKey
  if (issue.authorityKey) {
    const portal = getAuthorityPortal(issue.authorityKey);
    if (portal && portal.authorityKey !== 'mcd') {
      return {
        authorityKey: portal.authorityKey,
        authorityName: portal.authority,
        category: issue.category || 'General Civic Issue',
        confidence: 'medium',
        explanation: `Authority resolved to ${portal.authority} based on issue category.`,
        needsConfirmation: false,
        isVerifiedRouting: true,
      };
    }
  }

  // 5. General fallback when no reliable match
  const fallbackPortal = getAuthorityPortal('mcd');
  return {
    authorityKey: fallbackPortal.authorityKey,
    authorityName: fallbackPortal.authority,
    category: issue.category || 'General Civic Issue',
    confidence: 'low',
    explanation: 'The responsible authority could not be determined confidently.',
    needsConfirmation: true,
    isVerifiedRouting: false,
    suggestedAuthorities: [
      { key: 'mcd', name: 'Municipal Corporation of Delhi (MCD)' },
      { key: 'pwd', name: 'Public Works Department (PWD) Delhi' },
      { key: 'djb', name: 'Delhi Jal Board (DJB)' },
      { key: 'bses', name: 'BSES Power' },
    ],
  };
}
