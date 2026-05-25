export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function nullIfBlank(value) {
  return isBlank(value) ? null : String(value).trim();
}

export function optionalNumber(value) {
  if (isBlank(value)) return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

export function buildDate({ dia, mes, anio }) {
  if ([dia, mes, anio].some(isBlank)) return null;
  const day = Number(dia);
  const month = Number(mes);
  const year = Number(anio);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
