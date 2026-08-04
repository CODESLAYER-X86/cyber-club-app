import { Metadata } from 'next';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { StandaloneCertificateViewer } from '@/components/pages/standalone-certificate-viewer';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { code } = await params;
    const certificate = await prisma.certificate.findFirst({
      where: { certificateCode: code },
      include: {
        user: { select: { name: true } },
        event: { select: { title: true } }
      }
    });

    if (!certificate) {
      return {
        title: 'Certificate Not Found | Cyber Security Club',
      };
    }

    const name = certificate.user?.name || 'Member';
    const event = certificate.event?.title || 'Event';
    
    const ogUrl = `/api/certificates/${code}/og`;

    return {
      title: `Verified Certificate - ${name} | Cyber Security Club`,
      description: `This certifies that ${name} successfully completed the event "${event}". Verify certificate authenticity online.`,
      openGraph: {
        title: `Verified Certificate - ${name} | Cyber Security Club`,
        description: `This certifies that ${name} successfully completed the event "${event}". Verify certificate authenticity online.`,
        images: [
          {
            url: ogUrl,
            width: 1200,
            height: 630,
            type: 'image/svg+xml',
          }
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Verified Certificate - ${name} | Cyber Security Club`,
        description: `This certifies that ${name} successfully completed the event "${event}". Verify certificate authenticity online.`,
        images: [ogUrl],
      }
    };
  } catch {
    return {
      title: 'Certificate Verification | Cyber Security Club',
    };
  }
}

export default async function VerifyPage({ params }: Props) {
  try {
    const { code } = await params;
    
    const certificate = await prisma.certificate.findFirst({
      where: { certificateCode: code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            startDate: true,
            endDate: true,
            certificateLayout: true,
          },
        },
      },
    });

    if (!certificate) {
      notFound();
    }

    // Convert Date fields to ISO string so it can pass cleanly to client components
    const serializedCert = {
      ...certificate!,
      issuedAt: certificate!.issuedAt.toISOString(),
      event: certificate!.event ? {
        ...certificate!.event,
        startDate: certificate!.event.startDate.toISOString(),
        endDate: certificate!.event.endDate.toISOString(),
      } : null
    };

    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <StandaloneCertificateViewer cert={serializedCert} />
      </main>
    );
  } catch (error) {
    // Graceful error page instead of Vercel 500
    console.error('[VerifyPage] Render error:', error);
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.756a9.003 9.003 0 0 1-1.405-4.5 9.003 9.003 0 0 1 1.405-4.5m9.606 0a9.003 9.003 0 0 1 1.405 4.5 9.003 9.003 0 0 1-1.405 4.5M6.697 6.697a9 9 0 0 1 10.606 0M6.697 17.303a9 9 0 0 0 10.606 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Unable to Load Certificate</h1>
          <p className="text-gray-400">
            We encountered an error while verifying this certificate. This may be a temporary issue — please try again later.
          </p>
          <a href="/" className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
            Go Home
          </a>
        </div>
      </main>
    );
  }
}
