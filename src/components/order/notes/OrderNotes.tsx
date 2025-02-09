import React, { useState } from "react";
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



interface OrderNotesProps {
  orderId: string;
  customerPhone?: string;
}

export const OrderNotes: React.FC<OrderNotesProps> = ({
  orderId,
  customerPhone,
}) => {
  const { notes, isLoading, addNote } = useOrderNotes(orderId);  
  const { settings } = useSettings();

  const {
    isWhatsAppNote,
    isCustomerNote,
    setWhatsAppNote,
    setCustomerNote,
    isExpanded,
    setExpanded,
  } = useMessagingStore();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isWhatsAppNote && customerPhone) {
       

        const whatsappMessage = `📝 שלום, נוספה הערה להזמנה שלך מ ${settings?.storeUrl} 🛍️\n\n${newNote.trim()}\n───────\n🤖 לא ניתן להשיב להודעה זו`;

        const whatsappNumber = customerPhone.replace(/\D/g, "");
        const response = await fetch(`${BASE_URL}/api/send-whatsapp`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 
            whatsappMessage,
            
            phone: whatsappNumber.startsWith('972') ? whatsappNumber : `972${whatsappNumber.slice(1)}`
          })
        });

        if (response.ok) {
          toast.success(translations.orderNotes.whatsappSuccess);
          setNewNote("");
          // Add WhatsApp message as a note
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
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-1">
            <NotesList notes={notes} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
