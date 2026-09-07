import { getExternalServices } from '@/lib/admin/external-services';
import styles from '../admin.module.css';

export default function AdminServicosPage() {
  const services = getExternalServices();

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Serviços</h1>
          <p className={styles.heroMeta}>
            Atalhos para Supabase, Vercel, GitHub, Google Console e Bancos. Cada console abre em nova aba
            (com a sessão do navegador, não precisa logar de novo).
          </p>
        </div>
      </div>

      <div className={styles.servicosGrid}>
        {services.map((service) => (
          <section key={service.slug} className={`${styles.panel} ${styles.servicoCard}`}>
            <span className={styles.sectionTag}>{service.label}</span>
            <p className={styles.servicoDesc}>{service.description}</p>
            <div className={styles.servicoActions}>
              <a
                href={service.url}
                target="_blank"
                rel="noreferrer"
                className={styles.btnGold}
              >
                Abrir {service.label}
              </a>
            </div>
            <ul className={styles.servicoLinks}>
              {service.links.map((item) => (
                <li key={item.label}>
                  <a href={item.url} target="_blank" rel="noreferrer" className={styles.linkGold}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
