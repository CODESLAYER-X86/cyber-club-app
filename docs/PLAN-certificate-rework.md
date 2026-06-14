# PLAN: Certificate Rework & Attendance Bug Fixes

This plan details the changes required to rework the Certificate Designer settings, resolve the verifier authorization issue, self-heal missing legacy certificate data, and limit transparent signature resolution to 100x100 pixels.

## 1. Goal Description

- **Certificate Designer Rework**: Default background to black, hide the default club logo picker (it is hardcoded), and only allow logo upload in collaboration mode. Limit the uploaded transparent signature image to a maximum resolution of 100x100.
- **Attendance Verification Fix**: Permit the designated event verifier (`event.verifierId`) and event creator (`event.createdBy`) to mark attendance even if they do not have a global admin/staff role.
- **Legacy Self-Healing**: Automatically create/heal missing `Certificate` records on the fly when:
  1. Attendance is marked for a user.
  2. The President loads the CA review list for an event. This ensures registered users who signed up before the hook was added show up on the dashboard.

---

## 2. Proposed Changes

### Database & Backend API Layer

#### [MODIFY] [route.ts (events/[id]/attendance)](file:///home/codeslayer_x86/codeslayer/projects/cyber-club-glm/src/app/api/events/[id]/attendance/route.ts)
- Fetch the `Event` record first to verify permissions.
- Allow authorization if `currentUser.role` is in the authorized roles OR if `currentUser.id === event.verifierId` OR `currentUser.id === event.createdBy`.
- If the `Certificate` record is missing for the user/event combination, automatically create a new one with status `REGISTERED` before performing updates.

#### [MODIFY] [route.ts (certificates)](file:///home/codeslayer_x86/codeslayer/projects/cyber-club-glm/src/app/api/certificates/route.ts)
- When querying `GET /api/certificates?eventId=...`, retrieve both `Certificate` and `EventRegistration` records for the event.
- Find any approved registrations that do not have a corresponding `Certificate` record.
- Create missing `Certificate` records in the database with status `REGISTERED` (or `PRESENT` / `ELIGIBLE` if attendance is already recorded).
- Re-query/merge the list so the President CA dashboard receives all participant data.

---

### Frontend Components Layer

#### [MODIFY] [certificate-designer.tsx](file:///home/codeslayer_x86/codeslayer/projects/cyber-club-glm/src/components/pages/certificate-designer.tsx)
- Rework the settings panel to default layout backgrounds to black.
- Hide the default club logo picker.
- Add a "Collaboration Mode" switch; render the logo upload input only when this is checked.
- Add validation to the signature upload to restrict transparent image files to a maximum resolution of 100x100 pixels.

#### [MODIFY] [event-detail-page.tsx](file:///home/codeslayer_x86/codeslayer/projects/cyber-club-glm/src/components/pages/event-detail-page.tsx)
- Allow designated verifiers (matching `event.verifierId`) to see and use the attendance controls in the registrants list, regardless of their user role.

---

## 3. Verification Plan

### Automated Tests
- Run type checks: `npx tsc --noEmit`
- Run eslint: `npx eslint src/components/pages/certificates-page.tsx src/components/pages/certificate-authority-page.tsx src/app/api/certificates/route.ts`

### Manual Verification
1. **Design settings check**: Open the Certificate Designer. Verify it defaults to a black background, the default logo picker is hidden, and signature uploads validate for 100x100px.
2. **Attendance fix check**: Log in as a regular `MEMBER` who is assigned as a verifier for a test event. Open the Event Detail page, and verify the Present/Late/Absent buttons are visible and successfully update the backend database.
3. **CA Dashboard healing**: Go to the President CA dashboard, select the event where a user registered previously but has no certificate record. Verify that the user now shows up in the grid list.
