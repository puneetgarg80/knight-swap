
import React from 'react';

interface ReplayControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalSteps: number;
  onSeek: (index: number) => void;
  currentAction: string;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentIndex,
  totalSteps,
  onSeek,
  currentAction
}) => {
  return (
    <div className="flex flex-col bg-gray-800 border-t border-gray-700 p-4 shadow-lg z-50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-cyan-400 font-mono text-sm truncate max-w-[60%]">
            Action: {currentAction || 'Start'}
        </div>
        <div className="text-gray-400 text-sm font-mono">
          {Math.min(currentIndex + 1, totalSteps)} / {totalSteps}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={currentIndex < 0}
          className="p-2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 19V5l-11 7 11 7zm2-14v14l11-7-11-7z" transform="scale(-1, 1) translate(-24, 0)" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-colors"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalSteps - 1}
          className="p-2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
             <path d="M4 5v14l11-7z" />
             <path d="M16 5h4v14h-4z" transform="translate(2,0)"/>
          </svg>
        </button>

        <input
          type="range"
          min="-1"
          max={totalSteps - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
    </div>
  );
};

export default ReplayControls;
