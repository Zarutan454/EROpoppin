import { CustomError } from './errorHandler';

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export const required: ValidationRule = {
  test: (value: any) => value !== undefined && value !== null && value !== '',
  message: 'Dieses Feld ist erforderlich.',
};

export const email: ValidationRule = {
  test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
};

export const minLength = (length: number): ValidationRule => ({
  test: (value: string) => value.length >= length,
  message: `Mindestens ${length} Zeichen erforderlich.`,
});

export const maxLength = (length: number): ValidationRule => ({
  test: (value: string) => value.length <= length,
  message: `Maximal ${length} Zeichen erlaubt.`,
});

export const numeric: ValidationRule = {
  test: (value: string) => /^\d+$/.test(value),
  message: 'Bitte geben Sie nur Zahlen ein.',
};

export const url: ValidationRule = {
  test: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message: 'Bitte geben Sie eine gültige URL ein.',
};

export const validateInput = (value: any, rules: ValidationRule[]): string[] => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }
  
  return errors;
};

export const validateForm = (data: Record<string, any>, validationRules: Record<string, ValidationRule[]>) => {
  const errors: Record<string, string[]> = {};
  let hasErrors = false;

  for (const [field, rules] of Object.entries(validationRules)) {
    const fieldErrors = validateInput(data[field], rules);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      hasErrors = true;
    }
  }

  if (hasErrors) {
    throw new CustomError('Validierungsfehler', 'validation');
  }

  return true;
};

// Sicherheits-Validierung für Datei-Uploads
export const validateFileUpload = (file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
}) => {
  const errors: string[] = [];
  
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`Die Datei ist zu groß. Maximale Größe: ${options.maxSize / 1024 / 1024}MB`);
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`Dieser Dateityp wird nicht unterstützt. Erlaubte Typen: ${options.allowedTypes.join(', ')}`);
  }
  
  if (errors.length > 0) {
    throw new CustomError(errors.join(' '), 'validation');
  }
  
  return true;
};