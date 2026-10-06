'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, Loader2, Sparkles, Image as ImageIcon,
  Paintbrush, Settings, Sliders, Type, Award,
  AlignCenter, AlignLeft, AlignRight, Lock, Unlock,
  X, Check, GraduationCap, Shield, FileText, Calendar
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import type { Event } from '@/types';

/* ─── Types ─── */

type TextElementKey =
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

type LogoKey = 'clubLogo' | 'orgLogo' | 'eventLogo';

type SelectedElement =
  | { kind: 'text'; key: TextElementKey }
  | { kind: 'logo'; key: LogoKey }
  | { kind: 'signature'; index: number }
  | { kind: 'signatureImage'; index: number }
  | null;

interface PositionedTextElement {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  text?: string; // Editable text content — overrides textPreviewValues when set
  fontWeight?: number | string;
  textAnchor?: 'start' | 'middle' | 'end';
  letterSpacing?: number;
  fontFamily?: string;
  visible?: boolean;
}

interface PositionedLogo {
  x: number;
  y: number;
  width: number;
  height: number;
  keepAspectRatio: boolean;
  opacity?: number;
  visible?: boolean;
}

interface SignatureLayout {
  x: number;
  y: number;
  nameFontSize: number;
  titleFontSize: number;
  nameColor: string;
  titleColor: string;
  imageWidth?: number;
  imageHeight?: number;
  imageX?: number;
  imageY?: number;
}

interface SignatureConfig {
  name: string;
  title: string;
  image: string;
  visible: boolean;
  layout?: SignatureLayout;
}

interface TextTemplate {
  title: string;
  description: string;
}

interface AlignmentGuide {
  vertical?: number;
  horizontal?: number;
}

export type ThemeKey = 'ACADEMIC' | 'CYBER' | 'MODERN';

export interface WatermarkConfig {
  visible: boolean;
  text: string;
  opacity: number;
}

export interface ThemePreset {
  id: ThemeKey;
  name: string;
  subtitle: string;
  bgColor: string;
  primaryColor: string;
  secondaryColor: string;
  isLight: boolean;
  textColors: Record<TextElementKey, string>;
  signatureColors: { name: string; title: string };
  defaultWatermark: string;
}

export const THEME_PRESETS: Record<ThemeKey, ThemePreset> = {
  ACADEMIC: {
    id: 'ACADEMIC',
    name: 'Classic Academic',
    subtitle: 'Ivory parchment with ornate gold & navy accents',
    bgColor: '#faf8f5',
    primaryColor: '#b45309',
    secondaryColor: '#1e293b',
    isLight: true,
    textColors: {
      headerTitle: '#0f172a',
      headerSubtitle: '#b45309',
      intro: '#475569',
      recipientName: '#0f172a',
      eventLabel: '#475569',
      eventName: '#b45309',
      certificateTitle: '#991b1b',
      description: '#334155',
      issueDate: '#475569',
      issueDateLabel: '#64748b',
      certificateId: '#b45309',
      footer: '#64748b',
    },
    signatureColors: { name: '#0f172a', title: '#64748b' },
    defaultWatermark: 'VERIFIED',
  },
  CYBER: {
    id: 'CYBER',
    name: 'Cyber Tactical',
    subtitle: 'Cybersecurity dark theme with emerald & cyan neon accents',
    bgColor: '#050508',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    isLight: false,
    textColors: {
      headerTitle: '#ffffff',
      headerSubtitle: '#06b6d4',
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
    },
    signatureColors: { name: '#ffffff', title: '#6b7280' },
    defaultWatermark: 'AUTHENTIC',
  },
  MODERN: {
    id: 'MODERN',
    name: 'Clean Modern',
    subtitle: 'Minimalist white cardstock with crisp dual rules',
    bgColor: '#ffffff',
    primaryColor: '#0284c7',
    secondaryColor: '#059669',
    isLight: true,
    textColors: {
      headerTitle: '#0f172a',
      headerSubtitle: '#64748b',
      intro: '#64748b',
      recipientName: '#0284c7',
      eventLabel: '#64748b',
      eventName: '#0f172a',
      certificateTitle: '#0f172a',
      description: '#475569',
      issueDate: '#64748b',
      issueDateLabel: '#94a3b8',
      certificateId: '#0284c7',
      footer: '#94a3b8',
    },
    signatureColors: { name: '#0f172a', title: '#64748b' },
    defaultWatermark: 'OFFICIAL',
  },
};

interface LayoutConfig {
  theme?: ThemeKey;
  orientation: "LANDSCAPE" | "PORTRAIT";
  paperSize: "A4" | "LETTER";
  bgImage: string;
  bgImageOpacity?: number;
  bgColor?: string;
  primaryColor: string;
  secondaryColor: string;
  collabMode: boolean;
  clubLogo?: string;
  orgLogo: string;
  eventLogo: string;
  qrCode: {
    visible: boolean;
    size: number;
    x: number;
    y: number;
  };
  certId: {
    visible: boolean;
    x: number;
    y: number;
  };
  watermark?: WatermarkConfig;
  textColors?: Record<string, string>;
  textElements?: Partial<Record<TextElementKey, PositionedTextElement>>;
  logoElements?: Partial<Record<LogoKey, PositionedLogo>>;
  signatureLayouts?: SignatureLayout[];
  templates: Record<string, TextTemplate>;
  selectedTypes: string[];
  signatures: SignatureConfig[];
}

/* ─── Constants ─── */

const DEFAULT_TEMPLATES: Record<string, TextTemplate> = {
  PARTICIPATION: { title: 'CERTIFICATE OF PARTICIPATION', description: 'This certifies that {{recipient_name}} successfully participated in {{event_name}}.' },
  WINNER: { title: 'CERTIFICATE OF ACHIEVEMENT', description: 'This certifies that {{recipient_name}} secured Winner in {{event_name}}.' },
  FIRST_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 1st Place in {{event_name}}.' },
  SECOND_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 2nd Place in {{event_name}}.' },
  THIRD_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 3rd Place in {{event_name}}.' },
  ORGANIZER: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as an Organizer for {{event_name}}.' },
  VOLUNTEER: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as a Volunteer for {{event_name}}.' },
  JUDGE: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as a Judge for {{event_name}}.' },
  APPRECIATION: { title: 'CERTIFICATE OF APPRECIATION', description: 'This is awarded to {{recipient_name}} in appreciation of their contributions to {{event_name}}.' },
  CUSTOM: { title: 'CERTIFICATE OF RECOGNITION', description: 'This is awarded to {{recipient_name}} for {{event_name}}.' },
};

const CERT_TYPE_LABELS: Record<string, string> = {
  PARTICIPATION: 'Participation',
  WINNER: 'Winner',
  FIRST_PLACE: '1st Place',
  SECOND_PLACE: '2nd Place',
  THIRD_PLACE: '3rd Place',
  ORGANIZER: 'Organizer',
  VOLUNTEER: 'Volunteer',
  JUDGE: 'Judge',
  APPRECIATION: 'Appreciation',
  CUSTOM: 'Custom Type',
};

const DEFAULT_TEXT_COLORS = {
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
} as const;

const TEXT_ELEMENT_LABELS: Record<TextElementKey, string> = {
  headerTitle: 'Header Title',
  headerSubtitle: 'Header Subtitle',
  intro: 'Intro Text',
  recipientName: 'Recipient Name',
  eventLabel: 'Event Label',
  eventName: 'Event Name',
  certificateTitle: 'Certificate Title',
  description: 'Description',
  issueDate: 'Issue Date',
  issueDateLabel: 'Issue Date Label',
  certificateId: 'Certificate ID',
  footer: 'Footer',
};

const createDefaultTextElements = (isLandscape: boolean): Record<TextElementKey, PositionedTextElement> => {
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

const createDefaultLogoElements = (isLandscape: boolean): Record<LogoKey, PositionedLogo> => {
  const width = isLandscape ? 1200 : 840;
  return {
    clubLogo: { x: width / 2 - 40, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
    orgLogo: { x: 50, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
    eventLogo: { x: isLandscape ? 1070 : 710, y: 45, width: 80, height: 80, keepAspectRatio: true, opacity: 1, visible: true },
  };
};

const createDefaultSignatureLayouts = (isLandscape: boolean): SignatureLayout[] => {
  const y = isLandscape ? 700 : 960;
  return [
    { x: isLandscape ? 300 : 210, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
    { x: isLandscape ? 600 : 420, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
    { x: isLandscape ? 900 : 630, y, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' },
  ];
};

/* ─── Component ─── */

export function CertificateDesigner() {
  const { selectedEventId, setSelectedEventId, setCurrentView } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string>(selectedEventId || '');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventTitle, setEventTitle] = useState('Dynamic Event Title');
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Theme & Watermark states
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('CYBER');
  const [watermarkVisible, setWatermarkVisible] = useState(true);
  const [watermarkText, setWatermarkText] = useState('VERIFIED');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.06);

  // Layout states
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">("LANDSCAPE");
  const [paperSize, setPaperSize] = useState<"A4" | "LETTER">("A4");
  const [bgImage, setBgImage] = useState('');
  const [bgImageOpacity, setBgImageOpacity] = useState(1);
  const [bgColor, setBgColor] = useState('#050508');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [collabMode, setCollabMode] = useState(false);
  const [clubLogo, setClubLogo] = useState('/certificate/logo.png');
  const [orgLogo, setOrgLogo] = useState('');
  const [eventLogo, setEventLogo] = useState('');

  // QR & ID placements
  const [qrVisible, setQrVisible] = useState(true);
  const [qrSize, setQrSize] = useState(80);
  const [qrX, setQrX] = useState(1040);
  const [qrY, setQrY] = useState(480);

  const [idVisible, setIdVisible] = useState(true);
  const [idX, setIdX] = useState(600);
  const [idY, setIdY] = useState(480);

  // Type-specific templates
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['PARTICIPATION']);
  const [templates, setTemplates] = useState<Record<string, TextTemplate>>(DEFAULT_TEMPLATES);
  const [previewType, setPreviewType] = useState('PARTICIPATION');
  const [textColors, setTextColors] = useState<Record<string, string>>(DEFAULT_TEXT_COLORS);
  const [textElements, setTextElements] = useState<Record<TextElementKey, PositionedTextElement>>(() => createDefaultTextElements(true));
  const [logoElements, setLogoElements] = useState<Record<LogoKey, PositionedLogo>>(() => createDefaultLogoElements(true));
  const [signatureLayouts, setSignatureLayouts] = useState<SignatureLayout[]>(() => createDefaultSignatureLayouts(true));
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [activeDesignerTab, setActiveDesignerTab] = useState<string>('properties');
  const [dragState, setDragState] = useState<{
    kind: 'text' | 'logo' | 'signature' | 'signatureImage';
    key: TextElementKey | LogoKey | number;
    mode: 'move' | 'resize';
    startPointerX: number;
    startPointerY: number;
    startX: number;
    startY: number;
    startWidth?: number;
    startHeight?: number;
    aspectRatio?: number;
    resizeCorner?: 'br' | 'bl' | 'tr' | 'tl';
  } | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide | null>(null);

  // Signatures
  const [signatures, setSignatures] = useState<SignatureConfig[]>([
    { name: 'Dr. John Doe', title: 'President', image: '', visible: true, layout: { x: 300, y: 700, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' } },
    { name: 'Alice Smith', title: 'General Secretary', image: '', visible: true, layout: { x: 600, y: 700, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' } },
    { name: 'Bob Johnson', title: 'Event Coordinator', image: '', visible: false, layout: { x: 900, y: 700, nameFontSize: 14, titleFontSize: 11, nameColor: '#ffffff', titleColor: '#6b7280' } },
  ]);

  const isLandscape = orientation === 'LANDSCAPE';
  const width = isLandscape ? 1200 : 840;
  const height = isLandscape ? 840 : 1200;

  /* ─── 1. Load Events List on Mount ─── */
  useEffect(() => {
    let isMounted = true;
    const fetchEventsList = async () => {
      setEventsLoading(true);
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && data.data.events) {
          const list: Event[] = data.data.events;
          list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          if (isMounted) {
            setEvents(list);
            if (!currentEventId && list.length > 0) {
              const defaultEv = list[0].id;
              setCurrentEventId(defaultEv);
              setSelectedEventId(defaultEv);
            } else if (list.length === 0) {
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (isMounted) setEventsLoading(false);
      }
    };
    fetchEventsList();
    return () => { isMounted = false; };
  }, []);

  /* ─── 2. Load Selected Event Layout ─── */
  useEffect(() => {
    if (!currentEventId) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        let defaultPrimary = '#10b981';
        let defaultSecondary = '#06b6d4';
        if (configData.success && configData.data) {
          defaultPrimary = configData.data.defaultPrimaryColor || '#10b981';
          defaultSecondary = configData.data.defaultSecondaryColor || '#06b6d4';
        }

        const res = await fetch(`/api/events/${currentEventId}`);
        const data = await res.json();
        if (data.success && data.data.event) {
          const ev = data.data.event;
          setEventTitle(ev.title);
          if (ev.certificateLayout) {
            try {
              const layout: LayoutConfig = JSON.parse(ev.certificateLayout);
              const theme = layout.theme || 'CYBER';
              setCurrentTheme(theme);
              setOrientation(layout.orientation || "LANDSCAPE");
              setPaperSize(layout.paperSize || "A4");
              setBgImage(layout.bgImage || '');
              setBgImageOpacity((layout as any).bgImageOpacity ?? 1);
              setBgColor((layout as any).bgColor || THEME_PRESETS[theme]?.bgColor || '#050508');
              setPrimaryColor(layout.primaryColor || THEME_PRESETS[theme]?.primaryColor || defaultPrimary);
              setSecondaryColor(layout.secondaryColor || THEME_PRESETS[theme]?.secondaryColor || defaultSecondary);
              setCollabMode(layout.collabMode ?? false);
              setClubLogo((layout as any).clubLogo || '/certificate/logo.png');
              setOrgLogo(layout.orgLogo || '');
              setEventLogo(layout.eventLogo || '');

              if (layout.watermark) {
                setWatermarkVisible(layout.watermark.visible ?? true);
                setWatermarkText(layout.watermark.text || 'VERIFIED');
                setWatermarkOpacity(layout.watermark.opacity ?? 0.06);
              }

              if (layout.qrCode) {
                setQrVisible(layout.qrCode.visible ?? true);
                setQrSize(layout.qrCode.size || 80);
                setQrX(layout.qrCode.x || 1040);
                setQrY(layout.qrCode.y || 480);
              }

              if (layout.certId) {
                setIdVisible(layout.certId.visible ?? true);
                setIdX(layout.certId.x || 600);
                setIdY(layout.certId.y || 480);
              }

              if (layout.selectedTypes && Array.isArray(layout.selectedTypes)) {
                setSelectedTypes(layout.selectedTypes);
                if (layout.selectedTypes.length > 0) {
                  setPreviewType(layout.selectedTypes[0]);
                }
              }

              if (layout.templates) {
                setTemplates({ ...DEFAULT_TEMPLATES, ...layout.templates });
              }

              if (layout.textColors) {
                setTextColors({ ...DEFAULT_TEXT_COLORS, ...layout.textColors });
              }

              setTextElements({
                ...createDefaultTextElements(layout.orientation === 'LANDSCAPE' || !layout.orientation),
                ...(layout.textElements || {}),
              } as Record<TextElementKey, PositionedTextElement>);

              setLogoElements({
                ...createDefaultLogoElements(layout.orientation === 'LANDSCAPE' || !layout.orientation),
                ...(layout.logoElements || {}),
              } as Record<LogoKey, PositionedLogo>);

              setSignatureLayouts(
                (layout.signatureLayouts && Array.isArray(layout.signatureLayouts) && layout.signatureLayouts.length > 0)
                  ? layout.signatureLayouts
                  : createDefaultSignatureLayouts(layout.orientation === 'LANDSCAPE' || !layout.orientation)
              );

              if (layout.signatures && Array.isArray(layout.signatures)) {
                setSignatures(
                  layout.signatures.map((sig: SignatureConfig, index: number) => ({
                    ...sig,
                    layout: sig.layout || createDefaultSignatureLayouts(layout.orientation === 'LANDSCAPE' || !layout.orientation)[index] || createDefaultSignatureLayouts(layout.orientation === 'LANDSCAPE' || !layout.orientation)[0],
                  }))
                );
              }
            } catch (e) {
              console.error('Failed to parse certificate layout JSON:', e);
            }
          } else {
            setPrimaryColor(defaultPrimary);
            setSecondaryColor(defaultSecondary);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [currentEventId]);

  /* ─── 3. Apply Theme Preset ─── */
  const applyTheme = (themeKey: ThemeKey) => {
    const preset = THEME_PRESETS[themeKey];
    if (!preset) return;
    setCurrentTheme(themeKey);
    setBgColor(preset.bgColor);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setTextColors(preset.textColors);

    setTextElements(prev => {
      const updated = { ...prev };
      for (const k of Object.keys(updated) as TextElementKey[]) {
        if (preset.textColors[k]) {
          updated[k] = { ...updated[k], color: preset.textColors[k] };
        }
      }
      return updated;
    });

    setSignatureLayouts(prev => prev.map(s => ({
      ...s,
      nameColor: preset.signatureColors.name,
      titleColor: preset.signatureColors.title,
    })));
    setSignatures(prev => prev.map(s => ({
      ...s,
      layout: s.layout ? {
        ...s.layout,
        nameColor: preset.signatureColors.name,
        titleColor: preset.signatureColors.title,
      } : undefined
    })));

    setWatermarkText(preset.defaultWatermark);
    toast({ title: 'Theme Preset Applied', description: `Switched layout styling to ${preset.name}` });
  };

  /* ─── Updaters ─── */

  const updateSignature = (index: number, field: keyof SignatureConfig, value: any) => {
    setSignatures(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateTemplate = (type: string, field: keyof TextTemplate, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
    if (field === 'description' && textElements.description?.text) {
      setTextElements(prev => ({
        ...prev,
        description: { ...prev.description, text: undefined }
      }));
    }
  };

  const updateTextColor = (key: keyof typeof DEFAULT_TEXT_COLORS, value: string) => {
    setTextColors(prev => ({ ...prev, [key]: value }));
  };

  const updateTextElement = (key: TextElementKey, patch: Partial<PositionedTextElement>) => {
    setTextElements(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const updateLogoElement = (key: LogoKey, patch: Partial<PositionedLogo>) => {
    setLogoElements(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const updateSignatureLayout = (index: number, patch: Partial<SignatureLayout>) => {
    setSignatureLayouts(prev => prev.map((layout, currentIndex) => currentIndex === index ? { ...layout, ...patch } : layout));
    setSignatures(prev => prev.map((sig, currentIndex) => currentIndex === index ? { ...sig, layout: { ...((sig.layout) || createDefaultSignatureLayouts(true)[currentIndex] || createDefaultSignatureLayouts(true)[0]), ...patch } } : sig));
  };

  /* ─── SVG Coordinate Helpers ─── */

  const svgPointFromEvent = (event: PointerEvent | React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = point.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  /* ─── Enhanced Alignment Guides ─── */

  const snapToGuides = (x: number, y: number, elementWidth?: number, elementHeight?: number) => {
    const SNAP_THRESHOLD = 8;
    const cx = width / 2;
    const cy = height / 2;

    // Center guides
    let xGuide: number | undefined;
    let yGuide: number | undefined;

    // Horizontal center snap
    if (Math.abs(x - cx) < SNAP_THRESHOLD) xGuide = cx;
    // Left margin snap
    if (Math.abs(x - 50) < SNAP_THRESHOLD) xGuide = 50;
    // Right margin snap
    if (Math.abs(x - (width - 50)) < SNAP_THRESHOLD) xGuide = width - 50;
    // Quarter snaps
    if (Math.abs(x - width / 4) < SNAP_THRESHOLD) xGuide = width / 4;
    if (Math.abs(x - (3 * width / 4)) < SNAP_THRESHOLD) xGuide = 3 * width / 4;

    // Vertical center snap
    if (Math.abs(y - cy) < SNAP_THRESHOLD) yGuide = cy;
    // Top margin snap
    if (Math.abs(y - 50) < SNAP_THRESHOLD) yGuide = 50;
    // Bottom margin snap
    if (Math.abs(y - (height - 50)) < SNAP_THRESHOLD) yGuide = height - 50;

    // Element-to-element snapping: check against other text elements
    const allTextPositions = Object.entries(textElements).filter(([k]) => {
      if (selectedElement?.kind === 'text' && k === selectedElement.key) return false;
      return true;
    });
    for (const [, pos] of allTextPositions) {
      if (Math.abs(x - pos.x) < SNAP_THRESHOLD && !xGuide) xGuide = pos.x;
      if (Math.abs(y - pos.y) < SNAP_THRESHOLD && !yGuide) yGuide = pos.y;
    }

    // Element-to-element snapping: check against other logos
    const allLogoPositions = Object.entries(logoElements).filter(([k]) => {
      if (selectedElement?.kind === 'logo' && k === selectedElement.key) return false;
      return true;
    });
    for (const [, pos] of allLogoPositions) {
      if (Math.abs(x - pos.x) < SNAP_THRESHOLD && !xGuide) xGuide = pos.x;
      if (Math.abs(y - pos.y) < SNAP_THRESHOLD && !yGuide) yGuide = pos.y;
      // Right edge snap
      if (elementWidth && Math.abs(x - (pos.x + pos.width)) < SNAP_THRESHOLD && !xGuide) xGuide = pos.x + pos.width;
      // Bottom edge snap
      if (elementHeight && Math.abs(y - (pos.y + pos.height)) < SNAP_THRESHOLD && !yGuide) yGuide = pos.y + pos.height;
    }

    return {
      x: xGuide ?? x,
      y: yGuide ?? y,
      guides: { vertical: xGuide, horizontal: yGuide },
    };
  };

  /* ─── Drag & Resize ─── */

  const beginDrag = (
    kind: 'text' | 'logo' | 'signature' | 'signatureImage',
    key: TextElementKey | LogoKey | number,
    mode: 'move' | 'resize',
    event: React.PointerEvent,
    current: { x: number; y: number; width?: number; height?: number },
    resizeCorner?: 'br' | 'bl' | 'tr' | 'tl'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const point = svgPointFromEvent(event);
    setSelectedElement(kind === 'signature' || kind === 'signatureImage' ? { kind, index: key as number } : { kind, key: key as any });
    setActiveDesignerTab('properties');
    setDragState({
      kind,
      key,
      mode,
      startPointerX: point.x,
      startPointerY: point.y,
      startX: current.x,
      startY: current.y,
      startWidth: current.width,
      startHeight: current.height,
      aspectRatio: current.width && current.height ? current.width / current.height : undefined,
      resizeCorner,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event: PointerEvent) => {
      const point = svgPointFromEvent(event);

      if (dragState.kind === 'text') {
        if (dragState.mode === 'move') {
          const nextX = dragState.startX + (point.x - dragState.startPointerX);
          const nextY = dragState.startY + (point.y - dragState.startPointerY);
          const snapped = snapToGuides(nextX, nextY);
          updateTextElement(dragState.key as TextElementKey, { x: snapped.x, y: snapped.y });
          setAlignmentGuides(snapped.guides);
        }
      }

      if (dragState.kind === 'logo') {
        if (dragState.mode === 'move') {
          const nextX = dragState.startX + (point.x - dragState.startPointerX);
          const nextY = dragState.startY + (point.y - dragState.startPointerY);
          const logo = logoElements[dragState.key as LogoKey];
          const snapped = snapToGuides(nextX, nextY, logo?.width, logo?.height);
          updateLogoElement(dragState.key as LogoKey, { x: snapped.x, y: snapped.y });
          setAlignmentGuides(snapped.guides);
        } else if (dragState.mode === 'resize') {
          const logo = logoElements[dragState.key as LogoKey];
          const keepRatio = logo?.keepAspectRatio ?? true;

          if (dragState.resizeCorner === 'br') {
            const dx = point.x - dragState.startPointerX;
            const dy = point.y - dragState.startPointerY;
            const delta = Math.max(dx, dy);
            const nextWidth = Math.max(30, (dragState.startWidth || 80) + delta);
            if (keepRatio && dragState.aspectRatio) {
              const nextHeight = Math.max(30, nextWidth / dragState.aspectRatio);
              updateLogoElement(dragState.key as LogoKey, { width: nextWidth, height: nextHeight });
            } else {
              const nextHeight = Math.max(30, (dragState.startHeight || 80) + dy);
              updateLogoElement(dragState.key as LogoKey, { width: nextWidth, height: nextHeight });
            }
          } else if (dragState.resizeCorner === 'bl') {
            const dx = dragState.startPointerX - point.x;
            const dy = point.y - dragState.startPointerY;
            const delta = Math.max(dx, dy);
            const nextWidth = Math.max(30, (dragState.startWidth || 80) + delta);
            if (keepRatio && dragState.aspectRatio) {
              const nextHeight = Math.max(30, nextWidth / dragState.aspectRatio);
              const newX = dragState.startX + (dragState.startWidth || 80) - nextWidth;
              updateLogoElement(dragState.key as LogoKey, { x: newX, y: dragState.startY, width: nextWidth, height: nextHeight });
            } else {
              const nextHeight = Math.max(30, (dragState.startHeight || 80) + dy);
              const newX = dragState.startX + (dragState.startWidth || 80) - nextWidth;
              updateLogoElement(dragState.key as LogoKey, { x: newX, y: dragState.startY, width: nextWidth, height: nextHeight });
            }
          } else if (dragState.resizeCorner === 'tr') {
            const dx = point.x - dragState.startPointerX;
            const dy = dragState.startPointerY - point.y;
            const delta = Math.max(dx, dy);
            const nextWidth = Math.max(30, (dragState.startWidth || 80) + delta);
            if (keepRatio && dragState.aspectRatio) {
              const nextHeight = Math.max(30, nextWidth / dragState.aspectRatio);
              const newY = dragState.startY + (dragState.startHeight || 80) - nextHeight;
              updateLogoElement(dragState.key as LogoKey, { x: dragState.startX, y: newY, width: nextWidth, height: nextHeight });
            } else {
              const nextHeight = Math.max(30, (dragState.startHeight || 80) + dy);
              const newY = dragState.startY + (dragState.startHeight || 80) - nextHeight;
              updateLogoElement(dragState.key as LogoKey, { x: dragState.startX, y: newY, width: nextWidth, height: nextHeight });
            }
          } else if (dragState.resizeCorner === 'tl') {
            const dx = dragState.startPointerX - point.x;
            const dy = dragState.startPointerY - point.y;
            const delta = Math.max(dx, dy);
            const nextWidth = Math.max(30, (dragState.startWidth || 80) + delta);
            if (keepRatio && dragState.aspectRatio) {
              const nextHeight = Math.max(30, nextWidth / dragState.aspectRatio);
              const newX = dragState.startX + (dragState.startWidth || 80) - nextWidth;
              const newY = dragState.startY + (dragState.startHeight || 80) - nextHeight;
              updateLogoElement(dragState.key as LogoKey, { x: newX, y: newY, width: nextWidth, height: nextHeight });
            } else {
              const nextHeight = Math.max(30, (dragState.startHeight || 80) + dy);
              const newX = dragState.startX + (dragState.startWidth || 80) - nextWidth;
              const newY = dragState.startY + (dragState.startHeight || 80) - nextHeight;
              updateLogoElement(dragState.key as LogoKey, { x: newX, y: newY, width: nextWidth, height: nextHeight });
            }
          }
        }
      }

      if (dragState.kind === 'signature') {
        const index = dragState.key as number;
        if (dragState.mode === 'move') {
          const nextX = dragState.startX + (point.x - dragState.startPointerX);
          const nextY = dragState.startY + (point.y - dragState.startPointerY);
          const snapped = snapToGuides(nextX, nextY);
          updateSignatureLayout(index, { x: snapped.x, y: snapped.y });
          setAlignmentGuides(snapped.guides);
        }
      }

      if (dragState.kind === 'signatureImage') {
        const index = dragState.key as number;
        if (dragState.mode === 'move') {
          const nextX = dragState.startX + (point.x - dragState.startPointerX);
          const nextY = dragState.startY + (point.y - dragState.startPointerY);
          updateSignatureLayout(index, { imageX: nextX, imageY: nextY });
        } else if (dragState.mode === 'resize') {
          const dx = point.x - dragState.startPointerX;
          const dy = point.y - dragState.startPointerY;
          if (dragState.resizeCorner === 'br') {
            const nextWidth = Math.max(30, (dragState.startWidth || 100) + dx);
            const nextHeight = Math.max(20, (dragState.startHeight || 50) + dy);
            updateSignatureLayout(index, { imageWidth: nextWidth, imageHeight: nextHeight });
          } else if (dragState.resizeCorner === 'bl') {
            const nextWidth = Math.max(30, (dragState.startWidth || 100) - dx);
            const nextHeight = Math.max(20, (dragState.startHeight || 50) + dy);
            updateSignatureLayout(index, { imageWidth: nextWidth, imageHeight: nextHeight });
          } else if (dragState.resizeCorner === 'tr') {
            const nextWidth = Math.max(30, (dragState.startWidth || 100) + dx);
            const nextHeight = Math.max(20, (dragState.startHeight || 50) - dy);
            updateSignatureLayout(index, { imageWidth: nextWidth, imageHeight: nextHeight });
          } else if (dragState.resizeCorner === 'tl') {
            const nextWidth = Math.max(30, (dragState.startWidth || 100) - dx);
            const nextHeight = Math.max(20, (dragState.startHeight || 50) - dy);
            updateSignatureLayout(index, { imageWidth: nextWidth, imageHeight: nextHeight });
          }
        }
      }
    };

    const handleUp = () => {
      setDragState(null);
      setAlignmentGuides(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState, width, height, logoElements]);

  /* ─── Type Toggle ─── */

  const toggleType = (type: string) => {
    const nextActive = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(nextActive);
    if (nextActive.length > 0 && !nextActive.includes(previewType)) {
      setPreviewType(nextActive[0]);
    }
  };

  /* ─── Save ─── */

  const handleSave = async () => {
    if (!currentEventId) return;
    if (selectedTypes.length === 0) {
      toast({ title: 'Validation Error', description: 'You must select at least one certificate type', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const layoutConfig: LayoutConfig = {
      theme: currentTheme,
      orientation,
      paperSize,
      bgImage,
      bgImageOpacity,
      bgColor,
      primaryColor,
      secondaryColor,
      collabMode,
      clubLogo,
      orgLogo: collabMode ? orgLogo : '',
      eventLogo: collabMode ? eventLogo : '',
      qrCode: { visible: qrVisible, size: qrSize, x: qrX, y: qrY },
      certId: { visible: idVisible, x: idX, y: idY },
      watermark: { visible: watermarkVisible, text: watermarkText, opacity: watermarkOpacity },
      textElements,
      logoElements,
      selectedTypes,
      templates,
      textColors,
      signatureLayouts,
      signatures,
    };

    try {
      const res = await fetch(`/api/events/${currentEventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateLayout: JSON.stringify(layoutConfig) }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Design Saved', description: `Certificate template saved for ${eventTitle}.` });
      } else {
        toast({ title: 'Save Failed', description: data.error || 'Could not save layout config', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network Error', description: 'Could not connect to server', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Loading ─── */

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-gray-500 font-medium">Loading certificate designer...</p>
      </div>
    );
  }

  /* ─── Preview Data ─── */

  const activeSigs = signatures.filter(s => s.visible);
  const visibleSigIndices: number[] = [];
  signatures.forEach((s, i) => { if (s.visible) visibleSigIndices.push(i); });
  const currentTemplate = templates[previewType] || DEFAULT_TEMPLATES.PARTICIPATION;
  const previewTitle = currentTemplate.title;
  const previewDesc = currentTemplate.description
    .replace('{{recipient_name}}', 'Md. Rahim Uddin Shuvo')
    .replace('{{event_name}}', eventTitle)
    .replace('{{certificate_type}}', CERT_TYPE_LABELS[previewType] || previewType)
    .replace('{{position}}', previewType.includes('PLACE') ? CERT_TYPE_LABELS[previewType] : 'Winner')
    .replace('{{certificate_id}}', 'CSC-2026-CYBERSEC-00125')
    .replace('{{issue_date}}', 'June 15, 2026');

  const textPreviewValues: Record<TextElementKey, string> = {
    headerTitle: 'CYBER SECURITY CLUB',
    headerSubtitle: 'VERIFIED DIGITAL CERTIFICATE',
    intro: 'This is to certify that',
    recipientName: 'Md. Rahim Uddin Shuvo',
    eventLabel: 'has successfully completed the event',
    eventName: eventTitle,
    certificateTitle: previewTitle,
    description: previewDesc,
    issueDate: 'June 15, 2026',
    issueDateLabel: 'Issue Date',
    certificateId: 'CSC-2026-CYBERSEC-00125',
    footer: 'Verification URL: https://cybersec.club/?cert=CSC-2026-CYBERSEC-00125',
  };

  const selectedTextKey = selectedElement?.kind === 'text' ? selectedElement.key : null;
  const selectedLogoKey = selectedElement?.kind === 'logo' ? selectedElement.key : null;
  const selectedSigIndex = (selectedElement?.kind === 'signature' || selectedElement?.kind === 'signatureImage') ? selectedElement.index : null;

  /* ─── Render Logo with Resize Handles ─── */

  const renderLogo = (key: LogoKey, href: string, show: boolean) => {
    if (!show || !href) return null;
    const logo = logoElements[key];
    const isSelected = selectedLogoKey === key;
    const lx = logo?.x ?? createDefaultLogoElements(isLandscape)[key].x;
    const ly = logo?.y ?? createDefaultLogoElements(isLandscape)[key].y;
    const lw = logo?.width ?? 80;
    const lh = logo?.height ?? 80;
    const opacity = logo?.opacity ?? 1;

    return (
      <g
        onPointerDown={(e) => beginDrag('logo', key, 'move', e, { x: lx, y: ly, width: lw, height: lh })}
        style={{ cursor: 'move' }}
      >
        <image
          x={lx}
          y={ly}
          width={lw}
          height={lh}
          href={href}
          preserveAspectRatio={logo?.keepAspectRatio !== false ? 'xMidYMid meet' : 'none'}
          opacity={opacity}
        />
        {/* Selection border */}
        {isSelected && (
          <rect
            x={lx - 2}
            y={ly - 2}
            width={lw + 4}
            height={lh + 4}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}
        {/* Resize handles - only when selected */}
        {isSelected && (
          <>
            {/* Bottom-right handle */}
            <rect
              x={lx + lw - 6}
              y={ly + lh - 6}
              width={12}
              height={12}
              fill={primaryColor}
              stroke="#000"
              strokeWidth="1"
              rx="2"
              style={{ cursor: 'nwse-resize' }}
              onPointerDown={(e) => beginDrag('logo', key, 'resize', e, { x: lx, y: ly, width: lw, height: lh }, 'br')}
            />
            {/* Bottom-left handle */}
            <rect
              x={lx - 6}
              y={ly + lh - 6}
              width={12}
              height={12}
              fill={primaryColor}
              stroke="#000"
              strokeWidth="1"
              rx="2"
              style={{ cursor: 'nesw-resize' }}
              onPointerDown={(e) => beginDrag('logo', key, 'resize', e, { x: lx, y: ly, width: lw, height: lh }, 'bl')}
            />
            {/* Top-right handle */}
            <rect
              x={lx + lw - 6}
              y={ly - 6}
              width={12}
              height={12}
              fill={primaryColor}
              stroke="#000"
              strokeWidth="1"
              rx="2"
              style={{ cursor: 'nesw-resize' }}
              onPointerDown={(e) => beginDrag('logo', key, 'resize', e, { x: lx, y: ly, width: lw, height: lh }, 'tr')}
            />
            {/* Top-left handle */}
            <rect
              x={lx - 6}
              y={ly - 6}
              width={12}
              height={12}
              fill={primaryColor}
              stroke="#000"
              strokeWidth="1"
              rx="2"
              style={{ cursor: 'nwse-resize' }}
              onPointerDown={(e) => beginDrag('logo', key, 'resize', e, { x: lx, y: ly, width: lw, height: lh }, 'tl')}
            />
            {/* Size label */}
            <text
              x={lx + lw / 2}
              y={ly + lh + 16}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="9"
              fill={primaryColor}
            >
              {Math.round(lw)}x{Math.round(lh)}
            </text>
          </>
        )}
      </g>
    );
  };

  /* ─── Render Text Element ─── */

  const renderTextElement = (key: TextElementKey) => {
    const position = textElements[key];
    if (position.visible === false) return null;
    const isSelected = selectedTextKey === key;
    const previewValue = position.text || textPreviewValues[key] || ''; // Custom text if set, else default
    const effectiveColor = position.color || textColors[key] || '#ffffff';

    // Support multiline text via \n
    const lines = String(previewValue).split('\n');
    const isMultiLine = lines.length > 1;
    const lineHeight = Math.round(position.fontSize * 1.38);
    // Vertically center multiline text block around position.y
    const startY = isMultiLine ? position.y - ((lines.length - 1) * lineHeight) / 2 : position.y;

    // Estimate text width and bounding box for selection
    const maxLineLength = Math.max(...lines.map(l => l.length), 1);
    const estimatedWidth = Math.max(maxLineLength * position.fontSize * 0.6, 80);
    const boxHeight = (lines.length - 1) * lineHeight + position.fontSize + 12;

    return (
      <g
        key={key}
        onPointerDown={(e) => beginDrag('text', key, 'move', e, { x: position.x, y: position.y })}
        style={{ cursor: 'move' }}
      >
        <text
          x={position.x}
          y={startY}
          textAnchor={position.textAnchor}
          fontFamily={position.fontFamily || 'sans-serif'}
          fontSize={position.fontSize}
          fontWeight={position.fontWeight}
          fill={effectiveColor}
          letterSpacing={position.letterSpacing}
        >
          {isMultiLine ? (
            lines.map((line, idx) => (
              <tspan
                key={idx}
                x={position.x}
                dy={idx === 0 ? 0 : lineHeight}
              >
                {line}
              </tspan>
            ))
          ) : (
            previewValue
          )}
        </text>
        {isSelected && (
          <>
            <rect
              x={position.textAnchor === 'middle' ? position.x - estimatedWidth / 2 : position.textAnchor === 'end' ? position.x - estimatedWidth : position.x}
              y={startY - position.fontSize - 4}
              width={estimatedWidth}
              height={boxHeight}
              fill="none"
              stroke={primaryColor}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              rx="2"
            />
            {/* Element label */}
            <rect
              x={position.textAnchor === 'middle' ? position.x - 40 : position.textAnchor === 'end' ? position.x - 80 : position.x}
              y={startY - position.fontSize - 18}
              width="80"
              height="14"
              fill={primaryColor}
              rx="3"
            />
            <text
              x={position.textAnchor === 'middle' ? position.x : position.textAnchor === 'end' ? position.x - 40 : position.x + 40}
              y={startY - position.fontSize - 8}
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="8"
              fill="#000"
              fontWeight="bold"
            >
              {TEXT_ELEMENT_LABELS[key]}
            </text>
          </>
        )}
      </g>
    );
  };

  /* ─── Color Controls ─── */

  const textColorControls: Array<{ key: keyof typeof DEFAULT_TEXT_COLORS; label: string }> = [
    { key: 'headerTitle', label: 'Header Title' },
    { key: 'headerSubtitle', label: 'Header Subtitle' },
    { key: 'intro', label: 'Intro Text' },
    { key: 'recipientName', label: 'Recipient Name' },
    { key: 'eventLabel', label: 'Event Label' },
    { key: 'eventName', label: 'Event Name' },
    { key: 'certificateTitle', label: 'Certificate Title' },
    { key: 'description', label: 'Description Text' },
    { key: 'certificateId', label: 'Certificate ID' },
    { key: 'footer', label: 'Footer Text' },
    { key: 'signatureName', label: 'Signature Name' },
    { key: 'signatureTitle', label: 'Signature Title' },
  ];

  /* ─── Properties Panel ─── */

  const renderPropertiesPanel = () => {
    if (!selectedElement) {
      return (
        <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4">
          <p className="text-xs text-gray-500 text-center py-4">
            Click any element on the canvas to edit its properties
          </p>
        </div>
      );
    }

    if (selectedElement.kind === 'text') {
      const key = selectedElement.key;
      const el = textElements[key];
      const effectiveColor = el.color || textColors[key] || '#ffffff';

      return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" /> {TEXT_ELEMENT_LABELS[key]}
            </span>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Visible</span>
            <Switch
              checked={el.visible !== false}
              onCheckedChange={(v) => updateTextElement(key, { visible: v })}
            />
          </div>

          {/* Text Content — Editable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Text Content</label>
              {el.text !== undefined && (
                <button
                  type="button"
                  onClick={() => updateTextElement(key, { text: undefined })}
                  className="text-[9px] text-emerald-400 hover:text-emerald-300 underline"
                >
                  Reset to Template
                </button>
              )}
            </div>
            {key === 'description' || (el.text && el.text.includes('\n')) ? (
              <>
                <textarea
                  rows={3}
                  value={el.text !== undefined ? el.text : (textPreviewValues[key] || '')}
                  onChange={(e) => updateTextElement(key, { text: e.target.value })}
                  placeholder={textPreviewValues[key]}
                  className="w-full p-2 text-xs border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:border-emerald-500/50 resize-y font-sans"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[9px]">Enter</kbd> for 2 lines</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = el.text !== undefined ? el.text : (textPreviewValues[key] || '');
                      if (!currentVal.includes('\n')) {
                        let splitIdx = -1;
                        const phrases = ['successfully participated in', 'participated in', 'successfully served as', 'secured', 'in appreciation of', 'for completing'];
                        for (const p of phrases) {
                          const idx = currentVal.indexOf(p);
                          if (idx !== -1) { splitIdx = idx; break; }
                        }
                        if (splitIdx === -1) {
                          const half = Math.floor(currentVal.length / 2);
                          const nextSpace = currentVal.indexOf(' ', half);
                          splitIdx = nextSpace !== -1 ? nextSpace + 1 : half;
                        }
                        if (splitIdx > 0) {
                          const newText = currentVal.slice(0, splitIdx).trim() + '\n' + currentVal.slice(splitIdx).trim();
                          updateTextElement(key, { text: newText });
                        }
                      } else {
                        updateTextElement(key, { text: currentVal.replace(/\n+/g, ' ') });
                      }
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center gap-1"
                  >
                    {(el.text !== undefined ? el.text : (textPreviewValues[key] || '')).includes('\n') ? '🔗 Join into 1 line' : '✂️ Split into 2 lines'}
                  </button>
                </div>
              </>
            ) : (
              <Input
                value={el.text !== undefined ? el.text : (textPreviewValues[key] || '')}
                onChange={(e) => updateTextElement(key, { text: e.target.value })}
                placeholder={textPreviewValues[key]}
                className="h-7 text-xs border-white/10 bg-white/5 text-white"
              />
            )}
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position X</label>
              <Input
                type="number"
                value={Math.round(el.x)}
                onChange={(e) => updateTextElement(key, { x: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position Y</label>
              <Input
                type="number"
                value={Math.round(el.y)}
                onChange={(e) => updateTextElement(key, { y: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Font Size</span>
              <span className="font-mono text-white">{el.fontSize}px</span>
            </div>
            <input
              type="range"
              min="6"
              max="72"
              value={el.fontSize}
              onChange={(e) => updateTextElement(key, { fontSize: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effectiveColor}
                onChange={(e) => {
                  updateTextElement(key, { color: e.target.value });
                  updateTextColor(key as keyof typeof DEFAULT_TEXT_COLORS, e.target.value);
                }}
                className="h-8 w-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                value={effectiveColor}
                onChange={(e) => {
                  updateTextElement(key, { color: e.target.value });
                  updateTextColor(key as keyof typeof DEFAULT_TEXT_COLORS, e.target.value);
                }}
                className="h-8 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
          </div>

          {/* Font Weight */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Font Weight</label>
            <div className="flex gap-1">
              {['normal', 'bold'].map((w) => (
                <button
                  key={w}
                  onClick={() => updateTextElement(key, { fontWeight: w })}
                  className={`flex-1 h-7 text-[10px] font-semibold uppercase rounded border transition-all ${
                    el.fontWeight === w
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Text Alignment */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Text Alignment</label>
            <div className="flex gap-1">
              {([
                { value: 'start', icon: AlignLeft, label: 'Left' },
                { value: 'middle', icon: AlignCenter, label: 'Center' },
                { value: 'end', icon: AlignRight, label: 'Right' },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updateTextElement(key, { textAnchor: value })}
                  className={`flex-1 h-7 flex items-center justify-center gap-1 text-[10px] rounded border transition-all ${
                    el.textAnchor === value
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Letter Spacing</span>
              <span className="font-mono text-white">{el.letterSpacing || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={el.letterSpacing || 0}
              onChange={(e) => updateTextElement(key, { letterSpacing: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      );
    }

    if (selectedElement.kind === 'logo') {
      const key = selectedElement.key;
      const logo = logoElements[key];
      const logoLabels: Record<LogoKey, string> = {
        clubLogo: 'Club Logo',
        orgLogo: 'Partner Logo',
        eventLogo: 'Co-Host Logo',
      };

      return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> {logoLabels[key]}
            </span>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position X</label>
              <Input
                type="number"
                value={Math.round(logo.x)}
                onChange={(e) => updateLogoElement(key, { x: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position Y</label>
              <Input
                type="number"
                value={Math.round(logo.y)}
                onChange={(e) => updateLogoElement(key, { y: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
          </div>

          {/* Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Width</span>
              <span className="font-mono text-white">{Math.round(logo.width)}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={logo.width}
              onChange={(e) => {
                const newWidth = parseInt(e.target.value);
                if (logo.keepAspectRatio && logo.height > 0) {
                  const ratio = logo.width / logo.height;
                  updateLogoElement(key, { width: newWidth, height: newWidth / ratio });
                } else {
                  updateLogoElement(key, { width: newWidth });
                }
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Height</span>
              <span className="font-mono text-white">{Math.round(logo.height)}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={logo.height}
              onChange={(e) => {
                const newHeight = parseInt(e.target.value);
                if (logo.keepAspectRatio && logo.width > 0) {
                  const ratio = logo.height / logo.width;
                  updateLogoElement(key, { height: newHeight, width: newHeight / ratio });
                } else {
                  updateLogoElement(key, { height: newHeight });
                }
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Aspect Ratio Lock */}
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2">
              {logo.keepAspectRatio ? (
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span className="text-[10px] text-gray-300 font-semibold">Lock Aspect Ratio</span>
            </div>
            <Switch
              checked={logo.keepAspectRatio}
              onCheckedChange={(v) => updateLogoElement(key, { keepAspectRatio: v })}
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Opacity</span>
              <span className="font-mono text-white">{Math.round((logo.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={Math.round((logo.opacity ?? 1) * 100)}
              onChange={(e) => updateLogoElement(key, { opacity: parseInt(e.target.value) / 100 })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      );
    }

    if (selectedElement.kind === 'signature') {
      const idx = selectedElement.index;
      const sig = signatures[idx];
      const layout = sig.layout || signatureLayouts[idx];

      return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Signature {idx + 1}
            </span>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position X</label>
              <Input
                type="number"
                value={Math.round(layout.x)}
                onChange={(e) => updateSignatureLayout(idx, { x: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Position Y</label>
              <Input
                type="number"
                value={Math.round(layout.y)}
                onChange={(e) => updateSignatureLayout(idx, { y: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs border-white/10 bg-white/5 text-white font-mono"
              />
            </div>
          </div>

          {/* Name Font Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Name Size</span>
              <span className="font-mono text-white">{layout.nameFontSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              value={layout.nameFontSize}
              onChange={(e) => updateSignatureLayout(idx, { nameFontSize: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Title Font Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500 font-semibold uppercase">Title Size</span>
              <span className="font-mono text-white">{layout.titleFontSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              value={layout.titleFontSize}
              onChange={(e) => updateSignatureLayout(idx, { titleFontSize: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Name Color</label>
              <input
                type="color"
                value={layout.nameColor}
                onChange={(e) => updateSignatureLayout(idx, { nameColor: e.target.value })}
                className="h-8 w-full rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Title Color</label>
              <input
                type="color"
                value={layout.titleColor}
                onChange={(e) => updateSignatureLayout(idx, { titleColor: e.target.value })}
                className="h-8 w-full rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  /* ─── MAIN RENDER ─── */

  return (
    <div className="space-y-6">
      {/* Header with Event Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-[#111]/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('certificate-authority')}
            className="text-zinc-400 hover:text-white text-xs h-9 cursor-pointer"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to CA Console
          </Button>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap hidden md:inline">Target Event:</span>
            <Select
              value={currentEventId}
              onValueChange={(val) => {
                setCurrentEventId(val);
                setSelectedEventId(val);
              }}
              disabled={eventsLoading}
            >
              <SelectTrigger className="border-white/10 bg-black/40 text-white rounded-lg h-9 text-xs min-w-[260px] max-w-[380px] hover:border-emerald-500/40 transition-colors">
                <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select event to design..."} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#12121a] text-white max-h-72">
                {events.length === 0 ? (
                  <div className="py-2 px-3 text-xs text-zinc-500">No events found</div>
                ) : (
                  events.map((ev) => (
                    <SelectItem
                      key={ev.id}
                      value={ev.id}
                      textValue={`${ev.title} • ${new Date(ev.startDate).toLocaleDateString()}`}
                      className="text-xs py-2 cursor-pointer focus:bg-white/10 text-zinc-200"
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium text-white truncate max-w-[220px]">{ev.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-normal">
                            {ev.category}
                          </Badge>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(ev.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !currentEventId}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs h-9 px-4 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Design
          </Button>
        </div>
      </div>

      {!eventsLoading && events.length === 0 && (
        <Card className="border-white/5 bg-[#111]/60 p-8 text-center space-y-3">
          <p className="text-zinc-400 text-sm">No events found in the database. Please create an event first.</p>
          <Button onClick={() => setCurrentView('events')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer">
            Go to Events
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-md text-white flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-emerald-400" />
                Certificate Designer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs value={activeDesignerTab} onValueChange={setActiveDesignerTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="properties" className="text-xs">1. Element</TabsTrigger>
                  <TabsTrigger value="types" className="text-xs">2. Types</TabsTrigger>
                  <TabsTrigger value="branding" className="text-xs">3. Style</TabsTrigger>
                  <TabsTrigger value="placements" className="text-xs">4. Layout</TabsTrigger>
                  <TabsTrigger value="signatures" className="text-xs">5. Signatures</TabsTrigger>
                </TabsList>

                {/* TAB 1: Properties Panel (NEW) */}
                <TabsContent value="properties" className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Selected Element Properties</label>
                    {renderPropertiesPanel()}
                  </div>

                  {/* Quick Element Selection */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Select Element to Edit</label>
                    <div className="space-y-1">
                      {/* Text elements */}
                      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider pt-1">Text Elements</div>
                      {(Object.keys(TEXT_ELEMENT_LABELS) as TextElementKey[]).map((key) => {
                        const el = textElements[key];
                        const isSelected = selectedTextKey === key;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedElement({ kind: 'text', key });
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                              isSelected
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Type className="h-3 w-3" />
                              {TEXT_ELEMENT_LABELS[key]}
                            </span>
                            <span className="text-[10px] font-mono text-gray-600">{el.fontSize}px</span>
                          </button>
                        );
                      })}

                      {/* Logo elements */}
                      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider pt-2">Logo Elements</div>
                      {(['clubLogo', 'orgLogo', 'eventLogo'] as LogoKey[]).map((key) => {
                        const logo = logoElements[key];
                        const isSelected = selectedLogoKey === key;
                        const labels: Record<LogoKey, string> = { clubLogo: 'Club Logo', orgLogo: 'Partner Logo', eventLogo: 'Co-Host Logo' };
                        const show = key === 'clubLogo' || (key === 'orgLogo' && collabMode) || (key === 'eventLogo' && collabMode);
                        if (!show) return null;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedElement({ kind: 'logo', key })}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                              isSelected
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <ImageIcon className="h-3 w-3" />
                              {labels[key]}
                            </span>
                            <span className="text-[10px] font-mono text-gray-600">{Math.round(logo.width)}x{Math.round(logo.height)}</span>
                          </button>
                        );
                      })}

                      {/* Signatures */}
                      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider pt-2">Signatures</div>
                      {signatures.map((sig, i) => {
                        if (!sig.visible) return null;
                        const isSelected = selectedSigIndex === i;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedElement({ kind: 'signature', index: i })}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                              isSelected
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Award className="h-3 w-3" />
                              {sig.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-600">{sig.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: Certificate Types & Text Customization */}
                <TabsContent value="types" className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Select Available Certificate Types</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(DEFAULT_TEMPLATES).map((type) => {
                        const isChecked = selectedTypes.includes(type);
                        return (
                          <div
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`h-4 w-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-gray-600 bg-transparent'
                            }`}>
                              {isChecked && <span className="text-[10px] font-bold">✓</span>}
                            </div>
                            <span className="text-xs font-medium">{CERT_TYPE_LABELS[type]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedTypes.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customize Text Templates</label>
                        <select
                          value={previewType}
                          onChange={(e) => setPreviewType(e.target.value)}
                          className="w-full h-9 px-3 rounded-md border border-white/10 bg-[#0a0a0a] text-white text-xs focus:border-emerald-500/50 focus:outline-none"
                        >
                          {selectedTypes.map(t => (
                            <option key={t} value={t}>{CERT_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Certificate Title</label>
                          <Input
                            value={templates[previewType]?.title || ''}
                            onChange={(e) => updateTemplate(previewType, 'title', e.target.value)}
                            className="h-8 text-xs border-white/10 bg-white/5 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {textColorControls.map((control) => (
                            <div key={control.key} className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{control.label}</label>
                              <input
                                type="color"
                                value={textColors[control.key]}
                                onChange={(e) => updateTextColor(control.key, e.target.value)}
                                className="h-8 w-full rounded-md border border-white/10 bg-transparent cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              Certificate Text Template
                            </label>
                            <span className="text-[9px] text-gray-600 font-mono">{"Use {{recipient_name}}, {{event_name}}"}</span>
                          </div>
                          <textarea
                            rows={3}
                            value={templates[previewType]?.description || ''}
                            onChange={(e) => updateTemplate(previewType, 'description', e.target.value)}
                            className="w-full p-2 text-xs border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:border-emerald-500/50 resize-y font-sans"
                            placeholder="This certifies that {{recipient_name}}..."
                          />
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-gray-500">
                              Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[9px]">Enter</kbd> for line breaks
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = templates[previewType]?.description || '';
                                if (!cur.includes('\n')) {
                                  let splitIdx = -1;
                                  const searchPhrases = ['successfully participated in', 'participated in', 'successfully served as', 'secured', 'in appreciation of', 'for completing'];
                                  for (const phrase of searchPhrases) {
                                    const idx = cur.indexOf(phrase);
                                    if (idx !== -1) {
                                      splitIdx = idx;
                                      break;
                                    }
                                  }
                                  if (splitIdx === -1) {
                                    const half = Math.floor(cur.length / 2);
                                    const nextSpace = cur.indexOf(' ', half);
                                    splitIdx = nextSpace !== -1 ? nextSpace + 1 : half;
                                  }
                                  if (splitIdx > 0) {
                                    const newText = cur.slice(0, splitIdx).trim() + '\n' + cur.slice(splitIdx).trim();
                                    updateTemplate(previewType, 'description', newText);
                                  }
                                } else {
                                  const newText = cur.replace(/\n+/g, ' ');
                                  updateTemplate(previewType, 'description', newText);
                                }
                              }}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center gap-1"
                            >
                              {(templates[previewType]?.description || '').includes('\n') ? '🔗 Join into 1 line' : '✂️ Split into 2 lines'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: Branding & Style */}
                <TabsContent value="branding" className="space-y-4 pt-2">
                  {/* Theme Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> 1-Click Style Themes
                      </label>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        {THEME_PRESETS[currentTheme]?.name || 'Custom'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {(Object.keys(THEME_PRESETS) as ThemeKey[]).map((tKey) => {
                        const theme = THEME_PRESETS[tKey];
                        const isSelected = currentTheme === tKey;
                        return (
                          <div
                            key={tKey}
                            onClick={() => applyTheme(tKey)}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-sm'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                          >
                            <div
                              className="h-10 w-14 rounded border flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner"
                              style={{
                                backgroundColor: theme.bgColor,
                                borderColor: theme.isLight ? '#cbd5e1' : '#334155',
                              }}
                            >
                              <div
                                className="w-8 h-1 rounded"
                                style={{ backgroundColor: theme.primaryColor }}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-black stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                  {theme.name}
                                </span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 font-mono">
                                  {theme.isLight ? 'Printable Light' : 'Dark Screen'}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{theme.subtitle}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Watermark Section */}
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-200">Security Watermark</p>
                        <p className="text-[10px] text-gray-500">Translucent diagonal anti-counterfeit stamp</p>
                      </div>
                      <Switch checked={watermarkVisible} onCheckedChange={setWatermarkVisible} />
                    </div>

                    {watermarkVisible && (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase font-semibold">Watermark Text</label>
                          <Input
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="VERIFIED"
                            className="h-8 border-white/10 bg-white/5 text-white text-xs font-mono uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Watermark Opacity</span>
                            <span className="font-mono text-white">{Math.round(watermarkOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.02"
                            max="0.25"
                            step="0.01"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                            className="w-full h-1 accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Orientation</label>
                      <select
                        value={orientation}
                        onChange={(e) => {
                          const newOrientation = e.target.value as 'LANDSCAPE' | 'PORTRAIT';
                          setOrientation(newOrientation);
                          // Reposition all elements to defaults for the new orientation
                          const newIsLandscape = newOrientation === 'LANDSCAPE';
                          setTextElements(createDefaultTextElements(newIsLandscape));
                          setLogoElements(createDefaultLogoElements(newIsLandscape));
                          setSignatureLayouts(createDefaultSignatureLayouts(newIsLandscape));
                          setSignatures(prev => prev.map((sig, i) => ({
                            ...sig,
                            layout: createDefaultSignatureLayouts(newIsLandscape)[i] || createDefaultSignatureLayouts(newIsLandscape)[0],
                          })));
                        }}
                        className="w-full h-10 px-3 rounded-md border border-white/10 bg-[#0a0a0a] text-white text-xs focus:border-emerald-500/50 focus:outline-none"
                      >
                        <option value="LANDSCAPE">Landscape (A4)</option>
                        <option value="PORTRAIT">Portrait (A4)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Paper Size</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-md border border-white/10 bg-[#0a0a0a] text-white text-xs focus:border-emerald-500/50 focus:outline-none"
                      >
                        <option value="A4">A4 Standard</option>
                        <option value="LETTER">US Letter</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Primary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                        <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="border-white/10 bg-white/5 text-white text-xs font-mono" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Secondary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                        <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="border-white/10 bg-white/5 text-white text-xs font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                        <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="border-white/10 bg-white/5 text-white text-xs font-mono" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" /> Background Image URL
                      </label>
                      <Input
                        value={bgImage}
                        onChange={e => setBgImage(e.target.value)}
                        placeholder="https://example.com/certificate-bg.png"
                        className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                      />
                      {bgImage && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 uppercase font-semibold">Background Opacity: {Math.round(bgImageOpacity * 100)}%</label>
                          <input type="range" min="0" max="1" step="0.05" value={bgImageOpacity} onChange={e => setBgImageOpacity(parseFloat(e.target.value))} className="w-full h-1 accent-emerald-500 cursor-pointer" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Club Logo URL</label>
                    <Input
                      value={clubLogo}
                      onChange={e => setClubLogo(e.target.value)}
                      placeholder="/logo.svg or https://example.com/club-logo.png"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-200">Collaboration Mode</p>
                      <p className="text-[10px] text-gray-500">Enable to display organizer and partner logos</p>
                    </div>
                    <Switch checked={collabMode} onCheckedChange={setCollabMode} />
                  </div>

                  {collabMode && (
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Partner Logo URL</label>
                        <Input value={orgLogo} onChange={e => setOrgLogo(e.target.value)} placeholder="https://example.com/collaborator-logo.png" className="border-white/10 bg-white/5 text-white placeholder:text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Co-Host/Sponsor Logo URL</label>
                        <Input value={eventLogo} onChange={e => setEventLogo(e.target.value)} placeholder="https://example.com/cohost-logo.png" className="border-white/10 bg-white/5 text-white placeholder:text-gray-700" />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: Placement Controls */}
                <TabsContent value="placements" className="space-y-4 pt-2">
                  <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Verification QR Code</span>
                      <Switch checked={qrVisible} onCheckedChange={setQrVisible} />
                    </div>

                    {qrVisible && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position X</span>
                            <span className="font-mono text-white">{qrX}px</span>
                          </div>
                          <input type="range" min="0" max={width} value={qrX} onChange={(e) => setQrX(parseInt(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position Y</span>
                            <span className="font-mono text-white">{qrY}px</span>
                          </div>
                          <input type="range" min="0" max={height} value={qrY} onChange={(e) => setQrY(parseInt(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Size</span>
                            <span className="font-mono text-white">{qrSize}px</span>
                          </div>
                          <input type="range" min="40" max="200" value={qrSize} onChange={(e) => setQrSize(parseInt(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Certificate ID Block</span>
                      <Switch checked={idVisible} onCheckedChange={setIdVisible} />
                    </div>

                    {idVisible && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position X</span>
                            <span className="font-mono text-white">{idX}px</span>
                          </div>
                          <input type="range" min="0" max={width} value={idX} onChange={(e) => setIdX(parseInt(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position Y</span>
                            <span className="font-mono text-white">{idY}px</span>
                          </div>
                          <input type="range" min="0" max={height} value={idY} onChange={(e) => setIdY(parseInt(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 5: Signatures */}
                <TabsContent value="signatures" className="space-y-4 pt-2">
                  {signatures.map((sig, i) => (
                    <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Signature {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">Visible</span>
                          <Switch checked={sig.visible} onCheckedChange={v => updateSignature(i, 'visible', v)} />
                        </div>
                      </div>

                      {sig.visible && (
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">Name</label>
                              <Input value={sig.name} onChange={e => updateSignature(i, 'name', e.target.value)} className="h-8 text-xs border-white/10 bg-white/5 text-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">Title</label>
                              <Input value={sig.title} onChange={e => updateSignature(i, 'title', e.target.value)} className="h-8 text-xs border-white/10 bg-white/5 text-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-semibold block">Signature Image URL</label>
                            <Input
                              value={sig.image}
                              onChange={e => updateSignature(i, 'image', e.target.value)}
                              placeholder="https://example.com/signature.png"
                              className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Live Preview</h3>
              <select
                value={previewType}
                onChange={(e) => setPreviewType(e.target.value)}
                className="h-7 px-2 rounded border border-white/10 bg-black text-xs text-white focus:outline-none"
              >
                {selectedTypes.map(t => (
                  <option key={t} value={t}>{CERT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Drag elements to reposition
            </span>
          </div>

          <div
            className="w-full rounded-xl overflow-hidden border border-white/10 bg-[#000000] shadow-2xl relative"
            style={{ aspectRatio: `${width}/${height}` }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full select-none"
              onClick={(e) => {
                // Deselect when clicking empty canvas
                if (e.target === svgRef.current || (e.target as Element).tagName === 'rect' && (e.target as Element).getAttribute('fill') === bgColor) {
                  setSelectedElement(null);
                }
              }}
            >
              <defs>
                <linearGradient id="borderGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.6" />
                  <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="textGradPreview" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
                <linearGradient id="typeGradPreview" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
                <pattern id="gridPreview" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background */}
              {bgImage ? (
                <image x="0" y="0" width={width} height={height} href={bgImage} preserveAspectRatio="xMidYMid slice" opacity={bgImageOpacity} />
              ) : (
                <>
                  <rect width={width} height={height} fill={bgColor} />
                  {currentTheme === 'CYBER' && <rect width={width} height={height} fill="url(#gridPreview)" />}
                </>
              )}

              {/* Theme Borders & Corners */}
              {currentTheme === 'ACADEMIC' ? (
                <>
                  {/* Academic Theme: Ornate Double Gold & Navy Border */}
                  <rect x="18" y="18" width={width - 36} height={height - 36} rx="4" fill="none" stroke={primaryColor} strokeWidth="3" />
                  <rect x="26" y="26" width={width - 52} height={height - 52} rx="2" fill="none" stroke={secondaryColor} strokeWidth="1" opacity="0.5" />
                  {/* Classical Gold Corner Brackets */}
                  <path d="M 18 55 L 55 55 L 55 18 M 26 62 L 62 62 L 62 26" stroke={primaryColor} strokeWidth="2" fill="none" />
                  <path d={`M ${width - 18} 55 L ${width - 55} 55 L ${width - 55} 18 M ${width - 26} 62 L ${width - 62} 62 L ${width - 62} 26`} stroke={primaryColor} strokeWidth="2" fill="none" />
                  <path d={`M 18 ${height - 55} L 55 ${height - 55} L 55 ${height - 18} M 26 ${height - 62} L 62 ${height - 62} L 62 ${height - 26}`} stroke={primaryColor} strokeWidth="2" fill="none" />
                  <path d={`M ${width - 18} ${height - 55} L ${width - 55} ${height - 55} L ${width - 55} ${height - 18} M ${width - 26} ${height - 62} L ${width - 62} ${height - 62} L ${width - 62} ${height - 26}`} stroke={primaryColor} strokeWidth="2" fill="none" />
                </>
              ) : currentTheme === 'MODERN' ? (
                <>
                  {/* Clean Modern: Minimalist Slate Frame with Dual Color Rules */}
                  <rect x="20" y="20" width={width - 40} height={height - 40} rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="20" x2={width / 3} y2="20" stroke={primaryColor} strokeWidth="3.5" />
                  <line x1={2 * width / 3} y1="20" x2={width - 20} y2="20" stroke={secondaryColor} strokeWidth="3.5" />
                  <line x1="20" y1={height - 20} x2={width / 3} y2={height - 20} stroke={secondaryColor} strokeWidth="3.5" />
                  <line x1={2 * width / 3} y1={height - 20} x2={width - 20} y2={height - 20} stroke={primaryColor} strokeWidth="3.5" />
                </>
              ) : (
                <>
                  {/* Cyber Theme: Neon Rounded Gradient Border & Tech Ticks */}
                  <rect x="15" y="15" width={width - 30} height={height - 30} rx="14" fill="none" stroke="url(#borderGradPreview)" strokeWidth="2" />
                  <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke={primaryColor} strokeWidth="2" opacity="0.7" />
                  <path d={`M ${width - 30} 30 L ${width - 30} 60 M ${width - 30} 30 L ${width - 60} 30`} stroke={secondaryColor} strokeWidth="2" opacity="0.7" />
                  <path d={`M 30 ${height - 30} L 30 ${height - 60} M 30 ${height - 30} L 60 ${height - 30}`} stroke={primaryColor} strokeWidth="2" opacity="0.7" />
                  <path d={`M ${width - 30} ${height - 30} L ${width - 30} ${height - 60} M ${width - 30} ${height - 30} L ${width - 60} ${height - 30}`} stroke={secondaryColor} strokeWidth="2" opacity="0.7" />
                </>
              )}

              {/* Security Watermark */}
              {watermarkVisible && watermarkText && (
                <g transform={`translate(${width / 2}, ${height / 2}) rotate(-25)`} pointerEvents="none">
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="sans-serif"
                    fontSize={isLandscape ? 120 : 90}
                    fontWeight="900"
                    letterSpacing="14"
                    fill={currentTheme === 'ACADEMIC' ? '#b45309' : currentTheme === 'MODERN' ? '#0284c7' : primaryColor}
                    opacity={watermarkOpacity}
                    style={{ userSelect: 'none' }}
                  >
                    {watermarkText.toUpperCase()}
                  </text>
                </g>
              )}

              {/* Alignment Guide Lines */}
              {alignmentGuides?.vertical != null && (
                <line
                  x1={alignmentGuides.vertical}
                  y1="0"
                  x2={alignmentGuides.vertical}
                  y2={height}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              )}
              {alignmentGuides?.horizontal != null && (
                <line
                  x1="0"
                  y1={alignmentGuides.horizontal}
                  x2={width}
                  y2={alignmentGuides.horizontal}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              )}

              {/* Logos */}
              {renderLogo('orgLogo', orgLogo, collabMode && !!orgLogo)}
              {renderLogo('eventLogo', eventLogo, collabMode && !!eventLogo)}
              {clubLogo ? renderLogo('clubLogo', clubLogo, true) : (
                <g transform={`translate(${width / 2 - 60}, 45)`}>
                  <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.6" />
                  <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke={primaryColor} strokeWidth="1" />
                  <text x="60" y="75" textAnchor="middle" fontFamily="sans-serif" fontSize="28" fill={primaryColor}>✓</text>
                </g>
              )}

              {/* All Text Elements */}
              {(['headerTitle', 'headerSubtitle', 'intro', 'recipientName', 'eventLabel', 'eventName', 'certificateTitle', 'description', 'issueDate', 'issueDateLabel', 'certificateId', 'footer'] as TextElementKey[]).map((key) => (
                renderTextElement(key)
              ))}

              {/* Certificate Title rendered via textElements loop above — no duplicate, no box */}

              {/* Certificate ID rendered via textElements — no duplicate */}

              {/* Custom Placed QR Code */}
              {qrVisible && (
                <g transform={`translate(${qrX}, ${qrY})`}>
                  <rect x="-5" y="-5" width={qrSize + 10} height={qrSize + 10} fill="#ffffff" rx="4" />
                  <rect x="5" y="5" width={qrSize / 3} height={qrSize / 3} fill="#000000" />
                  <rect x={qrSize - (qrSize / 3) - 5} y="5" width={qrSize / 3} height={qrSize / 3} fill="#000000" />
                  <rect x="5" y={qrSize - (qrSize / 3) - 5} width={qrSize / 3} height={qrSize / 3} fill="#000000" />
                  <rect x={qrSize / 3} y={qrSize / 3} width={qrSize / 3} height={qrSize / 3} fill="#000000" opacity="0.8" />
                </g>
              )}

              {/* Signatures — with correct original indices */}
              {activeSigs.length > 0 ? (
                activeSigs.map((sig, filteredIdx) => {
                  const origIdx = visibleSigIndices[filteredIdx] ?? filteredIdx;
                  const layout = sig.layout || signatureLayouts[origIdx];
                  const xPos = layout?.x ?? (width / 2);
                  const yPos = layout?.y ?? (isLandscape ? 700 : 960);
                  const sigImgW = layout?.imageWidth ?? 100;
                  const sigImgH = layout?.imageHeight ?? 50;
                  // Image has its own independent position, defaulting to above the name line
                  const sigImgX = layout?.imageX ?? (xPos - sigImgW / 2);
                  const sigImgY = layout?.imageY ?? (yPos - sigImgH - 10);
                  const isSigSelected = selectedSigIndex === origIdx;
                  return (
                    <g key={origIdx}>
                      {/* Signature image — independently draggable & resizable */}
                      {sig.image && (
                        <g
                          onPointerDown={(e) => { e.stopPropagation(); beginDrag('signatureImage', origIdx, 'move', e, { x: sigImgX, y: sigImgY, width: sigImgW, height: sigImgH }); }}
                          style={{ cursor: 'move' }}
                        >
                          <image x={sigImgX} y={sigImgY} width={sigImgW} height={sigImgH} href={sig.image} preserveAspectRatio="xMidYMid meet" />
                          {isSigSelected && (
                            <>
                              <rect x={sigImgX - 2} y={sigImgY - 2} width={sigImgW + 4} height={sigImgH + 4} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="5 4" rx="2" />
                              <rect x={sigImgX + sigImgW - 6} y={sigImgY + sigImgH - 6} width={12} height={12} fill={primaryColor} stroke="#000" strokeWidth="1" rx="2" style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => { e.stopPropagation(); beginDrag('signatureImage', origIdx, 'resize', e, { x: sigImgX, y: sigImgY, width: sigImgW, height: sigImgH }, 'br'); }} />
                              <rect x={sigImgX - 6} y={sigImgY + sigImgH - 6} width={12} height={12} fill={primaryColor} stroke="#000" strokeWidth="1" rx="2" style={{ cursor: 'nesw-resize' }} onPointerDown={(e) => { e.stopPropagation(); beginDrag('signatureImage', origIdx, 'resize', e, { x: sigImgX, y: sigImgY, width: sigImgW, height: sigImgH }, 'bl'); }} />
                              <rect x={sigImgX + sigImgW - 6} y={sigImgY - 6} width={12} height={12} fill={primaryColor} stroke="#000" strokeWidth="1" rx="2" style={{ cursor: 'nesw-resize' }} onPointerDown={(e) => { e.stopPropagation(); beginDrag('signatureImage', origIdx, 'resize', e, { x: sigImgX, y: sigImgY, width: sigImgW, height: sigImgH }, 'tr'); }} />
                              <rect x={sigImgX - 6} y={sigImgY - 6} width={12} height={12} fill={primaryColor} stroke="#000" strokeWidth="1" rx="2" style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => { e.stopPropagation(); beginDrag('signatureImage', origIdx, 'resize', e, { x: sigImgX, y: sigImgY, width: sigImgW, height: sigImgH }, 'tl'); }} />
                            </>
                          )}
                        </g>
                      )}

                      {/* Signature line + name + title — draggable as a unit */}
                      <g
                        onPointerDown={(e) => beginDrag('signature', origIdx, 'move', e, { x: xPos, y: yPos })}
                        style={{ cursor: 'move' }}
                      >
                        <line x1={xPos - 90} y1={yPos} x2={xPos + 90} y2={yPos} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x={xPos} y={yPos + 20} textAnchor="middle" fontFamily="sans-serif" fontSize={layout?.nameFontSize || 14} fontWeight="bold" fill={layout?.nameColor || textColors.signatureName}>{sig.name}</text>
                        <text x={xPos} y={yPos + 38} textAnchor="middle" fontFamily="sans-serif" fontSize={layout?.titleFontSize || 11} fill={layout?.titleColor || textColors.signatureTitle}>{sig.title}</text>
                        {isSigSelected && !sig.image && (
                          <rect x={xPos - 100} y={yPos - 10} width={200} height={60} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="5 4" rx="2" />
                        )}
                      </g>
                    </g>
                  );
                })
              ) : (
                <g transform={`translate(${width / 2}, ${isLandscape ? 700 : 960})`}>
                  <text x="0" y="20" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill={textColors.footer}>[No Signatures Configured]</text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
