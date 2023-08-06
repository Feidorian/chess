// @ts-ignore
import {Chessboard, BORDER_TYPE, INPUT_EVENT_TYPE, COLOR} from "cm-chessboard";
import {Markers, MARKER_TYPE} from "cm-chessboard/src/extensions/markers/Markers.js";
import {PromotionDialog} from "cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {Accessibility} from "cm-chessboard/src/extensions/accessibility/Accessibility.js";
import {FEN} from "cm-chessboard/src/model/Position.js";
import engine from "./Engine";
import {Move, PotentialMove, Square} from "./types";

export default class ChessBoard {
	#config = {
		position: FEN.start,
		style: {
			aspectRatio: 0.9,
			pieces: {file: "pieces/staunty.svg"},
			borderType: BORDER_TYPE.frame,
		},
		extensions: [
			{class: Markers, props: {autoMarkers: MARKER_TYPE.frame}},
			{class: PromotionDialog},
			{class: Accessibility, props: {visuallyHidden: true}},
		],
	};
	#container!: HTMLElement;
	orientation: string;
	board: any;

	constructor(orientation: string, id: string) {
		this.#container = document.getElementById(id)!;
		this.#config["orientation"] = orientation;
		this.orientation = orientation;
		this.board = new Chessboard(this.#container, this.#config);
		engine.register("move", this.onEngineMove);
		engine.register("enPassant", this.onEnPassant);
		engine.register("castle", this.onCastle);
		engine.register("promote", this.onEnginePromote);
		this.board.enableMoveInput(this.onBoardMove);
	}

	/**
	 * Move event handler.
	 * Allows the chessboard to synchronize with
	 * movements made by another ChessBoard instance
	 * @param move - move made by another ChessBoard instance
	 */
	onEngineMove = async (move: Move): Promise<void> => {
		const {prevSquare, postSquare} = move;
		const enginePiece = engine.getPieceCompact(postSquare.piece);
		// return if the move was initiated by the current instance
		// if (enginePiece?.orientation === this.orientation) return;
		const {file: postFile, rank: postRank} = postSquare;
		const { file: prevFile, rank: prevRank } = prevSquare;
		await this.board.movePiece(prevFile + prevRank, postFile + postRank, true);
	};

	onEnginePromote = async (square: Square): Promise<void> => {
		const { file, rank, piece: _piece } = square;
		const { piece, orientation } = engine.getPieceCompact(_piece)!;
		// if (orientation === this.orientation) return;
		await this.board.setPiece(file+rank, piece, null)
	}

	onEnPassant = async (move: Move): Promise<void> => {
		const {
			capturedPiece,
			postSquare: {rank, file},
		} = move;
		const {
			side: {name},
		} = capturedPiece!;
		const targetRank: number = name === "black" ? rank - 1 : rank + 1;
		await this.board.setPiece(file + targetRank, null);
	};

	onCastle = async (move: Move): Promise<void> => {
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
		await this.board.movePiece(squareFrom, squareTo, true);
	};

	onBoardMove = <T extends {[key: string]: string}>(event: T): Boolean => {
		let validatedMove: PotentialMove | null;
		let isValid: Boolean;
		const {piece, squareFrom, squareTo} = event;

		switch (event.type) {
			case INPUT_EVENT_TYPE.moveInputStarted:
				validatedMove = this.validateBoardMove(event.squareFrom, event.squareTo);
				isValid = Boolean(validatedMove);
				break;
			case INPUT_EVENT_TYPE.validateMoveInput:
				validatedMove = this.validateBoardMove(event.squareFrom, event.squareTo);
				isValid = Boolean(validatedMove);
				if (isValid) this.moveEnginePiece(validatedMove!, squareFrom, squareTo, piece);
				break;
			case INPUT_EVENT_TYPE.moveInputCanceled:
				isValid = true;
				break;
			default:
				isValid = false;
		}
		return isValid;
	};

	moveEnginePiece(move: PotentialMove, squareFrom: string, squareTo: string, piece: string): void {
		const [notation] = move;
		const whitePawnPromotion = piece === "wp" && squareFrom[1] === "7" && squareTo[1] === "8";
		const blackPawnPromotion = piece === "bp" && squareFrom[1] === "2" && squareTo[1] === "1";
		if (whitePawnPromotion || blackPawnPromotion) this.showPromotionDialog(squareTo, piece[0], notation);
		else engine.client.move(notation);
	}

	showPromotionDialog = (squareTo: string, color: string, notation: string): void => {
		let dict = {q: "Q", r: "R", n: "N", b: "B"};
		this.board.showPromotionDialog(squareTo, color, (res: any) => {
			if (res) {
				const {square, piece} = res;
				this.board.setPiece(square, piece);
				const promotedNotation = notation.slice(0, -1) + dict[piece[1]];
				engine.client.move(promotedNotation);
			} else return this.showPromotionDialog(squareTo, color, notation);
		});
	};

	/**
	 * Verify if a valid move can be made from a selected square
	 * @param  squareFrom - the square on which a move is triggered
	 * @returns a move object describing a potential move from the squareFrom param
	 */
	validateBoardMove(squareFrom: string, squareTo: string): PotentialMove | null {
		const notatedMoves = engine.notatedMoves;
		let validNotatedMove = Object.keys(notatedMoves).find(key => {
			const currMove = engine.getMoveCompact(notatedMoves[key].src, notatedMoves[key].dest);
			const isValidOrientation = currMove?.pieceFrom?.orientation === this.orientation;
			const isValidSquareFrom = currMove.squareFrom === squareFrom;
			const isValidSquareTo = squareTo ? currMove.squareTo === squareTo : true;
			return isValidOrientation && isValidSquareFrom && isValidSquareTo;
		});
		if (!validNotatedMove) return null;
		const {src, dest} = notatedMoves[validNotatedMove];
		return [validNotatedMove, src, dest];
	}
}
