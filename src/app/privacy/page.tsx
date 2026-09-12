import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | DIU Cyber Security Club',
  description: 'Privacy policy and data protection terms for Dhaka International University Cyber Security Club.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 md:py-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          </div>
          <p className="text-sm text-slate-400">
            Effective Date: September 2026 • Dhaka International University Cyber Security Club (DIU CSC)
          </p>
        </div>

        <section className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
          <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
          <p>
            Dhaka International University Cyber Security Club (&ldquo;DIU CSC&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the web platform at{' '}
            <span className="text-emerald-400 font-mono">cybersecdiu.club</span>. This Privacy Policy explains how we collect, use, and protect your information when you access our member portal, participate in workshops, or verify event certificates.
          </p>
        </section>

        <section className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
          <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
          <p>When you register or sign in using Google OAuth, we collect limited personal information necessary for club operations:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Account Data:</strong> Your full name, email address, and profile picture provided by Google authentication.
            </li>
            <li>
              <strong className="text-white">Academic Details:</strong> Student ID, department, batch, and roll number provided during club membership registration.
            </li>
            <li>
              <strong className="text-white">Event Participation & Certifications:</strong> Event registration status, attendance logs, and public cryptographic hashes for verifiable certificate issuance.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To manage club memberships, executive elections, and internal communication.</li>
            <li>To issue verifiable digital certificates with unique cryptographic identifiers.</li>
            <li>To track event registrations and process workshop check-ins.</li>
            <li>We do <strong>NOT</strong> sell, rent, or trade your personal data to any third-party marketing companies.</li>
          </ul>
        </section>

        <section className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
          <h2 className="text-xl font-semibold text-white">4. Data Storage & Security</h2>
          <p>
            Your information is stored in secure PostgreSQL databases hosted on Supabase with encrypted connections (TLS/SSL). Authentication is handled via PKCE-enabled Google OAuth protocols, ensuring your password is never handled or stored on our servers.
          </p>
        </section>

        <section className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
          <h2 className="text-xl font-semibold text-white">5. Your Data Rights & Contact</h2>
          <p>
            You have the right to request a copy of your personal data or request deletion of your club account at any time. For privacy inquiries or account deletion requests, please contact:
          </p>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1 text-sm">
            <p className="text-white font-medium">DIU Cyber Security Club Operations</p>
            <p className="text-slate-400">Department of Computer Science &amp; Engineering</p>
            <p className="text-slate-400">Dhaka International University, Satarkul, Badda, Dhaka-1212</p>
            <p className="text-emerald-400">Email: cscdiucse@gmail.com</p>
          </div>
        </section>
      </div>
    </main>
  );
}
