'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const LINKS = [
  { href: '/admin', label: 'Centro de comando', exact: true },
  { href: '/admin/companies', label: 'Empresas', exact: false },
  { href: '/admin/contato', label: 'Contato', exact: false },
  { href: '/admin/servicos', label: 'Serviços', exact: false },
  { href: '/admin/security', label: 'Segurança', exact: false },
] as const;

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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
