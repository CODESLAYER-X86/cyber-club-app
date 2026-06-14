'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Sparkles, Image as ImageIcon, CheckCircle, Paintbrush, FileText, Check } from 'lucide-react';
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

interface LayoutConfig {
  bgImage: string;
  primaryColor: string;
  secondaryColor: string;
  title: string;
  orgLogo: string;
  eventLogo: string;
  signatures: SignatureConfig[];
}

export function CertificateDesigner() {
  const { currentUser, selectedEventId, setCurrentView } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [eventTitle, setEventTitle] = useState('Dynamic Event Title');
  const [loading, setLoading] = useState(true);

  // Layout states
  const [bgImage, setBgImage] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981'); // default emerald
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4'); // default cyan
  const [title, setTitle] = useState('CERTIFICATE OF PARTICIPATION');
  const [orgLogo, setOrgLogo] = useState('');
  const [eventLogo, setEventLogo] = useState('');

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
        const res = await fetch(`/api/events/${selectedEventId}`);
        const data = await res.json();
        if (data.success && data.data.event) {
          const ev = data.data.event;
          setEventTitle(ev.title);
          if (ev.certificateLayout) {
            try {
              const layout: LayoutConfig = JSON.parse(ev.certificateLayout);
              setBgImage(layout.bgImage || '');
              setPrimaryColor(layout.primaryColor || '#10b981');
              setSecondaryColor(layout.secondaryColor || '#06b6d4');
              setTitle(layout.title || 'CERTIFICATE OF PARTICIPATION');
              setOrgLogo(layout.orgLogo || '');
              setEventLogo(layout.eventLogo || '');
              if (layout.signatures && Array.isArray(layout.signatures)) {
                setSignatures(layout.signatures);
              }
            } catch (e) {
              console.error('Failed to parse certificate layout JSON:', e);
            }
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

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    const layoutConfig: LayoutConfig = {
      bgImage,
      primaryColor,
      secondaryColor,
      title,
      orgLogo,
      eventLogo,
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
        <p className="text-sm text-gray-500">Loading certificate configuration...</p>
      </div>
    );
  }

  // Pre-calculate X coordinates for active signatures
  const activeSigs = signatures.filter(s => s.visible);
  const sigCount = activeSigs.length;

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
        {/* Editor Settings (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-emerald-400" />
                Certificate Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 w-full justify-start">
                  <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                  <TabsTrigger value="logos" className="text-xs">Logos & bg</TabsTrigger>
                  <TabsTrigger value="signatures" className="text-xs">Signatures</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Certificate Title</label>
                    <Input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. CERTIFICATE OF PARTICIPATION"
                      className="border-white/10 bg-white/5 text-white"
                    />
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
                </TabsContent>

                <TabsContent value="logos" className="space-y-4 pt-2">
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

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Organization Logo URL</label>
                    <Input
                      value={orgLogo}
                      onChange={e => setOrgLogo(e.target.value)}
                      placeholder="https://example.com/club-logo.png (optional)"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Event Logo URL</label>
                    <Input
                      value={eventLogo}
                      onChange={e => setEventLogo(e.target.value)}
                      placeholder="https://example.com/event-logo.png (optional)"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-700"
                    />
                  </div>
                </TabsContent>

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
                            <label className="text-[10px] text-gray-500 uppercase font-semibold">Signature Image URL</label>
                            <Input
                              value={sig.image}
                              onChange={e => updateSignature(i, 'image', e.target.value)}
                              placeholder="https://example.com/signature-line.png (optional)"
                              className="h-8 text-xs border-white/10 bg-white/5 text-white placeholder:text-gray-700"
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

        {/* Live Preview (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Live Certificate Preview</h3>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Sparkles className="h-3 w-3 text-emerald-400" /> Real-time rendering</span>
          </div>

          <div className="w-full aspect-[1200/630] rounded-xl overflow-hidden border border-white/10 bg-[#070707] shadow-2xl relative">
            <svg viewBox="0 0 1200 630" className="w-full h-full select-none">
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
                <image x="0" y="0" width="1200" height="630" href={bgImage} preserveAspectRatio="xMidYMid slice" />
              ) : (
                <>
                  <rect width="1200" height="630" fill="#0a0a0a" />
                  <rect width="1200" height="630" fill="url(#gridPreview)" />
                </>
              )}

              {/* Borders */}
              <rect x="15" y="15" width="1170" height="600" rx="16" fill="none" stroke="url(#borderGradPreview)" strokeWidth="2" />
              <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke={primaryColor} strokeWidth="2" opacity="0.5" />
              <path d="M 1170 30 L 1170 60 M 1170 30 L 1140 30" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />
              <path d="M 30 600 L 30 570 M 30 600 L 60 600" stroke={primaryColor} strokeWidth="2" opacity="0.5" />
              <path d="M 1170 600 L 1170 570 M 1170 600 L 1140 600" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />

              {/* Org Logo */}
              {orgLogo && <image x="50" y="45" width="80" height="80" href={orgLogo} />}

              {/* Event Logo */}
              {eventLogo && <image x="1070" y="45" width="80" height="80" href={eventLogo} />}

              {/* Badge/Seal */}
              <g transform="translate(540, 45)">
                <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.6" />
                <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill={`rgba(16,185,129,0.1)`} stroke={primaryColor} strokeWidth="1" />
                <text x="60" y="75" textAnchor="middle" fontFamily="sans-serif" fontSize="28" fill={primaryColor}>✓</text>
              </g>

              {/* Main Text Fields */}
              <text x="600" y="195" textAnchor="middle" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#ffffff" letterSpacing="6">CYBER SECURITY CLUB</text>
              <text x="600" y="220" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#6b7280" letterSpacing="2">VERIFIED DIGITAL CERTIFICATE</text>

              <text x="600" y="270" textAnchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">This is to certify that</text>
              <text x="600" y="325" textAnchor="middle" fontFamily="sans-serif" fontSize="42" fontWeight="bold" fill="url(#textGradPreview)">Md. Rahim Uddin Shuvo</text>
              <text x="600" y="365" textAnchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">has successfully completed the event</text>
              <text x="600" y="405" textAnchor="middle" fontFamily="sans-serif" fontSize="26" fontWeight="bold" fill="#ffffff">{eventTitle}</text>

              {/* Certificate Type Label Block */}
              <rect x="520" y="425" width="160" height="28" rx="14" fill="url(#typeGradPreview)" opacity="0.2" />
              <rect x="520" y="425" width="160" height="28" rx="14" fill="none" stroke="url(#typeGradPreview)" strokeWidth="1" />
              <text x="600" y="444" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">{title}</text>

              {/* Mock Certificate ID */}
              <text x="600" y="480" textAnchor="middle" fontFamily="monospace" fontSize="14" fill={primaryColor}>CSC-2026-CYBERSEC-00125</text>

              {/* Dynamic Signatures Rendering */}
              {sigCount > 0 ? (
                activeSigs.map((sig, idx) => {
                  const xPos = sigCount === 1 ? 600 : sigCount === 2 ? (400 + idx * 400) : (300 + idx * 300);
                  return (
                    <g key={idx} transform={`translate(${xPos}, 510)`}>
                      <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      {sig.image && <image x="-60" y="-70" width="120" height="60" href={sig.image} />}
                      <text x="0" y="20" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">{sig.name}</text>
                      <text x="0" y="38" text-anchor="middle" fontFamily="sans-serif" fontSize="11" fill="#6b7280">{sig.title}</text>
                    </g>
                  );
                })
              ) : (
                <>
                  <g transform="translate(300, 510)">
                    <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <text x="0" y="20" text-anchor="middle" fontFamily="sans-serif" fontSize="14" fill="#ffffff">President</text>
                    <text x="0" y="38" text-anchor="middle" fontFamily="sans-serif" fontSize="11" fill="#6b7280">Cyber Security Club</text>
                  </g>
                  <g transform="translate(900, 510)">
                    <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <text x="0" y="20" text-anchor="middle" fontFamily="sans-serif" fontSize="14" fill="#ffffff">General Secretary</text>
                    <text x="0" y="38" text-anchor="middle" fontFamily="sans-serif" fontSize="11" fill="#6b7280">Cyber Security Club</text>
                  </g>
                </>
              )}

              {/* Static Mock QR Code */}
              <g transform="translate(1040, 480)">
                <rect x="-5" y="-5" width="90" height="90" fill="#ffffff" rx="4" />
                {/* Standard grid patterns representing QR code */}
                <rect x="5" y="5" width="20" height="20" fill="#000000" />
                <rect x="55" y="5" width="20" height="20" fill="#000000" />
                <rect x="5" y="55" width="20" height="20" fill="#000000" />
                <rect x="25" y="25" width="30" height="30" fill="#000000" opacity="0.8" />
              </g>

              {/* Date */}
              <text x="140" y="560" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#9ca3af">June 15, 2026</text>
              <text x="140" y="578" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#4b5563">Issue Date</text>

              {/* Verification Info Footer */}
              <line x1="100" y1="595" x2="1100" y2="595" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x="600" y="612" text-anchor="middle" fontFamily="sans-serif" fontSize="10" fill="#4b5563">Verification URL: https://cybersec.club/?cert=CSC-2026-CYBERSEC-00125</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
