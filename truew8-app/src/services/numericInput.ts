const DEFAULT_LOCALE = 'pt-BR';

type NumericMaskOptions = {
  locale?: string;
  allowDecimal?: boolean;
  maxFractionDigits?: number;
  mode?: 'decimal' | 'rightToLeft';
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getNumberSeparators(locale = DEFAULT_LOCALE): { decimalSeparator: string; groupSeparator: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1000.1);
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? ',';
  const groupSeparator = parts.find((part) => part.type === 'group')?.value ?? '.';

  return { decimalSeparator, groupSeparator };
}

export function getDecimalSeparator(locale = DEFAULT_LOCALE): string {
  return getNumberSeparators(locale).decimalSeparator;
}

function formatIntegerWithGrouping(value: string, groupSeparator: string): string {
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return '0';
  }

  const normalizedDigits = digitsOnly.replace(/^0+(?=\d)/, '');
  let formatted = '';
  let digitCount = 0;

  for (let index = normalizedDigits.length - 1; index >= 0; index -= 1) {
    formatted = normalizedDigits[index] + formatted;
    digitCount += 1;

    if (index > 0 && digitCount === 3) {
      formatted = `${groupSeparator}${formatted}`;
      digitCount = 0;
    }
  }

  return formatted;
}

export function maskNumericInput(raw: string, options: NumericMaskOptions = {}): string {
  const {
    locale = DEFAULT_LOCALE,
    allowDecimal = true,
    maxFractionDigits = 2,
    mode = 'decimal',
  } = options;

  const { decimalSeparator, groupSeparator } = getNumberSeparators(locale);

  if (mode === 'rightToLeft') {
    const digitsOnly = raw.replace(/\D/g, '');

    if (!digitsOnly) {
      return '';
    }

    if (!allowDecimal || maxFractionDigits <= 0) {
      return formatIntegerWithGrouping(digitsOnly, groupSeparator);
    }

    const integerDigits = digitsOnly.length > maxFractionDigits ? digitsOnly.slice(0, -maxFractionDigits) : '0';
    const fractionDigits = digitsOnly.slice(-maxFractionDigits).padStart(maxFractionDigits, '0');
    const formattedInteger = formatIntegerWithGrouping(integerDigits, groupSeparator);

    return `${formattedInteger}${decimalSeparator}${fractionDigits}`;
  }

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
