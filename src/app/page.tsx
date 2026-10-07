import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { HomeClient } from '@/components/home-client';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const view = typeof params.view === 'string' ? params.view : undefined;
  const eventId = (typeof params.id === 'string' ? params.id : undefined)
    || (typeof params.event === 'string' ? params.event : undefined)
    || (typeof params.eventId === 'string' ? params.eventId : undefined);

  if ((view === 'event-detail' || !view) && eventId) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          description: true,
          poster: true,
          venue: true,
          category: true,
        },
      });

      if (event) {
        const cleanDesc = (event.description || '')
          .replace(/[#*`_~]/g, '')
          .slice(0, 180)
          .trim() || 'Join this event hosted by Cyber Security Club at Dhaka International University.';

        const imageUrl = event.poster || '/logo.png';
        const absoluteImageUrl = imageUrl.startsWith('http')
          ? imageUrl
          : `https://www.cybersecdiu.club${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

        const pageUrl = `https://www.cybersecdiu.club/?view=event-detail&id=${eventId}`;

        return {
          title: `${event.title} | Cyber Security Club`,
          description: cleanDesc,
          openGraph: {
            title: `${event.title} | Cyber Security Club`,
            description: cleanDesc,
            url: pageUrl,
            siteName: 'Cyber Security Club',
            images: [
              {
                url: absoluteImageUrl,
                alt: event.title,
              },
            ],
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: `${event.title} | Cyber Security Club`,
            description: cleanDesc,
            images: [absoluteImageUrl],
          },
        };
      }
    } catch (e) {
      console.error('Error generating event metadata:', e);
    }
  }

  // Certificate deep link metadata
  const certCode = typeof params.cert === 'string' ? params.cert : undefined;
  if (certCode) {
    return {
      title: 'Verified Certificate | Cyber Security Club',
      description: 'View and verify a certificate issued by Cyber Security Club at Dhaka International University.',
      openGraph: {
        title: 'Verified Certificate | Cyber Security Club',
        description: 'View and verify a certificate issued by Cyber Security Club at Dhaka International University.',
        url: `https://www.cybersecdiu.club/?cert=${certCode}`,
        siteName: 'Cyber Security Club',
        images: [{ url: 'https://www.cybersecdiu.club/logo.png', alt: 'Cyber Security Club' }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Verified Certificate | Cyber Security Club',
        description: 'View and verify a certificate issued by Cyber Security Club at Dhaka International University.',
        images: ['https://www.cybersecdiu.club/logo.png'],
      },
    };
  }

  return {
    title: 'Cyber Security Club - Dhaka International University',
    description: 'Defend. Learn. Lead. Join our cybersecurity community at Dhaka International University and master the art of digital defense.',
    openGraph: {
      title: 'Cyber Security Club - Dhaka International University',
      description: 'Defend. Learn. Lead. Join our cybersecurity community at Dhaka International University and master the art of digital defense.',
      url: 'https://www.cybersecdiu.club',
      siteName: 'Cyber Security Club',
      images: [
        {
          url: 'https://www.cybersecdiu.club/logo.png',
          width: 800,
          height: 800,
          alt: 'Cyber Security Club Logo',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cyber Security Club - Dhaka International University',
      description: 'Defend. Learn. Lead. Join our cybersecurity community at Dhaka International University and master the art of digital defense.',
      images: ['https://www.cybersecdiu.club/logo.png'],
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
