import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../../config/firebase';
import type { DeliveryIntegration } from '../../../../../../types/delivery';

const ZIPGO_ID = 'zipGo';
const ZIPGO_LOGO = 'https://pub-cd0ad975a9414c00b745134205ec9566.r2.dev/zipgo-main-logo.svg';

interface AddZipGoCardProps {
  integrations: DeliveryIntegration[];
}

/**
 * One-time setup: adds ZipGo, a second same-day courier that runs on LionWheel like Mahir Li, to the
 * list of delivery companies. The card is shown only while the company does not exist. Once added,
 * ZipGo appears as a regular card and is connected with its own LionWheel token.
 * The server needs the `id` field next to the document id, and `programType: 'lionWheel'` is what
 * makes shipment creation and cancellation work for it without any server change.
 */
export const AddZipGoCard: React.FC<AddZipGoCardProps> = ({ integrations }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const hasMahirLi = integrations.some(integration => integration.provider === 'mahirLi');
  const hasZipGo = integrations.some(integration => integration.provider === ZIPGO_ID);
  if (!hasMahirLi || hasZipGo) return null;

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      const ref = doc(db, 'delivery_companies', ZIPGO_ID);
      if (!(await getDoc(ref)).exists()) {
        // Same shape as the Mahir Li record (both are LionWheel companies), without its identity or any credential.
        const template = { ...((await getDoc(doc(db, 'delivery_companies', 'mahirLi'))).data() || {}) };
        for (const key of ['token', 'username', 'password', 'clientId', 'lastTested', 'key', 'keys']) delete template[key];
        await setDoc(ref, {
          ...template,
          id: ZIPGO_ID,
          provider: ZIPGO_ID,
          name: 'ZipGo',
          description: 'משלוחים מהיום להיום',
          logoUrl: ZIPGO_LOGO,
          programType: 'lionWheel',
          controlPanelLink: 'https://members.lionwheel.com/dashboard',
          fields: Array.isArray(template.fields) ? template.fields : [{ label: 'Token', placeholder: '' }],
          isConnected: false,
          index: integrations.reduce((max, integration) => Math.max(max, integration.index || 0), 0) + 1,
        });
      }
      window.location.reload();
    } catch (caught) {
      console.error('[AddZipGoCard] Failed to add ZipGo:', caught);
      setError('לא ניתן היה להוסיף את ZipGo מהמסך הזה. נסו שוב; אם זה חוזר, הרשומה תתווסף ישירות במסד הנתונים.');
      setBusy(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border-2 border-dashed border-teal-300 bg-teal-50 text-center">
      <img src={ZIPGO_LOGO} alt="ZipGo" className="h-16 w-auto mb-4 mx-auto object-contain" />
      <h3 className="font-semibold text-lg mb-2">ZipGo</h3>
      <p className="text-sm text-gray-600 mb-4">חברת משלוחים מהיום להיום. לחיצה אחת מוסיפה אותה לרשימה, ואחר כך מחברים אותה עם המפתח שלה.</p>
      <button
        type="button"
        onClick={() => void add()}
        disabled={busy}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? 'מוסיף…' : 'הוסף את ZipGo'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
};
