import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Viewport Configuration (Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#16a34a", // tailwind bg-green-600
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. Main Metadata Configuration
export const metadata: Metadata = {
  // Base Information
  title: {
    default: "Visly",
    template: "%s | Visly", // Dynamic pages will show as "Dashboard | Visly"
  },
  description: "Your open-source web analytics platform. Privacy-focused, lightweight, and powerful.",
  applicationName: "Visly",
  authors: [{ name: "Visly Team", url: "https://visly.nikhilsaiankilla.blog" }],
  keywords: ["analytics", "open source", "web metrics", "privacy", "dashboard"],
  creator: "Visly Team",
  publisher: "Visly Inc.",

  // Base URL for resolving relative links (CRITICAL for OG images)
  metadataBase: new URL("https://visly.nikhilsaiankilla.blog"), // Replace with your actual domain

  // Open Graph (Facebook, LinkedIn, Discord previews)
  openGraph: {
    title: "Visly - Open-Source Web Analytics",
    description: "The modern, privacy-friendly alternative for web analytics.",
    url: "https://visly.nikhilsaiankilla.blog",
    siteName: "Visly",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Must be inside /public folder
        width: 1200,
        height: 630,
        alt: "Visly Dashboard Preview",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Visly",
    description: "Your open-source web analytics platform.",
    creator: "@nikhilbuildss", // Replace with your actual Twitter handle
    images: ["/og-image.png"],
  },

  // Icons & Manifest
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",

  // Robots & SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Canonical URL
  alternates: {
    canonical: "https://visly.nikhilsaiankilla.blog",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFAFA]`}
      >
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
