
import React from 'react';

interface UnlockModalProps {
  featureName: string;
  cost: number;
  currentScore: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ featureName, cost, currentScore, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 border-2 border-amber-500 rounded-xl p-6 text-center shadow-2xl max-w-sm w-full relative">
        <div className="mb-4">
            <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Unlock {featureName}?</h2>
        <p className="text-gray-300 mb-6">
          This will cost <span className="font-bold text-amber-400">{cost} Points</span>.
          <br />
          <span className="text-sm text-gray-400 mt-2 block">
            Current Score: {currentScore} &rarr; {currentScore - cost}
          </span>
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-amber-900/20"
          >
            Unlock (-{cost})
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
