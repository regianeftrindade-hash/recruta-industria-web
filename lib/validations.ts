// Validações de segurança reutilizáveis

export const validations = {
  // Valida email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valida força da senha
  isStrongPassword: (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasMinLength && hasUppercase && hasNumber && hasSymbol;
  },

  // Valida CPF básico
  isValidCPF: (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) return false;
    
    // Verifica se não é sequência repetida
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    return true;
  },

  // Valida CNPJ básico
  isValidCNPJ: (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleaned = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleaned.length !== 14) return false;
    
    // Verifica se não é sequência repetida
    if (/^(\d)\1{13}$/.test(cleaned)) return false;
    
    return true;
  },

  // Sanitiza entrada de texto (remove caracteres perigosos)
  sanitizeInput: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < e >
      .slice(0, 255); // Limita tamanho
  },

  // Valida nome (apenas letras e espaços)
  isValidName: (name: string): boolean => {
    return /^[a-zA-ZÀ-ÿ\s]{2,}$/.test(name.trim());
  },

  // Verifica força da senha com detalhes
  getPasswordStrength: (password: string) => {
    let strength = 0;
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(requirements).forEach(req => {
      if (req) strength++;
    });

    return {
      strength,
      isStrong: strength >= 3,
      requirements,
      level: strength === 0 ? 'muito fraca' : 
             strength === 1 ? 'fraca' : 
             strength === 2 ? 'média' :
             strength === 3 ? 'boa' : 'muito forte'
    };
  }
};

// Tipos de erro de validação
export type ValidationError = {
  field: string;
  message: string;
};

// Validador de formulário genérico
export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => string | null>) => {
  const errors: ValidationError[] = [];

  Object.keys(rules).forEach(field => {
    const error = rules[field](data[field]);
    if (error) {
      errors.push({ field, message: error });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
