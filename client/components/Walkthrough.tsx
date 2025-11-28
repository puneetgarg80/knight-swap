import React, { useState, useLayoutEffect, useRef } from 'react';
import { walkthroughSteps } from '../walkthroughSteps';

interface WalkthroughProps {
  onFinish: () => void;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentStep = walkthroughSteps[currentStepIndex];

  useLayoutEffect(() => {
    const popoverEl = popoverRef.current;
    if (!popoverEl) return;

    const element = currentStep.targetSelector
      ? document.querySelector(currentStep.targetSelector)
      : null;

    if (element) {
      // Use instant scroll to avoid race conditions with getBoundingClientRect
      element.scrollIntoView({ block: 'center', inline: 'center' });
    }

    // Defer position calculation to allow scroll to complete.
    const timerId = setTimeout(() => {
      const targetRect = element?.getBoundingClientRect();

      setHighlightStyle(
        targetRect
          ? {
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }
          : {
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
            }
      );
      
      const popoverRect = popoverEl.getBoundingClientRect();
      const margin = 16;
      let newPopoverStyle: React.CSSProperties = { visibility: 'visible' };

      if (!targetRect) {
        // Manual centering to avoid transform conflict with animation
        const top = (window.innerHeight - popoverRect.height) / 2;
        const left = (window.innerWidth - popoverRect.width) / 2;
        
        newPopoverStyle = {
            ...newPopoverStyle,
            top: Math.max(margin, top),
            left: Math.max(margin, left),
        };

      } else {
        const placement = currentStep.placement || 'bottom';
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'top':
            top = targetRect.top - popoverRect.height - margin;
            left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
            break;
          case 'bottom':
            top = targetRect.bottom + margin;
            left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
            break;
          case 'left':
            top = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
            left = targetRect.left - popoverRect.width - margin;
            break;
          case 'right':
            top = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
            left = targetRect.right + margin;
            break;
          default:
            top = targetRect.bottom + margin;
            left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
        }

        // Boundary checks to keep popover on screen
        left = Math.max(margin, Math.min(left, window.innerWidth - popoverRect.width - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight - popoverRect.height - margin));
        
        newPopoverStyle = { ...newPopoverStyle, top, left };
      }
      setPopoverStyle(newPopoverStyle);
    }, 50); // 50ms to allow for paint after scroll

    return () => clearTimeout(timerId);
  }, [currentStepIndex, currentStep.targetSelector, currentStep.placement]);

  const handleNext = () => {
    if (currentStepIndex < walkthroughSteps.length - 1) {
      setPopoverStyle({ visibility: 'hidden' }); // Hide while transitioning
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setPopoverStyle({ visibility: 'hidden' }); // Hide while transitioning
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const handleSkip = () => {
      onFinish();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Highlight Box / Backdrop */}
      <div
        className="absolute transition-all duration-500 ease-in-out pointer-events-none"
        style={{
          ...highlightStyle,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
          border: '2px solid #22d3ee',
          borderRadius: '8px',
        }}
      ></div>

      {/* Popover */}
      <div
        ref={popoverRef}
        className="absolute z-50 w-11/12 max-w-xs bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-5 transition-all duration-500 ease-in-out animate-fade-in-up"
        style={popoverStyle}
      >
        <h3 className="text-xl font-bold text-cyan-400 mb-2">{currentStep.title}</h3>
        <p className="text-gray-300 mb-4 text-base">{currentStep.content}</p>
        
        <div className="flex justify-between items-center mt-4">
          <button onClick={handleSkip} className="px-3 py-1 rounded-md text-sm font-semibold bg-transparent hover:bg-gray-700 text-gray-300 transition-colors">Skip</button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
                {currentStepIndex + 1} / {walkthroughSteps.length}
            </span>
            {currentStepIndex > 0 && (
                 <button onClick={handlePrev} className="px-3 py-1.5 rounded-md text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-colors">Prev</button>
            )}
            <button onClick={handleNext} className="px-4 py-1.5 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
              {currentStepIndex === walkthroughSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Walkthrough;