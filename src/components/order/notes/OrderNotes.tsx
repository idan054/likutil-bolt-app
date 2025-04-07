import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MessageSquarePlus, ChevronDown } from "lucide-react";
import { NotesList } from "./NotesList";
import { NoteTypeSelector } from "./NoteTypeSelector";
import { NoteInput } from "./NoteInput";
import { useOrderNotes } from "../../../hooks/useOrderNotes";
import { translations } from "../../../config/translations";
import { useMessagingStore } from "../../../store/useMessagingStore";
import { useSettings } from '../../../hooks/useSettings';
import { settingsStorage } from '../../../services/settings/storage';
import { UserSettings } from "../../../types/settings";
import { BASE_URL } from "../../../services/auth/woo-auth";
import { useAuth } from '../../../hooks/useAuth'; // Adjust the path as needed
import { updateBusinessPhone } from '../../../services/settings/update.service';
import { WhatsAppPreview } from "./WhatsAppPreview";
import { OrderDetails } from "../../../types/order";



interface OrderNotesProps {
  order?: OrderDetails;
  orderId: string;
  order_number?: string;
  customerPhone?: string;
}

export const OrderNotes: React.FC<OrderNotesProps> = ({
  order,
  order_number,
  orderId,
  customerPhone,
}) => {
  // Add auth hook to get userId

  const { notes, isLoading, addNote } = useOrderNotes(orderId, order);  
  const { settings, user } = useSettings();

  const {
    isWhatsAppNote,
    isCustomerNote,
    setWhatsAppNote,
    setCustomerNote,
    isExpanded,
    setExpanded,
    businessPhone,
    setBusinessPhone,
  } = useMessagingStore();

  useEffect(() => {
    setBusinessPhone(settings?.businessPhone || '');
  }, []); 


  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [isWhatsAppReplyEnabled, setWhatsAppReplyEnabled] = useState<boolean>(false);

  // Save boolean to cache
  const togglWhatsAppReplyEnabled = () => {
    const newValue = !isWhatsAppReplyEnabled;
    localStorage.setItem('isWhatsAppReplyEnabled', JSON.stringify(newValue));
    setWhatsAppReplyEnabled(newValue);
  };

  // Retrieve boolean from cache on init
  useEffect(() => {
    const cachedValue = localStorage.getItem('isWhatsAppReplyEnabled');
    if (cachedValue !== null) {
      setWhatsAppReplyEnabled(JSON.parse(cachedValue));
    }
  }, []);

  async function generateWhatsAppLink() {
    const whatsappReply = `
  שלום, קיבלתי עדכון לגבי הזמנה #${order_number ?? orderId}
  
  ${newNote.trim()}
  `.trim().replace(/\n\s+/g, '\n');
  
    
  const phone = businessPhone.replace(/\D/g, "").replace(/^0/, '972');
    const encodedMessage = encodeURIComponent(whatsappReply);
    const longUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
  
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      const shortUrl = await response.text();
      return shortUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      return longUrl; // Return the original if shortening fails
    }
  }
  

  const handleSubmit = async () => {
    if (!newNote.trim() || isSubmitting) return;
    
    // Add validation for business phone when WhatsApp reply is enabled
    if (isWhatsAppNote && isWhatsAppReplyEnabled && !businessPhone.trim()) {
      toast.error('ההודעה עדיין לא נשלחה - יש להכניס מס׳ טלפון עסקי כדי לאפשר ללקוח להגיב');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isWhatsAppNote && customerPhone) {


        const waReplyLink = await generateWhatsAppLink();

const whatsappMessage = `
  📝 שלום, התקבל עדכון מ
${settings?.storeUrl}
🛍️ להזמנה #${order_number ?? orderId}

  ${newNote.trim()}

  ───
  ${isWhatsAppReplyEnabled 
    ? `👇  לחץ כדי להשיב להודעה: 
    ${waReplyLink}` 
    : "🤖 לא ניתן להשיב להודעה זו"
  }
`.trim();

        const response = await fetch(`${BASE_URL}/api/send-whatsapp`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 
            whatsappMessage,
            phone: customerPhone.replace(/\D/g, "").replace(/^0/, '972')
          })
        });

        if (response.ok) {
          toast.success(translations.orderNotes.whatsappSuccess);
          setNewNote("");

          // ALSO Add WhatsApp message as a note
          await addNote({
            note: `📱 ההודעה נשלחה דרך Mail & WhatsApp: \n\n ״${whatsappMessage}״`,
            customer_note: true,
          });


        } else {
          throw new Error('Failed to send WhatsApp message');
        }
      } else {
        await addNote({
          note: newNote.trim(),
          customer_note: isCustomerNote,
        });
        setNewNote("");
        toast.success(translations.orderNotes.addSuccess);
      }
    } catch (error) {
      toast.error(translations.orderNotes.addError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessPhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setBusinessPhone(newPhone);
    
    // Update in Firestore if we have a userId
    if (user?.uid) {
      try {
        await updateBusinessPhone(user.uid, newPhone);
      } catch (error) {
        console.error('Failed to update business phone:', error);
        // Optionally show an error toast
        toast.error('Failed to save business phone');
      }
    }
  };

  return (
    <div className="border-t pt-6">
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="text-gray-600" size={24} />
          <h3 className="text-xl font-semibold">
            {translations.orderNotes.title}
          </h3>
        </div>
        <ChevronDown
          className={`text-gray-600 transition-transform duration-200 ${
            isExpanded ? "transform rotate-180" : ""
          }`}
          size={24}
        />
      </div>

      <div
        className={`transition-all duration-200 overflow-hidden ${
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4">
          <div>
            <NoteTypeSelector
              isCustomerNote={isCustomerNote}
              isWhatsAppNote={isWhatsAppNote}
              onChange={(type) => {
                if (type === "whatsapp") {
                  setWhatsAppNote(true);
                  setCustomerNote(false);
                } else {
                  setWhatsAppNote(false);
                  setCustomerNote(type === "customer");
                }
              }}
            />
            
         
            <NoteInput
              value={newNote}
              onChange={setNewNote}
              onSubmit={handleSubmit}
              noteType={
                isWhatsAppNote
                  ? "whatsapp"
                  : isCustomerNote
                  ? "customer"
                  : "private"
              }
              isSubmitting={isSubmitting}
              showTemplates={showTemplates}
              onToggleTemplates={() => setShowTemplates(!showTemplates)}
            />

{isWhatsAppNote && (
            <div className="mt-1 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer mr-1">
                <input
                  type="checkbox"
                  checked={isWhatsAppReplyEnabled}
                  onChange={() => togglWhatsAppReplyEnabled()}
                  className="w-4 h-8 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">אפשר ללקוח להשיב</span>
              </label>
              
              {isWhatsAppReplyEnabled && (
                <div className="flex items-center gap-2">
   
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={handleBusinessPhoneChange}
                    placeholder="מס׳ וואטסאפ עסקי "
                    className={`w-36 h-8 px-3 text-sm border-b text-right focus:border-b-gray-500 focus:ring-0 focus:outline-none`}
                    dir="rtl"
                    required
                  />
                </div>
              )}
            </div>
          )}
          </div>

      



          <div className="max-h-[400px] overflow-y-auto pr-1">
          {isWhatsAppNote && (
            <div className="mb-4">
              <WhatsAppPreview
                orderId={order_number ?? orderId}
                message={newNote.trim() || 'הכנס הודעת ווטסאפ ללקוח...'}
                storeUrl={settings?.storeUrl}
                isWhatsAppReplyEnabled={isWhatsAppReplyEnabled}
              />
            </div>
          )}
            <NotesList notes={notes} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
