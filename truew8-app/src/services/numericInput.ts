const DEFAULT_LOCALE = 'pt-BR';

type NumericMaskOptions = {
  locale?: string;
  allowDecimal?: boolean;
  maxFractionDigits?: number;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getDecimalSeparator(locale = DEFAULT_LOCALE): string {
  const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
  return parts.find((part) => part.type === 'decimal')?.value ?? ',';
}

export function maskNumericInput(raw: string, options: NumericMaskOptions = {}): string {
  const {
    locale = DEFAULT_LOCALE,
    allowDecimal = true,
    maxFractionDigits = 2,
  } = options;

  const decimalSeparator = getDecimalSeparator(locale);
  const separatorClass = `[.,${escapeRegExp(decimalSeparator)}]`;
  const normalized = raw
    .replace(new RegExp(separatorClass, 'g'), decimalSeparator)
    .replace(new RegExp(`[^0-9${escapeRegExp(decimalSeparator)}]`, 'g'), '');

  if (!allowDecimal) {
    return normalized.replace(new RegExp(escapeRegExp(decimalSeparator), 'g'), '');
  }

  const firstSeparatorIndex = normalized.indexOf(decimalSeparator);
  if (firstSeparatorIndex < 0) {
    return normalized;
  }

  const integerPart = normalized.slice(0, firstSeparatorIndex);
  const fractionRaw = normalized.slice(firstSeparatorIndex + 1).replace(new RegExp(escapeRegExp(decimalSeparator), 'g'), '');
  const fractionPart = maxFractionDigits >= 0 ? fractionRaw.slice(0, maxFractionDigits) : fractionRaw;
  const normalizedInteger = integerPart.length > 0 ? integerPart : '0';

  return `${normalizedInteger}${decimalSeparator}${fractionPart}`;
}

export function parseLocaleNumber(value: string, locale = DEFAULT_LOCALE): number {
  const decimalSeparator = getDecimalSeparator(locale);
  const sanitized = value
    .replace(new RegExp(`[^0-9${escapeRegExp(decimalSeparator)}]`, 'g'), '')
    .replace(decimalSeparator, '.');

  if (!sanitized || sanitized === '.') {
    return 0;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}
