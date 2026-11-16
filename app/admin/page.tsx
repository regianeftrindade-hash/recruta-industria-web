'use client';
import { localizeServerText } from "@/lib/i18n/server-text";
import { formatUiDateTime, uiIntlLocale } from "@/lib/i18n/format-ui";
import { exactUi } from "@/lib/i18n/exact-ui";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n/translate';
import styles from './admin.module.css';

type SeriesPoint = {
  day: string;
  label: string;
  visits: number;
  professionals: number;
  companies: number;
};

type PeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

type SiteStats = {
  visits: PeriodCounts;
  sessions: PeriodCounts;
  googleAccounts: PeriodCounts;
};

type AudienceStats = {
  cadastros: PeriodCounts;
  profilesComplete: number;
  profilesActive: number;
  pendingCnpj?: number;
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
    return formatUiDateTime(iso, {
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
  return date.toLocaleTimeString(uiIntlLocale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [professionalsStats, setProfessionalsStats] = useState<AudienceStats | null>(null);
  const [companiesStats, setCompaniesStats] = useState<AudienceStats | null>(null);
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
        setSiteStats(stats.site || null);
        setProfessionalsStats(stats.professionals || null);
        setCompaniesStats(stats.companies || null);
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
      const res = await fetch('/api/admin/inbox?limit=4&todas=1', { credentials: 'include' });
      const inbox = await res.json();
      setInboxConfigured(inbox.configured === true);
      setMailbox(inbox.mailbox || null);
      setMessages(inbox.messages || []);
      setInboxError(localizeServerText(inbox.error) || '');
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
            {t('internal.admin.command')} <span>{t('internal.admin.commandWord')}</span>
          </h1>
          <p className={styles.heroMeta}>
            {t('internal.admin.liveHint')}
            {clockReady && lastUpdate ? ` · ${t('internal.admin.lastUpdate')} ${formatClock(lastUpdate)}` : ''}
            {clockReady && now ? ` · ${t('internal.admin.now')} ${formatClock(now)}` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btnGhost} ${live ? styles.btnGhostActive : ''}`}
            onClick={() => setLive((v) => !v)}
          >
            {live ? t('internal.admin.liveOn') : t('internal.admin.liveOff')}
          </button>
          <button type="button" className={styles.btnGold} onClick={() => void refreshAll(false)}>
            {t('internal.admin.refresh')}
          </button>
        </div>
      </div>

      <section className={styles.panel} style={{ marginBottom: 20 }}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>{t('surface.admin.jobs')}</h2>
            <p className={styles.panelSub}>
              {t('internal.admin.jobsLead')}
            </p>
          </div>
          <Link href="/admin/vagas" className={styles.btnGold}>
            {t('internal.admin.openJobs')}
          </Link>
        </div>
      </section>

      <section className={styles.panel} style={{ marginBottom: 20 }}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>{t('internal.admin.manualTitle')}</h2>
            <p className={styles.panelSub}>
              {t('internal.admin.manualLead')}
            </p>
          </div>
          <Link href="/admin/candidaturas-manual" className={styles.btnGold}>
            {t('internal.admin.openManual')}
          </Link>
        </div>
      </section>

      {loading && !totals && <p className={styles.empty}>{t('internal.admin.loading')}</p>}
      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeadMail}>
            <div className={styles.panelHeadStart}>
              <h2 className={styles.panelTitle}>{t('surface.admin.inbox')}</h2>
              <p className={styles.panelSub}>
                {mailbox
                  ? `${t('internal.admin.mailAccount')} ${mailbox}. ${t('internal.admin.mailRest')}`
                  : t('internal.admin.mailMissing')}
              </p>
            </div>
            <p
              className={`${styles.mailUnreadBadge} ${unreadMail === 0 ? styles.mailUnreadBadgeZero : ''}`}
            >
              {unreadMail} {unreadMail === 1 ? t('internal.admin.unreadOne') : t('internal.admin.unreadMany')}
            </p>
            <div className={styles.panelHeadEnd}>
              <Link href="/admin/contato" className={styles.linkGold}>
                {t('internal.admin.openInbox')}
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
            <p className={styles.empty}>{t('internal.admin.noRecentMail')}</p>
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
              <h2 className={styles.panelTitle}>{t('internal.admin.pendingCompanies')}</h2>
              <p className={styles.panelSub}>
                {companies.length} {companies.length === 1 ? t('internal.admin.pendingOne') : t('internal.admin.pendingMany')}
                {companies.length > PREVIEW_LIST_LIMIT
                  ? ` · ${t('internal.admin.showing')} ${PREVIEW_LIST_LIMIT}`
                  : ''}
                {` · ${t('internal.admin.viewOnly')}`}
              </p>
            </div>
            <Link href="/admin/companies" className={styles.linkGold}>{t('internal.admin.openCompanies')}</Link>
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
                      <span className={styles.companyListNameEmpty}>{t('internal.admin.freeSlot')}</span>
                      <span className={styles.companyListMeta}>{t('internal.admin.waitingCompany')}</span>
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
                    <span className={styles.companyListMeta}>{t('internal.admin.inReview')}</span>
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
            <h2 className={styles.sectionTag}>{t('internal.admin.site')}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t('internal.admin.indicator')}</th>
                    <th>{t('internal.admin.total')}</th>
                    <th>{t('internal.admin.daily')}</th>
                    <th>{t('internal.admin.weekly')}</th>
                    <th>{t('internal.admin.monthly')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('internal.admin.visits')}</td>
                    <td className={styles.dataValue}>{siteStats?.visits.total ?? totals.visits}</td>
                    <td className={styles.dataValue}>{siteStats?.visits.today ?? totals.visitsToday}</td>
                    <td className={styles.dataValue}>{siteStats?.visits.week ?? '—'}</td>
                    <td className={styles.dataValue}>{siteStats?.visits.month ?? '—'}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.sessions')}</td>
                    <td className={styles.dataValue}>{siteStats?.sessions.total ?? totals.uniqueSessions}</td>
                    <td className={styles.dataValue}>{siteStats?.sessions.today ?? '—'}</td>
                    <td className={styles.dataValue}>{siteStats?.sessions.week ?? '—'}</td>
                    <td className={styles.dataValue}>{siteStats?.sessions.month ?? '—'}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.googleAccounts')}</td>
                    <td className={styles.dataValue}>{siteStats?.googleAccounts.total ?? 0}</td>
                    <td className={styles.dataValue}>{siteStats?.googleAccounts.today ?? 0}</td>
                    <td className={styles.dataValue}>{siteStats?.googleAccounts.week ?? 0}</td>
                    <td className={styles.dataValue}>{siteStats?.googleAccounts.month ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={styles.brandSub} style={{ marginTop: 10 }}>
              Google = contas criadas sem senha (login OAuth). Diário = hoje, das 00:00 às 23:59 no horário de Brasília. Semanal = 7 dias. Mensal = mês atual.
              Contas admin ficam fora das métricas de profissional/empresa.
            </p>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>{t('internal.admin.professionals')}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t('internal.admin.indicator')}</th>
                    <th>{t('internal.admin.total')}</th>
                    <th>{t('internal.admin.daily')}</th>
                    <th>{t('internal.admin.weekly')}</th>
                    <th>{t('internal.admin.monthly')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('internal.admin.signups')}</td>
                    <td className={styles.dataValue}>
                      {professionalsStats?.cadastros.total ?? totals.professionals}
                    </td>
                    <td className={styles.dataValue}>{professionalsStats?.cadastros.today ?? '—'}</td>
                    <td className={styles.dataValue}>{professionalsStats?.cadastros.week ?? '—'}</td>
                    <td className={styles.dataValue}>{professionalsStats?.cadastros.month ?? '—'}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.completeProfiles')}</td>
                    <td className={styles.dataValue}>{professionalsStats?.profilesComplete ?? '—'}</td>
                    <td colSpan={3}>{t('internal.admin.showcaseMinimum')}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.activeProfiles')}</td>
                    <td className={styles.dataValue}>
                      {professionalsStats?.profilesActive ?? totals.profilesActive}
                    </td>
                    <td colSpan={3}>{t('internal.admin.visibleToCompanies')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>{t('internal.admin.companies')}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t('internal.admin.indicator')}</th>
                    <th>{t('internal.admin.total')}</th>
                    <th>{t('internal.admin.daily')}</th>
                    <th>{t('internal.admin.weekly')}</th>
                    <th>{t('internal.admin.monthly')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('internal.admin.signups')}</td>
                    <td className={styles.dataValue}>
                      {companiesStats?.cadastros.total ?? totals.companies}
                    </td>
                    <td className={styles.dataValue}>{companiesStats?.cadastros.today ?? '—'}</td>
                    <td className={styles.dataValue}>{companiesStats?.cadastros.week ?? '—'}</td>
                    <td className={styles.dataValue}>{companiesStats?.cadastros.month ?? '—'}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.completeCompanies')}</td>
                    <td className={styles.dataValue}>{companiesStats?.profilesComplete ?? '—'}</td>
                    <td colSpan={3}>{t('internal.admin.companyMinimum')}</td>
                  </tr>
                  <tr>
                    <td>{t('internal.admin.activeCompanies')}</td>
                    <td className={styles.dataValue}>{companiesStats?.profilesActive ?? '—'}</td>
                    <td colSpan={3}>{t('internal.admin.cnpjApproved')}</td>
                  </tr>
                  <tr>
                    <td>{exactUi("Pendentes CNPJ")}</td>
                    <td className={styles.dataValue}>
                      {companiesStats?.pendingCnpj ?? totals.companiesPending}
                    </td>
                    <td colSpan={3}>{exactUi("Aguardando análise")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>{exactUi("Assinaturas e receita")}</h2>
            <div className={styles.revenueTotalBox}>
              <span className={styles.revenueTotalLabel}>{exactUi("Total arrecadado com assinaturas")}</span>
              <strong className={styles.revenueTotalValue}>
                {plans?.totalCollectedLabel ?? exactUi("R$ 0,00")}
              </strong>
              <span className={styles.revenueTotalHint}>
                {plans?.collectedPayments ?? 0} pagamento{(plans?.collectedPayments ?? 0) === 1 ? '' : 's'} confirmado{(plans?.collectedPayments ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{exactUi("Plano")}</th>
                    <th>{exactUi("Preço / mês")}</th>
                    <th>{exactUi("Assinaturas")}</th>
                    <th>{exactUi("Receita / mês")}</th>
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
                    <td>{exactUi("Empresas Free")}</td>
                    <td>—</td>
                    <td className={styles.dataValue}>{totals.freeCompanies}</td>
                    <td>{exactUi("Sem plano pago ativo")}</td>
                  </tr>
                  <tr className={styles.dataRowHighlight}>
                    <td>{exactUi("Receita mensal estimada")}</td>
                    <td>—</td>
                    <td className={styles.dataValue}>{plans?.totalSubscriptions ?? 0}</td>
                    <td className={styles.dataValue}>{plans?.totalRevenueLabel ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>{exactUi("Funil de recrutamento")}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{exactUi("Etapa")}</th>
                    <th>{exactUi("Quantidade")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{exactUi("Contatados")}</td>
                    <td className={styles.dataValue}>{totals.contatados}</td>
                  </tr>
                  <tr>
                    <td>{exactUi("Entrevistados")}</td>
                    <td className={styles.dataValue}>{totals.entrevistados}</td>
                  </tr>
                  <tr>
                    <td>{exactUi("Testados")}</td>
                    <td className={styles.dataValue}>{totals.testados ?? 0}</td>
                  </tr>
                  <tr>
                    <td>{exactUi("Contratados")}</td>
                    <td className={styles.dataValue}>{totals.contratados}</td>
                  </tr>
                  <tr>
                    <td>{exactUi("Não contratados")}</td>
                    <td className={styles.dataValue}>{totals.naoContratados ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.dataCard}`}>
            <h2 className={styles.sectionTag}>{exactUi("Tendência · 14 dias")}</h2>
            <div className={styles.charts}>
              <BarChart title={exactUi("Visitas")} series={series} dataKey="visits" color="#C89B3C" />
              <BarChart title={exactUi("Cadastros profissionais")} series={series} dataKey="professionals" color="#4ade80" />
              <BarChart title={exactUi("Cadastros empresas")} series={series} dataKey="companies" color="#60a5fa" />
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
