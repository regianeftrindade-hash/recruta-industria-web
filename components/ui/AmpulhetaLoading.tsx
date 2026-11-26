'use client';

import type { CSSProperties } from 'react';
import { t } from '@/lib/i18n/translate';

type AmpulhetaLoadingProps = {
  label?: string;
  size?: number;
  color?: string;
  /** Só o ícone (ex.: botão “Buscando...”) */
  compact?: boolean;
};

const spinStyle = (size: number, color: string): CSSProperties => ({
  display: 'inline-block',
  fontSize: size,
  lineHeight: 1,
  color,
  animation: 'ri-hourglass-spin 1.2s linear infinite',
  transformOrigin: 'center center',
});

const keyframes = `
  @keyframes ri-hourglass-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default function AmpulhetaLoading({
  label,
  size = 36,
  color = '#C89B3C',
  compact = false,
}: AmpulhetaLoadingProps) {
  label = label ?? t('rest.ui.loadingProfile');
  const icon = (
    <span aria-hidden style={spinStyle(size, color)}>
      ⏳
    </span>
  );

  if (compact) {
    return (
      <span role="status" aria-live="polite" aria-label={label || 'Carregando'}>
        {icon}
        <style>{keyframes}</style>
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Carregando'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {icon}
      {label ? (
        <p style={{ margin: 0, fontSize: 14, color, fontWeight: 600 }}>
          {label}
        </p>
      ) : null}
      <style>{keyframes}</style>
    </div>
  );
}
