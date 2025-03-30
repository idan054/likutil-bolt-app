import { formatDistanceToNow, parse } from 'date-fns';
import { he } from 'date-fns/locale';

const parseFormats = [
  // Common European and International formats
  'dd/MM/yyyy, HH:mm:ss',
  'd/M/yyyy, H:m:s',
  'dd.MM.yyyy, HH:mm:ss',
  'd.M.yyyy, H:m:s',
  'dd/MM/yyyy',
  'd/M/yyyy',
  'dd.MM.yyyy',
  'd.M.yyyy',

  // ISO and US formats
  'yyyy-MM-dd HH:mm:ss',
  'yyyy/MM/dd HH:mm:ss',
  'yyyy.MM.dd HH:mm:ss',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'yyyy.MM.dd',
  'MM/dd/yyyy, HH:mm:ss',
  'M/d/yyyy, H:m:s',
  'MM-dd-yyyy HH:mm:ss',
  'M-d-yyyy H:m:s',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'MM-dd-yyyy',
  'M-d-yyyy',

  // Time zone variations
  "yyyy-MM-dd'T'HH:mm:ssXXX",
  "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
  "yyyy-MM-dd'T'HH:mm:ss'Z'",
  "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",

  // Formats with AM/PM
  'dd/MM/yyyy, h:m:s a',
  'd/M/yyyy, h:m:s a',
  'MM/dd/yyyy, h:m:s a',
  'M/d/yyyy, h:m:s a',
  'yyyy/MM/dd, h:m:s a',
  'yyyy-MM-dd, h:m:s a',
  'yyyy.MM.dd, h:m:s a',
  'dd/MM/yyyy h:m:s a',
  'd/M/yyyy h:m:s a',
  'MM/dd/yyyy h:m:s a',
  'M/d/yyyy h:m:s a',
];

const tryParseDate = (dateString: string): Date | null => {
  for (const format of parseFormats) {
    try {
      const parsedDate = parse(dateString, format, new Date());
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (error) {
      continue;
    }
  }

  const fallbackDate = new Date(dateString);
  return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
};

export const formatDate = (dateString: string): string => {
  const date = tryParseDate(dateString);
  if (!date) return dateString;

  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = tryParseDate(dateString);
  if (!date) return dateString;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? tryParseDate(date) : date;

  if (!dateObj || isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : date.toString();
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: he,
  });
};

export const formatDateWithTimeAgo = (dateString: string): string => {
  const date = tryParseDate(dateString);
  if (!date) return dateString;

  const formattedDate = formatDate(dateString);
  const timeAgo = formatTimeAgo(date);

  return `${timeAgo} | ${formattedDate}`;
};
