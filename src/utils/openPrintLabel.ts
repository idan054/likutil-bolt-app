import { toast } from 'react-hot-toast';
import { getPrintLabelSource } from '../services/delivery/validation/response';

export const openPrintLabel = (printLabel: string) => {
    const source = getPrintLabelSource(printLabel);

    if (!source) {
      toast.error('לא התקבלה מדבקת PDF תקינה מחברת המשלוחים');
      return;
    }

    if (source.type === 'url') {
      window.open(source.value, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const binary = atob(source.value);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Allow the new tab enough time to finish reading the blob before releasing it.
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('לא ניתן לפתוח את מדבקת ה-PDF שהתקבלה');
    }
  };
