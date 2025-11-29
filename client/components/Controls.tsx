
import React from 'react';
import ToggleSwitch from './ToggleSwitch';

interface ControlsProps {
  moveCount: number;
  score: number;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  currentView: 'board' | 'map';
  onViewChange: (view: 'board' | 'map') => void;
  isShowingTarget: boolean;
  onToggleTarget: () => void;
  isMapUnlocked: boolean;
  onRequestUnlockMap: () => void;
  onShowRules: () => void;
}

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }> = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'
      } ${className}`}
  >
    {children}
  </button>
);


const Controls: React.FC<ControlsProps> = ({
  moveCount,
  score,
  onReset,
  onUndo,
  canUndo,
  currentView,
  onViewChange,
  isShowingTarget,
  onToggleTarget,
  isMapUnlocked,
  onRequestUnlockMap,
  onShowRules
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between w-full bg-gray-800/50 p-3 rounded-lg gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="text-lg" data-walkthrough="move-counter">
          Moves: <span className="font-bold text-cyan-400 text-xl">{moveCount}</span>
        </div>
        <div className="text-lg">
          Score: <span className={`font-bold text-xl ${score >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div data-walkthrough="view-target">
          <ToggleSwitch
            label="View Target"
            checked={isShowingTarget}
            onChange={onToggleTarget}
          />
        </div>
        <div data-walkthrough="controls-buttons" className="flex items-center gap-2">
          <Button onClick={onUndo} disabled={!canUndo || isShowingTarget}>
            Undo
          </Button>
          <Button onClick={onReset}>
            Reset
          </Button>
        </div>
        <button
          onClick={onShowRules}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-cyan-400 transition-colors"
          title="Show Rules"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Controls;
