import chess, { AlgebraicGameClient } from "chess";
import {MoveCompact, NotatedMoves, Piece, PieceCompact, Square} from "./types";

class Engine {
	client: AlgebraicGameClient;

	constructor() {
		this.client = chess.create({PGN:true});
	}

	get notatedMoves(): NotatedMoves {
		const {notatedMoves} = this.client.getStatus();
		return notatedMoves;
	}

  getPieceCompact(_piece: Piece | null): PieceCompact | null {
    if (!_piece) return _piece;
    const dict = {pawn:"p", knight:"n", bishop:"b", rook:"r", queen:"q", king:'q'}
		const moveCount = _piece.moveCount;
    const piece = _piece.side.name[0] + dict[_piece.type];
    const orientation = _piece.side.name[0];
		const notation = _piece.notation;
		return {moveCount, piece, notation, orientation};
	}

	getMoveCompact(src: Square, dest: Square): MoveCompact {
    const squareFrom = src.file + src.rank;
    const pieceFrom = this.getPieceCompact(src.piece);
    const squareTo = dest.file + dest.rank;
    const pieceTo = this.getPieceCompact(dest.piece);
    return {squareFrom, squareTo, pieceFrom, pieceTo}
  }

  register(event:string, fn:Function): void {
    this.client.on(event as any, fn as any)

  }

  randomPlay() {
    if (this.client.getStatus().isCheckMate) return;
    const moves = Object.keys(this.notatedMoves);
    const random = Math.floor(Math.random() * moves.length);
    this.client.move(moves[random]);
    setTimeout(() => {
      this.randomPlay();
    }, 100);
  }
}

const engine: Engine = new Engine();

export default engine;
