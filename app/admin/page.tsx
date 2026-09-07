'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

type SeriesPoint = {
  day: string;
  label: string;
  visits: number;
  professionals: number;
  companies: number;
};

type Totals = {
  visits: number;
  uniqueSessions: number;
  visitsToday: number;
  professionals: number;
  companies: number;
  profilesActive: number;
  companiesPending: number;
  freeCompanies: number;
  contatados: number;
  entrevistados: number;
  testados: number;
  contratados: number;
  naoContratados: number;
};

type PlanItem = {
  tier: string;
  nome: string;
  preco: string;
  subscriptions: number;
  revenueLabel: string;
};

type PlansSummary = {
  items: PlanItem[];
  totalSubscriptions: number;
  totalRevenueLabel: string;
  totalCollectedLabel?: string;
  collectedPayments?: number;
};

type InboxMessage = {
  id: string;
  uid?: number;
  from: string;
  subject: string;
  date: string | null;
  seen: boolean;
};

type PendingCompany = {
  userId: string;
  razaoSocial: string;
  cnpj: string | null;
  responsavelNome: string | null;
  emailLogin: string;
  emailCorporativo: string | null;
  cartaoCnpjUrl: string | null;
};

const STATS_MS = 5000;
const INBOX_MS = 10000;
/** Prévia no Centro de comando: o que cabe no card (alinhado ao e-mail). */
const PREVIEW_LIST_LIMIT = 4;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function BarChart({
  title,
  series,
  dataKey,
  color,
}: {
  title: string;
  series: SeriesPoint[];
  dataKey: 'visits' | 'professionals' | 'companies';
  color: string;
}) {
  const max = Math.max(1, ...series.map((s) => s[dataKey]));

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartBars}>
        {series.map((point) => {
          const value = point[dataKey];
          const height = Math.max(4, Math.round((value / max) * 120));
          return (
            <div key={`${dataKey}-${point.day}`} className={styles.chartCol}>
              <div className={styles.chartVal}>{value || ''}</div>
              <div
                className={styles.chartBar}
                title={`${point.label}: ${value}`}
                style={{ height, background: color }}
              />
              <div className={styles.chartLabel}>{point.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [plans, setPlans] = useState<PlansSummary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [mailbox, setMailbox] = useState<string | null>(null);
  const [inboxError, setInboxError] = useState('');
  const [inboxConfigured, setInboxConfigured] = useState(false);
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [clockReady, setClockReady] = useState(false);
  const liveRef = useRef(true);

  const loadCore = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/companies?status=PENDING', { credentials: 'include' }),
      ]);
      const stats = await statsRes.json();
      const companiesData = await companiesRes.json();

      if (stats.error) {
        setError(stats.error);
      } else {
        setError('');
        setTotals(stats.totals);
        setPlans(stats.plans || null);
        setSeries(stats.series || []);
      }

      if (!companiesData.error) {
        setCompanies(companiesData.companies || []);
      }

      setLastUpdate(new Date());
    } catch {
      if (!silent) setError('Erro ao carregar o painel.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox?limit=4', { credentials: 'include' });
      const inbox = await res.json();
      setInboxConfigured(inbox.configured === true);
      setMailbox(inbox.mailbox || null);
      setMessages(inbox.messages || []);
      setInboxError(inbox.error || '');
    } catch {
      /* silencioso no polling */
    }
  }, []);

  const refreshAll = useCallback(async (silent = false) => {
    await Promise.all([loadCore(silent), loadInbox()]);
  }, [loadCore, loadInbox]);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    void refreshAll(false);
  }, [refreshAll]);

  useEffect(() => {
    setClockReady(true);
    setNow(new Date());
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!live) return undefined;

    const statsTimer = window.setInterval(() => {
      if (liveRef.current) void loadCore(true);
    }, STATS_MS);

    const inboxTimer = window.setInterval(() => {
      if (liveRef.current) void loadInbox();
    }, INBOX_MS);

    const onFocus = () => {
      if (liveRef.current) void loadInbox();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && liveRef.current) void loadInbox();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(statsTimer);
      window.clearInterval(inboxTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [live, loadCore, loadInbox]);

  const unreadMail = messages.filter((m) => !m.seen).length;
  const companiesPreview = companies.slice(0, PREVIEW_LIST_LIMIT);

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            Centro de <span>comando</span>
          </h1>
          <p className={styles.heroMeta}>
            Painel de visualização em tempo real — ações em Empresas, Contato e Serviços.
            {clockReady && lastUpdate ? ` · Última atualização ${formatClock(lastUpdate)}` : ''}
            {clockReady && now ? ` · Agora ${formatClock(now)}` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btnGhost} ${live ? styles.btnGhostActive : ''}`}
            onClick={() => setLive((v) => !v)}
          >
            {live ? 'Ao vivo ligado' : 'Ao vivo pausado'}
          </button>
          <button type="button" className={styles.btnGold} onClick={() => void refreshAll(false)}>
            Atualizar agora
          </button>
        </div>
      </div>

      {loading && !totals && <p className={styles.empty}>Carregando painel...</p>}
      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeadMail}>
            <div className={styles.panelHeadStart}>
              <h2 className={styles.panelTitle}>Caixa de e-mail</h2>
              <p className={styles.panelSub}>
                {mailbox
                  ? `Conta: ${mailbox} · só dashboard empresa`
                  : 'Configure IMAP Hostinger no .env.local para ler a caixa'}
              </p>
            </div>
            <p
              className={`${styles.mailUnreadBadge} ${unreadMail === 0 ? styles.mailUnreadBadgeZero : ''}`}
            >
              {unreadMail} Não Lida{unreadMail === 1 ? '' : 's'}
            </p>
            <div className={styles.panelHeadEnd}>
              <Link href="/admin/contato" className={styles.linkGold}>
                Abrir Contato
              </Link>
            </div>
          </div>

          {inboxError && (
            <div className={styles.warnBox}>
              {inboxError}
              {!inboxConfigured && (
                <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#C89B3C', fontSize: 12 }}>
{`IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=contato@recrutaindustria.com
IMAP_PASS=sua-senha
# Se IMAP_PASS vazio, reutiliza SMTP_PASS`}
                </pre>
              )}
            </div>
          )}

          {!inboxError && messages.length === 0 && (
            <p className={styles.empty}>Nenhuma mensagem do dashboard empresa.</p>
          )}

          {messages.length > 0 && (
            <div className={styles.mailList}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.mailItem} ${styles.mailItemPreview} ${msg.seen ? '' : styles.mailItemUnread}`}
                >
                  <div className={styles.mailItemRow}>
                    <div className={styles.mailSubject}>{msg.subject}</div>
                    <div className={styles.mailDate}>{formatDate(msg.date)}</div>
                  </div>
                  <div className={styles.mailFrom}>{msg.from}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Empresas pendentes</h2>
              <p className={styles.panelSub}>
                {companies.length} pendente{companies.length === 1 ? '' : 's'}
                {companies.length > PREVIEW_LIST_LIMIT
                  ? ` · mostrando ${PREVIEW_LIST_LIMIT}`
                  : ''}
                {' · só visualização'}
              </p>
            </div>
            <Link href="/admin/companies" className={styles.linkGold}>Abrir Empresas</Link>
          </div>

          <ul className={styles.companyListView}>
            {Array.from({ length: PREVIEW_LIST_LIMIT }, (_, index) => {
              const company = companiesPreview[index];
              if (!company) {
                return (
                  <li
                    key={`empresa-vazio-${index}`}
                    className={`${styles.companyListRow} ${styles.companyListRowEmpty}`}
                  >
                    <div className={styles.companyListMain}>
                      <span className={styles.companyListNameEmpty}>Slot livre</span>
                      <span className={styles.companyListMeta}>Aguardando empresa pendente</span>
                    </div>
                    <div className={styles.companyListSide}>
                      <span className={styles.companyListMeta}>—</span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={company.userId} className={styles.companyListRow}>
                  <div className={styles.companyListMain}>
                    <span className={styles.companyListName}>{company.razaoSocial}</span>
                    <span className={styles.companyListMeta}>
                      CNPJ {company.cnpj || '—'}
                      {company.responsavelNome ? ` · ${company.responsavelNome}` : ''}
                    </span>
                  </div>
                  <div className={styles.companyListSide}>
                    <span className={styles.companyListEmail}>{company.emailLogin}</span>
                    {company.emailCorporativo && company.emailCorporativo !== company.emailLogin && (
                      <span className={styles.companyListMeta}>{company.emailCorporativo}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {totals && (
        <>
          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>Métricas</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th>Valor</th>
                    <th>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Visitas no site</td>
                    <td className={styles.dataValue}>{totals.visits}</td>
                    <td>{totals.visitsToday} hoje</td>
                  </tr>
                  <tr>
                    <td>Sessões únicas</td>
                    <td className={styles.dataValue}>{totals.uniqueSessions}</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Profissionais</td>
                    <td className={styles.dataValue}>{totals.professionals}</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Empresas</td>
                    <td className={styles.dataValue}>{totals.companies}</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Perfis ativos</td>
                    <td className={styles.dataValue}>{totals.profilesActive}</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Pendentes CNPJ</td>
                    <td className={styles.dataValue}>{totals.companiesPending}</td>
                    <td>Aguardando análise</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>Assinaturas e receita</h2>
            <div className={styles.revenueTotalBox}>
              <span className={styles.revenueTotalLabel}>Total arrecadado com assinaturas</span>
              <strong className={styles.revenueTotalValue}>
                {plans?.totalCollectedLabel ?? 'R$ 0,00'}
              </strong>
              <span className={styles.revenueTotalHint}>
                {plans?.collectedPayments ?? 0} pagamento{(plans?.collectedPayments ?? 0) === 1 ? '' : 's'} confirmado{(plans?.collectedPayments ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Plano</th>
                    <th>Preço / mês</th>
                    <th>Assinaturas</th>
                    <th>Receita / mês</th>
                  </tr>
                </thead>
                <tbody>
                  {plans?.items.map((plan) => (
                    <tr key={plan.tier}>
                      <td>{plan.nome}</td>
                      <td>{plan.preco}</td>
                      <td className={styles.dataValue}>{plan.subscriptions}</td>
                      <td className={styles.dataValue}>{plan.revenueLabel}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Empresas Free</td>
                    <td>—</td>
                    <td className={styles.dataValue}>{totals.freeCompanies}</td>
                    <td>Sem plano pago ativo</td>
                  </tr>
                  <tr className={styles.dataRowHighlight}>
                    <td>Receita mensal estimada</td>
                    <td>—</td>
                    <td className={styles.dataValue}>{plans?.totalSubscriptions ?? 0}</td>
                    <td className={styles.dataValue}>{plans?.totalRevenueLabel ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>Funil de recrutamento</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Contatados</td>
                    <td className={styles.dataValue}>{totals.contatados}</td>
                  </tr>
                  <tr>
                    <td>Entrevistados</td>
                    <td className={styles.dataValue}>{totals.entrevistados}</td>
                  </tr>
                  <tr>
                    <td>Testados</td>
                    <td className={styles.dataValue}>{totals.testados ?? 0}</td>
                  </tr>
                  <tr>
                    <td>Contratados</td>
                    <td className={styles.dataValue}>{totals.contratados}</td>
                  </tr>
                  <tr>
                    <td>Não contratados</td>
                    <td className={styles.dataValue}>{totals.naoContratados ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>Tendência · 14 dias</h2>
            <div className={styles.charts}>
              <BarChart title="Visitas" series={series} dataKey="visits" color="#C89B3C" />
              <BarChart title="Cadastros profissionais" series={series} dataKey="professionals" color="#4ade80" />
              <BarChart title="Cadastros empresas" series={series} dataKey="companies" color="#60a5fa" />
            </div>
          </section>
        </>
      )}

      <p className={styles.footerNote}>
        Métricas e listas atualizam a cada {STATS_MS / 1000}s · e-mail a cada {INBOX_MS / 1000}s enquanto o modo ao vivo estiver ligado.
      </p>
    </div>
  );
}
