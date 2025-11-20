import React from 'react';
import Confetti from './Confetti';

interface WinModalProps {
  moveCount: number;
  onReset: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ moveCount, onReset }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Confetti />
      <div className="bg-gray-800 border border-cyan-500 rounded-xl p-8 text-center shadow-2xl animate-fade-in-up relative z-10">
        <h2 className="text-4xl font-bold text-cyan-400 mb-2">Puzzle Solved!</h2>
        <p className="text-gray-300 mb-6">Congratulations! You completed the challenge in <span className="font-bold text-white">{moveCount}</span> moves.</p>
        <button
          onClick={onReset}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
        >
          Play Again
        </button>
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

export default WinModal;