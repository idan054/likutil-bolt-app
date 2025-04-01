import { 
  parse, 
  parseISO, 
  isValid, 
  formatDistanceToNow 
} from 'date-fns';
import { he } from 'date-fns/locale';

const DEBUG = false; // Set to false to silence logs

const parseFormats = [
  // ✅ European formats (day first)
  'dd/MM/yyyy, HH:mm:ss',
  'dd.MM.yyyy, HH:mm:ss',
  'dd/MM/yyyy',
  'dd.MM.yyyy',
  'd/M/yyyy, H:m:s',
  'd.M.yyyy, H:m:s',
  'd/M/yyyy',
  'd.M.yyyy',

  // 🕐 European formats with AM/PM
  'dd/MM/yyyy, h:m:s a',
  'dd/MM/yyyy h:m:s a',
  'd/M/yyyy, h:m:s a',
  'd/M/yyyy h:m:s a',

  // 🌍 ISO formats
  "yyyy-MM-dd'T'HH:mm:ssXXX",
  "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
  "yyyy-MM-dd'T'HH:mm:ss'Z'",
  "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  'yyyy-MM-dd HH:mm:ss',
  'yyyy/MM/dd HH:mm:ss',
  'yyyy.MM.dd HH:mm:ss',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'yyyy.MM.dd',

  // 🕐 ISO formats with AM/PM
  'yyyy-MM-dd, h:m:s a',
  'yyyy/MM/dd, h:m:s a',
  'yyyy.MM.dd, h:m:s a',

  // 🇺🇸 US formats (month first, fallback)
  'MM/dd/yyyy, HH:mm:ss',
  'MM-dd-yyyy HH:mm:ss',
  'MM/dd/yyyy',
  'MM-dd-yyyy',
  'M/d/yyyy, H:m:s',
  'M-d-yyyy H:m:s',
  'M/d/yyyy',
  'M-d-yyyy',

  // 🕐 US formats with AM/PM
  'MM/dd/yyyy, h:m:s a',
  'MM/dd/yyyy h:m:s a',
  'M/d/yyyy, h:m:s a',
  'M/d/yyyy h:m:s a',
];

const tryParseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;

  if(DEBUG) console.log('\n🔍 Trying to parse:', dateString);

  try {
    const parsedISO = parseISO(dateString);
    const isoValid = isValid(parsedISO);

    if(isoValid && DEBUG){

      console.log('[parseISO]');
      console.log('- original:', dateString);
      console.log('- iso:', parsedISO.toISOString());
      console.log('- isValid ISO:', isoValid);
    }
      
    if (isoValid) return parsedISO;
  } catch (_) {}

  for (const formatStr of parseFormats) {
    try {
      const parsed = parse(dateString, formatStr, new Date());
      const valid = isValid(parsed);

      if (valid && DEBUG) {
        console.log(`[format: ${formatStr}]`);
        console.log('- original:', dateString);
        console.log('- iso:', parsed.toISOString());
        console.log('- isValid parseFormats:', valid);
        return parsed;
      }
    } catch (_) {}
  }

  const fallback = new Date(dateString);
  const fallbackValid = isValid(fallback);

  if(fallbackValid && DEBUG){
    console.log('[fallback: new Date()]');
    console.log('- original:', dateString);
    console.log('- iso:', fallback.toISOString());
    console.log('- isValid fallback:', fallbackValid);
  }

  return fallbackValid ? fallback : null;
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

  if (!dateObj || !isValid(dateObj)) {
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

export const createDeliveryFormatDate = (dateString: string): string => {
  const date = tryParseDate(dateString);
  if (!date) return dateString;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};
