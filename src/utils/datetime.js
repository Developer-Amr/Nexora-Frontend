export function datetimeLocalToISOString(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length === 16 ? `${text}:00` : text;
}

export function parseApiDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  const normalizedValue = text.replace(' ', 'T');
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDatetimeLocalValue(value) {
  if (!value) return '';

  const text = String(value).trim().replace(' ', 'T');
  const looksLikeIsoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text);
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(text);

  if (looksLikeIsoDateTime && !hasTimezone) {
    return text.slice(0, 16);
  }

  const date = parseApiDate(text);
  if (!date) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function nowDatetimeLocalValue() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function getExamDateField(exam, possibleNames) {
  for (const name of possibleNames) {
    if (exam && exam[name]) return exam[name];
  }
  return null;
}

export function getExamActiveFrom(exam) {
  return getExamDateField(exam, [
    'activeFrom',
    'activeFromAt',
    'activeStartTime',
    'activeStartAt',
    'availableFrom',
    'availableFromAt',
    'availabilityStart',
    'availabilityStartAt',
    'startActiveAt',
  ]);
}

export function getExamActiveTo(exam) {
  return getExamDateField(exam, [
    'activeTo',
    'activeToAt',
    'activeEndTime',
    'activeEndAt',
    'availableTo',
    'availableToAt',
    'availabilityEnd',
    'availabilityEndAt',
    'endActiveAt',
  ]);
}

export function formatExamDateTime(value) {
  const date = parseApiDate(value);
  if (!date) return 'Not set';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
