import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTermoBySlug } from '@/lib/cadastro-termos';
import styles from '../termo.module.css';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TermoCadastroPage({ params }: Props) {
  const { slug } = await params;
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
        <Link href="/professional/register" className={styles.backLink}>
          Voltar ao cadastro
        </Link>
      </article>
    </div>
  );
}
