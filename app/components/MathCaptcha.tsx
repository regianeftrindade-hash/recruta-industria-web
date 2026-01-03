"use client";

import React, { useState, useEffect } from 'react';
import { generateMathCaptcha } from '@/lib/security';

interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export default function MathCaptcha({ onVerify }: MathCaptchaProps) {
  const [captcha, setCaptcha] = useState(generateMathCaptcha());
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleRefresh = () => {
    setCaptcha(generateMathCaptcha());
    setUserAnswer('');
    setIsVerified(false);
    setError('');
    onVerify(false);
  };

  const handleVerify = () => {
    const answer = parseInt(userAnswer, 10);
    if (isNaN(answer)) {
      setError('Por favor, digite um número válido');
      return;
    }

    if (answer === captcha.answer) {
      setIsVerified(true);
      setError('');
      onVerify(true);
    } else {
      setError('Resposta incorreta. Tente novamente.');
      setIsVerified(false);
      onVerify(false);
      handleRefresh();
    }
  };

  useEffect(() => {
    if (userAnswer && !isVerified) {
      setError('');
    }
  }, [userAnswer, isVerified]);

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      padding: '16px',
      marginTop: '10px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          Verificação de Segurança
        </h4>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          {captcha.question}
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify();
          }}
          placeholder="Sua resposta"
          disabled={isVerified}
          style={{
            flex: 1,
            padding: '10px',
            border: `2px solid ${error ? '#ef4444' : isVerified ? '#10b981' : '#d1d5db'}`,
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        
        {!isVerified ? (
          <>
            <button
              onClick={handleVerify}
              disabled={!userAnswer}
              style={{
                backgroundColor: userAnswer ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: userAnswer ? 'pointer' : 'not-allowed'
              }}
            >
              ✓
            </button>
            <button
              onClick={handleRefresh}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔄
            </button>
          </>
        ) : (
          <div style={{
            backgroundColor: '#d1fae5',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#065f46'
          }}>
            ✓ Verificado
          </div>
        )}
      </div>

      {error && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '12px',
          color: '#ef4444',
          fontWeight: '600'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
