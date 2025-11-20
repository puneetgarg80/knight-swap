
import React from 'react';
import { type SquareName, type SquareContent, type PieceType } from '../types';
import { KNIGHT_EMOJI } from '../constants';

interface SquareProps {
  name: SquareName;
  piece: SquareContent;
  onClick: (name: SquareName) => void;
  isSelected: boolean;
  isPossibleMove: boolean;
  isBlack: boolean;
}

const Square: React.FC<SquareProps> = React.memo(({ name, piece, onClick, isSelected, isPossibleMove }) => {
  // All squares are white with black borders as requested.
  // Using strictly white background and black borders for high contrast visibility.
  
  return (
    <div
      onClick={() => onClick(name)}
      className={`relative flex items-center justify-center aspect-square rounded-sm cursor-pointer border-2 border-black bg-white hover:bg-gray-100 transition-all duration-200 ${
        isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-cyan-600' : ''
      }`}
    >
      {isPossibleMove && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 bg-cyan-600/50 rounded-full"></div>
        </div>
      )}
      {piece && (
        <span className="text-4xl sm:text-5xl md:text-6xl text-black select-none">
          {KNIGHT_EMOJI[piece as PieceType]}
        </span>
      )}
      <span className="absolute top-1 left-1.5 text-sm font-bold font-mono text-black">{name}</span>
    </div>
  );
});

export default Square;
