'use client';

import React, { useCallback, useState } from 'react';
import { exactUi } from '@/lib/i18n/exact-ui';
import { formatUiDateTime } from '@/lib/i18n/format-ui';
import { localizeServerText } from '@/lib/i18n/server-text';
import { t } from '@/lib/i18n/translate';
import styles from '../admin.module.css';

type AccountRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
  profile: { title: string | null; status: string | null; isVisible: boolean | null } | null;
  company: {
    name: string | null;
    verificationStatus: string | null;
    planTier: string | null;
  } | null;
};

type RoleFilter = 'ALL' | 'PROFESSIONAL' | 'COMPANY';

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatUiDateTime(iso, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function AdminContasPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    setHint('');
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        role,
        limit: '40',
      });
      const res = await fetch(`/api/admin/accounts?${params}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(localizeServerText(data.error) || exactUi('Erro ao buscar contas.'));
        setAccounts([]);
        return;
      }
      setAccounts(data.accounts || []);
      setHint(data.hint || '');
    } catch {
      setError(exactUi('Erro ao buscar contas.'));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [q, role]);

  const removeAccount = async (account: AccountRow) => {
    if (account.isAdmin) {
      alert(exactUi('Contas administrativas não podem ser excluídas por esta tela.'));
      return;
    }
    const label = account.company?.name || account.name || account.email;
    if (!window.confirm(`Excluir ${label}? A conta sai do site. Não dá para desfazer.`)) {
      return;
    }
    setBusyId(account.id);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(localizeServerText(data.error) || exactUi('Não foi possível excluir a conta.'));
        return;
      }
      setAccounts((prev) => prev.filter((row) => row.id !== account.id));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            {t('surface.admin.accounts')}
          </h1>
          <p className={styles.heroMeta}>
            Busca por e-mail, nome, cargo ou empresa. Resultados limitados — não lista o banco inteiro.
          </p>
        </div>
      </div>

      <section className={styles.panel}>
        <form
          className={styles.actions}
          style={{ flexWrap: 'wrap', gap: 10, justifyItems: 'center' }}
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={exactUi('E-mail, nome ou empresa')}
            aria-label={exactUi('Buscar contas')}
            style={{
              minWidth: 240,
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #c9b48a',
              background: '#fff8e8',
              color: '#414141',
            }}
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as RoleFilter)}
            aria-label={exactUi('Filtrar por tipo')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #c9b48a',
              background: '#fff8e8',
              color: '#414141',
            }}
          >
            <option value="ALL">{exactUi('Todos')}</option>
            <option value="PROFESSIONAL">{exactUi('Profissionais')}</option>
            <option value="COMPANY">{exactUi('Empresas')}</option>
          </select>
          <button type="submit" className={styles.btnGold} disabled={loading}>
            {loading ? exactUi('Buscando…') : exactUi('Buscar')}
          </button>
        </form>

        {error && <div className={styles.errorBox} style={{ marginTop: 16 }}>{error}</div>}
        {hint && !error && <p className={styles.empty}>{hint}</p>}
        {!loading && !hint && accounts.length === 0 && q.trim().length >= 2 && (
          <p className={styles.empty}>{exactUi('Nenhuma conta encontrada.')}</p>
        )}

        {accounts.length > 0 && (
          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{exactUi('Conta')}</th>
                  <th>{exactUi('Tipo')}</th>
                  <th>{exactUi('Detalhe')}</th>
                  <th>{exactUi('Criada')}</th>
                  <th>{exactUi('Último login')}</th>
                  <th>{exactUi('Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div>{account.name || '—'}</div>
                      <div className={styles.brandSub}>{account.email}</div>
                    </td>
                    <td>{account.isAdmin ? 'ADMIN' : account.role}</td>
                    <td>
                      {account.company?.name
                        ? `${account.company.name} · ${account.company.verificationStatus || '—'} · ${account.company.planTier || 'FREE'}`
                        : account.profile?.title
                          ? `${account.profile.title} · ${account.profile.status || '—'}`
                          : '—'}
                    </td>
                    <td>{formatWhen(account.createdAt)}</td>
                    <td>{formatWhen(account.lastLogin)}</td>
                    <td>
                      {!account.isAdmin && (
                        <button
                          type="button"
                          className={styles.btnGhost}
                          disabled={busyId === account.id}
                          onClick={() => void removeAccount(account)}
                        >
                          {busyId === account.id ? exactUi('Excluindo…') : exactUi('Excluir')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
