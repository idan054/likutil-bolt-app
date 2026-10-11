import React, { useEffect, useState } from 'react';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../../config/firebase';
import { settingsStorage } from '../../../../../services/settings';
import {
  getPickupState,
  isPickupRouteMissing,
  isPickupSwitchUnsupported,
  setPickupMode,
} from '../../../../../services/pickup/pickup.service';
import {
  PICKUP_MODES,
  pickupMode,
  pickupSwitchEffects,
  type PickupMode,
  type PickupState,
} from '../../../../../utils/pickupSignal';

const MODES: Record<PickupMode, { name: string; what: string; ask: string }> = {
  active: {
    name: 'פועל',
    what: 'הכפתורים מוצגים בפס הליקוט, והאתר והמערכות פועלים לפיהם: חברה שסומנה כנאספה מפסיקה לקבל הבטחת "היום". עד הלחיצה ממשיכים להציע "היום", גם אחרי 11:00.',
    ask: 'לעבור ל"פועל"? מרגע זה האתר והמערכות יפסיקו להבטיח "היום" לחברה שסומנה כנאספה.',
  },
  listen: {
    name: 'מאזין',
    what: 'הכפתורים מוצגים בפס הליקוט והלחיצות נשמרות, אבל האתר נשאר בכלל הרגיל של 11:00.',
    ask: 'לעבור ל"מאזין"? הכפתורים יוצגו והלחיצות יישמרו, והאתר יתנהג כרגיל.',
  },
  hidden: {
    name: 'הסתרת כפתורים',
    what: 'אין כפתורים בפס הליקוט, והאתר מתנהג כרגיל, כמו לפני שהכפתורים נוספו.',
    ask: 'לעבור ל"הסתרת כפתורים"? הכפתורים ייעלמו מפס הליקוט בכל המסכים, והאתר יתנהג כרגיל.',
  },
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

interface PickupModeCardProps {
  state: PickupState | null;
  loading: boolean;
  changing: PickupMode | null;
  error: string | null;
  onChoose: (mode: PickupMode) => void;
}

/** The card itself: three modes to choose from, and what the active one changes right now. */
export const PickupModeCard: React.FC<PickupModeCardProps> = ({ state, loading, changing, error, onChoose }) => {
  const current = state ? pickupMode(state) : null;
  const effects = state ? pickupSwitchEffects(state) : null;
  const since = state?.on_at ? formatTime(state.on_at) : null;

  return (
    <div className="rounded-lg border p-4 bg-gray-50 space-y-3" dir="rtl">
      <div className="flex gap-3">
        <div className={`mt-0.5 h-fit p-2 rounded-lg ${current === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
          <Truck size={20} />
        </div>
        <div>
          <h3 className="font-semibold">כפתורי "השליח אסף"</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            המלקט מסמן בפס הליקוט שחברת משלוחים אספה. כאן קובעים מה עושים עם הסימון.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Loader2 size={14} className="animate-spin" /> טוען מצב…
        </p>
      ) : (
        <div role="radiogroup" aria-label='מצב כפתורי "השליח אסף"' className="grid gap-2 sm:grid-cols-3">
          {PICKUP_MODES.map((mode) => {
            const selected = mode === current;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChoose(mode)}
                disabled={!state || changing !== null}
                className={`flex flex-col rounded-lg border-2 p-3 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? mode === 'active'
                      ? 'border-green-500 bg-green-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {MODES[mode].name}
                  {changing === mode && <Loader2 size={14} className="animate-spin text-gray-500" />}
                  {selected && <span className="text-xs font-normal text-gray-600">· המצב הנוכחי</span>}
                </span>
                <span className="mt-1 block text-xs text-gray-600">{MODES[mode].what}</span>
              </button>
            );
          })}
        </div>
      )}

      {current === 'active' && since && (
        <p className="text-sm text-green-700 font-medium">פועל מאז {since}</p>
      )}

      {effects && current !== 'hidden' && (
        <p className="text-xs text-gray-600">
          {effects.length > 0
            ? `ב"פועל" מושפעים: ${effects.join(' · ')}.`
            : 'כרגע שום חלק באתר עדיין לא קורא את הסימון, ולכן "פועל" עוד לא משנה דבר ללקוחות.'}
        </p>
      )}

      {error && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
};

/**
 * The mode of "the courier collected": active, listening or hidden. The mode lives on the shop site,
 * so every screen follows the same one.
 */
export const PickupSwitchToggle: React.FC = () => {
  const [user] = useAuthState(auth);
  const isWoo = settingsStorage.get()?.authType !== 'shopify';
  const [state, setState] = useState<PickupState | null>(null);
  const [loading, setLoading] = useState(isWoo);
  const [missing, setMissing] = useState(!isWoo);
  const [changing, setChanging] = useState<PickupMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isWoo) return;
    let active = true;
    (async () => {
      try {
        const next = await getPickupState();
        if (active) setState(next);
      } catch (failure) {
        if (!active) return;
        if (isPickupRouteMissing(failure)) setMissing(true);
        else setError('לא ניתן לקרוא את המצב מהאתר. יש לרענן ולנסות שוב.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isWoo]);

  // A shop whose site has no pickup route has nothing to set.
  if (missing) return null;

  const current = state ? pickupMode(state) : null;

  const choose = async (mode: PickupMode) => {
    if (!state || changing || mode === current) return;
    if (!window.confirm(MODES[mode].ask)) return;
    setChanging(mode);
    setError(null);
    try {
      setState(await setPickupMode(mode, user?.email ?? user?.displayName));
    } catch (failure) {
      setError(isPickupSwitchUnsupported(failure)
        ? 'האתר עדיין לא תומך במצב הזה. המצב לא השתנה.'
        : 'הפעולה נכשלה, המצב לא השתנה. יש לנסות שוב.');
    } finally {
      setChanging(null);
    }
  };

  return <PickupModeCard state={state} loading={loading} changing={changing} error={error} onChoose={choose} />;
};
