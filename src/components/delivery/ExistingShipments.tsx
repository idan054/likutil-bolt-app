import type { OrderDetails } from '../../types/order';
import type { DeliveryTaskResponse } from '../../services/delivery/types';
import { getShipmentLabelUrl } from '../../utils/shippingLabel';
import { getPrintLabelSource } from '../../services/delivery/validation/response';
import { openPrintLabel } from '../../utils/openPrintLabel';
import { getDeliveryCity } from '../../services/delivery/mappers';

export function ExistingShipments({ order, shipments }: {
  order: OrderDetails; shipments: DeliveryTaskResponse[];
}) {
  return <div className="flex flex-wrap gap-2">
    {shipments.map((shipment, index) => {
      const label = getShipmentLabelUrl(order.s3_label_url, order.id, shipment.provider,
        shipment, shipment.package_count ?? '1', getDeliveryCity(order), true) ?? shipment.print_label;
      const source = getPrintLabelSource(label);
      if (!source) return <span key={index}>משלוח {shipment.track_number}: המדבקה זמינה אצל חברת המשלוחים.</span>;
      const text = shipments.length === 1 ? 'הדפס שוב מדבקה שיצרנו' : `הדפס שוב מדבקה ${shipment.track_number || index + 1}`;
      const className = 'rounded-md border border-amber-500 bg-white px-3 py-2 font-semibold hover:bg-amber-100';
      return source.type === 'url'
        ? <a key={index} href={source.value} target="_blank" rel="noopener noreferrer" className={className}>{text}</a>
        : <button key={index} onClick={() => openPrintLabel(label)} className={className}>{text}</button>;
    })}
  </div>;
}
