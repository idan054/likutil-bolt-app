import { useState, useEffect, useCallback } from "react";
import {
  getOrderNotes,
  createOrderNote,
} from "../services/orders/notes.service";
import { showErrorToast } from "../utils/error";
import type { OrderNote, CreateNoteRequest } from "../types/order";

export const useOrderNotes = (orderId: string) => {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    // Don't try to fetch notes if settings are not available
    const settings = localStorage.getItem("wc_settings");
    if (!settings) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getOrderNotes(orderId);
      setNotes(data);
      console.log("Notes format: ", data);
    } catch (error) {
      console.error("[useOrderNotes] Failed to fetch notes:", error);
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // Add a small delay to ensure settings are loaded
    const timer = setTimeout(fetchNotes, 1000);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  const addNote = async (noteRequest: CreateNoteRequest) => {
    // Create optimistic note
    const optimisticNote: OrderNote = {
      id: Date.now(),
      date_created: new Date().toISOString(),
      note: noteRequest.note,
      customer_note: noteRequest.customer_note,
      author: "You",
    };

    setNotes((prevNotes) => [optimisticNote, ...prevNotes]);

    try {
      const createdNote = await createOrderNote(orderId, noteRequest);

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === optimisticNote.id ? createdNote : note
        )
      );

      return true;
    } catch (error) {
      // Remove optimistic note on error
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note.id !== optimisticNote.id)
      );
      showErrorToast(error);
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
