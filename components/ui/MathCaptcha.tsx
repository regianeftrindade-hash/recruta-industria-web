"use client";

import React, { useState, useEffect } from 'react';
import { t } from '@/lib/i18n/translate';
import { generateMathCaptcha } from '@/lib/security';
import { READABLE_TEXT_STYLE } from '@/lib/theme';
import styles from './MathCaptcha.module.css';

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
      setError(t('surface.captcha.invalid'));
      return;
    }

    if (answer === captcha.answer) {
      setIsVerified(true);
      setError('');
      onVerify(true);
    } else {
      setError(t('surface.captcha.wrong'));
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
    <div className={styles.wrap} style={READABLE_TEXT_STYLE}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>🤖</span>
        <h4 className={styles.title}>{t('surface.captcha.title')}</h4>
      </div>

      <div className={styles.questionBox}>
        <p className={styles.question}>{captcha.question}</p>
      </div>

      <div className={styles.actions}>
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify();
          }}
          placeholder={t('surface.captcha.answer')}
          disabled={isVerified}
          className={`${styles.input} ${error ? styles.inputError : ''} ${isVerified ? styles.inputOk : ''}`}
        />

        {!isVerified ? (
          <>
            <button
              type="button"
              onClick={handleVerify}
              disabled={!userAnswer}
              className={styles.btnOk}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className={styles.btnRefresh}
              aria-label={t('surface.captcha.refresh')}
            >
              🔄
            </button>
          </>
        ) : (
          <div className={styles.verified}>✓ {t('surface.captcha.verified')}</div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
