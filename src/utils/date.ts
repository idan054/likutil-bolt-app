import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { 
    addSuffix: true,
    locale: he 
  });
};

export const formatDateWithTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const formattedDate = formatDate(dateString);
  const timeAgo = formatTimeAgo(date);
  return `${formattedDate} (${timeAgo})`;
};