'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatWindow } from './chat-window';
import { useChat } from '../contexts/chat-context';
import { useCustomerAuth } from '../contexts/customer-auth-context';
import { useRouter } from 'next/navigation';

export function ChatWidget() {
  const { isAuthenticated } = useCustomerAuth();
  const { isOpen, toggleChat, openChat } = useChat();
  const router = useRouter();
  const [wasAuthSheetOpen, setWasAuthSheetOpen] = useState(false);

  const handleChatClick = () => {
    if (!isAuthenticated) {
      // Store that user tried to open chat
      localStorage.setItem('pending_chat_open', 'true');
      router.push('/customer');
      return;
    }

    // Clear any pending chat open flag
    localStorage.removeItem('pending_chat_open');
    toggleChat();
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={handleChatClick}
          size="lg"
          className={`h-14 w-14 rounded-full shadow-lg ${
            isOpen
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600'
          } transition-all duration-300`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && isAuthenticated && <ChatWindow />}
      </AnimatePresence>
    </>
  );
}
