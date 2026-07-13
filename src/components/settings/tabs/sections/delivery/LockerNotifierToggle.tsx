import React, { useEffect, useState } from 'react';
import { Package, Loader2, AlertCircle, FlaskConical, History, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '../../../../../config/firebase';

const CONTROL_URL = '/.netlify/functions/locker-notifier-control';

interface PreviewRecord {
  id: number;
  orderNumber: string;
  phone: string;
  code: string;
  box: string;
  address: string;
  savedAt: string;
  message: string;
}

interface HistoryEntry {
  sentAt: string;
  orderNumber: string;
  phone: string;
  code: string;
  box: string;
  ok: boolean;
  error?: string;
}

interface NotifierState {
  enabled: boolean;
  enabledAt: string | null;
  lastSeenId: number;
  history?: HistoryEntry[];
  preview?: {
    generatedAt: string;
    wouldSend: PreviewRecord[];
    sample: PreviewRecord | null;
    waitingForPickup: number;
  };
}

const authorizedFetch = async (url: string = CONTROL_URL, init?: RequestInit) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...init, headers });
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

export const LockerNotifierToggle: React.FC = () => {
  const [state, setState] = useState<NotifierState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
      const res = await authorizedFetch(CONTROL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !state.enabled }),
      });
      if (!res.ok) throw new Error();
      setState({ ...(await res.json()), preview: state.preview });
    } catch {
      setError('הפעולה נכשלה, נסה שוב.');
    } finally {
      setToggling(false);
    }
  };

  // Dry run — asks the server who WOULD be messaged. Sends nothing.
  const runDryRun = async () => {
    if (previewing) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await authorizedFetch(`${CONTROL_URL}?preview=1`);
      if (!res.ok) throw new Error();
      setState(await res.json());
      setShowPreview(true);
    } catch {
      setError('הבדיקה היבשה נכשלה, נסה שוב.');
    } finally {
      setPreviewing(false);
    }
  };

  const enabled = state?.enabled ?? false;
  const since = state?.enabledAt ? formatTime(state.enabledAt) : null;
  const preview = state?.preview;
  const history = state?.history ?? [];

  return (
    <div className="rounded-lg border p-4 bg-gray-50 space-y-3" dir="rtl">
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

      {/* Actions */}
      {state && (
        <div className="flex flex-wrap gap-2 pt-1 border-t">
          <button
            type="button"
            onClick={runDryRun}
            disabled={previewing}
            className="mt-2 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50"
            title="מריץ את אותה בדיקה בדיוק, בלי לשלוח כלום"
          >
            {previewing ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            בדיקה יבשה — מה יישלח עכשיו?
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="mt-2 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-100"
            >
              <History size={14} />
              הודעות שנשלחו ({history.length})
            </button>
          )}
        </div>
      )}

      {/* Dry-run results */}
      {showPreview && preview && (
        <div className="rounded-lg border bg-white p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              תוצאת בדיקה יבשה · {formatTime(preview.generatedAt)}
            </h4>
            <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-gray-600">
              סגור
            </button>
          </div>

          <p className="text-sm">
            {preview.wouldSend.length === 0 ? (
              <span className="text-gray-600">
                כרגע <b>לא הייתה נשלחת אף הודעה</b>. ({preview.waitingForPickup} חבילות ממתינות לאיסוף, אך אף אחת
                לא הופקדה בחלון הזמן האחרון.)
              </span>
            ) : (
              <span className="text-green-700 font-medium">
                היו נשלחות {preview.wouldSend.length} הודעות:
              </span>
            )}
          </p>

          {preview.wouldSend.map((r) => (
            <div key={r.id} className="border rounded-lg p-2 bg-green-50/50">
              <div className="text-sm font-medium">
                📱 {r.phone} · הזמנה {r.orderNumber} · תא {r.box} · קוד {r.code}
              </div>
              <pre className="text-xs whitespace-pre-wrap mt-1 text-gray-700 font-sans">{r.message}</pre>
            </div>
          ))}

          {preview.sample && (
            <div className="border rounded-lg p-2 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">
                דוגמה בלבד (על ההפקדה האחרונה, לבדיקת הניסוח — לא יישלח):
              </div>
              <div className="text-sm font-medium">📱 {preview.sample.phone} · הזמנה {preview.sample.orderNumber}</div>
              <pre className="text-xs whitespace-pre-wrap mt-1 text-gray-700 font-sans">{preview.sample.message}</pre>
            </div>
          )}
        </div>
      )}

      {/* Sent history */}
      {showHistory && history.length > 0 && (
        <div className="rounded-lg border bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">הודעות שנשלחו בפועל</h4>
            <button onClick={() => setShowHistory(false)} className="text-xs text-gray-400 hover:text-gray-600">
              סגור
            </button>
          </div>
          {history.map((h, i) => (
            <div key={`${h.sentAt}-${i}`} className="flex items-center gap-2 text-sm border-b last:border-0 py-1">
              {h.ok ? (
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-500 shrink-0" />
              )}
              <span className="text-gray-500 text-xs shrink-0">{formatTime(h.sentAt)}</span>
              <span>📱 {h.phone}</span>
              <span className="text-gray-500">· הזמנה {h.orderNumber} · קוד {h.code}</span>
              {!h.ok && <span className="text-red-500 text-xs">נכשל</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
