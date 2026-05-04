// Ecuadorian CI validation (Módulo 10)
export function validateCI(ci: string): string | null {
  if (!/^\d{10}$/.test(ci)) return 'La cédula debe tener exactamente 10 dígitos.';
  const province = parseInt(ci.substring(0, 2));
  if ((province < 1 || province > 24) && province !== 30)
    return 'Código de provincia inválido (primeros 2 dígitos deben ser 01-24 o 30).';
  if (parseInt(ci[2]) > 5)
    return 'El tercer dígito debe ser 0-5 para cédulas ordinarias.';
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(ci[i]) * coefficients[i];
    if (val > 9) val -= 9;
    sum += val;
  }
  const verifier = (10 - (sum % 10)) % 10;
  if (verifier !== parseInt(ci[9])) return 'Cédula inválida (dígito verificador incorrecto).';
  return null;
}

export function validatePassport(passport: string): string | null {
  if (!/^[A-Za-z0-9]{5,15}$/.test(passport))
    return 'El pasaporte debe tener entre 5 y 15 caracteres alfanuméricos.';
  return null;
}

export function validateDocument(type: 'CI' | 'PASAPORTE', value: string): string | null {
  return type === 'CI' ? validateCI(value) : validatePassport(value);
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  barColor: string;
  textColor: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score: PasswordStrength['score'] =
    passed === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const labels  = ['', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const barColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const textColors = ['', 'text-red-500', 'text-orange-400', 'text-yellow-500', 'text-green-500'];
  return { score, label: labels[score], barColor: barColors[score], textColor: textColors[score], checks };
}
