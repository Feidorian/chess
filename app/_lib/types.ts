export type Piece = {
	moveCount: number;
	side: {
		name: string;
	};
	type: string;
	notation: string;
};

export type PieceCompact = {
	moveCount: number;
	piece: string;
  notation: string;
  orientation: string;
};

export type Square = {
	file: string;
	rank: number;
	piece: Piece | null;
};

export type Move = {
	capturedPiece: Piece | null;
	castle: Boolean;
	enPassant: Boolean;
	postSquare: Square;
	prevSquare: Square;
	undo: () => void;
};

export type MoveCompact = {
  squareFrom: string;
  squareTo: string;
  pieceFrom: PieceCompact | null;
  pieceTo: PieceCompact | null;
}

export type NotatedMoves = {
	[key: string]: {
		src: Square;
		dest: Square;
	};
};

export type PotentialMove = [
  notation: string,
  src: Square,
  dest: Square
]