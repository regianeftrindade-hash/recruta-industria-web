"use client";

import React from 'react';
import { calculatePasswordScore } from '@/lib/security';

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, percentage, crackTime, feedback } = calculatePasswordScore(password);

  const getColor = () => {
    if (percentage < 30) return '#ef4444'; // vermelho
    if (percentage < 50) return '#f59e0b'; // laranja
    if (percentage < 70) return '#eab308'; // amarelo
    if (percentage < 85) return '#84cc16'; // verde claro
    return '#10b981'; // verde forte
  };

  const getLabel = () => {
    if (percentage < 30) return 'MUITO FRACA';
    if (percentage < 50) return 'FRACA';
    if (percentage < 70) return 'MÉDIA';
    if (percentage < 85) return 'FORTE';
    return 'MUITO FORTE';
  };

  const color = getColor();

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Barra de progresso */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'all 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>

      {/* Label e porcentagem */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: color
        }}>
          {getLabel()} ({percentage}%)
        </span>
        <span style={{
          fontSize: '11px',
          color: '#6b7280',
          fontWeight: '600'
        }}>
          ⏱️ Tempo para quebrar: {crackTime}
        </span>
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '10px',
          borderRadius: '8px',
          marginTop: '10px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#374151',
            marginBottom: '6px'
          }}>
            💡 Sugestões para melhorar:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            {feedback.map((item, index) => (
              <li key={index} style={{ marginBottom: '3px' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Barra de características */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: password.length >= 8 ? '#d1fae5' : '#fee2e2',
          color: password.length >= 8 ? '#065f46' : '#991b1b',
          fontWeight: '600'
        }}>
          {password.length >= 8 ? '✓' : '✗'} 8+ caracteres
        </div>
        <div style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: /[A-Z]/.test(password) ? '#d1fae5' : '#fee2e2',
          color: /[A-Z]/.test(password) ? '#065f46' : '#991b1b',
          fontWeight: '600'
        }}>
          {/[A-Z]/.test(password) ? '✓' : '✗'} Maiúscula
        </div>
        <div style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: /[0-9]/.test(password) ? '#d1fae5' : '#fee2e2',
          color: /[0-9]/.test(password) ? '#065f46' : '#991b1b',
          fontWeight: '600'
        }}>
          {/[0-9]/.test(password) ? '✓' : '✗'} Número
        </div>
        <div style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#d1fae5' : '#fee2e2',
          color: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#065f46' : '#991b1b',
          fontWeight: '600'
        }}>
          {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '✗'} Símbolo
        </div>
      </div>
    </div>
  );
}
