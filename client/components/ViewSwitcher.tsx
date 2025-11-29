
import React from 'react';

interface ViewSwitcherProps {
  currentView: 'board' | 'map';
  onViewChange: (view: 'board' | 'map') => void;
  isMapUnlocked: boolean;
  onUnlockRequest: () => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange, isMapUnlocked, onUnlockRequest }) => {
  const baseClasses = "flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";

  const activeClasses = "bg-cyan-500 text-white";
  const inactiveClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";
  const lockedClasses = "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600 border-dashed";

  const handleMapClick = () => {
    if (isMapUnlocked) {
      onViewChange('map');
    } else {
      onUnlockRequest();
    }
  };

  return (
    <div className="flex p-1 bg-gray-900 rounded-lg gap-1">
      <button
        onClick={() => onViewChange('board')}
        className={`${baseClasses} ${currentView === 'board' ? activeClasses : inactiveClasses}`}
      >
        Chessboard
      </button>
      <button
        onClick={handleMapClick}
        title={isMapUnlocked ? "Switch to Map View" : "Unlock Map View (-20 Points)"}
        className={`${baseClasses} ${!isMapUnlocked
          ? lockedClasses
          : currentView === 'map' ? activeClasses : inactiveClasses
          }`}
        data-walkthrough="unlock-map-btn"
      >
        Map View {!isMapUnlocked && <span className="ml-1" aria-label="Locked">🔒</span>}
      </button>
    </div>
  );
};

export default ViewSwitcher;
