import type { OrderDetails } from '../../types/order';
import type { DeliveryTaskResponse } from '../../services/delivery/types';
import { getShipmentLabelUrl } from '../../utils/shippingLabel';
import { getPrintLabelSource } from '../../services/delivery/validation/response';
import { openPrintLabel } from '../../utils/openPrintLabel';
import { getDeliveryCity } from '../../services/delivery/mappers';
import { Printer } from 'lucide-react';

export function ExistingShipments({ order, shipments }: {
  order: OrderDetails; shipments: DeliveryTaskResponse[];
}) {
  return <div className="flex flex-col gap-2">
    {shipments.map((shipment, index) => {
      if (shipment.cancelled) return null;
      const label = getShipmentLabelUrl(order.s3_label_url, order.id, shipment.provider,
        shipment, shipment.package_count ?? '1', getDeliveryCity(order), true) ?? shipment.print_label;
      const source = getPrintLabelSource(label);
      if (!source) return <button key={index} disabled title="המדבקה זמינה בפאנל חברת המשלוחים" className="w-full rounded-lg bg-slate-100 px-4 py-3 text-slate-500">הדפס מדבקה</button>;
      const text = `הדפס מדבקה${shipments.length > 1 ? ` · ${shipment.track_number || index + 1}` : ''}`;
      const className = 'flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
      const title = `הדפסה חוזרת של משלוח #${shipment.track_number}, ללא יצירת משלוח חדש`;
      const content = <><Printer size={18} aria-hidden="true" /><span>{text}</span></>;
      return source.type === 'url'
        ? <a key={index} href={source.value} target="_blank" rel="noopener noreferrer" title={title} className={className}>{content}</a>
        : <button key={index} onClick={() => openPrintLabel(label)} title={title} className={className}>{content}</button>;
    })}
  </div>;
}
