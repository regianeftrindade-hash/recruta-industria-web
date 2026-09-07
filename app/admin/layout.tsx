import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.config';
import { hasAdminAccess } from '@/lib/auth/admin-auth';
import LogoRecruta from '@/app/components/LogoRecruta';
import styles from './admin.module.css';
import AdminNav from './AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!hasAdminAccess({
    isAdmin: user?.isAdmin,
    email: user?.email,
    role: user?.userType,
  })) {
    redirect('/login?redirect=/admin');
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <LogoRecruta size="xs" as="div" />
            <p className={styles.brandSub}>
              Admin{user?.email ? ` · ${user.email}` : ''}
            </p>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.livePill}>
              <span className={styles.liveDot} />
              Tempo real
            </span>
            <AdminNav />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
