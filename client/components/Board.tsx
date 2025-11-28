
import React from 'react';
import { type BoardState, type SquareName } from '../types';
import { BOARD_GRID_LAYOUT, SQUARE_COORDS } from '../constants';
import Square from './Square';

interface BoardProps {
  boardState: BoardState;
  onSquareClick: (squareName: SquareName) => void;
  selectedSquare: SquareName | null;
  possibleMoves: SquareName[];
  shake: boolean;
}

const Board: React.FC<BoardProps> = ({ boardState, onSquareClick, selectedSquare, possibleMoves, shake }) => {
  const animationClass = shake ? 'animate-shake' : '';

  return (
    <div className={`p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg w-full`}>
      <div className={`grid grid-cols-4 gap-1 sm:gap-2 w-full aspect-square transition-transform duration-300 ${animationClass}`} style={{ animation: shake ? 'shake 0.3s ease-in-out' : 'none' }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
        {BOARD_GRID_LAYOUT.map((squareName, index) => {
          if (!squareName) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }
          const piece = boardState[squareName];
          const coords = SQUARE_COORDS[squareName];
          return (
            <Square
              key={squareName}
              name={squareName}
              piece={piece}
              onClick={onSquareClick}
              isSelected={selectedSquare === squareName}
              isPossibleMove={possibleMoves.includes(squareName)}
              isBlack={(coords.row + coords.col) % 2 !== 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Board;
