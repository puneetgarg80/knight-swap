
import React from 'react';

interface HintPromptModalProps {
  onSwitchToChat: () => void;
  onDismiss: () => void;
}

const InvestigationPromptModal: React.FC<HintPromptModalProps> = ({ onSwitchToChat, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-cyan-500 rounded-xl p-8 text-center shadow-2xl animate-fade-in-up max-w-lg">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Stuck in a Rut?</h2>
        <div className="text-gray-300 mb-6 space-y-3">
            <p>Great effort! You've made 30 or more total moves.</p>
            <p>Puzzles like this can be tricky. Our AI Helper can offer hints and discuss strategies to help you see the problem in a new light—without spoiling the solution.</p>
            <p>Would you like some help?</p>
        </div>
        <div className="flex justify-center gap-4">
            <button
            onClick={onDismiss}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
            >
            Keep Playing
            </button>
            <button
            onClick={onSwitchToChat}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
            >
            Chat with AI Helper
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default InvestigationPromptModal;