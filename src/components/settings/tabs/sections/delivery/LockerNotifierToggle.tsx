import React, { useEffect, useState } from 'react';
import { Package, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../../../../../config/firebase';

const CONTROL_URL = '/.netlify/functions/locker-notifier-control';

interface NotifierState {
  enabled: boolean;
  enabledAt: string | null;
  lastSeenId: number;
}

const authorizedFetch = async (init?: RequestInit) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(CONTROL_URL, {
    ...init,
    headers,
  });
};

export const LockerNotifierToggle: React.FC = () => {
  const [state, setState] = useState<NotifierState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authorizedFetch();
        if (!res.ok) throw new Error();
        setState(await res.json());
      } catch {
        setError('לא ניתן לטעון את מצב ההתראות (זמין רק בסביבת הפרודקשן).');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async () => {
    if (!state || toggling) return;
    setToggling(true);
    setError(null);
    try {
      const res = await authorizedFetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !state.enabled }),
      });
      if (!res.ok) throw new Error();
      setState(await res.json());
    } catch {
      setError('הפעולה נכשלה, נסה שוב.');
    } finally {
      setToggling(false);
    }
  };

  const enabled = state?.enabled ?? false;
  const since = state?.enabledAt
    ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(state.enabledAt))
    : null;

  return (
    <div className="rounded-lg border p-4 bg-gray-50" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className={`mt-0.5 p-2 rounded-lg ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-semibold">התראות וואטסאפ אוטומטיות ללוקרים</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              כשחבילה מוכנסת ללוקר ונוצר קוד, נשלח ללקוח את הקוד בוואטסאפ (בדיקה כל 5 דקות).
            </p>
            <p className="text-xs text-gray-500 mt-1">
              בהדלקה, המערכת מתחילה מרגע ההפעלה קדימה בלבד — חבילות קודמות לא יקבלו הודעה.
            </p>

            {loading ? (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" /> טוען מצב…
              </p>
            ) : enabled ? (
              <p className="text-sm text-green-700 mt-2 font-medium">
                פעיל{since ? ` · הופעל ב-${since}` : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">כבוי</p>
            )}

            {error && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={toggle}
          disabled={loading || toggling || !state}
          aria-pressed={enabled}
          className={`relative shrink-0 w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
          title={enabled ? 'כבה' : 'הדלק'}
        >
          <span
            className={`absolute top-1 h-6 w-6 bg-white rounded-full shadow transition-all flex items-center justify-center ${
              enabled ? 'left-1' : 'right-1'
            }`}
          >
            {toggling && <Loader2 size={14} className="animate-spin text-gray-500" />}
          </span>
        </button>
      </div>
    </div>
  );
};
