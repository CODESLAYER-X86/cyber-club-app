'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Loader2, Sparkles, Image as ImageIcon,
  Paintbrush, Settings, Sliders, Type, CheckCircle, Plus, Trash2, Award
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface SignatureConfig {
  name: string;
  title: string;
  image: string;
  visible: boolean;
}

interface TextTemplate {
  title: string;
  description: string;
}

interface LayoutConfig {
  orientation: "LANDSCAPE" | "PORTRAIT";
  paperSize: "A4" | "LETTER";
  bgImage: string;
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
  templates: Record<string, TextTemplate>;
  selectedTypes: string[];
  signatures: SignatureConfig[];
}

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

export function CertificateDesigner() {
  const { selectedEventId, setCurrentView } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [eventTitle, setEventTitle] = useState('Dynamic Event Title');
  const [loading, setLoading] = useState(true);

  // Layout states
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">("LANDSCAPE");
  const [paperSize, setPaperSize] = useState<"A4" | "LETTER">("A4");
  const [bgImage, setBgImage] = useState('');
  const [bgColor, setBgColor] = useState('#000000');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [collabMode, setCollabMode] = useState(false);
  const [clubLogo, setClubLogo] = useState('/logo.png');
  const [orgLogo, setOrgLogo] = useState('');
  const [eventLogo, setEventLogo] = useState('');

  // Placements
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

  // Signatures
  const [signatures, setSignatures] = useState<SignatureConfig[]>([
    { name: 'Dr. John Doe', title: 'President', image: '', visible: true },
    { name: 'Alice Smith', title: 'General Secretary', image: '', visible: true },
    { name: 'Bob Johnson', title: 'Event Coordinator', image: '', visible: false },
  ]);

  useEffect(() => {
    if (!selectedEventId) return;
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

        const res = await fetch(`/api/events/${selectedEventId}`);
        const data = await res.json();
        if (data.success && data.data.event) {
          const ev = data.data.event;
          setEventTitle(ev.title);
          if (ev.certificateLayout) {
            try {
              const layout: LayoutConfig = JSON.parse(ev.certificateLayout);
              setOrientation(layout.orientation || "LANDSCAPE");
              setPaperSize(layout.paperSize || "A4");
              setBgImage(layout.bgImage || '');
              setBgColor((layout as any).bgColor || '#000000');
              setPrimaryColor(layout.primaryColor || defaultPrimary);
              setSecondaryColor(layout.secondaryColor || defaultSecondary);
              setCollabMode(layout.collabMode ?? false);
              setClubLogo((layout as any).clubLogo || '/logo.png');
              setOrgLogo(layout.orgLogo || '');
              setEventLogo(layout.eventLogo || '');

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

              if (layout.signatures && Array.isArray(layout.signatures)) {
                setSignatures(layout.signatures);
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
  }, [selectedEventId]);

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
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const active = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];
      if (active.length > 0 && !active.includes(previewType)) {
        setPreviewType(active[0]);
      }
      return active;
    });
  };

  const handleSave = async () => {
    if (!selectedEventId) return;
    if (selectedTypes.length === 0) {
      toast({ title: 'Validation Error', description: 'You must select at least one certificate type', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const layoutConfig: LayoutConfig = {
      orientation,
      paperSize,
      bgImage,
      bgColor,
      primaryColor,
      secondaryColor,
      collabMode,
      clubLogo,
      orgLogo: collabMode ? orgLogo : '',
      eventLogo: collabMode ? eventLogo : '',
      qrCode: { visible: qrVisible, size: qrSize, x: qrX, y: qrY },
      certId: { visible: idVisible, x: idX, y: idY },
      selectedTypes,
      templates,
      signatures,
    };

    try {
      const res = await fetch(`/api/events/${selectedEventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateLayout: JSON.stringify(layoutConfig) }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Design Saved', description: 'Certificate template has been updated.' });
        setCurrentView('event-detail');
      } else {
        toast({ title: 'Save Failed', description: data.error || 'Could not save layout config', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network Error', description: 'Could not connect to server', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-gray-500 font-medium">Loading certificate designer...</p>
      </div>
    );
  }

  const activeSigs = signatures.filter(s => s.visible);
  const sigCount = activeSigs.length;

  const currentTemplate = templates[previewType] || DEFAULT_TEMPLATES.PARTICIPATION;
  const previewTitle = currentTemplate.title;
  const previewDesc = currentTemplate.description
    .replace('{{recipient_name}}', 'Md. Rahim Uddin Shuvo')
    .replace('{{event_name}}', eventTitle)
    .replace('{{certificate_type}}', CERT_TYPE_LABELS[previewType] || previewType)
    .replace('{{position}}', previewType.includes('PLACE') ? CERT_TYPE_LABELS[previewType] : 'Winner')
    .replace('{{certificate_id}}', 'CSC-2026-CYBERSEC-00125')
    .replace('{{issue_date}}', 'June 15, 2026');

  // SVG parameters
  const isLandscape = orientation === 'LANDSCAPE';
  const width = isLandscape ? 1200 : 840;
  const height = isLandscape ? 840 : 1200;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentView('event-detail')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Design
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-md text-white flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-emerald-400" />
                Certificate Designer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="types" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="types" className="text-xs">1. Types</TabsTrigger>
                  <TabsTrigger value="branding" className="text-xs">2. Style</TabsTrigger>
                  <TabsTrigger value="placements" className="text-xs">3. Layout</TabsTrigger>
                  <TabsTrigger value="signatures" className="text-xs">4. Signatures</TabsTrigger>
                </TabsList>

                {/* TAB 1: Certificate Types Selection & Text Customization */}
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
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customize Text templates</label>
                        <div className="flex gap-2">
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
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Certificate Text Template</span>
                            <span className="text-[9px] text-gray-600 font-mono">{"Use {{recipient_name}}"}</span>
                          </label>
                          <textarea
                            rows={3}
                            value={templates[previewType]?.description || ''}
                            onChange={(e) => updateTemplate(previewType, 'description', e.target.value)}
                            className="w-full p-2 text-xs border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
                            placeholder="This certifies that {{recipient_name}}..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 2: Branding & Style Customization */}
                <TabsContent value="branding" className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Orientation</label>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as any)}
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
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                        />
                        <Input
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="border-white/10 bg-white/5 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={e => setSecondaryColor(e.target.value)}
                          className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={e => setSecondaryColor(e.target.value)}
                          className="border-white/10 bg-white/5 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={e => setBgColor(e.target.value)}
                          className="h-9 w-9 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                        />
                        <Input
                          value={bgColor}
                          onChange={e => setBgColor(e.target.value)}
                          className="border-white/10 bg-white/5 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" /> Background Image URL
                      </label>
                      <Input
                        value={bgImage}
                        onChange={e => setBgImage(e.target.value)}
                        placeholder="https://example.com/certificate-bg.png (optional)"
                        className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Club Logo URL</label>
                    <Input
                      value={clubLogo}
                      onChange={e => setClubLogo(e.target.value)}
                      placeholder="/logo.png or https://example.com/club-logo.png"
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
                        <Input
                          value={orgLogo}
                          onChange={e => setOrgLogo(e.target.value)}
                          placeholder="https://example.com/collaborator-logo.png"
                          className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Co-Host/Sponsor Logo URL</label>
                        <Input
                          value={eventLogo}
                          onChange={e => setEventLogo(e.target.value)}
                          placeholder="https://example.com/cohost-logo.png"
                          className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: Placement Sliders */}
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
                          <input
                            type="range" min="0" max={width} value={qrX}
                            onChange={(e) => setQrX(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position Y</span>
                            <span className="font-mono text-white">{qrY}px</span>
                          </div>
                          <input
                            type="range" min="0" max={height} value={qrY}
                            onChange={(e) => setQrY(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Size</span>
                            <span className="font-mono text-white">{qrSize}px</span>
                          </div>
                          <input
                            type="range" min="40" max="200" value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
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
                          <input
                            type="range" min="0" max={width} value={idX}
                            onChange={(e) => setIdX(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Position Y</span>
                            <span className="font-mono text-white">{idY}px</span>
                          </div>
                          <input
                            type="range" min="0" max={height} value={idY}
                            onChange={(e) => setIdY(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 4: Signatures */}
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
                              <Input
                                value={sig.name}
                                onChange={e => updateSignature(i, 'name', e.target.value)}
                                className="h-8 text-xs border-white/10 bg-white/5 text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">Title</label>
                              <Input
                                value={sig.title}
                                onChange={e => updateSignature(i, 'title', e.target.value)}
                                className="h-8 text-xs border-white/10 bg-white/5 text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-semibold block">Signature Image (transparent PNG)</label>
                            <div className="flex gap-2 items-center">
                              {sig.image ? (
                                <div className="relative border border-white/10 bg-black/40 rounded p-1 flex items-center justify-center shrink-0">
                                  <img src={sig.image} alt="Signature Preview" className="h-10 w-10 object-contain" />
                                  <button
                                    onClick={() => updateSignature(i, 'image', '')}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-[8px] leading-none hover:bg-red-500"
                                    type="button"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="image/png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const img = new Image();
                                    const objectUrl = URL.createObjectURL(file);
                                    img.onload = () => {
                                      if (img.width > 200 || img.height > 200) {
                                        toast({
                                          title: "Invalid Signature Resolution",
                                          description: `Signature image resolution must not exceed 200x200 pixels (uploaded: ${img.width}x${img.height}).`,
                                          variant: "destructive"
                                        });
                                        URL.revokeObjectURL(objectUrl);
                                        return;
                                      }

                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result) {
                                          updateSignature(i, 'image', event.target.result as string);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                      URL.revokeObjectURL(objectUrl);
                                    };
                                    img.src = objectUrl;
                                  }}
                                  className="h-8 text-xs border-white/10 bg-white/5 text-white cursor-pointer file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                />
                              )}
                            </div>
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
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Live canvas
            </span>
          </div>

          <div
            className="w-full rounded-xl overflow-hidden border border-white/10 bg-[#000000] shadow-2xl relative"
            style={{ aspectRatio: `${width}/${height}` }}
          >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
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
                <image x="0" y="0" width={width} height={height} href={bgImage} preserveAspectRatio="xMidYMid slice" />
              ) : (
                <>
                  <rect width={width} height={height} fill={bgColor} />
                  <rect width={width} height={height} fill="url(#gridPreview)" />
                </>
              )}

              {/* Borders */}
              <rect x="15" y="15" width={width - 30} height={height - 30} rx="16" fill="none" stroke="url(#borderGradPreview)" strokeWidth="2" />
              <path d={`M 30 30 L 30 60 M 30 30 L 60 30`} stroke={primaryColor} strokeWidth="2" opacity="0.5" />
              <path d={`M ${width - 30} 30 L ${width - 30} 60 M ${width - 30} 30 L ${width - 60} 30`} stroke={secondaryColor} strokeWidth="2" opacity="0.5" />
              <path d={`M 30 ${height - 30} L 30 ${height - 60} M 30 ${height - 30} L 60 ${height - 30}`} stroke={primaryColor} strokeWidth="2" opacity="0.5" />
              <path d={`M ${width - 30} ${height - 30} L ${width - 30} ${height - 60} M ${width - 30} ${height - 30} L ${width - 60} ${height - 30}`} stroke={secondaryColor} strokeWidth="2" opacity="0.5" />

              {/* Collaborator Logo */}
              {collabMode && orgLogo && <image x="50" y="45" width="80" height="80" href={orgLogo} />}

              {/* Co-Host Logo */}
              {collabMode && eventLogo && <image x={isLandscape ? "1070" : "710"} y="45" width="80" height="80" href={eventLogo} />}

              {/* Decorative Seal/Club Logo */}
              {clubLogo ? (
                <image x={width / 2 - 40} y="45" width="80" height="80" href={clubLogo} />
              ) : (
                <g transform={`translate(${width / 2 - 60}, 45)`}>
                  <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.6" />
                  <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke={primaryColor} strokeWidth="1" />
                  <text x="60" y="75" textAnchor="middle" fontFamily="sans-serif" fontSize="28" fill={primaryColor}>✓</text>
                </g>
              )}

              {/* Certificate Authority Headers */}
              <text x={width / 2} y={isLandscape ? "210" : "230"} textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="bold" fill="#ffffff" letterSpacing="6">CYBER SECURITY CLUB</text>
              <text x={width / 2} y={isLandscape ? "235" : "255"} textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#6b7280" letterSpacing="2">VERIFIED DIGITAL CERTIFICATE</text>

              {/* Core Text Elements */}
              <text x={width / 2} y={isLandscape ? "290" : "320"} textAnchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">This is to certify that</text>
              <text x={width / 2} y={isLandscape ? "350" : "390"} textAnchor="middle" fontFamily="sans-serif" fontSize="42" fontWeight="bold" fill="url(#textGradPreview)">Md. Rahim Uddin Shuvo</text>
              <text x={width / 2} y={isLandscape ? "395" : "440"} textAnchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">has successfully completed the event</text>
              <text x={width / 2} y={isLandscape ? "435" : "480"} textAnchor="middle" fontFamily="sans-serif" fontSize="26" fontWeight="bold" fill="#ffffff">{eventTitle}</text>

              {/* Certificate Type Banner */}
              <g transform={`translate(${width / 2 - 130}, ${isLandscape ? 465 : 520})`}>
                <rect width="260" height="32" rx="16" fill="url(#typeGradPreview)" opacity="0.2" />
                <rect width="260" height="32" rx="16" fill="none" stroke="url(#typeGradPreview)" strokeWidth="1" />
                <text x="130" y="20" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">{previewTitle}</text>
              </g>

              {/* Dynamic Recipient Description Text */}
              <text x={width / 2} y={isLandscape ? "535" : "600"} textAnchor="middle" fontFamily="sans-serif" fontSize="13" fill="#6b7280" width={width - 200}>
                {previewDesc}
              </text>

              {/* Custom Placed Certificate ID */}
              {idVisible && (
                <text x={idX} y={idY} textAnchor="middle" fontFamily="monospace" fontSize="14" fill={primaryColor}>
                  CSC-2026-CYBERSEC-00125
                </text>
              )}

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

              {/* Signatures Row */}
              {sigCount > 0 ? (
                activeSigs.map((sig, idx) => {
                  const xPos = sigCount === 1 ? (width / 2) : sigCount === 2 ? (width / 2 - 200 + idx * 400) : (width / 2 - 300 + idx * 300);
                  const yPos = isLandscape ? 700 : 960;
                  return (
                    <g key={idx} transform={`translate(${xPos}, ${yPos})`}>
                      <line x1="-90" y1="0" x2="90" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      {sig.image && <image x="-50" y="-60" width="100" height="50" href={sig.image} preserveAspectRatio="xMidYMid meet" />}
                      <text x="0" y="20" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">{sig.name}</text>
                      <text x="0" y="38" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#6b7280">{sig.title}</text>
                    </g>
                  );
                })
              ) : (
                <g transform={`translate(${width / 2}, ${isLandscape ? 700 : 960})`}>
                  <text x="0" y="20" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#4b5563">[No Signatures Configured]</text>
                </g>
              )}

              {/* Verification Info footer */}
              <line x1="100" y1={height - 50} x2={width - 100} y2={height - 50} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={width / 2} y={height - 30} textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#4b5563">
                Verification URL: https://cybersec.club/?cert=CSC-2026-CYBERSEC-00125
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
