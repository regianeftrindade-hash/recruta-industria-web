import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RECRUTA INDÚSTRIA",
  description: "Plataforma de recrutamento para setor industrial",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RECRUTA INDÚSTRIA",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
