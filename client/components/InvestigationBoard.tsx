
import React from 'react';
import { type BoardState, type SquareName, type PieceType, SQUARE_NAMES } from '../types';
import { LEGAL_MOVES, KNIGHT_EMOJI } from '../constants';

interface InvestigationBoardProps {
  boardState: BoardState;
  onSquareClick: (squareName: SquareName) => void;
  selectedSquare: SquareName | null;
  possibleMoves: SquareName[];
  shake: boolean;
}

const VIEWBOX_SIZE = 500;
const PADDING = 50;
const NODE_RADIUS = 25;

// Generates node positions for the custom T-shaped graph layout.
const GRAPH_NODE_POSITIONS = (() => {
  const H_NODES: SquareName[] = ['10', '6', '1', '8', '3'];
  const V_NODES: SquareName[] = ['8', '7', '2', '9', '4', '5'];
  
  const positions = {} as Record<SquareName, { cx: number; cy: number }>;

  const H_SPACING = (VIEWBOX_SIZE - 2 * PADDING) / (H_NODES.length - 1);
  const Y_H_LINE = 70;
  const X_V_LINE = PADDING + H_NODES.indexOf('8') * H_SPACING;
  const V_SPACING = (VIEWBOX_SIZE - PADDING - Y_H_LINE) / (V_NODES.length - 1);
  
  // Calculate horizontal node positions
  H_NODES.forEach((name, i) => {
    positions[name] = {
      cx: PADDING + i * H_SPACING,
      cy: Y_H_LINE,
    };
  });

  // Calculate vertical node positions, overwriting the intersection point '8'
  V_NODES.forEach((name, i) => {
    positions[name] = {
      ...positions[name], // Preserves properties if node already exists (for '8')
      cx: X_V_LINE,
      cy: Y_H_LINE + i * V_SPACING,
    };
  });

  return positions;
})();


const InvestigationBoard: React.FC<InvestigationBoardProps> = ({ boardState, onSquareClick, selectedSquare, possibleMoves, shake }) => {
  const animationClass = shake ? 'animate-shake' : '';

  return (
    <div className={`p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg w-full`}>
      <div className={`w-full aspect-square transition-transform duration-300 ${animationClass}`} style={{ animation: shake ? 'shake 0.3s ease-in-out' : 'none' }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
        <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} width="100%" height="100%">
          {/* Edges */}
          <g>
            {SQUARE_NAMES.map(startNode =>
              LEGAL_MOVES[startNode].map(endNode => {
                const pos1 = GRAPH_NODE_POSITIONS[startNode];
                const pos2 = GRAPH_NODE_POSITIONS[endNode];
                // A check to prevent rendering lines for nodes that might not be in the custom layout
                if (!pos1 || !pos2) return null;
                return (
                  <line
                    key={`${startNode}-${endNode}`}
                    x1={pos1.cx}
                    y1={pos1.cy}
                    x2={pos2.cx}
                    y2={pos2.cy}
                    className="stroke-gray-600"
                    strokeWidth="2"
                  />
                );
              })
            )}
          </g>

          {/* Nodes */}
          <g>
            {SQUARE_NAMES.map(name => {
              const piece = boardState[name];
              const pos = GRAPH_NODE_POSITIONS[name];
               // A check to prevent rendering nodes that might not be in the custom layout
              if (!pos) return null;
              const isSelected = selectedSquare === name;
              const isPossible = possibleMoves.includes(name);

              return (
                <g
                  key={name}
                  transform={`translate(${pos.cx}, ${pos.cy})`}
                  onClick={() => onSquareClick(name)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={NODE_RADIUS}
                    className={`transition-all duration-200 fill-gray-700 group-hover:fill-gray-600 ${isSelected ? 'stroke-cyan-400' : 'stroke-gray-500'}`}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  {isPossible && <circle r={NODE_RADIUS / 3} className="fill-cyan-400/50" />}
                  {piece && (
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      className="text-4xl pointer-events-none"
                      style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }}
                    >
                      {KNIGHT_EMOJI[piece as PieceType]}
                    </text>
                  )}
                  <text
                    textAnchor="middle"
                    y={NODE_RADIUS + 14}
                    className="text-lg font-mono font-bold fill-gray-200 pointer-events-none"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default InvestigationBoard;
