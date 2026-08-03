# PLAN: Per-Event Certificate Type Assignment & Approval Workflow

This plan details how to enable executives to assign non-participation certificate types (e.g., Winner, Organizer, Volunteer, Judge) directly to participants when reviewing/approving them under an event.

---

## 1. System Changes

### 1.1 Expand Type Definitions (`src/types/index.ts`)
Update the `CertificateType` union type and `CERTIFICATE_TYPE_LABELS` map to include all custom designer certificate types:

```typescript
export type CertificateType =
  | "PARTICIPATION"
  | "WINNER"
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "ORGANIZER"
  | "VOLUNTEER"
  | "JUDGE"
  | "APPRECIATION"
  | "CUSTOM";

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  PARTICIPATION: "Participation",
  WINNER: "Winner",
  FIRST_PLACE: "1st Place",
  SECOND_PLACE: "2nd Place",
  THIRD_PLACE: "3rd Place",
  ORGANIZER: "Organizer",
  VOLUNTEER: "Volunteer",
  JUDGE: "Judge",
  APPRECIATION: "Appreciation",
  CUSTOM: "Custom Type",
};
```

---

## 2. API Updates

### 2.1 Update Individual & Bulk Issuance (`src/app/api/certificates/route.ts`)
- In `POST /api/certificates`, update the approval workflow gating:
  - High-achievement types (`WINNER`, `FIRST_PLACE`, `SECOND_PLACE`, `THIRD_PLACE`, `CUSTOM`) require executive approval and get status `ELIGIBLE` (Pending Approval).
  - Standard/helper types (`PARTICIPATION`, `ORGANIZER`, `VOLUNTEER`, `JUDGE`, `APPRECIATION`) are auto-approved directly to status `AUTHORIZED`.
- When updating or creating a certificate, allow changing the `type` dynamically based on the incoming request body.

### 2.2 Add Certificate Update Endpoint (`src/app/api/certificates/[id]/route.ts`)
- Create a `PATCH` handler at `/api/certificates/[id]` to allow the GS, President, or Admin to update a specific certificate's properties (such as its `type` or `score`).
- When the certificate type is changed, automatically reset its approval status according to the new type rules.

---

## 3. Frontend UI Updates

### 3.1 Event Registrations Admin Table (`event-detail-page.tsx`)
- Currently, the registrations list only shows the name, registration status (Pending/Approved), and attendance markers.
- **New Feature**: Add a **"Certificate Type"** selector dropdown for each attendee once their registration is approved.
  - The dropdown options will show all active certificate types enabled for the event (e.g. *Participation*, *Volunteer*, *Winner*).
  - Selecting a type will instantly update that participant's certificate record in the database using `/api/certificates` (creating it if missing, or PATCHing the type if already present).
- Show a badge indicating their current certificate type assignment next to their registration record.

### 3.2 Certificate Authority Page updates (`certificate-authority-page.tsx`)
- Update type badge colors and UI labels to cover all new types.
- Ensure the President/GS can view and approve the pending `WINNER` and `FIRST_PLACE` certificates.

---

## 4. Verification Checklist

### Automated Compilation
- Run `npx tsc --noEmit` to ensure TypeScript compilation passes.
- Run `npm run lint` to verify code formatting.

### Functional Verification
- Verify that changing an attendee's certificate type to `VOLUNTEER` in the event detail page updates the database and displays the updated type badge.
- Verify that assigning `WINNER` certificate type sends the certificate to the President's "Pending Approval" queue.
