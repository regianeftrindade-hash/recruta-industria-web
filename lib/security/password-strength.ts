export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Comprimento mínimo
  if (password.length >= 8) {
    score++
  } else {
    feedback.push('Mínimo 8 caracteres')
  }

  // Comprimento forte
  if (password.length >= 12) {
    score++
  } else if (password.length < 12) {
    feedback.push('Mínimo 12 caracteres para força máxima')
  }

  // Maiúsculas
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Adicione letras maiúsculas (A-Z)')
  }

  // Minúsculas
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Adicione letras minúsculas (a-z)')
  }

  // Números
  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Adicione números (0-9)')
  }

  // Caracteres especiais
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++
  } else {
    feedback.push('Adicione caracteres especiais (!@#$%^&*)')
  }

  // Não permitir padrões comuns
  const commonPatterns = [
    '123456',
    'password',
    'qwerty',
    'abc123',
    '111111',
    '000000'
  ]

  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    feedback.push('Evite padrões comuns (123456, password, etc)')
    score = Math.max(0, score - 1)
  }

  return {
    score: Math.min(4, Math.max(0, score - 2)), // Normalizar para 0-4
    feedback,
    isStrong: score >= 4 // Requer pelo menos 4 critérios
  }
}
