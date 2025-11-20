
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { GoogleGenAI, Chat as GenAIChat } from '@google/genai';
import { CHAT_SYSTEM_INSTRUCTION } from '../constants';
import { diagnostics } from '../diagnostics';
import { ChatMessage } from '../types';

interface ChatProps {
  replayMessages?: ChatMessage[];
}

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MAX_MESSAGES = 40;

const Chat: React.FC<ChatProps> = ({ replayMessages }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<GenAIChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use replay messages if provided, otherwise local state
  const displayMessages = replayMessages || messages;
  
  const isLimitReached = displayMessages.length >= MAX_MESSAGES;
  const isReplayMode = !!replayMessages;

  useEffect(() => {
    if (isReplayMode) return;

    const initializeChat = () => {
      try {
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: CHAT_SYSTEM_INSTRUCTION,
          },
        });
        
        const initialMsg: ChatMessage = { role: 'model', text: "Hello! I'm your AI assistant for the Knight Swap Puzzle. Do you need help?" };
        setMessages([initialMsg]);
        // Log the initial message so it appears in replays
        diagnostics.log('CHAT_MSG_RECEIVED', { text: initialMsg.text });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([{ role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        diagnostics.log('CHAT_ERROR', { error: String(error) });
      }
    };
    initializeChat();
  }, [isReplayMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (isReplayMode) return;
    if (!inputValue.trim() || isLoading || !chatRef.current || isLimitReached) return;

    const userMessage: ChatMessage = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    diagnostics.log('CHAT_MSG_SENT', { text: userMessage.text });

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage.text });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
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

  return (
    <div className="flex flex-col h-full w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {displayMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                  msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
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
        <div className="flex items-center bg-gray-700 rounded-lg">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={isReplayMode ? "Replay Mode - Chat Disabled" : isLimitReached ? "Message limit reached" : "Ask for a hint..."}
            disabled={isLoading || isLimitReached || isReplayMode}
            className="w-full bg-transparent p-3 text-gray-200 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || isLimitReached || isReplayMode}
            className="p-3 text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
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
