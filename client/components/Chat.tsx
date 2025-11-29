
import React, { useState, useRef, useEffect, FormEvent } from 'react';

import { diagnostics } from '../diagnostics';
import { ChatMessage } from '../types';

interface ChatProps {
  replayMessages?: ChatMessage[];
  initialMessage?: string;
}

const MAX_MESSAGES = 40;

const Chat: React.FC<ChatProps> = ({ replayMessages, initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // chatRef removed as state is now managed via API calls
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use replay messages if provided, otherwise local state
  const displayMessages = replayMessages || messages;

  const isLimitReached = displayMessages.length >= MAX_MESSAGES;
  const isReplayMode = !!replayMessages;

  useEffect(() => {
    if (isReplayMode) return;

    const initializeChat = () => {
      const text = initialMessage || "Hello! I'm your AI assistant for the Knight Swap Puzzle. Do you need help?";
      const initialMsg: ChatMessage = { role: 'model', text };
      setMessages([initialMsg]);
      // Log the initial message so it appears in replays
      diagnostics.log('CHAT_MSG_RECEIVED', { text: initialMsg.text });
    };
    initializeChat();
  }, [isReplayMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
    }
  }, [inputValue]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isReplayMode) return;
    const textToSend = inputValue.trim();
    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Reset height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    diagnostics.log('CHAT_MSG_SENT', { text: userMessage.text });

    try {
      // Prepare history for the API (excluding the message we just added locally for now, or include it? 
      // The API expects history + new message. 
      // Let's send the current messages as history.
      // Note: The server expects { message: string, history: ChatMessage[] }
      // The history should NOT include the current message being sent if we follow standard pattern, 
      // or we can send it as part of history and empty message? 
      // The GoogleGenAI SDK `chat.sendMessage` takes the new message. 
      // So history should be the *previous* messages.

      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyForApi
        })
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const modelMessage: ChatMessage = { role: 'model', text: data.text };

      setMessages(prev => [...prev, modelMessage]);
      diagnostics.log('CHAT_MSG_RECEIVED', { text: modelMessage.text });
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "Oops! Something went wrong. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      diagnostics.log('CHAT_ERROR', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {displayMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && !isReplayMode && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-1">
                  <span className="animate-bounce w-2 h-2 bg-cyan-400 rounded-full" style={{ animationDuration: '1s' }}></span>
                  <span className="animate-bounce w-2 h-2 bg-cyan-400 rounded-full" style={{ animationDuration: '1s', animationDelay: '0.15s' }}></span>
                  <span className="animate-bounce w-2 h-2 bg-cyan-400 rounded-full" style={{ animationDuration: '1s', animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}
          {isLimitReached && (
            <div className="flex justify-center py-2">
              <div className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-full text-gray-400 text-sm">
                {isReplayMode ? "Message limit reached during session." : `Message limit reached (${MAX_MESSAGES}).`}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex items-end bg-gray-700 rounded-lg">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isReplayMode ? "Replay Mode - Chat Disabled" : isLimitReached ? "Message limit reached" : "Ask for a hint... (Enter for new line, Ctrl+Enter to send)"}
            disabled={isLoading || isLimitReached || isReplayMode}
            className="w-full bg-transparent p-3 text-gray-200 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || isLimitReached || isReplayMode}
            className="p-3 text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors mb-0.5"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
