"use client";

import React, { useEffect, useState } from 'react';
import { isSessionExpired } from '@/lib/security';

interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
}

export default function SessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout
}: SessionTimeoutProps) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    // Eventos que resetam o timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastActivity) / 1000 / 60; // em minutos
      const remaining = timeoutMinutes - elapsed;

      if (isSessionExpired(lastActivity, timeoutMinutes)) {
        clearInterval(interval);
        onTimeout?.();
      } else if (remaining <= warningMinutes && !showWarning) {
        setShowWarning(true);
      }

      setRemainingTime(Math.max(0, Math.ceil(remaining)));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutMinutes, warningMinutes, showWarning, onTimeout]);

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      maxWidth: '350px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>⏱️</span>
        <h4 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#92400e'
        }}>
          Sessão Inativa
        </h4>
      </div>
      
      <p style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        color: '#78350f',
        lineHeight: '1.5'
      }}>
        Sua sessão vai expirar em <strong>{remainingTime} minuto{remainingTime !== 1 ? 's' : ''}</strong> por segurança.
      </p>
      
      <button
        onClick={() => {
          setLastActivity(Date.now());
          setShowWarning(false);
        }}
        style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Continuar Conectado
      </button>
    </div>
  );
}
