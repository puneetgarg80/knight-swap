import React from 'react';

interface SuggestionModalProps {
    onUnlock: () => void;
    onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ onUnlock, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-cyan-500/50 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-cyan-900/50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Need a Hint?</h3>
                    <p className="text-gray-300 mb-6">
                        You've been trying for a while! Our AI Helper can analyze the board and give you personalized advice to solve the puzzle.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={onUnlock}
                            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Unlock AI Helper
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-colors"
                        >
                            No thanks
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuggestionModal;
