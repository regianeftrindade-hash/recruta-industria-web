"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';
import { t } from '@/lib/i18n/translate';

/** Redireciona para a tela de boas-vindas (mesmo fluxo do profissional). */
export default function SucessoEmpresa() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/company/boas-vindas');
  }, [router]);

  return <PageLoader message={t('rest.company.preparingWelcome')} />;
}
