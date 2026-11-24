import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTermoBySlug } from "@/lib/cadastro-termos";
import {
  getPublicTerm,
  isPublicTermSlug,
  resolvePublicTermParagraphs,
} from "@/lib/legal/public-terms";
import { bindLocale } from "@/lib/i18n/active-locale";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import styles from "../termo.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

function publicTitleKey(slug: string): MessageKey | null {
  if (slug === "uso") return "legal.termsOfUse";
  if (slug === "privacidade") return "legal.privacyPolicy";
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveInterfaceLocale();
  bindLocale(locale);

  const publicDoc = getPublicTerm(slug);
  if (publicDoc) {
    const titleKey = publicTitleKey(slug);
    const title = titleKey ? t(titleKey, locale) : publicDoc.titlePtBR;
    return {
      title,
      description: publicDoc.paragraphsByLocale["pt-BR"][0]?.slice(0, 160),
      robots: { index: true, follow: true },
      alternates: {
        canonical: `/termos/${slug}`,
        languages: {
          "pt-BR": `/termos/${slug}`,
          "x-default": `/termos/${slug}`,
        },
      },
    };
  }

  const termo = getTermoBySlug(slug);
  return {
    title: termo?.titulo || "Termos",
    robots: termo ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function TermoPage({ params }: Props) {
  const { slug } = await params;
  const locale = await resolveInterfaceLocale();
  bindLocale(locale);

  const publicDoc = getPublicTerm(slug);
  if (publicDoc) {
    const titleKey = publicTitleKey(slug);
    const title = titleKey ? t(titleKey, locale) : publicDoc.titlePtBR;
    const paragraphs = resolvePublicTermParagraphs(publicDoc, locale);
    const bodyIsFallback = !publicDoc.paragraphsByLocale[locale];

    return (
      <div className={styles.container}>
        <article className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {bodyIsFallback && locale !== "pt-BR" ? (
            <p className={styles.paragraph}>
              {t("legal.bodyFallbackNotice", locale)}
            </p>
          ) : null}
          <div className={styles.body}>
            {paragraphs.map((texto) => (
              <p key={texto.slice(0, 48)} className={styles.paragraph}>
                {texto}
              </p>
            ))}
          </div>
          <aside className={styles.body} aria-label={t("legal.pendingReviewHeading", locale)}>
            <p className={styles.paragraph}>
              <strong>{t("legal.pendingReviewHeading", locale)}</strong>
            </p>
            <ul>
              {publicDoc.pendingLegalValidation.map((item) => (
                <li key={item} className={styles.paragraph}>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
          <p className={styles.paragraph}>
            <Link href="/termos/uso">{t("legal.termsOfUse", locale)}</Link>
            {" · "}
            <Link href="/termos/privacidade">{t("legal.privacyPolicy", locale)}</Link>
            {" · "}
            <Link href="/termos/lgpd">{t("legal.lgpdShort", locale)}</Link>
          </p>
          <Link href="/" className={styles.backLink}>
            {t("legal.backHome", locale)}
          </Link>
        </article>
      </div>
    );
  }

  const termo = getTermoBySlug(slug);
  if (!termo) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>{termo.titulo}</h1>
        <div className={styles.body}>
          {termo.paragrafos.map((texto) => (
            <p key={texto} className={styles.paragraph}>
              {texto}
            </p>
          ))}
        </div>
        {isPublicTermSlug(slug) ? null : (
          <p className={styles.paragraph}>
            <Link href="/termos/uso">{t("legal.termsOfUse", locale)}</Link>
            {" · "}
            <Link href="/termos/privacidade">{t("legal.privacyPolicy", locale)}</Link>
          </p>
        )}
        <Link href="/professional/register" className={styles.backLink}>
          {t("legal.backToRegister", locale)}
        </Link>
      </article>
    </div>
  );
}
