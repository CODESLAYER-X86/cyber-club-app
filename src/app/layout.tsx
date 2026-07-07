import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cyber Security Club - Cybersecurity Community Platform",
  description: "Defend. Learn. Lead. Join our cybersecurity community at Dhaka International University and master the art of digital defense.",
  keywords: ["Cyber Security Club", "Cybersecurity", "CTF", "Ethical Hacking", "Club", "Security Training", "Dhaka International University", "DIU"],
  authors: [{ name: "Cyber Security Club" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Cyber Security Club - Verified Certificate",
    description: "View and verify a certificate issued by Cyber Security Club",
    type: "website",
    siteName: "Cyber Security Club",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Security Club - Verified Certificate",
    description: "View and verify a certificate issued by Cyber Security Club",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3216427245362717"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
