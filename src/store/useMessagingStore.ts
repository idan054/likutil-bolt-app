import { create } from "zustand";

interface MessagingState {
  isWhatsAppNote: boolean;
  isCustomerNote: boolean;
  isExpanded: boolean;
  isWhatsAppReplyEnabled: boolean;
  businessPhone: string;
  setWhatsAppNote: (value: boolean) => void;
  setCustomerNote: (value: boolean) => void;
  setExpanded: (value: boolean) => void;
  setWhatsAppReplyEnabled: (value: boolean) => void;
  setBusinessPhone: (value: string) => void;
  toggleWhatsAppNote: () => void;
  toggleCustomerNote: () => void;
  reset: () => void;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  isWhatsAppNote: false,
  isCustomerNote: false,
  isExpanded: false,
  isWhatsAppReplyEnabled: false,
  businessPhone: "",
  setWhatsAppNote: (value) => set({ isWhatsAppNote: value, isExpanded: true }),
  setCustomerNote: (value) => set({ isCustomerNote: value, isExpanded: true }),
  setExpanded: (value) => set({ isExpanded: value }),
  toggleWhatsAppNote: () =>
    set((state) => {
      if (state.isWhatsAppNote) {
        return {
          isWhatsAppNote: true,
        };
      } else {
        return {
          isWhatsAppNote: !state.isWhatsAppNote,
          isExpanded: true,
          isCustomerNote: false,
        };
      }
    }),
  toggleCustomerNote: () =>
    set((state) => {
      if (state.isCustomerNote) {
        return {
          isCustomerNote: true,
        };
      } else {
        return {
          isCustomerNote: !state.isCustomerNote,
          isExpanded: true,
          isWhatsAppNote: false,
        };
      }
    }),
  setWhatsAppReplyEnabled: (value) => set({ isWhatsAppReplyEnabled: value }),
  setBusinessPhone: (value) => set({ businessPhone: value }),
  reset: () =>
    set({
      isWhatsAppNote: false,
      isCustomerNote: false,
      isExpanded: false,
      isWhatsAppReplyEnabled: false,
      businessPhone: "",
    }),
}));
