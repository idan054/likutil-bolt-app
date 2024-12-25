import { apiClient } from '../api/client';
import type { OrderNote, CreateNoteRequest } from '../../types/order';

export const getOrderNotes = async (orderId: string): Promise<OrderNote[]> => {
  return apiClient<OrderNote[]>({
    method: 'GET',
    path: `/orders/${orderId}/notes`,
  });
};

export const createOrderNote = async (
  orderId: string, 
  { note, customer_note }: CreateNoteRequest
): Promise<OrderNote> => {
  return apiClient<OrderNote>({
    method: 'POST',
    path: `/orders/${orderId}/notes`,
    body: { 
      note,
      customer_note
    },
  });
};