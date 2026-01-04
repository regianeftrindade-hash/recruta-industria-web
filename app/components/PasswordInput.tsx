'use client'

import { useState } from 'react'
import { validatePasswordStrength } from '@/lib/password-strength'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showStrength?: boolean
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Senha',
  showStrength = true
}: PasswordInputProps) {
  const strength = validatePasswordStrength(value)

  const getStrengthColor = () => {
    if (strength.score < 2) return '#ff4444'
    if (strength.score < 3) return '#ffaa00'
    if (strength.score < 4) return '#88cc00'
    return '#00cc00'
  }

  const getStrengthLabel = () => {
    if (strength.score < 2) return '❌ Fraca'
    if (strength.score < 3) return '⚠️ Média'
    if (strength.score < 4) return '✓ Boa'
    return '✅ Forte'
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: `2px solid ${getStrengthColor()}`,
          borderRadius: '6px',
          fontSize: '16px',
          boxSizing: 'border-box'
        }}
      />

      {showStrength && value && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '8px'
            }}
          >
            {[1, 2, 3, 4].map(level => (
              <div
                key={level}
                style={{
                  flex: 1,
                  height: '6px',
                  backgroundColor:
                    level <= strength.score ? getStrengthColor() : '#ddd',
                  borderRadius: '3px'
                }}
              />
            ))}
          </div>

          <p
            style={{
              margin: '5px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: getStrengthColor()
            }}
          >
            {getStrengthLabel()}
          </p>

          {strength.feedback.length > 0 && (
            <ul
              style={{
                margin: '8px 0',
                paddingLeft: '20px',
                fontSize: '13px'
              }}
            >
              {strength.feedback.map((tip, idx) => (
                <li key={idx} style={{ color: '#666', marginBottom: '4px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {!strength.isStrong && (
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#ff4444'
              }}
            >
              ⚠️ Senha não atende aos requisitos mínimos de segurança
            </p>
          )}
        </div>
      )}
    </div>
  )
}
