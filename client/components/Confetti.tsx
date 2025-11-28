import React, { useEffect, useRef } from 'react';
import JSConfetti from 'js-confetti';

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize JSConfetti with our canvas
    // If canvasRef.current is null, it would default to creating one on body, 
    // but we want to control it via our rendered canvas.
    if (!canvasRef.current) return;

    const jsConfetti = new JSConfetti({ canvas: canvasRef.current });

    const fireConfetti = () => {
      jsConfetti.addConfetti({
        confettiColors: [
          '#06b6d4', '#facc15', '#ec4899', '#8b5cf6', '#f87171', '#4ade80', '#ffffff'
        ],
        confettiNumber: 250,
      });
    };

    // Fire immediately on mount
    fireConfetti();

    // Cleanup not strictly necessary for the instance itself as it doesn't leave lingering side effects 
    // other than the canvas content, but we can clear it.
    return () => {
      jsConfetti.clearCanvas();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
};

export default Confetti;
