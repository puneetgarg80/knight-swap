
export const SQUARE_NAMES = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
] as const;

export type SquareName = typeof SQUARE_NAMES[number];

export type PieceType = 'white' | 'black';

export type SquareContent = PieceType | null;

export type BoardState = Record<SquareName, SquareContent>;

export type MoveHistory = BoardState[];

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
