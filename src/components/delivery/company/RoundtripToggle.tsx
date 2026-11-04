import React from 'react';
import { Repeat } from 'lucide-react';

interface RoundtripToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

/** Delivery + pickup in one visit: the courier hands over the parcel and takes back the item being exchanged. */
export const RoundtripToggle: React.FC<RoundtripToggleProps> = ({ checked, onChange, disabled }) => (
  <div className="bg-blue-50 p-4 rounded-lg">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-100'
      }`}
    >
      <span className="flex items-center gap-2">
        <Repeat size={20} />
        <span className="font-medium">משלוח + איסוף מהלקוח (החלפה)</span>
      </span>
      <span className="text-sm font-medium">{checked ? 'פעיל' : 'כבוי'}</span>
    </button>
    {checked && (
      <p className="mt-2 text-sm text-blue-700">
        השליח מוסר את החבילה ובאותו ביקור אוסף מהלקוח את הפריט להחלפה
      </p>
    )}
  </div>
);
