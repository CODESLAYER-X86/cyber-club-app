import { Metadata } from 'next';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { StandaloneCertificateViewer } from '@/components/pages/standalone-certificate-viewer';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
  
  // Clean base URL for metadata resolving
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
}

export default async function VerifyPage({ params }: Props) {
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

  // Convert Date fields to ISO string or clean format so it can pass cleanly to client components
  const serializedCert = {
    ...certificate,
    issuedAt: certificate.issuedAt.toISOString(),
    event: certificate.event ? {
      ...certificate.event,
      startDate: certificate.event.startDate.toISOString(),
      endDate: certificate.event.endDate.toISOString(),
    } : null
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <StandaloneCertificateViewer cert={serializedCert} />
    </main>
  );
}
