import { useCallback, useMemo } from 'react';
import type { CampoObrigatorioFalta, CampoObrigatorioId } from '@/lib/professional/cadastro-obrigatorios';
import styles from './register.module.css';

export function useCampoObrigatorioErro(camposFaltando: CampoObrigatorioFalta[]) {
  const idsFaltando = useMemo(
    () => new Set(camposFaltando.map((campo) => campo.id)),
    [camposFaltando],
  );

  const campoErro = useCallback(
    (id: CampoObrigatorioId) => idsFaltando.has(id),
    [idsFaltando],
  );

  const fg = useCallback(
    (id: CampoObrigatorioId, extra?: string) =>
      [styles.fieldGroup, extra, campoErro(id) ? styles.fieldGroupErro : '']
        .filter(Boolean)
        .join(' '),
    [campoErro],
  );

  const blocoErro = useCallback(
    (id: CampoObrigatorioId, extra?: string) =>
      [extra, campoErro(id) ? styles.blocoCampoErro : ''].filter(Boolean).join(' '),
    [campoErro],
  );

  const termoErro = useCallback(
    (id: CampoObrigatorioId) =>
      [styles.termoItem, campoErro(id) ? styles.termoItemErro : ''].filter(Boolean).join(' '),
    [campoErro],
  );

  return { campoErro, fg, blocoErro, termoErro };
}
