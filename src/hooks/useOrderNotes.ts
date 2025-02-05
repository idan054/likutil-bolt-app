import { useState, useEffect, useCallback } from 'react';
import { getOrderNotes, createOrderNote } from '../services/orders/notes.service';
import { showErrorToast } from '../utils/error';
import { translations } from '../config/translations';
import type { OrderNote, CreateNoteRequest } from '../types/order';

export const useOrderNotes = (orderId: string) => {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getOrderNotes(orderId);
      setNotes(data);
    } catch (error) {
      console.error('[useOrderNotes] Failed to fetch notes:', error);
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (noteRequest: CreateNoteRequest) => {
    // Create optimistic note
    const optimisticNote: OrderNote = {
      id: Date.now(), // Temporary ID
      date_created: new Date().toISOString(),
      note: noteRequest.note,
      customer_note: noteRequest.customer_note,
      author: 'You', // Will be replaced with actual author from API
    };

    // Add optimistic note to the list
    setNotes(prevNotes => [optimisticNote, ...prevNotes]);

    try {
      // Make API call
      const createdNote = await createOrderNote(orderId, noteRequest);
      
      // Replace optimistic note with real one
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === optimisticNote.id ? createdNote : note
        )
      );

      return true;
    } catch (error) {
      // Remove optimistic note on error
      setNotes(prevNotes => 
        prevNotes.filter(note => note.id !== optimisticNote.id)
      );
      throw error;
    }
  };

  return {
    notes,
    isLoading,
    addNote,
    refetch: fetchNotes,
  };
};