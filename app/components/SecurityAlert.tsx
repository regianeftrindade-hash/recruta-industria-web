"use client";

import React, { useEffect, useState } from 'react';

interface SecurityAlertProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  icon?: string;
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

export default function SecurityAlert({
  type = 'info',
  title,
  message,
  icon,
  autoClose = true,
  duration = 5000,
  onClose
}: SecurityAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!visible) return null;

  const styles = {
    container: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      maxWidth: '400px',
      backgroundColor: 
        type === 'error' ? '#fee2e2' :
        type === 'warning' ? '#fef3c7' :
        type === 'success' ? '#d1fae5' :
        '#dbeafe',
      border: `2px solid ${
        type === 'error' ? '#ef4444' :
        type === 'warning' ? '#f59e0b' :
        type === 'success' ? '#10b981' :
        '#3b82f6'
      }`,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px',
    },
    icon: {
      fontSize: '24px',
    },
    title: {
      fontWeight: 'bold',
      fontSize: '16px',
      color: 
        type === 'error' ? '#991b1b' :
        type === 'warning' ? '#92400e' :
        type === 'success' ? '#065f46' :
        '#1e40af',
      margin: 0,
    },
    message: {
      fontSize: '14px',
      color: 
        type === 'error' ? '#7f1d1d' :
        type === 'warning' ? '#78350f' :
        type === 'success' ? '#064e3b' :
        '#1e3a8a',
      lineHeight: '1.5',
    },
    closeButton: {
      position: 'absolute' as const,
      top: '12px',
      right: '12px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      opacity: 0.6,
    },
  };

  const defaultIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✓',
    error: '✗',
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={styles.container}>
        <button 
          style={styles.closeButton}
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
        >
          ×
        </button>
        <div style={styles.header}>
          <span style={styles.icon}>{icon || defaultIcons[type]}</span>
          <h4 style={styles.title}>{title}</h4>
        </div>
        <p style={styles.message}>{message}</p>
      </div>
    </>
  );
}
