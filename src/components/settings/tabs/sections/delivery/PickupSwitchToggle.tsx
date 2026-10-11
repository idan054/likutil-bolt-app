import React, { useEffect, useState } from 'react';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../../config/firebase';
import { settingsStorage } from '../../../../../services/settings';
import {
  getPickupState,
  isPickupRouteMissing,
  isPickupSwitchUnsupported,
  setPickupSwitch,
} from '../../../../../services/pickup/pickup.service';
import { pickupSwitchEffects, type PickupState } from '../../../../../utils/pickupSignal';

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

/**
 * The main switch of "the courier collected". On: the shop site and the systems around it follow the
 * buttons of the picking bar. Off: the presses are only kept. The switch itself lives on the site.
 */
export const PickupSwitchToggle: React.FC = () => {
  const [user] = useAuthState(auth);
  const isWoo = settingsStorage.get()?.authType !== 'shopify';
  const [state, setState] = useState<PickupState | null>(null);
  const [loading, setLoading] = useState(isWoo);
  const [missing, setMissing] = useState(!isWoo);
  const [toggling, setToggling] = useState(false);
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
        else setError('לא ניתן לקרוא את מצב המתג מהאתר. יש לרענן ולנסות שוב.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isWoo]);

  // A shop whose site has no pickup route has nothing to switch.
  if (missing) return null;

  const enabled = state?.on ?? false;
  const effects = state ? pickupSwitchEffects(state) : null;
  const since = state?.on_at ? formatTime(state.on_at) : null;

  const toggle = async () => {
    if (!state || toggling) return;
    const question = enabled
      ? 'לכבות? האתר והמערכות יחזרו לכלל הרגיל של 11:00, והלחיצות רק יישמרו.'
      : 'להדליק? מרגע זה האתר והמערכות יפסיקו להבטיח "היום" לחברה שסומנה כנאספה.';
    if (!window.confirm(question)) return;
    setToggling(true);
    setError(null);
    try {
      setState(await setPickupSwitch(!enabled, user?.email ?? user?.displayName));
    } catch (failure) {
      setError(isPickupSwitchUnsupported(failure)
        ? 'האתר עדיין לא תומך במתג הזה. המצב לא השתנה.'
        : 'הפעולה נכשלה, המצב לא השתנה. יש לנסות שוב.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 bg-gray-50" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className={`mt-0.5 p-2 rounded-lg ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-semibold">"השליח אסף" קובע מה האתר מבטיח</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              דולק: חברה שסומנה כנאספה בפס הליקוט מפסיקה לקבל הבטחת "היום" באתר ובמערכות. עד הלחיצה ממשיכים להציע "היום", גם אחרי 11:00.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              כבוי: הכפתורים בפס הליקוט ממשיכים לעבוד והלחיצות נשמרות, אבל האתר נשאר בכלל הרגיל של 11:00.
            </p>

            {loading ? (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" /> טוען מצב…
              </p>
            ) : !state ? null : enabled ? (
              <p className="text-sm text-green-700 mt-2 font-medium">
                פעיל{since ? ` · הופעל ב-${since}` : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">כבוי</p>
            )}

            {effects && (
              <p className="text-xs text-gray-600 mt-1">
                {effects.length > 0
                  ? `מושפעים כרגע: ${effects.join(' · ')}.`
                  : 'כרגע שום חלק באתר עדיין לא קורא את האות, ולכן הדלקה עוד לא משנה דבר ללקוחות.'}
              </p>
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
    </div>
  );
};
