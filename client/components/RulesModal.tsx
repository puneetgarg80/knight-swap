import React from 'react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    view: 'board' | 'map';
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, view }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl max-w-sm w-full p-6 relative shadow-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    {view === 'map' ? 'Map View Rules' : 'Puzzle Rules'}
                </h2>

                <div className="text-gray-300 space-y-4">
                    {view === 'map' ? (
                        <>
                            <p className="font-semibold text-amber-400">About Map View</p>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Graph Transformation:</strong> We converted the board squares into nodes and legal Knight moves into connecting lines.</li>
                                <li><strong>Hidden Structure:</strong> This reveals that the puzzle isn't a complex 2D grid, but a simple linear track with one side-path.</li>
                                <li><strong>Goal:</strong> Treat each knight like a car and connections like streets. Simply drive the cars along the track to swap their positions.</li>
                            </ul>
                        </>
                    ) : (
                        <ul className="list-disc list-inside space-y-2">
                            <li>Knights move in an 'L' shape (or follow the lines in Map View).</li>
                            <li>A knight can only move to an empty square.</li>
                            <li>Click a knight to select it, then click an empty square to move.</li>
                        </ul>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Got it
                </button>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default RulesModal;
