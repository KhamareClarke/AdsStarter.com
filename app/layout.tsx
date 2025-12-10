import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const font = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdsStarter | Launch Your Reach with High-Converting Ad Campaigns",
  description: "AdsStarter helps you scale your business with paid AdsStarter ads, funnels, email marketing, and automation. Get results-driven AdsStarter client acquisition for online brands.",
  openGraph: {
    title: "AdsStarter | Launch Your Reach with High-Converting Ad Campaigns",
    description: "AdsStarter helps you scale your business with paid AdsStarter ads, funnels, email marketing, and automation. Get results-driven AdsStarter client acquisition for online brands.",
    url: "https://adsstarter.com/",
    siteName: "AdsStarter",
    images: [
      {
        url: "/logo/logo.svg",
        width: 512,
        height: 512,
        alt: "AdsStarter Logo",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@adsstarter",
    title: "AdsStarter | Launch Your Reach with High-Converting Ad Campaigns",
    description: "AdsStarter helps you scale your business with paid AdsStarter ads, funnels, email marketing, and automation. Get results-driven AdsStarter client acquisition for online brands.",
    images: ["/logo/logo.svg"],
  },
  icons: {
    icon: "/logo/logo.svg",
    shortcut: "/logo/logo.svg",
    apple: "/logo/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://adsstarter.com/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>

        {children}
        <Analytics />

      </body>
    </html>
  );
}
