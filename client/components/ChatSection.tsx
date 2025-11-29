import React, { Suspense } from 'react';
import Chat from './Chat';

interface ChatSectionProps {
    title: string;
    isUnlocked: boolean;
    onUnlock: () => void;
    initialMessage?: string;
    context: 'board' | 'map';
}

const ChatSection: React.FC<ChatSectionProps> = ({ title, isUnlocked, onUnlock, initialMessage, context }) => {
    return (
        <div className="w-full max-w-2xl mt-2 mb-2">
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-cyan-400">{title}</h3>
                {!isUnlocked ? (
                    <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                        <p className="text-gray-400 mb-4">Unlock the AI assistant for help with this view.</p>
                        <button
                            onClick={onUnlock}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Unlock (20 pts)
                        </button>
                    </div>
                ) : (
                    <div className="h-[400px]">
                        <Suspense fallback={<div className="text-center text-gray-500">Loading Chat...</div>}>
                            <Chat initialMessage={initialMessage} context={context} />
                        </Suspense>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSection;
