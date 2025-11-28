import React from 'react';

const Confetti: React.FC = () => {
  const confettiCount = 150;
  const colors = [
    '#06b6d4', '#facc15', '#ec4899', '#8b5cf6', '#f87171', '#4ade80', '#ffffff'
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const fallDuration = Math.random() * 3 + 4; // 4s to 7s
        const swayDuration = Math.random() * 2 + 2; // 2s to 4s
        const delay = Math.random() * 5;

        const style = {
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          width: `${Math.floor(Math.random() * 8) + 8}px`,
          height: `${Math.floor(Math.random() * 5) + 5}px`,
          transform: `rotate(${Math.random() * 360}deg)`,
          '--sway-x': `${Math.random() * 50 - 25}px`, // -25px to +25px
          animation: `fall ${fallDuration}s linear ${delay}s forwards, rotate-and-sway ${swayDuration}s ease-in-out ${delay}s infinite`,
        } as React.CSSProperties;

        return <div key={i} className="confetti" style={style}></div>;
      })}
    </div>
  );
};

export default Confetti;