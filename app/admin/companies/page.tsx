'use client';

import React, { useCallback, useEffect, useState } from 'react';
import CompanyVerificationBadge from '@/components/company/CompanyVerificationBadge';
import { isCompanyVerificationStatus, type CompanyVerificationStatus } from '@/lib/company/company-verification';

type PendingCompany = {
  userId: string;
  razaoSocial: string;
  cnpj: string | null;
  responsavelNome: string | null;
  emailLogin: string;
  emailCorporativo: string | null;
  cartaoCnpjUrl: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
};

const FILTROS: Array<{ id: CompanyVerificationStatus; label: string }> = [
  { id: 'PENDING', label: 'Em análise' },
  { id: 'VERIFIED', label: 'Aprovado' },
  { id: 'REJECTED', label: 'Negado' },
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filtro, setFiltro] = useState<CompanyVerificationStatus>('PENDING');

  const load = useCallback((status: CompanyVerificationStatus) => {
    setLoading(true);
    void fetch(`/api/admin/companies?status=${status}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setCompanies([]);
          return;
        }
        setError('');
        setCompanies(data.companies || []);
      })
      .catch(() => setError('Erro ao carregar empresas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filtro);
  }, [filtro, load]);

  const review = async (userId: string, action: 'verify' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const typed = window.prompt('Justificativa da negativa:');
      if (typed == null) return;
      reason = typed.trim();
      if (!reason) {
        alert('Informe a justificativa da negativa.');
        return;
      }
    }

    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/companies/${userId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Erro ao atualizar verificação.');
        return;
      }
      load(filtro);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div style={{ padding: 24, color: '#414141', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#C89B3C' }}>Verificação de empresas</h1>
      <p style={{ color: 'var(--dash-text, #414141)' }}>Analise o cartão CNPJ. O status fica abaixo dos dados: em análise, aprovado ou negado. A negativa exige justificativa.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '2px solid #8D6B1F',
              background: filtro === item.id ? '#E8C56A' : '#F3E6C8',
              color: '#24180a',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: '#7f1d1d' }}>{error}</p>}

      {!loading && companies.length === 0 && !error && (
        <p>Nenhuma empresa neste status.</p>
      )}

      <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        {companies.map((company) => (
          <div key={company.userId} style={{ border: '2px solid #8D6B1F', borderRadius: 12, padding: 16, background: '#F3E6C8' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{company.razaoSocial}</h2>
            <p style={{ margin: '4px 0', fontSize: 13 }}>CNPJ: {company.cnpj || '—'}</p>
            <p style={{ margin: '4px 0', fontSize: 13 }}>Responsável: {company.responsavelNome || '—'}</p>
            <p style={{ margin: '4px 0', fontSize: 13 }}>Login: {company.emailLogin}</p>
            <p style={{ margin: '4px 0', fontSize: 13 }}>E-mail corporativo: {company.emailCorporativo || '—'}</p>
            {company.cartaoCnpjUrl && (
              <p style={{ margin: '10px 0 0' }}>
                <a href={company.cartaoCnpjUrl} target="_blank" rel="noreferrer" style={{ color: '#C89B3C' }}>
                  Abrir cartão CNPJ
                </a>
              </p>
            )}
            {isCompanyVerificationStatus(company.verificationStatus) ? (
              <CompanyVerificationBadge
                status={company.verificationStatus}
                reason={company.rejectionReason}
              />
            ) : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                disabled={busyId === company.userId}
                onClick={() => void review(company.userId, 'verify')}
                style={{ padding: '8px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Aprovar e dar selo verificada
              </button>
              <button
                type="button"
                disabled={busyId === company.userId}
                onClick={() => void review(company.userId, 'reject')}
                style={{ padding: '8px 14px', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Negar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
