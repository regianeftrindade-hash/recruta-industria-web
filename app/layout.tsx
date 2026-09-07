import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/app-shell/ServiceWorkerRegister";
import ManifestInjector from "@/components/app-shell/ManifestInjector";
import SiteVisitTracker from "@/components/app-shell/SiteVisitTracker";
import { InstallPromptProvider } from "@/components/pwa/InstallPromptProvider";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RECRUTA INDÚSTRIA",
  description: "Plataforma de recrutamento para setor industrial",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-ri.ico", sizes: "48x48" },
      { url: "/icons/ri-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/ri-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/ri-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/ri-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/ri-apple-touch.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/ri-192.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RECRUTA INDÚSTRIA",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "format-detection": "telephone=no, date=no, email=no, address=no",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "RECRUTA INDÚSTRIA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}>
        <ManifestInjector />
        <ServiceWorkerRegister />
        <Providers>
          <InstallPromptProvider>
            <SiteVisitTracker />
            {children}
          </InstallPromptProvider>
        </Providers>
      </body>
    </html>
  );
}
