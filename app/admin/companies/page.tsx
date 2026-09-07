'use client';

import React, { useEffect, useState } from 'react';

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

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    void fetch('/api/admin/companies?status=PENDING', { credentials: 'include' })
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
      .catch(() => setError('Erro ao carregar empresas pendentes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (userId: string, action: 'verify' | 'reject') => {
    const reason = action === 'reject'
      ? window.prompt('Motivo da recusa (opcional):') || 'Documentação não aprovada.'
      : undefined;

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
      load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div style={{ padding: 24, color: '#f2f2f2', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#C89B3C' }}>Verificação de empresas</h1>
      <p style={{ color: '#ccc' }}>Analise o cartão CNPJ e aprove ou recuse o cadastro.</p>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && companies.length === 0 && !error && (
        <p>Nenhuma empresa aguardando verificação.</p>
      )}

      <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        {companies.map((company) => (
          <div key={company.userId} style={{ border: '1px solid #8D6B1F', borderRadius: 12, padding: 16, background: '#111' }}>
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
                Recusar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
