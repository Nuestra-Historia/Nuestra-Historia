export function isoToBuenosAiresInput(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  // Buenos Aires es siempre UTC-3
  const bstTime = new Date(d.getTime() - 3 * 3600 * 1000);
  const year = bstTime.getUTCFullYear();
  const month = String(bstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(bstTime.getUTCDate()).padStart(2, '0');
  const hours = String(bstTime.getUTCHours()).padStart(2, '0');
  const minutes = String(bstTime.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buenosAiresInputToIso(inputValue: string | null | undefined): string | null {
  if (!inputValue || !inputValue.trim()) return null;
  const match = inputValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hours, minutes, seconds = '00'] = match;
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
}

export function isDateInFuture(isoString: string): boolean {
  const d = new Date(isoString);
  return d.getTime() > Date.now();
}
