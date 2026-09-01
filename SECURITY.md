# Security Policy & Threat Verification (SECURITY.md)

## Status: SECURED

- **System**: Dhaka International University Cyber Security Club Web Application (DIU)
- **Standard**: OWASP Top 10 (2025) / ASVS Level 2
- **Audit Date**: 2026-09-01
- **Overall Threat Disposition**: 4/4 Threats Verified & Closed

---

## 1. Threat Verification Matrix

| Threat ID | Threat Category | Threat Description | Disposition | Evidence (File & Logic) | Status |
|---|---|---|---|---|---|
| **THR-01** | Concurrency / Race Condition | Event seat overselling via concurrent automated registration requests | `mitigate` | [`src/app/api/events/[id]/register/route.ts`](file:///home/codeslayer_x86/CODESLAYER/projects/Cyber-club-web-app/cyber-club-app/src/app/api/events/%5Bid%5D/register/route.ts#L42-L58): Atomic `prisma.$transaction` executing conditional update `currentSeats: { lt: maxSeats }` | **CLOSED** |
| **THR-02** | Broken Access Control / IDOR | Unauthorized profile modification or PII data scraping of members | `mitigate` | [`src/app/api/users/[id]/route.ts`](file:///home/codeslayer_x86/CODESLAYER/projects/Cyber-club-web-app/cyber-club-app/src/app/api/users/%5Bid%5D/route.ts#L41-L50): Selective field gating (`isSelf \|\| isAdmin`) + Supabase token validation | **CLOSED** |
| **THR-03** | Vertical Privilege Escalation | Rogue approval of club treasury expenses or unauthorized budget tampering | `mitigate` | `src/app/api/treasury/` & [`src/app/api/config/route.ts`](file:///home/codeslayer_x86/CODESLAYER/projects/Cyber-club-web-app/cyber-club-app/src/app/api/config/route.ts#L60-L66): Role verification (`PRESIDENT`, `TREASURER`, `PLATFORM_ADMIN`) + immutable `AuditLog` logging | **CLOSED** |
| **THR-04** | Data Tampering & Forgery | Forged certificate generation or falsified event attendance records | `mitigate` | [`src/app/api/certificates/route.ts`](file:///home/codeslayer_x86/CODESLAYER/projects/Cyber-club-web-app/cyber-club-app/src/app/api/certificates/route.ts) & [`src/components/pages/certificate-verify-page.tsx`](file:///home/codeslayer_x86/CODESLAYER/projects/Cyber-club-web-app/cyber-club-app/src/components/pages/certificate-verify-page.tsx): Unique cryptographic codes (`CSC-2026-XXXX-XXXX`) verified directly against central database | **CLOSED** |

---

## 2. Security Controls & Safeguards

### Authentication & Authorization (A01, A07)
- Pure Google OAuth 2.0 with Supabase PKCE token verification.
- Zero plaintext password storage.
- All mutating endpoints enforce active caller session checks.

### Network & Transport Security (A02, A04)
- Enforced HTTP security headers in `next.config.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000`).
- Database TLS connection pooler on port 6543.
- Private environment secrets strictly isolated in `.env.local` (ignored by `.gitignore`).

### Injection Prevention (A05)
- 100% Parameterized queries via Prisma ORM.
- Zero unsafe SQL execution paths.
- Default React JSX escaping prevents XSS across user-generated input fields.

---

## 3. Reporting a Vulnerability

If you discover a security issue or potential vulnerability in this platform, please contact the Cyber Security Club Security Operations Center (SOC) at:
- **Email**: `soc@diu.cyber.edu`
- **Lead Executive**: President / Platform Admin
