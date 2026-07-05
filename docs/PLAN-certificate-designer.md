# PLAN: Certificate Design & PDF Generation System (Per Event)

This plan details the implementation of an interactive SVG-based Certificate Designer and PDF Generator. Each event can have its own design config, support multiple certificate types (Participation, Winner, etc.) with custom text templates, positionable QR codes/IDs, and link sharing optimized for LinkedIn.

---

## 1. System Design Specification (Option A)

### 1.1 Template Configuration Schema
The `Event.certificateLayout` database column will store a JSON configuration mapping to the following TypeScript interface:

```typescript
interface TextTemplate {
  title: string;          // e.g. "CERTIFICATE OF PARTICIPATION"
  description: string;    // e.g. "This certifies that {{recipient_name}} successfully participated in {{event_name}}."
}

interface SignatureConfig {
  name: string;
  title: string;
  image: string;          // Base64 PNG signature
  visible: boolean;
}

interface LayoutConfig {
  // General & Canvas
  orientation: "LANDSCAPE" | "PORTRAIT";
  paperSize: "A4" | "LETTER";
  
  // Branding
  bgImage?: string;       // Custom background URL
  primaryColor: string;   // Accent color
  secondaryColor: string; // Gradient accent color
  collabMode: boolean;
  orgLogo?: string;
  eventLogo?: string;
  
  // Type-specific templates
  templates: {
    PARTICIPATION: TextTemplate;
    WINNER: TextTemplate;
    FIRST_PLACE: TextTemplate;
    SECOND_PLACE: TextTemplate;
    THIRD_PLACE: TextTemplate;
    ORGANIZER: TextTemplate;
    VOLUNTEER: TextTemplate;
    JUDGE: TextTemplate;
    APPRECIATION: TextTemplate;
    CUSTOM: TextTemplate;
  };
  
  // Elements Placement
  qrCode: {
    visible: boolean;
    size: number;
    x: number;            // SVG X-coordinate
    y: number;            // SVG Y-coordinate
  };
  certId: {
    visible: boolean;
    x: number;
    y: number;
  };
  
  // Signatures
  signatures: SignatureConfig[];
}
```

### 1.2 SVG Render Calculations & Dynamic Placeholders
- The certificate is rendered as an SVG viewport:
  - Landscape: `viewBox="0 0 1200 840"` (A4 aspect ratio)
  - Portrait: `viewBox="0 0 840 1200"`
- Dynamic placeholders are replaced on rendering:
  - `{{recipient_name}}` $\rightarrow$ User's full name.
  - `{{event_name}}` $\rightarrow$ Event title.
  - `{{certificate_type}}` $\rightarrow$ Selected certificate type label.
  - `{{position}}` $\rightarrow$ Winner position (e.g. "1st Place", "2nd Place").
  - `{{certificate_id}}` $\rightarrow$ Unique certificate code.
  - `{{issue_date}}` $\rightarrow$ Formatted date.

---

## 2. API Implementation

### 2.1 PDF Generation Endpoint (`src/app/api/certificates/[code]/pdf/route.ts`) [NEW]
- Generates a print-ready PDF using a server-side PDF generator library (e.g., converting the dynamically populated SVG to PDF vectors using `pdfkit` / `svg-to-pdfkit` or rendering via Chromium edge print settings).
- Sets `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="certificate-[code].pdf"`.

### 2.2 OG Image Generation (`src/app/api/certificates/[code]/og/route.ts`)
- Rebuild/optimize the existing endpoint to parse the `certificateLayout` JSON config from the associated event, interpolate placeholders, and return a PNG og:image representation of the certificate.
- When shared on LinkedIn, the og:image meta tags will render the certificate beautifully.

---

## 3. Frontend UI Updates

### 3.1 Customization Tabs (`certificate-designer.tsx`)
- **Types Tab**: Checkbox list to choose available certificate types for this event. For each checked type, provide text inputs to customize the Title and Description template.
- **Logos & Canvas Tab**: Toggle Orientation (Landscape/Portrait), Background image URL, primary/secondary colors, and collaborator logos.
- **Placement Tab**: Sliders to adjust the X/Y coordinates and size of the QR verification code and the Certificate ID text block.
- **Signatures Tab**: Input signatory name, title, and upload transparent signature files.

### 3.2 Live Preview Viewport (`certificate-designer.tsx`)
- Display the SVG rendering inline.
- Add a dropdown: "Preview Mode" (choose type to preview Participation vs. Winner layouts instantly with mock data).
- The preview matches the orientation and updates instantly as branding, sliders, or dynamic text templates change.

### 3.3 Member Downloads (`certificates-page.tsx`)
- Render a "Download PDF" button that redirects to the PDF generation endpoint.
- Render a "Share on LinkedIn" button that copies the certificate sharing link to the clipboard.

---

## 4. Verification Checklist

### Automated Compilation
- Run `npx tsc --noEmit` to ensure TypeScript compilation passes.
- Run `npm run lint` to verify code format.

### Functional Verification
- Verify that templates render custom text for Winner vs. Participation correctly.
- Verify that adjusting placement sliders moves the QR code on the live SVG instantly.
- Verify that PDF downloads output the certificate matching the SVG layout.
