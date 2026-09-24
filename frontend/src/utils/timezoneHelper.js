/**
 * Timezone Utility for WorkTracker Pro
 * Default: Asia/Jakarta (WIB, GMT+7)
 * Configurable via Application Settings
 */

export const TIMEZONE_OPTIONS = [
  { id: 'Asia/Jakarta', value: 'Asia/Jakarta', label: 'WIB - Waktu Indonesia Barat (GMT+7)', shortLabel: 'WIB (GMT+7)', abbr: 'WIB (GMT+7)', offset: 7 },
  { id: 'Asia/Makassar', value: 'Asia/Makassar', label: 'WITA - Waktu Indonesia Tengah (GMT+8)', shortLabel: 'WITA (GMT+8)', abbr: 'WITA (GMT+8)', offset: 8 },
  { id: 'Asia/Jayapura', value: 'Asia/Jayapura', label: 'WIT - Waktu Indonesia Timur (GMT+9)', shortLabel: 'WIT (GMT+9)', abbr: 'WIT (GMT+9)', offset: 9 },
  { id: 'UTC', value: 'UTC', label: 'UTC - Universal Coordinated Time (GMT+0)', shortLabel: 'UTC (GMT+0)', abbr: 'UTC (GMT+0)', offset: 0 }
];

const STORAGE_KEY = 'wt_app_timezone';

export function getAppTimezone() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
}

export function setAppTimezone(timezoneId) {
  try {
    localStorage.setItem(STORAGE_KEY, timezoneId);
    window.dispatchEvent(new CustomEvent('wt_timezone_changed', { detail: { timezone: timezoneId } }));
  } catch (err) {
    console.error('Failed to set timezone in localStorage:', err);
  }
}

export function getTimezoneInfo(timezoneId = null) {
  const tz = timezoneId || getAppTimezone();
  return TIMEZONE_OPTIONS.find(opt => opt.id === tz || opt.value === tz) || TIMEZONE_OPTIONS[0];
}

export function formatTimeInTz(dateInput, tzOrSeconds = false, includeSeconds = false) {
  if (!dateInput) return '-';
  const tz = typeof tzOrSeconds === 'string' ? tzOrSeconds : getAppTimezone();
  const withSec = typeof tzOrSeconds === 'boolean' ? tzOrSeconds : includeSeconds;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      ...(withSec ? { second: '2-digit' } : {}),
      hour12: false
    }).format(d);
  } catch {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
}

export function formatDateInTz(dateInput, tzOrFormatStyle = 'medium', formatStyle = 'medium') {
  if (!dateInput) return '-';
  const tz = typeof tzOrFormatStyle === 'string' && (tzOrFormatStyle.includes('/') || tzOrFormatStyle === 'UTC') ? tzOrFormatStyle : getAppTimezone();
  const style = typeof tzOrFormatStyle === 'string' && !tzOrFormatStyle.includes('/') && tzOrFormatStyle !== 'UTC' ? tzOrFormatStyle : formatStyle;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  try {
    if (style === 'short') {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: tz,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    }
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return d.toLocaleDateString('id-ID');
  }
}

export function formatDateTimeInTz(dateInput) {
  if (!dateInput) return '-';
  const tz = getAppTimezone();
  const tzInfo = getTimezoneInfo(tz);
  const timeStr = formatTimeInTz(dateInput, false);
  const dateStr = formatDateInTz(dateInput, 'short');
  return `${dateStr} ${timeStr} ${tzInfo.shortLabel.split(' ')[0]}`;
}
