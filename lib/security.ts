// Validações de segurança e sanitização de dados

// CORS e Headers de Segurança
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validar força da senha
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  strength: 'weak' | 'medium' | 'strong';
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
} {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const fulfilledRequirements = Object.values(requirements).filter(Boolean).length;
  const strength = fulfilledRequirements <= 2 ? 'weak' : fulfilledRequirements === 3 ? 'medium' : 'strong';
  const isStrong = fulfilledRequirements >= 3;

  return { isStrong, strength, requirements };
}

// Sanitizar entrada de texto (remover caracteres perigosos)
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .slice(0, 500); // Limita a 500 caracteres
}

// Validar CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  let digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

// Validar CPF com algoritmo completo
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  let multiplier = 10;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * multiplier;
    multiplier--;
  }
  
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleaned[9], 10) !== firstDigit) {
    return false;
  }
  
  // Validar segundo dígito verificador
  sum = 0;
  multiplier = 11;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i], 10) * multiplier;
    multiplier--;
  }
  
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleaned[10], 10) !== secondDigit) {
    return false;
  }
  
  return true;
}

// Rate limiting simples em memória
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (now - attempt.timestamp > windowMs) {
    loginAttempts.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (attempt.count >= maxAttempts) {
    return false;
  }

  attempt.count++;
  return true;
}

// Resetar tentativas de login
export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

// ===== NOVAS FUNCIONALIDADES DE SEGURANÇA =====

// Session Timeout - Verificar se sessão expirou
export function isSessionExpired(lastActivity: number, timeoutMinutes = 30): boolean {
  const now = Date.now();
  const timeout = timeoutMinutes * 60 * 1000;
  return (now - lastActivity) > timeout;
}

// Gerar token de confirmação de email
export function generateEmailToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

// Validar token de email
export function isValidEmailToken(token: string, createdAt: number, expiryHours = 24): boolean {
  const now = Date.now();
  const expiry = expiryHours * 60 * 60 * 1000;
  return token.length > 20 && (now - createdAt) < expiry;
}

// Detectar login suspeito (novo IP ou localização)
export function isSuspiciousLogin(
  currentIP: string, 
  lastKnownIPs: string[], 
  maxKnownIPs = 5
): boolean {
  return lastKnownIPs.length > 0 && !lastKnownIPs.includes(currentIP);
}

// Calcular força de senha com pontuação detalhada
export function calculatePasswordScore(password: string): {
  score: number;
  maxScore: number;
  percentage: number;
  crackTime: string;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Comprimento (0-30 pontos)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  else feedback.push('Use pelo menos 16 caracteres');
  
  // Maiúsculas (10 pontos)
  if (/[A-Z]/.test(password)) score += 10;
  else feedback.push('Adicione letras maiúsculas');
  
  // Minúsculas (10 pontos)
  if (/[a-z]/.test(password)) score += 10;
  else feedback.push('Adicione letras minúsculas');
  
  // Números (10 pontos)
  if (/[0-9]/.test(password)) score += 10;
  else feedback.push('Adicione números');
  
  // Símbolos especiais (15 pontos)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  else feedback.push('Adicione símbolos especiais');
  
  // Sem repetições óbvias (15 pontos)
  if (!/(.)\1{2,}/.test(password)) score += 15;
  else feedback.push('Evite caracteres repetidos');
  
  const maxScore = 100;
  const percentage = Math.round((score / maxScore) * 100);
  
  // Estimar tempo para quebrar senha
  let crackTime = '';
  if (percentage < 30) crackTime = 'Segundos';
  else if (percentage < 50) crackTime = 'Minutos';
  else if (percentage < 70) crackTime = 'Dias';
  else if (percentage < 85) crackTime = 'Meses';
  else crackTime = 'Séculos';
  
  return { score, maxScore, percentage, crackTime, feedback };
}

// Gerar captcha simples (matemática)
export function generateMathCaptcha(): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let answer = 0;
  let question = '';
  
  switch (operation) {
    case '+':
      answer = num1 + num2;
      question = `Quanto é ${num1} + ${num2}?`;
      break;
    case '-':
      answer = Math.abs(num1 - num2);
      question = `Quanto é ${Math.max(num1, num2)} - ${Math.min(num1, num2)}?`;
      break;
    case '*':
      answer = num1 * num2;
      question = `Quanto é ${num1} × ${num2}?`;
      break;
  }
  
  return { question, answer };
}

// Logs de atividade
interface ActivityLog {
  timestamp: number;
  action: string;
  ip: string;
  userAgent: string;
  success: boolean;
}

const activityLogs = new Map<string, ActivityLog[]>();

export function logActivity(
  identifier: string,
  action: string,
  ip: string,
  userAgent: string,
  success: boolean
): void {
  const log: ActivityLog = {
    timestamp: Date.now(),
    action,
    ip,
    userAgent,
    success
  };
  
  const logs = activityLogs.get(identifier) || [];
  logs.push(log);
  
  // Manter apenas últimos 100 logs
  if (logs.length > 100) {
    logs.shift();
  }
  
  activityLogs.set(identifier, logs);
}

export function getActivityLogs(identifier: string, limit = 20): ActivityLog[] {
  const logs = activityLogs.get(identifier) || [];
  return logs.slice(-limit).reverse();
}

// Verificar se IP está em lista negra
const ipBlacklist = new Set<string>();

export function isIPBlocked(ip: string): boolean {
  return ipBlacklist.has(ip);
}

export function blockIP(ip: string): void {
  ipBlacklist.add(ip);
}

export function unblockIP(ip: string): void {
  ipBlacklist.delete(ip);
}

// Validação de telefone brasileiro
export function isValidPhoneBR(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Aceita: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  return /^(\d{2})9?\d{8}$/.test(cleaned);
}

// Gerar código 2FA
export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verificar código 2FA com tempo de expiração
const twoFACodes = new Map<string, { code: string; timestamp: number }>();

export function store2FACode(identifier: string, code: string): void {
  twoFACodes.set(identifier, { code, timestamp: Date.now() });
}

export function verify2FACode(identifier: string, code: string, expiryMinutes = 5): boolean {
  const stored = twoFACodes.get(identifier);
  if (!stored) return false;
  
  const now = Date.now();
  const expiry = expiryMinutes * 60 * 1000;
  
  if ((now - stored.timestamp) > expiry) {
    twoFACodes.delete(identifier);
    return false;
  }
  
  if (stored.code === code) {
    twoFACodes.delete(identifier);
    return true;
  }
  
  return false;
}

// ===== NOVAS FUNCIONALIDADES DE SEGURANÇA =====

// Hash de Senha (simulado - usar bcrypt em produção)
export function hashPassword(password: string): string {
  // Em produção, usar: import bcrypt from 'bcrypt'; await bcrypt.hash(password, 10)
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
  // Em produção, usar: await bcrypt.compare(password, hash)
  return Buffer.from(password).toString('base64') === hash;
}

// CSRF Token geração
const csrfTokens = new Map<string, { token: string; timestamp: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  csrfTokens.set(sessionId, { token, timestamp: Date.now() });
  return token;
}

export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  
  // Token válido por 1 hora
  if ((Date.now() - stored.timestamp) > 3600000) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

// Bloqueio de conta após tentativas falhadas
interface AccountLockout {
  attempts: number;
  lastAttempt: number;
  locked: boolean;
}

const accountLockouts = new Map<string, AccountLockout>();

export function incrementFailedAttempts(email: string): void {
  const lockout = accountLockouts.get(email) || { attempts: 0, lastAttempt: Date.now(), locked: false };
  lockout.attempts++;
  lockout.lastAttempt = Date.now();
  
  if (lockout.attempts >= 5) {
    lockout.locked = true;
  }
  
  accountLockouts.set(email, lockout);
}

export function isAccountLocked(email: string): boolean {
  const lockout = accountLockouts.get(email);
  if (!lockout) return false;
  
  if (lockout.locked) {
    // Desbloquear após 15 minutos
    if ((Date.now() - lockout.lastAttempt) > 900000) {
      accountLockouts.delete(email);
      return false;
    }
    return true;
  }
  
  return false;
}

export function resetFailedAttempts(email: string): void {
  accountLockouts.delete(email);
}

// Gerador de token seguro para reset de senha
const passwordResetTokens = new Map<string, { token: string; email: string; timestamp: number }>();

export function generatePasswordResetToken(email: string): string {
  const token = Buffer.from(`${email}-${Date.now()}-${Math.random()}`).toString('base64');
  passwordResetTokens.set(token, { token, email, timestamp: Date.now() });
  return token;
}

export function verifyPasswordResetToken(token: string): string | null {
  const stored = passwordResetTokens.get(token);
  if (!stored) return null;
  
  // Token válido por 1 hora
  if ((Date.now() - stored.timestamp) > 3600000) {
    passwordResetTokens.delete(token);
    return null;
  }
  
  return stored.email;
}

export function consumePasswordResetToken(token: string): void {
  passwordResetTokens.delete(token);
}

// Detecção de anomalias (login em novo IP/device)
interface LoginRecord {
  ip: string;
  userAgent: string;
  timestamp: number;
}

const loginHistory = new Map<string, LoginRecord[]>();

export function recordLogin(email: string, ip: string, userAgent: string): void {
  const record: LoginRecord = { ip, userAgent, timestamp: Date.now() };
  const history = loginHistory.get(email) || [];
  history.push(record);
  
  // Manter últimos 50 logins
  if (history.length > 50) {
    history.shift();
  }
  
  loginHistory.set(email, history);
}

export function detectAnomalousLogin(email: string, ip: string, userAgent: string): boolean {
  const history = loginHistory.get(email) || [];
  
  if (history.length === 0) return false;
  
  // Verificar se IP/userAgent já foi visto
  const hasSeenBefore = history.some(
    record => record.ip === ip && record.userAgent === userAgent
  );
  
  // Se não viu antes e temos histórico, é anômalo
  return !hasSeenBefore && history.length > 0;
}

// Validação de entrada robusta
export function validateInput(input: any, type: 'email' | 'password' | 'text' | 'number'): boolean {
  if (typeof input !== 'string' && type !== 'number') return false;
  
  switch (type) {
    case 'email':
      return isValidEmail(input);
    case 'password':
      return input.length >= 8;
    case 'text':
      return input.length > 0 && input.length <= 500;
    case 'number':
      return !isNaN(Number(input));
    default:
      return false;
  }
}

// Proteção contra brute force em API
const apiRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkAPIRateLimit(identifier: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const current = apiRateLimits.get(identifier);
  
  if (!current || now > current.resetTime) {
    apiRateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count < limit) {
    current.count++;
    return true;
  }
  
  return false;
}

// Auditoria com timestamp e detalhes
interface AuditLog {
  timestamp: number;
  action: string;
  email: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure';
  details: string;
}

const auditLogs: AuditLog[] = [];

export function logAudit(
  action: string,
  email: string,
  ip: string,
  userAgent: string,
  result: 'success' | 'failure',
  details: string
): void {
  const log: AuditLog = {
    timestamp: Date.now(),
    action,
    email,
    ip,
    userAgent,
    result,
    details,
  };
  
  auditLogs.push(log);
  
  // Manter últimos 10000 logs
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
}

export function getAuditLogs(limit = 100): AuditLog[] {
  return auditLogs.slice(-limit).reverse();
}
