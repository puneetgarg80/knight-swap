
import React from 'react';
import ViewSwitcher from './ViewSwitcher';
import ToggleSwitch from './ToggleSwitch';

interface ControlsProps {
  moveCount: number;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  currentView: 'board' | 'map';
  onViewChange: (view: 'board' | 'map') => void;
  isShowingTarget: boolean;
  onToggleTarget: () => void;
  isMapUnlocked: boolean;
}

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }> = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'
    } ${className}`}
  >
    {children}
  </button>
);


const Controls: React.FC<ControlsProps> = ({ moveCount, onReset, onUndo, canUndo, currentView, onViewChange, isShowingTarget, onToggleTarget, isMapUnlocked }) => {
  return (
    <div className="flex flex-wrap items-center justify-between w-full bg-gray-800/50 p-3 rounded-lg gap-4">
      <div className="text-lg" data-walkthrough="move-counter">
        Moves: <span className="font-bold text-cyan-400 text-xl">{moveCount}</span>
      </div>
      <div data-walkthrough="view-switcher">
        <ViewSwitcher 
          currentView={currentView} 
          onViewChange={onViewChange} 
          isMapUnlocked={isMapUnlocked}
        />
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
      </div>
    </div>
  );
};

export default Controls;
