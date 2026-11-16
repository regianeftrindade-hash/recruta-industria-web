'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n/translate';
import type { MessageKey } from '@/lib/i18n/messages/pt-BR';
import styles from './admin.module.css';

const LINKS: Array<{ href: string; labelKey: MessageKey; exact: boolean }> = [
  { href: '/admin', labelKey: 'surface.admin.command', exact: true },
  { href: '/admin/vagas', labelKey: 'surface.admin.jobs', exact: false },
  { href: '/admin/candidaturas-manual', labelKey: 'surface.admin.manual', exact: false },
  { href: '/admin/companies', labelKey: 'surface.admin.companies', exact: false },
  { href: '/admin/contato', labelKey: 'surface.admin.inbox', exact: false },
  { href: '/admin/servicos', labelKey: 'surface.admin.services', exact: false },
  { href: '/admin/security', labelKey: 'surface.admin.security', exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
