// Функції для форматування українських телефонних номерів

export function formatUkrainianPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Видаляємо всі символи крім цифр
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Якщо номер починається з 380, видаляємо код країни
  let phoneNumber = digitsOnly;
  if (phoneNumber.startsWith('380')) {
    phoneNumber = phoneNumber.substring(3);
  }
  
  // Якщо номер починається з 0, видаляємо його
  if (phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber.substring(1);
  }
  
  // Форматуємо залежно від довжини
  if (phoneNumber.length === 9) {
    // Мобільний номер: (0XX) XXX-XX-XX
    return `(0${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 5)}-${phoneNumber.substring(5, 7)}-${phoneNumber.substring(7, 9)}`;
  } else if (phoneNumber.length === 7) {
    // Міський номер: XXX-XX-XX
    return `${phoneNumber.substring(0, 3)}-${phoneNumber.substring(3, 5)}-${phoneNumber.substring(5, 7)}`;
  } else if (phoneNumber.length === 6) {
    // Короткий міський: XXX-XXX
    return `${phoneNumber.substring(0, 3)}-${phoneNumber.substring(3, 6)}`;
  }
  
  // Якщо номер не підходить під стандартні формати, повертаємо як є з пробілами
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  const formatted = formatUkrainianPhone(phone);
  return formatted ? `📞 ${formatted}` : '';
}

export function normalizePhoneInput(phone: string): string {
  if (!phone) return '';
  
  // Видаляємо всі символи крім цифр та +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Якщо починається з +38, залишаємо як є
  if (normalized.startsWith('+38')) {
    return normalized;
  }
  
  // Якщо починається з 38, додаємо +
  if (normalized.startsWith('38')) {
    return `+${normalized}`;
  }
  
  // Якщо починається з 0, замінюємо на +380
  if (normalized.startsWith('0')) {
    return `+38${normalized}`;
  }
  
  // Якщо 9 цифр без кодів, додаємо +380
  if (normalized.length === 9 && /^[1-9]/.test(normalized)) {
    return `+380${normalized}`;
  }
  
  return normalized;
}