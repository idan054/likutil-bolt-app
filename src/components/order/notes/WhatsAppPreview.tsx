import React from 'react';
import { WhatsAppIcon } from '../../icons/WhatsAppIcon';

interface WhatsAppPreviewProps {
  orderId: string;
  message: string;
  storeUrl?: string;
  isWhatsAppReplyEnabled: boolean;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  orderId,
  message,
  storeUrl,
  isWhatsAppReplyEnabled,
}) => {
  const previewMessage = `היי שלום לך! 👋

יש לך הודעה בקשר להזמנה מספר ${orderId}

${message.trim()}

נא לא להשיב להודעה זו.

במקרים דחופים,

ניתן להתקשר אלינו לטלפון: 052-250-9900. 😊`;

  return (
    <div className="mt-2 p-0 rounded-lg w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="bg-[#e7ffdb] p-3 rounded-[14px] rounded-tr-[6px] self-end w-full relative">
          {/* WhatsApp Icon */}
          <div className="absolute top-4 left-4">
          <WhatsAppIcon size={20} className="text-[#1EA952] opacity-75" />
          </div>
          <div className="text-[#111b21] text-sm whitespace-pre-wrap">
            {previewMessage}
            {isWhatsAppReplyEnabled && (
              <div className="text-blue-600 underline mt-1">קישור לתשובה...</div>
            )}
          </div>
          <div className="text-[#667781] text-[0.6875rem] text-right mt-1">
            {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}
          </div>
        </div>
      </div>
    </div>
  );
};