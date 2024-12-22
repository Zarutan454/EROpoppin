/**
 * Formatiert einen Betrag als Währung
 * @param amount - Der zu formatierende Betrag
 * @param currency - Die Währung (Standard: EUR)
 * @param locale - Das Gebietsschema (Standard: de-DE)
 * @returns Formatierter Währungsbetrag
 */
export const formatCurrency = (
  amount: number,
  currency = 'EUR',
  locale = 'de-DE'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatiert eine Zahl mit Tausendertrennzeichen
 * @param number - Die zu formatierende Zahl
 * @param locale - Das Gebietsschema (Standard: de-DE)
 * @returns Formatierte Zahl
 */
export const formatNumber = (
  number: number,
  locale = 'de-DE'
): string => {
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Formatiert einen Prozentsatz
 * @param percentage - Der zu formatierende Prozentsatz
 * @param decimals - Anzahl der Dezimalstellen (Standard: 1)
 * @param locale - Das Gebietsschema (Standard: de-DE)
 * @returns Formatierter Prozentsatz
 */
export const formatPercentage = (
  percentage: number,
  decimals = 1,
  locale = 'de-DE'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentage / 100);
};

/**
 * Formatiert eine Dateigröße in Bytes in eine lesbare Form
 * @param bytes - Die Bytes
 * @param decimals - Anzahl der Dezimalstellen (Standard: 2)
 * @returns Formatierte Dateigröße
 */
export const formatFileSize = (
  bytes: number,
  decimals = 2
): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Formatiert eine Dauer in Minuten in ein lesbares Format
 * @param minutes - Die Dauer in Minuten
 * @returns Formatierte Dauer
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Kürzt einen Text auf eine bestimmte Länge
 * @param text - Der zu kürzende Text
 * @param maxLength - Maximale Länge (Standard: 100)
 * @param suffix - Suffix für gekürzte Texte (Standard: ...)
 * @returns Gekürzter Text
 */
export const truncateText = (
  text: string,
  maxLength = 100,
  suffix = '...'
): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.substring(0, maxLength - suffix.length)}${suffix}`;
};

/**
 * Formatiert eine Telefonnummer in ein einheitliches Format
 * @param phoneNumber - Die zu formatierende Telefonnummer
 * @returns Formatierte Telefonnummer
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Entfernt alle nicht-numerischen Zeichen außer +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Überprüft, ob es eine internationale Nummer ist
  if (cleaned.startsWith('+')) {
    // Formatiert internationale Nummern: +49 123 45678901
    return cleaned.replace(/(\+\d{2})(\d{3})(\d{8})/, '$1 $2 $3');
  }

  // Formatiert nationale Nummern: 0123 45678901
  return cleaned.replace(/(\d{4})(\d{8})/, '$1 $2');
};

/**
 * Formatiert eine E-Mail-Adresse teilweise mit Sternen
 * @param email - Die zu formatierende E-Mail-Adresse
 * @returns Formatierte E-Mail-Adresse
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const maskedLocal =
    localPart.charAt(0) +
    '*'.repeat(localPart.length - 2) +
    localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};