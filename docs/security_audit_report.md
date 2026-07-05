# Professional Security Audit & Vulnerability Report

This report documents the security audit findings for the Cyber Security Club Application backend API endpoints.

---

## V-01: Broken Access Control in Gallery Photo Deletion

*   **Title**: Client-Trusted Role in Gallery Deletion
*   **Severity**: Critical
*   **CWE ID**: CWE-285 (Improper Authorization)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `DELETE /api/gallery/[id]`
*   **Description**: The API route trusts a client-provided `body.role` property directly to authenticate the deletion request.
*   **Attack Scenario**: An attacker determines the ID of any gallery image, sends a HTTP DELETE request, and sets `{ "role": "PRESIDENT" }` in the JSON body. The backend reads this role directly, bypasses check guards, and deletes the image from the filesystem and database.
*   **Proof of Concept**:
    ```bash
    curl -X DELETE http://localhost:3000/api/gallery/image-uuid-1234 \
      -H "Content-Type: application/json" \
      -d '{"role": "PRESIDENT"}'
    ```
*   **Reproduction Steps**:
    1. Send a DELETE request to `/api/gallery/[id]` with role parameter set to "PRESIDENT" in the request body.
    2. Check the response; it returns `{ "deleted": true }`.
*   **Risk Assessment**:
    *   **Likelihood**: High (no skills or credentials needed)
    *   **Impact**: High (data loss, malicious content deletion)
*   **Business Impact**: Disruption of club gallery records, deletion of event highlights, reputation damage.
*   **Recommended Fix**: Validate user session via `getSupabaseUser()` instead of accepting parameters in the request body.
*   **Secure Code Example**:
    ```typescript
    const caller = await getSupabaseUser(["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"]);
    if (!caller) return forbiddenResponse("Unauthorized");
    ```
*   **Status**: Open

---

## V-02: Broken Access Control in Committee Member Administration

*   **Title**: Client-Trusted Role in Committee Deletion & Edit
*   **Severity**: Critical
*   **CWE ID**: CWE-285 (Improper Authorization)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `PATCH /api/committee/[id]` & `DELETE /api/committee/[id]`
*   **Description**: The `PATCH` handler trusts a client-provided `body.requesterRole` parameter, and the `DELETE` handler trusts the `?role` URL query parameter.
*   **Attack Scenario**: An attacker alters the name or role of any executive committee member by sending a PATCH request with `{ "requesterRole": "PRESIDENT" }` in the payload.
*   **Proof of Concept**:
    ```bash
    curl -X PATCH http://localhost:3000/api/committee/member-uuid-5678 \
      -H "Content-Type: application/json" \
      -d '{"requesterRole": "PRESIDENT", "name": "Hacker Master"}'
    ```
*   **Reproduction Steps**:
    1. Send a PATCH/DELETE call targeting `/api/committee/[id]` with requesterRole/role set to "PRESIDENT".
    2. The server updates or deletes the committee member.
*   **Risk Assessment**:
    *   **Likelihood**: High
    *   **Impact**: Critical (corruption of organization identity representation)
*   **Business Impact**: Attackers can spoof the club's public leadership team on the website.
*   **Recommended Fix**: Perform session checks using `getSupabaseUser()`.
*   **Status**: Open

---

## V-03: Missing Authentication in Announcement Deletion

*   **Title**: Unauthenticated Announcement Deletion
*   **Severity**: Critical
*   **CWE ID**: CWE-306 (Missing Authentication for Sensitive Function)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `DELETE /api/announcements/[id]`
*   **Description**: The DELETE handler has no authentication check whatsoever, allowing any caller to delete announcements.
*   **Attack Scenario**: An attacker retrieves announcement IDs from the homepage and deletes them all by executing DELETE requests.
*   **Proof of Concept**:
    ```bash
    curl -X DELETE http://localhost:3000/api/announcements/announcement-uuid-9999
    ```
*   **Reproduction Steps**:
    1. Call DELETE on `/api/announcements/[id]` unauthenticated.
    2. Announcement gets permanently deleted.
*   **Risk Assessment**:
    *   **Likelihood**: High
    *   **Impact**: High (loss of communication channel)
*   **Business Impact**: Complete disruption of executive announcement broadcasts.
*   **Recommended Fix**: Guard the DELETE handler with `getSupabaseUser(["PRESIDENT", "VP", "GS", "PLATFORM_ADMIN", "MEDIA"])`.
*   **Status**: Open

---

## V-04: Broken Object Level Authorization (BOLA/IDOR) in Profile Updates

*   **Title**: Unprotected Profile Modification
*   **Severity**: Critical
*   **CWE ID**: CWE-285 (Improper Authorization)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `PATCH /api/users/[id]`
*   **Description**: The profile update endpoint accepts fields to update (`name`, `phone`, `bio`) without checking if the requester owns the target profile.
*   **Attack Scenario**: An attacker changes the name, phone number, and biography of the club President or any other user simply by calling `PATCH /api/users/[id]`.
*   **Proof of Concept**:
    ```bash
    curl -X PATCH http://localhost:3000/api/users/president-user-id \
      -H "Content-Type: application/json" \
      -d '{"name": "Spoofed President"}'
    ```
*   **Reproduction Steps**:
    1. Send a PATCH call to another user's profile ID `/api/users/[id]` containing new parameters.
    2. Profile data gets updated without verification.
*   **Risk Assessment**:
    *   **Likelihood**: High
    *   **Impact**: Critical (identity theft, profile corruption)
*   **Business Impact**: Widespread user account tampering.
*   **Recommended Fix**: Verify that the caller is authenticated and that `caller.userId === id` or they are a `PLATFORM_ADMIN`.
*   **Status**: Open

---

## V-05: Unauthenticated File Upload Proxy

*   **Title**: Unauthenticated Supabase Storage Upload proxy
*   **Severity**: High
*   **CWE ID**: CWE-306 / CWE-434
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `POST /api/upload`
*   **Description**: The upload endpoint allows any unauthenticated user to upload image files to the club storage bucket using Supabase service role credentials.
*   **Attack Scenario**: An attacker writes a script that repeatedly uploads large 10MB images via `/api/upload`, causing storage exhaustion.
*   **Proof of Concept**:
    ```bash
    curl -F "file=@malicious-large-image.jpg" http://localhost:3000/api/upload
    ```
*   **Reproduction Steps**:
    1. Send a multipart form upload request to `/api/upload` without any cookie/token.
    2. File is successfully uploaded and a public CDN link is returned.
*   **Risk Assessment**:
    *   **Likelihood**: High
    *   **Impact**: High (denial of service, hosting illegal content, budget drain)
*   **Business Impact**: Escalation of Cloud hosting bills, server denial of service.
*   **Recommended Fix**: Retrieve user credentials with `getSupabaseUser()` and reject anonymous uploads.
*   **Status**: Open

---

## V-06: Sensitive Data Exposure / IDOR in User Details

*   **Title**: Public Exposure of Private Member Fields
*   **Severity**: High
*   **CWE ID**: CWE-639 (Access Control Bypass Through User-Controlled Key)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `GET /api/users/[id]`
*   **Description**: Querying a user's details returns private fields (phone numbers, raw transaction IDs, payment proof image links, and logs) to any guest caller.
*   **Attack Scenario**: An attacker queries the ID of all users and collects their phone numbers, emails, and transaction logs.
*   **Proof of Concept**:
    ```bash
    curl http://localhost:3000/api/users/member-user-id
    ```
*   **Reproduction Steps**:
    1. Call GET on `/api/users/[id]` as an unauthenticated guest.
    2. Check returned payload; private contact information is fully visible.
*   **Risk Assessment**:
    *   **Likelihood**: High
    *   **Impact**: High (PII leaks)
*   **Business Impact**: GDPR/privacy violations.
*   **Recommended Fix**: Check user session. If the requester is not the user themselves or an administrator, omit private fields.
*   **Status**: Open

---

## V-07: Broken Object Level Authorization (BOLA/IDOR) in Notifications Mark-as-Read

*   **Title**: Unchecked Notification Status Updates
*   **Severity**: Medium
*   **CWE ID**: CWE-639
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `PATCH /api/notifications/[id]/read`
*   **Description**: Any caller can mark any notification ID as read without verifying that they own the notification.
*   **Attack Scenario**: An attacker discovers a notification ID belonging to another user and marks it read, causing them to miss important alerts.
*   **Proof of Concept**:
    ```bash
    curl -X PATCH http://localhost:3000/api/notifications/another-user-notification-id/read
    ```
*   **Recommended Fix**: Verify that the caller matches the notification's `userId`.
*   **Status**: Open

---

## V-08: Broken Object Level Authorization (BOLA/IDOR) in Notifications Retrieval

*   **Title**: Unauthorized Notifications Querying
*   **Severity**: Medium
*   **CWE ID**: CWE-639
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `GET /api/notifications`
*   **Description**: The GET endpoint lists notifications for any `userId` query parameter without checking ownership.
*   **Attack Scenario**: An attacker queries `/api/notifications?userId=target-user-id` to spy on a target user's custom notifications and updates.
*   **Recommended Fix**: Verify the caller matches the queried `userId` parameter.
*   **Status**: Open

---

## V-09: Sensitive Data Exposure in Event Registrations List

*   **Title**: Unauthenticated Event Attendees Leak
*   **Severity**: Medium
*   **CWE ID**: CWE-200 (Exposure of Sensitive Information)
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `GET /api/events/[id]/registrations`
*   **Description**: Anyone can fetch the complete list of event registrations (including member names, emails, roles, and departments) without logging in.
*   **Recommended Fix**: Guard the endpoint with `getSupabaseUser()` to verify the user is logged in.
*   **Status**: Open

---

## V-10: Sensitive Data Exposure in Budget Logs

*   **Title**: Public Exposure of Budgets & Expenses
*   **Severity**: Medium
*   **CWE ID**: CWE-200
*   **OWASP Category**: A01:2025-Broken Access Control
*   **Affected Components**: `GET /api/budgets`
*   **Description**: Budget allocations, specific transactions, names of budget creators, and expense details are exposed to the public internet.
*   **Recommended Fix**: Require `getSupabaseUser()` to ensure the caller is at least a logged-in member.
*   **Status**: Open

---

## V-11: Public Exposure of Security Audit Logs

*   **Title**: Unauthenticated Security Audit Logs Retrieval
*   **Severity**: High
*   **CWE ID**: CWE-200
*   **OWASP Category**: A01:2025-Broken Access Control / A09:2025-Logging & Alerting
*   **Affected Components**: `GET /api/audit-logs`
*   **Description**: Complete records of administrative activities (role updates, member kicks, and configuration edits) are exposed without authentication.
*   **Attack Scenario**: An attacker reads the audit logs to map the organization's user IDs, active administrators, and sensitive demotion timelines.
*   **Proof of Concept**:
    ```bash
    curl http://localhost:3000/api/audit-logs
    ```
*   **Recommended Fix**: Require `getSupabaseUser(["PRESIDENT", "PLATFORM_ADMIN", "GS"])`.
*   **Status**: Open
