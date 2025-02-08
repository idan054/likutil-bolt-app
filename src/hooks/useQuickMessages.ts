import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { toast } from 'react-hot-toast';

const MESSAGES_LIMIT = 10;

export const useQuickMessages = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'quick_messages');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages || []);
        }
      } catch (error) {
        console.error('[useQuickMessages] Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user]);

  const saveMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      // Don't save duplicates
      if (messages.includes(message)) {
        toast.error('הודעה זו כבר קיימת ברשימה');
        return;
      }

      // Limit the number of saved messages
      const updatedMessages = [message, ...messages].slice(0, MESSAGES_LIMIT);
      
      const docRef = doc(db, 'users', user.uid, 'settings', 'quick_messages');
      await setDoc(docRef, { messages: updatedMessages });
      
      setMessages(updatedMessages);
      toast.success('התבנית נשמרה בהצלחה');
    } catch (error) {
      console.error('[useQuickMessages] Failed to save message:', error);
      toast.error('שגיאה בשמירת התבנית');
    }
  };

  const deleteMessage = async (messageToDelete: string) => {
    if (!user) return;

    try {
      const updatedMessages = messages.filter(msg => msg !== messageToDelete);
      console.log('messageToDelete')
      console.log(messageToDelete)
      console.log('updatedMessages')
      console.log(updatedMessages)
      
      const docRef = doc(db, 'users', user.uid, 'settings', 'quick_messages');
      await setDoc(docRef, { messages: updatedMessages });
      
      setMessages(updatedMessages);
      toast.success('התבנית נמחקה בהצלחה');
    } catch (error) {
      console.error('[useQuickMessages] Failed to delete message:', error);
      toast.error('שגיאה במחיקת התבנית');
    }
  };

  return {
    messages,
    isLoading,
    saveMessage,
    deleteMessage
  };
};