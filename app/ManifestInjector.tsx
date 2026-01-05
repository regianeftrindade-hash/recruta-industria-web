"use client";

import { useEffect } from "react";

export default function ManifestInjector() {
  useEffect(() => {
    // Garantir que o link do manifest existe no head
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
      console.log('✓ Manifest link adicionado ao head');
    }

    // Adicionar meta tags para PWA
    const metaTags = [
      { name: 'theme-color', content: '#001f3f' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Recruta Indústria' }
    ];

    metaTags.forEach(tag => {
      const existing = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
  }, []);

  return null;
}
