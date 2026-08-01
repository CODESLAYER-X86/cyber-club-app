/**
 * Shared certificate layout types and helpers.
 * Used by the certificate designer AND the certificate viewers
 * to ensure what you design is what you get on the real certificate.
 */

/* ─── Types ─── */

export type TextElementKey =
  | 'headerTitle'
  | 'headerSubtitle'
  | 'intro'
  | 'recipientName'
  | 'eventLabel'
  | 'eventName'
  | 'certificateTitle'
  | 'description'
  | 'issueDate'
  | 'issueDateLabel'
  | 'certificateId'
  | 'footer';

export type LogoKey = 'clubLogo' | 'orgLogo' | 'eventLogo';

export interface PositionedTextElement {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight?: number | string;
  textAnchor?: 'start' | 'middle' | 'end';
  letterSpacing?: number;
  fontFamily?: string;
  visible?: boolean;
}

export interface PositionedLogo {
  x: number;
  y: number;
  width: number;
  height: number;
  keepAspectRatio: boolean;
  opacity?: number;
  visible?: boolean;
}

export interface SignatureLayout {
  x: number;
  y: number;
  nameFontSize: number;
  titleFontSize: number;
  nameColor: string;
  titleColor: string;
}

export interface SignatureConfig {
  name: string;
  title: string;
  image: string;
  visible: boolean;
  layout?: SignatureLayout;
}

/* ─── Defaults ─── */

export const DEFAULT_TEXT_COLORS: Record<string, string> = {
  headerTitle: '#ffffff',
  headerSubtitle: '#6b7280',
  intro: '#9ca3af',
  recipientName: '#10b981',
  eventLabel: '#9ca3af',
  eventName: '#ffffff',
  certificateTitle: '#ffffff',
  description: '#6b7280',
  issueDate: '#9ca3af',
  issueDateLabel: '#4b5563',
  certificateId: '#10b981',
  footer: '#4b5563',
  signatureName: '#ffffff',
  signatureTitle: '#6b7280',
};

export const createDefaultTextElements = (isLandscape: boolean): Record<TextElementKey, PositionedTextElement> => {
  const width = isLandscape ? 1200 : 840;
  return {
    headerTitle: { x: width / 2, y: isLandscape ? 210 : 230, fontSize: 22, color: '#ffffff', fontWeight: 'bold', textAnchor: 'middle', letterSpacing: 6, visible: true },
    headerSubtitle: { x: width / 2, y: isLandscape ? 235 : 255, fontSize: 12, color: '#6b7280', textAnchor: 'middle', letterSpacing: 2, visible: true },
    intro: { x: width / 2, y: isLandscape ? 290 : 320, fontSize: 16, color: '#9ca3af', textAnchor: 'middle', visible: true },
    recipientName: { x: width / 2, y: isLandscape ? 350 : 390, fontSize: 42, color: '#10b981', fontWeight: 'bold', textAnchor: 'middle', visible: true },
    eventLabel: { x: width / 2, y: isLandscape ? 395 : 440, fontSize: 16, color: '#9ca3af', textAnchor: 'middle', visible: true },
    eventName: { x: width / 2, y: isLandscape ? 435 : 480, fontSize: 26, color: '#ffffff', fontWeight: 'bold', textAnchor: 'middle', visible: true },
    certificateTitle: { x: width / 2, y: isLandscape ? 485 : 540, fontSize: 12, color: '#ffffff', fontWeight: 'bold', textAnchor: 'middle', visible: true },
    description: { x: width / 2, y: isLandscape ? 535 : 600, fontSize: 13, color: '#6b7280', textAnchor: 'middle', visible: true },
    issueDate: { x: 140, y: isLandscape ? 750 : 1010, fontSize: 12, color: '#9ca3af', textAnchor: 'middle', visible: true },
    issueDateLabel: { x: 140, y: isLandscape ? 768 : 1028, fontSize: 10, color: '#4b5563', textAnchor: 'middle', visible: true },
    certificateId: { x: width / 2, y: 480, fontSize: 14, color: '#10b981', textAnchor: 'middle', visible: true },
    footer: { x: width / 2, y: isLandscape ? 810 : 1170, fontSize: 10, color: '#4b5563', textAnchor: 'middle', visible: true },
  };
};

export const createDefaultLogoElements = (isLandscape: boolean): Record<LogoKey, PositionedLogo> => {
  const width = isLandscape ? 1200 : 840;
  return {
    clubLogo: { x: width / 2 - 40, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
    orgLogo: { x: 50, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
    eventLogo: { x: isLandscape ? 1070 : 710, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
  };
};

export const createDefaultSignatureLayouts = (isLandscape: boolean): SignatureLayout[] => {
  const y = isLandscape ? 700 : 960;
  return [
    { x: isLandscape ? 300 : 210, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
    { x: isLandscape ? 600 : 420, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
    { x: isLandscape ? 900 : 630, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
  ];
};

/* ─── Resolver Helpers ─── */

/**
 * Resolve text element position/style from layout config, merging with defaults.
 */
export function resolveTextElements(
  layout: any,
  isLandscape: boolean
): Record<TextElementKey, PositionedTextElement> {
  const defaults = createDefaultTextElements(isLandscape);
  const saved = layout?.textElements || {};
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as TextElementKey[]) {
    if (saved[key]) {
      merged[key] = { ...defaults[key], ...saved[key] };
    }
  }
  return merged;
}

/**
 * Resolve text colors from layout config, merging with defaults.
 */
export function resolveTextColors(layout: any): Record<string, string> {
  return { ...DEFAULT_TEXT_COLORS, ...(layout?.textColors || {}) };
}

/**
 * Resolve logo elements from layout config, merging with defaults.
 */
export function resolveLogoElements(
  layout: any,
  isLandscape: boolean
): Record<LogoKey, PositionedLogo> {
  const defaults = createDefaultLogoElements(isLandscape);
  const saved = layout?.logoElements || {};
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as LogoKey[]) {
    if (saved[key]) {
      merged[key] = { ...defaults[key], ...saved[key] };
    }
  }
  return merged;
}

/**
 * Resolve signature layouts from layout config, merging with defaults.
 */
export function resolveSignatureLayouts(
  layout: any,
  isLandscape: boolean
): SignatureLayout[] {
  const defaults = createDefaultSignatureLayouts(isLandscape);
  const saved = layout?.signatureLayouts;
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  return defaults;
}

/**
 * Build the default text preview values for a certificate.
 * These are the "real" text that appears on the certificate.
 */
export function buildDefaultTextValues(
  displayName: string,
  eventTitle: string,
  certTitle: string,
  resolvedDesc: string,
  dateStr: string,
  certCode: string,
  verifyUrl: string
): Record<TextElementKey, string> {
  return {
    headerTitle: 'CYBER SECURITY CLUB',
    headerSubtitle: 'VERIFIED DIGITAL CERTIFICATE',
    intro: 'This is to certify that',
    recipientName: displayName,
    eventLabel: 'has successfully completed the event',
    eventName: eventTitle,
    certificateTitle: certTitle,
    description: resolvedDesc,
    issueDate: dateStr,
    issueDateLabel: 'Issue Date',
    certificateId: certCode,
    footer: verifyUrl,
  };
}

/**
 * Apply custom text values (from the designer) on top of default values.
 */
export function applyCustomTextValues(
  defaults: Record<TextElementKey, string>,
  customValues: Partial<Record<TextElementKey, string>> | undefined
): Record<TextElementKey, string> {
  if (!customValues) return defaults;
  const result = { ...defaults };
  for (const key of Object.keys(customValues) as TextElementKey[]) {
    if (customValues[key] !== undefined && customValues[key] !== '') {
      result[key] = customValues[key]!;
    }
  }
  return result;
}
