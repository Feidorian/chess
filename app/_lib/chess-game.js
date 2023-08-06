import {Chessboard, BORDER_TYPE, INPUT_EVENT_TYPE, COLOR} from "cm-chessboard";
import {Markers, MARKER_TYPE} from "cm-chessboard/src/extensions/markers/Markers.js";
import {PromotionDialog} from "cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {Accessibility} from "cm-chessboard/src/extensions/accessibility/Accessibility.js"

import {FEN} from "cm-chessboard/src/model/Position.js";
import chess from "chess";

const config = {
	position: FEN.start,
	style: {
		aspectRatio: 0.9,
		pieces: {file: "pieces/staunty.svg"},
		cssClass: "",
		borderType: BORDER_TYPE.frame,
	},
	extensions: [
		{class: Markers, props: {autoMarkers: MARKER_TYPE.bevel}},
		{class: PromotionDialog},
		{class: Accessibility, props: {visuallyHidden: true}},
	],
};

export default class ChessGame {
  constructor(state) {
    this.state = state;
		this.history = [];
		const container = document.getElementById("chess");
		this.board = new Chessboard(container, config);
		this.client = chess.create({PGN: true});
		this.board.enableMoveInput(this.onMove);
		this.client.on("enPassant", this.onEnPassant);
    this.client.on("castle", this.onCastle);
	}

	onEnPassant() {}
	onCastle() {}

	getMoveInfo(notation, src, dest) {
		let squareFrom, squareTo, pieceFrom, pieceTo;

		squareFrom = src.file + src.rank;
		if (src.piece) pieceFrom = src.piece.side.name[0] + src.piece.type[0];

		squareTo = dest.file + dest.rank;
		if (dest.piece) pieceTo = dest.piece.side.name[0] + dest.piece.type[0];

		return {notation, squareFrom, squareTo, pieceFrom, pieceTo};
	}

	isSelectable = e => {
		const {squareFrom} = e;
		const {notatedMoves} = this.client.getStatus();
		const potentialMove = Object.keys(notatedMoves).find(key => {
			let notation = key,
				src = notatedMoves[key].src,
				dest = notatedMoves[key].dest;
			const currMove = this.getMoveInfo(notation, src, dest);
			return currMove.squareFrom === squareFrom;
		});
		const isSelectable = Boolean(potentialMove);
		return {isSelectable, squareFrom};
	};

	isMovable = e => {
		let isMovable = false,
			potentialMove;
		const {squareFrom, squareTo} = e;
		const {notatedMoves} = this.client.getStatus();
		potentialMove = Object.keys(notatedMoves).find(key => {
			let notation = key,
				src = notatedMoves[key].src,
				dest = notatedMoves[key].dest;
			const currMove = this.getMoveInfo(notation, src, dest);
			return currMove.squareTo === squareTo && currMove.squareFrom === squareFrom;
		});
		isMovable = Boolean(potentialMove);
		return {isMovable, potentialMove};
	};

	onEnPassant = move => {
		const {
			capturedPiece: {
				side: {name},
			},
			postSquare: {rank, file},
		} = move;
		const targetRank = name === "black" ? rank - 1 : rank + 1;
		this.board.setPiece(file + targetRank, null);
	};

	onCastle = move => {
		const {
			postSquare: {rank, file},
		} = move;
		// rooks new position on castle
		const castle = {
			g1: {from: "h1", to: "f1"}, // white left
			c1: {from: "a1", to: "d1"}, // white right
			g8: {from: "h8", to: "f8"}, // black left
			c8: {from: "a8", to: "d8"}, // black right
		};
		const squareFrom = castle[file + rank].from;
		const squareTo = castle[file + rank].to;
		this.board.state.moveInputProcess.then(() => {
			this.board.movePiece(squareFrom, squareTo, true);
		});
	};

	movePiece(notation, e) {
		const {piece, squareFrom, squareTo} = e;
		const pieceColor = piece[0];
    if(this.isPawnPromotion(piece, squareFrom, squareTo)) {
      this.showPromotionDialog(squareTo, pieceColor, notation);
    } else {
      this.client.move(notation);
      this.state.push(notation)
      console.log(this.state);
    }
	}

  markAllValidMoves(squareFrom) {
    const {validMoves} = this.client;
    const potentialMoves = validMoves.find(({src}) => src.file + src.rank === squareFrom);
    for(let square of potentialMoves.squares) {
      this.board.addMarker(MARKER_TYPE.dot, square.file + square.rank)
    }
  }

	showPromotionDialog = (squareTo, color, notation) => {
		let dict = {q: "Q", r: "R", n: "N", b: "B"};
		this.board.showPromotionDialog(squareTo, color, res => {
			if (res) {
				const {square, piece} = res;
				this.board.setPiece(square, piece);
				const promotedNotation = notation.slice(0, -1) + dict[piece[1]];
        this.client.move(promotedNotation);
        this.state.push(promotedNotation)
			} else return this.showPromotionDialog(squareTo, color, notation);
		});
	};

	isPawnPromotion(piece, squareFrom, squareTo) {
		const whitePawnPromotion = piece === "wp" && squareFrom[1] === "7" && squareTo[1] === "8";
		const blackPawnPromotion = piece === "bp" && squareFrom[1] === "2" && squareTo[1] === "1";
		return whitePawnPromotion || blackPawnPromotion;
	}

	onMove = e => {
		switch (e.type) {
      case INPUT_EVENT_TYPE.moveInputStarted:
        // this.board.addMarker(MARKER_TYPE.bevel, e.squareFrom)
        const {isSelectable, squareFrom} = this.isSelectable(e);
        if(isSelectable) this.markAllValidMoves(squareFrom)
				return isSelectable;
      case INPUT_EVENT_TYPE.validateMoveInput:
				const {isMovable, potentialMove} = this.isMovable(e);
        if(isMovable) {
          this.movePiece(potentialMove, e);
        }
        this.board.removeMarkers(MARKER_TYPE.dot);
				return isMovable;
      case INPUT_EVENT_TYPE.moveInputCanceled:
        this.board.removeMarkers(MARKER_TYPE.dot)
				return true;
			default:
				return false;
		}
	};
}
