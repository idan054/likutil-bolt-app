import type { CompanyPrintDocuments } from "../types/order";

export interface CompanyPrintAction {
  id: string;
  label: string;
  url: string;
  valid: boolean;
  createsDeliveryNote: boolean;
}

const isValidPrintUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export const getCompanyPrintSignature = (documents: CompanyPrintDocuments | null): string =>
  JSON.stringify([
    documents?.quote_id ?? null,
    Array.isArray(documents?.invoices)
      ? documents.invoices.map((invoice) => invoice.number)
      : null,
  ]);

export const getCompanyPrintActions = (
  documents: CompanyPrintDocuments | null
): CompanyPrintAction[] => {
  if (!documents) return [];
  const note = documents.delivery_note;
  const invoiceActions = Array.isArray(documents.invoices)
    ? documents.invoices.map((invoice, index) => ({
        id: `invoice-${index}-${invoice.number}`,
        label: invoice.number != null
          ? `🖨️ הדפס חשבונית מס #${invoice.number}`
          : "🖨️ הדפס חשבונית מס",
        url: invoice.print_url,
        valid: invoice.number != null && isValidPrintUrl(invoice.print_url),
        createsDeliveryNote: false,
      }))
    : [];

  return [
    {
      id: "delivery-note",
      label: note?.exists === true
        ? note.number != null
          ? `🖨️ הדפס תעודת משלוח #${note.number}`
          : "🖨️ הדפס תעודת משלוח"
        : "📄 הפק והדפס תעודת משלוח",
      url: note?.print_url ?? "",
      valid: (note?.exists === false || (note?.exists === true && note.number != null)) &&
        isValidPrintUrl(note?.print_url),
      createsDeliveryNote: note?.exists === false,
    },
    ...invoiceActions,
  ];
};
