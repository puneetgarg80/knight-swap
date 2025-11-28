
import React, { useState } from 'react';

interface NameModalProps {
  onNameSubmit: (name: string) => void;
}

const NameModal: React.FC<NameModalProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onNameSubmit(trimmedName);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 border-2 border-cyan-500 rounded-xl p-8 text-center shadow-2xl max-w-sm w-full">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome!</h2>
        <p className="text-gray-300 mb-6">Please enter your name to start the Knight Swap Challenge.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              placeholder="Your Name"
              className={`w-full px-4 py-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                error ? 'ring-2 ring-red-500 bg-red-900/20' : 'focus:ring-cyan-500'
              }`}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-1 text-left">Name is required.</p>}
          </div>
          
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameModal;
