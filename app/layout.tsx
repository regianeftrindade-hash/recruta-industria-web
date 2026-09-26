import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/app-shell/ServiceWorkerRegister";
import ManifestInjector from "@/components/app-shell/ManifestInjector";
import SiteVisitTracker from "@/components/app-shell/SiteVisitTracker";
import { InstallPromptProvider } from "@/components/pwa/InstallPromptProvider";
import GoogleAdsLoader from "@/components/analytics/GoogleAdsLoader";
import Providers from "./providers";
import SiteEmailFooter from "@/components/shared/SiteEmailFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.recrutaindustria.com"),
  title: {
    default: "Recruta Indústria | Vagas e talentos do setor industrial",
    template: "%s | Recruta Indústria",
  },
  description:
    "Recrutamento industrial: conecte empresas e profissionais. Cadastre perfil ou encontre talentos no chão de fábrica.",
  applicationName: "Recruta Indústria",
  keywords: [
    "recrutamento industrial",
    "vagas indústria",
    "profissional industrial",
    "soldador",
    "CNC",
    "chão de fábrica",
    "Recruta Indústria",
  ],
  authors: [{ name: "Recruta Indústria" }],
  creator: "Recruta Indústria",
  publisher: "Recruta Indústria",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.recrutaindustria.com/",
    siteName: "Recruta Indústria",
    title: "Recruta Indústria | Vagas e talentos do setor industrial",
    description:
      "Recrutamento industrial para empresas e profissionais: vagas, talentos e conexões com foco no chão de fábrica.",
    images: [
      {
        url: "/logo-recruta.png",
        width: 512,
        height: 512,
        alt: "Recruta Indústria",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Recruta Indústria | Vagas e talentos do setor industrial",
    description:
      "Recrutamento industrial para empresas e profissionais. Cadastre-se e conecte-se ao setor.",
    images: ["/logo-recruta.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    title: "Recruta Indústria",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "format-detection": "telephone=no, date=no, email=no, address=no",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Recruta Indústria",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3A3A3A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.recrutaindustria.com/#organization",
        name: "Recruta Indústria",
        url: "https://www.recrutaindustria.com/",
        logo: "https://www.recrutaindustria.com/logo-recruta.png",
        email: "contato@recrutaindustria.com",
        description:
          "Plataforma de recrutamento industrial para empresas e profissionais no Brasil.",
      },
      {
        "@type": "WebSite",
        "@id": "https://www.recrutaindustria.com/#website",
        url: "https://www.recrutaindustria.com/",
        name: "Recruta Indústria",
        publisher: { "@id": "https://www.recrutaindustria.com/#organization" },
        inLanguage: "pt-BR",
      },
    ],
  };

  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAdsLoader />
        <ManifestInjector />
        <ServiceWorkerRegister />
        <Providers>
          <InstallPromptProvider>
            <SiteVisitTracker />
            {children}
            <SiteEmailFooter />
          </InstallPromptProvider>
        </Providers>
      </body>
    </html>
  );
}
